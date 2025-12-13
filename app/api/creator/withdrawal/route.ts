import { neon } from "@neondatabase/serverless"
import { auth } from "@clerk/nextjs/server"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    const { amountUSD, cryptoType, walletAddress, pin } = await request.json()

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify creator has wallet and earnings
    const [creator] = await sql`
      SELECT 
        cs.canWithdraw,
        cs.monthlyWithdrawalLimit,
        cs.pausedReason,
        cw.walletAddress as savedWallet,
        cw.cryptoType as savedCryptoType,
        cp.pinHash
      FROM creatorSettings cs
      LEFT JOIN creatorWallets cw ON cw.userId = ${userId}
      LEFT JOIN creatorWithdrawalPins cp ON cp.userId = ${userId}
      WHERE cs.userId = ${userId}
    `

    if (!creator) {
      return Response.json({ error: "Creator settings not found" }, { status: 404 })
    }

    if (!creator.canWithdraw) {
      return Response.json(
        {
          error: `Withdrawals paused: ${creator.pausedReason || "Contact admin"}`,
        },
        { status: 403 },
      )
    }

    if (!creator.savedWallet || !creator.pinHash) {
      return Response.json(
        {
          error: "Please set up your wallet and PIN first",
        },
        { status: 400 },
      )
    }

    // Verify PIN
    const isPinValid = await bcrypt.compare(pin, creator.pinHash)
    if (!isPinValid) {
      return Response.json({ error: "Invalid PIN" }, { status: 401 })
    }

    // Check minimum withdrawal
    if (amountUSD < 18) {
      return Response.json(
        {
          error: "Minimum withdrawal is $18 USD",
        },
        { status: 400 },
      )
    }

    // Get current balance
    const [balance] = await sql`
      SELECT COALESCE(SUM(earningsUSD), 0) as totalEarnings
      FROM creatorEarnings
      WHERE userId = ${userId} AND isPaid = false
    `

    if (balance.totalEarnings < amountUSD) {
      return Response.json(
        {
          error: "Insufficient balance",
        },
        { status: 400 },
      )
    }

    // Check monthly limit
    const [monthlyTotal] = await sql`
      SELECT COALESCE(SUM(amountUSD), 0) as monthlyWithdrawn
      FROM payoutRequests
      WHERE userId = ${userId}
      AND status IN ('approved', 'completed')
      AND requestedAt >= NOW() - INTERVAL '30 days'
    `

    if (monthlyTotal.monthlyWithdrawn + amountUSD > creator.monthlyWithdrawalLimit) {
      return Response.json(
        {
          error: `Monthly withdrawal limit of $${creator.monthlyWithdrawalLimit} exceeded`,
        },
        { status: 400 },
      )
    }

    // Check for pending requests
    const [pending] = await sql`
      SELECT id FROM payoutRequests
      WHERE userId = ${userId} AND status = 'pending'
      LIMIT 1
    `

    if (pending) {
      return Response.json(
        {
          error: "You already have a pending withdrawal request",
        },
        { status: 400 },
      )
    }

    // Create withdrawal request
    const [request] = await sql`
      INSERT INTO payoutRequests (
        userId, amountUSD, cryptoType, walletAddress, status, requestedAt
      ) VALUES (
        ${userId}, ${amountUSD}, ${cryptoType}, ${walletAddress}, 'pending', NOW()
      )
      RETURNING *
    `

    return Response.json({
      success: true,
      request,
      message: "Withdrawal request submitted. Awaiting admin approval.",
    })
  } catch (error) {
    console.error("Withdrawal request error:", error)
    return Response.json({ error: "Failed to create withdrawal request" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all withdrawal requests for this creator
    const requests = await sql`
      SELECT 
        id,
        amountUSD,
        cryptoType,
        walletAddress,
        status,
        requestedAt,
        processedAt,
        adminNote,
        transactionHash,
        rejectionReason
      FROM payoutRequests
      WHERE userId = ${userId}
      ORDER BY requestedAt DESC
    `

    return Response.json({ requests })
  } catch (error) {
    console.error("Get withdrawal requests error:", error)
    return Response.json({ error: "Failed to fetch withdrawal requests" }, { status: 500 })
  }
}
