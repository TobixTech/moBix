import { getFeedbackEntries, updateFeedbackStatus } from "@/lib/server-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Trash2 } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function FeedbackPage() {
  const entries = await getFeedbackEntries()

  async function updateStatus(id: string, status: string) {
    "use server"
    await updateFeedbackStatus(id, status)
    revalidatePath("/admin/feedback")
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Feedback & Requests</h1>

      <div className="grid gap-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-6 flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={entry.type === "REQUEST" ? "default" : "destructive"}>{entry.type}</Badge>
                  <Badge variant="outline">{entry.status}</Badge>
                  <span className="text-sm text-muted-foreground">{entry.createdAt.toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-semibold">{entry.title || "No Title"}</h3>
                <p className="text-muted-foreground">{entry.details}</p>
                {entry.email && <p className="text-sm text-blue-500">Contact: {entry.email}</p>}
              </div>

              <div className="flex space-x-2">
                <form action={updateStatus.bind(null, entry.id, "COMPLETE")}>
                  <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 bg-transparent">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                </form>
                <form action={updateStatus.bind(null, entry.id, "DELETE")}>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
        {entries.length === 0 && <p className="text-center text-muted-foreground">No feedback or requests found.</p>}
      </div>
    </div>
  )
}
