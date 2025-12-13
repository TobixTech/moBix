"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Globe, Smartphone, TrendingUp } from "lucide-react"
import { toast } from "sonner"

export function CreatorAnalyticsTab() {
  const [timeRange, setTimeRange] = useState("30")
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/creator/analytics?timeRange=${timeRange}`)
      if (!response.ok) throw new Error("Failed to fetch analytics")
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/creator/analytics/export?format=${format}&timeRange=${timeRange}`)
      if (!response.ok) throw new Error("Failed to export")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics_${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Analytics exported successfully")
    } catch (error) {
      console.error("Error exporting:", error)
      toast.error("Failed to export analytics")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Detailed insights into your content performance</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleExport("csv")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>Top countries viewing your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.geoDistribution?.map((geo: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{geo.country || "Unknown"}</span>
                  <span className="text-muted-foreground">{geo.views} views</span>
                </div>
              ))}
              {(!analytics?.geoDistribution || analytics.geoDistribution.length === 0) && (
                <p className="text-muted-foreground text-sm">No geographic data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Device Breakdown
            </CardTitle>
            <CardDescription>Views by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.deviceBreakdown?.map((device: any, index: number) => {
                const total = analytics.deviceBreakdown.reduce((sum: number, d: any) => sum + d.views, 0)
                const percentage = ((device.views / total) * 100).toFixed(1)
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">{device.device || "Unknown"}</span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
              {(!analytics?.deviceBreakdown || analytics.deviceBreakdown.length === 0) && (
                <p className="text-muted-foreground text-sm">No device data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* View Sources */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              View Sources
            </CardTitle>
            <CardDescription>Where your viewers are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.viewSources?.map((source: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[70%]">{source.referrer || "Direct / None"}</span>
                  <span className="text-muted-foreground">{source.views} views</span>
                </div>
              ))}
              {(!analytics?.viewSources || analytics.viewSources.length === 0) && (
                <p className="text-muted-foreground text-sm">No referrer data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Views Chart */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daily Views</CardTitle>
            <CardDescription>View trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-1">
              {analytics?.dailyViews?.map((day: any, index: number) => {
                const maxViews = Math.max(...analytics.dailyViews.map((d: any) => d.views))
                const height = (day.views / maxViews) * 100
                return (
                  <div
                    key={index}
                    className="flex-1 bg-primary rounded-t hover:bg-primary/80 transition-colors relative group"
                    style={{ height: `${height}%`, minHeight: "4px" }}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {new Date(day.date).toLocaleDateString()}: {day.views} views
                    </div>
                  </div>
                )
              })}
              {(!analytics?.dailyViews || analytics.dailyViews.length === 0) && (
                <p className="text-muted-foreground text-sm">No daily view data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
