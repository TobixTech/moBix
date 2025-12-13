"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, DollarSign, Activity } from "lucide-react"
import { toast } from "sonner"

export function AdminSecurityTab() {
  const [fraudFlags, setFraudFlags] = useState<any[]>([])
  const [chargebacks, setChargebacks] = useState<any[]>([])
  const [ipLogs, setIPLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chargebackModalOpen, setChargebackModalOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<any>(null)

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const [flagsRes, chargebacksRes, logsRes] = await Promise.all([
        fetch("/api/admin/security/fraud-flags"),
        fetch("/api/admin/security/chargebacks"),
        fetch("/api/admin/security/ip-logs?suspicious=true"),
      ])

      const [flagsData, chargebacksData, logsData] = await Promise.all([
        flagsRes.json(),
        chargebacksRes.json(),
        logsRes.json(),
      ])

      setFraudFlags(flagsData.flags || [])
      setChargebacks(chargebacksData.chargebacks || [])
      setIPLogs(logsData.logs || [])
    } catch (error) {
      console.error("Error fetching security data:", error)
      toast.error("Failed to load security data")
    } finally {
      setLoading(false)
    }
  }

  const handleResolveFlag = async (flagId: string, status: string, action: string) => {
    try {
      const response = await fetch("/api/admin/security/fraud-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, status, actionTaken: action }),
      })

      if (!response.ok) throw new Error("Failed to resolve flag")

      toast.success("Fraud flag resolved")
      setResolveModalOpen(false)
      fetchSecurityData()
    } catch (error) {
      toast.error("Failed to resolve fraud flag")
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading security data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security & Fraud Detection</h2>
        <p className="text-muted-foreground">Monitor and manage security threats</p>
      </div>

      <Tabs defaultValue="fraud-flags" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fraud-flags">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Fraud Flags ({fraudFlags.filter((f) => f.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="chargebacks">
            <DollarSign className="h-4 w-4 mr-2" />
            Chargebacks ({chargebacks.length})
          </TabsTrigger>
          <TabsTrigger value="ip-logs">
            <Activity className="h-4 w-4 mr-2" />
            Suspicious Activity ({ipLogs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fraud-flags" className="space-y-4">
          {fraudFlags.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No fraud flags found</p>
              </CardContent>
            </Card>
          ) : (
            fraudFlags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{flag.userName || flag.userEmail}</CardTitle>
                      <CardDescription>{flag.flagType.replace(/_/g, " ")}</CardDescription>
                    </div>
                    <Badge variant={getSeverityColor(flag.severity) as any}>{flag.severity}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{flag.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Status: {flag.status}</span>
                    <span>•</span>
                    <span>{new Date(flag.createdAt).toLocaleDateString()}</span>
                  </div>
                  {flag.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedFlag(flag)
                          setResolveModalOpen(true)
                        }}
                        size="sm"
                      >
                        Investigate
                      </Button>
                      <Button
                        onClick={() => handleResolveFlag(flag.id, "resolved", "False alarm")}
                        variant="outline"
                        size="sm"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                  {flag.actionTaken && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium">Action Taken:</p>
                      <p className="text-sm text-muted-foreground">{flag.actionTaken}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="chargebacks" className="space-y-4">
          {chargebacks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No chargebacks found</p>
              </CardContent>
            </Card>
          ) : (
            chargebacks.map((chargeback) => (
              <Card key={chargeback.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{chargeback.userName}</CardTitle>
                      <CardDescription>${chargeback.amountUSD}</CardDescription>
                    </div>
                    <Badge variant={chargeback.status === "completed" ? "secondary" : "default"}>
                      {chargeback.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{chargeback.reason}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>Initiated: {new Date(chargeback.initiatedAt).toLocaleString()}</p>
                    {chargeback.completedAt && <p>Completed: {new Date(chargeback.completedAt).toLocaleString()}</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="ip-logs" className="space-y-4">
          {ipLogs.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No suspicious activity detected</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {ipLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{log.userName}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.action} from {log.ipAddress}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                        {log.isSuspicious && (
                          <Badge variant="destructive" className="mt-1">
                            Suspicious
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Resolve Flag Modal */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Fraud Flag</DialogTitle>
            <DialogDescription>Take action on this security alert</DialogDescription>
          </DialogHeader>
          {selectedFlag && (
            <div className="space-y-4">
              <div>
                <Label>Creator</Label>
                <p className="text-sm">{selectedFlag.userName || selectedFlag.userEmail}</p>
              </div>
              <div>
                <Label>Flag Type</Label>
                <p className="text-sm">{selectedFlag.flagType.replace(/_/g, " ")}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm">{selectedFlag.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedFlag) {
                  handleResolveFlag(selectedFlag.id, "confirmed", "Account suspended, payout blocked")
                }
              }}
            >
              Confirm & Suspend
            </Button>
            <Button
              onClick={() => {
                if (selectedFlag) {
                  handleResolveFlag(selectedFlag.id, "investigating", "Under investigation")
                }
              }}
            >
              Investigate Further
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
