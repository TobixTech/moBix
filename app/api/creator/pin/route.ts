import { type NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { users, creatorProfiles, creatorWithdrawalPins } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

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

    // Check if PIN exists
    const [pin] = await db
      .select()
      .from(creatorWithdrawalPins)
      .where(eq(creatorWithdrawalPins.userId, user.id))
      .limit(1)

    return NextResponse.json({ success: true, hasPin: !!pin })
  } catch (error) {
    console.error("Error checking PIN:", error)
    return NextResponse.json({ error: "Failed to check PIN" }, { status: 500 })
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
    const { pin, oldPin } = body

    // Validate PIN
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4-6 digits" }, { status: 400 })
    }

    // Check if PIN already exists
    const [existingPin] = await db
      .select()
      .from(creatorWithdrawalPins)
      .where(eq(creatorWithdrawalPins.userId, user.id))
      .limit(1)

    if (existingPin) {
      // Changing PIN - verify old PIN
      if (!oldPin) {
        return NextResponse.json({ error: "Old PIN required to change PIN" }, { status: 400 })
      }

      const isValid = await bcrypt.compare(oldPin, existingPin.pinHash)
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect old PIN" }, { status: 400 })
      }

      // Update PIN
      const pinHash = await bcrypt.hash(pin, 10)
      await db
        .update(creatorWithdrawalPins)
        .set({ pinHash, lastChangedAt: new Date() })
        .where(eq(creatorWithdrawalPins.id, existingPin.id))

      return NextResponse.json({ success: true, message: "PIN updated successfully" })
    } else {
      // Create new PIN
      const pinHash = await bcrypt.hash(pin, 10)
      await db.insert(creatorWithdrawalPins).values({
        userId: user.id,
        pinHash,
      })

      return NextResponse.json({ success: true, message: "PIN created successfully" })
    }
  } catch (error) {
    console.error("Error saving PIN:", error)
    return NextResponse.json({ error: "Failed to save PIN" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [user] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await req.json()
    const { pin } = body

    // Verify PIN
    const [storedPin] = await db
      .select()
      .from(creatorWithdrawalPins)
      .where(eq(creatorWithdrawalPins.userId, user.id))
      .limit(1)

    if (!storedPin) {
      return NextResponse.json({ error: "No PIN set" }, { status: 400 })
    }

    const isValid = await bcrypt.compare(pin, storedPin.pinHash)

    return NextResponse.json({ success: true, isValid })
  } catch (error) {
    console.error("Error verifying PIN:", error)
    return NextResponse.json({ error: "Failed to verify PIN" }, { status: 500 })
  }
}
