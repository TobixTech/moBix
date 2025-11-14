import { NextResponse } from "next/server"
import { deleteComment } from "@/lib/server-actions"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteComment(params.id)
    
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 })
  }
}
