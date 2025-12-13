import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const [admin] = await sql`
      SELECT role FROM users WHERE clerkId = ${userId}
    `

    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"

    // Get payout requests with creator info
    const requests = await sql`
      SELECT 
        pr.*,
        u.email,
        u.username,
        cp.name as creatorName,
        cp.profileImage,
        ct.tierLevel,
        (SELECT COUNT(*) FROM strikes WHERE userId = u.clerkId) as strikeCount
      FROM payoutRequests pr
      JOIN users u ON u.clerkId = pr.userId
      LEFT JOIN creatorProfiles cp ON cp.userId = pr.userId
      LEFT JOIN creatorTiers ct ON ct.userId = pr.userId
      WHERE pr.status = ${status}
      ORDER BY pr.requestedAt DESC
    `

    return Response.json({ requests })
  } catch (error) {
    console.error("Get admin payouts error:", error)
    return Response.json({ error: "Failed to fetch payout requests" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const [admin] = await sql`
      SELECT role FROM users WHERE clerkId = ${userId}
    `

    if (!admin || admin.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 })
    }

    const { requestId, action, transactionHash, adminNote, rejectionReason } = await request.json()

    if (action === "approve") {
      // Update request status
      await sql`
        UPDATE payoutRequests
        SET 
          status = 'approved',
          processedAt = NOW(),
          processedBy = ${userId},
          adminNote = ${adminNote || ""}
        WHERE id = ${requestId}
      `

      // Get request details
      const [request] = await sql`
        SELECT * FROM payoutRequests WHERE id = ${requestId}
      `

      return Response.json({
        success: true,
        message: "Payout approved. Record transaction hash after sending crypto.",
      })
    } else if (action === "complete") {
      // Mark as completed with transaction hash
      await sql`
        UPDATE payoutRequests
        SET 
          status = 'completed',
          transactionHash = ${transactionHash},
          processedAt = NOW(),
          processedBy = ${userId}
        WHERE id = ${requestId}
      `

      // Mark earnings as paid
      const [request] = await sql`
        SELECT userId, amountUSD FROM payoutRequests WHERE id = ${requestId}
      `

      await sql`
        UPDATE creatorEarnings
        SET isPaid = true
        WHERE userId = ${request.userId}
        AND isPaid = false
        AND earningsUSD <= ${request.amountUSD}
      `

      // Create transaction record
      await sql`
        INSERT INTO payoutTransactions (
          payoutRequestId, userId, amountUSD, transactionHash, status, processedAt
        ) VALUES (
          ${requestId}, ${request.userId}, ${request.amountUSD}, ${transactionHash}, 'completed', NOW()
        )
      `

      return Response.json({
        success: true,
        message: "Payout completed and recorded.",
      })
    } else if (action === "reject") {
      await sql`
        UPDATE payoutRequests
        SET 
          status = 'rejected',
          processedAt = NOW(),
          processedBy = ${userId},
          rejectionReason = ${rejectionReason}
        WHERE id = ${requestId}
      `

      return Response.json({
        success: true,
        message: "Payout request rejected.",
      })
    }

    return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Process payout error:", error)
    return Response.json({ error: "Failed to process payout" }, { status: 500 })
  }
}
