import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { currentUser } from "@clerk/nextjs/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminCheck = await sql`
      SELECT role, id FROM "User" WHERE "clerkId" = ${user.id}
    `
    if (!adminCheck[0] || adminCheck[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get all creators with their balance details
    const creators = await sql`
      SELECT 
        cp."userId",
        u.email,
        u.username,
        u."firstName",
        u."createdAt" as "userCreatedAt",
        cp.id as "profileId",
        cp."totalUploads",
        cp."totalViews",
        cp.status as "creatorStatus",
        cp."strikeCount",
        ct."tierLevel",
        ct."ratePerView",
        ct."totalViews" as "tierViews",
        cw."walletAddress",
        cw."cryptoType",
        COALESCE(SUM(ce."earningsUsd"), 0) as "totalEarnings",
        COALESCE(SUM(CASE WHEN ce."isPaid" = false THEN ce."earningsUsd" ELSE 0 END), 0) as "currentBalance",
        COALESCE(SUM(CASE WHEN ce."isPaid" = true THEN ce."earningsUsd" ELSE 0 END), 0) as "paidOut",
        cs."monthlyWithdrawalLimit",
        cs."canWithdraw",
        cs."isPremium"
      FROM "CreatorProfile" cp
      JOIN "User" u ON u.id = cp."userId"
      LEFT JOIN "CreatorTier" ct ON ct."userId" = cp."userId"
      LEFT JOIN "CreatorWallet" cw ON cw."userId" = cp."userId"
      LEFT JOIN "CreatorEarning" ce ON ce."userId" = cp."userId"
      LEFT JOIN "CreatorSettings" cs ON cs."userId" = cp."userId"
      WHERE cp.status IN ('active', 'suspended')
      GROUP BY 
        cp."userId", u.email, u.username, u."firstName", u."createdAt",
        cp.id, cp."totalUploads", cp."totalViews", cp.status, cp."strikeCount",
        ct."tierLevel", ct."ratePerView", ct."totalViews",
        cw."walletAddress", cw."cryptoType",
        cs."monthlyWithdrawalLimit", cs."canWithdraw", cs."isPremium"
      ORDER BY "currentBalance" DESC
    `

    return NextResponse.json({ success: true, creators })
  } catch (error: any) {
    console.error("Get creator balances error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminCheck = await sql`
      SELECT role, id FROM "User" WHERE "clerkId" = ${user.id}
    `
    if (!adminCheck[0] || adminCheck[0].role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { action, userId, amount, reason } = await req.json()

    if (action === "fund") {
      // Add bonus to creator balance
      await sql`
        INSERT INTO "CreatorBonus" ("userId", "bonusType", amount, reason, "appliedBy", "appliedAt")
        VALUES (${userId}, 'admin_bonus', ${amount}, ${reason}, ${adminCheck[0].id}, NOW())
      `

      // Create a positive earning entry
      await sql`
        INSERT INTO "CreatorEarning" ("userId", "contentId", "contentType", date, views, "earningsUsd", "tierRate", "isPaid", "calculatedAt")
        VALUES (${userId}, null, 'bonus', NOW(), 0, ${amount}, 0, false, NOW())
      `

      return NextResponse.json({ success: true, message: "Balance funded successfully" })
    } else if (action === "debit") {
      // Deduct from creator balance
      await sql`
        INSERT INTO "CreatorBonus" ("userId", "bonusType", amount, reason, "appliedBy", "appliedAt")
        VALUES (${userId}, 'admin_deduction', ${-Math.abs(amount)}, ${reason}, ${adminCheck[0].id}, NOW())
      `

      // Create a negative earning entry
      await sql`
        INSERT INTO "CreatorEarning" ("userId", "contentId", "contentType", date, views, "earningsUsd", "tierRate", "isPaid", "calculatedAt")
        VALUES (${userId}, null, 'deduction', NOW(), 0, ${-Math.abs(amount)}, 0, false, NOW())
      `

      return NextResponse.json({ success: true, message: "Balance debited successfully" })
    } else if (action === "updateSettings") {
      const { monthlyLimit, canWithdraw, isPremium } = await req.json()

      await sql`
        INSERT INTO "CreatorSettings" ("userId", "monthlyWithdrawalLimit", "canWithdraw", "isPremium")
        VALUES (${userId}, ${monthlyLimit}, ${canWithdraw}, ${isPremium})
        ON CONFLICT ("userId") 
        DO UPDATE SET 
          "monthlyWithdrawalLimit" = ${monthlyLimit},
          "canWithdraw" = ${canWithdraw},
          "isPremium" = ${isPremium}
      `

      return NextResponse.json({ success: true, message: "Settings updated successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("Creator balance action error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
