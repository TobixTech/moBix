import { type NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles, creatorWallets } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)
    if (!profile) {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 })
    }

    // Get wallet
    const [wallet] = await db.select().from(creatorWallets).where(eq(creatorWallets.userId, user.id)).limit(1)

    return NextResponse.json({ success: true, wallet: wallet || null })
  } catch (error) {
    console.error("Error fetching wallet:", error)
    return NextResponse.json({ error: "Failed to fetch wallet" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [profile] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.userId, user.id)).limit(1)
    if (!profile) {
      return NextResponse.json({ error: "Not a creator" }, { status: 403 })
    }

    const body = await req.json()
    const { cryptoType, walletAddress } = body

    // Validate
    if (!cryptoType || !["SOL", "TRC20", "BEP20"].includes(cryptoType)) {
      return NextResponse.json({ error: "Invalid crypto type. Must be SOL, TRC20, or BEP20" }, { status: 400 })
    }

    if (!walletAddress || walletAddress.length < 10) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 })
    }

    // Check if wallet already exists
    const [existingWallet] = await db.select().from(creatorWallets).where(eq(creatorWallets.userId, user.id)).limit(1)

    if (existingWallet) {
      // Check if they can change (once every few weeks)
      const canChangeAt = new Date(existingWallet.canChangeAt)
      const now = new Date()

      if (now < canChangeAt) {
        const daysLeft = Math.ceil((canChangeAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return NextResponse.json(
          { error: `You can change your wallet in ${daysLeft} days. Contact support if urgent.` },
          { status: 400 },
        )
      }

      // Update wallet and add to history
      const changeHistory = existingWallet.changeHistory
        ? [...JSON.parse(existingWallet.changeHistory), { ...existingWallet, changedAt: new Date() }]
        : [{ ...existingWallet, changedAt: new Date() }]

      const nextChangeDate = new Date()
      nextChangeDate.setDate(nextChangeDate.getDate() + 21) // 3 weeks

      await db
        .update(creatorWallets)
        .set({
          cryptoType,
          walletAddress,
          lastChangedAt: new Date(),
          canChangeAt: nextChangeDate,
          changeHistory: JSON.stringify(changeHistory),
        })
        .where(eq(creatorWallets.id, existingWallet.id))

      return NextResponse.json({ success: true, message: "Wallet updated successfully" })
    } else {
      // Create new wallet
      const nextChangeDate = new Date()
      nextChangeDate.setDate(nextChangeDate.getDate() + 21) // 3 weeks

      await db.insert(creatorWallets).values({
        userId: user.id,
        cryptoType,
        walletAddress,
        canChangeAt: nextChangeDate,
        changeHistory: JSON.stringify([]),
      })

      return NextResponse.json({ success: true, message: "Wallet added successfully" })
    }
  } catch (error) {
    console.error("Error saving wallet:", error)
    return NextResponse.json({ error: "Failed to save wallet" }, { status: 500 })
  }
}
