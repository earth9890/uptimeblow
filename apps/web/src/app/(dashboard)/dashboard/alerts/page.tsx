"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bell, Mail, MessageSquare, Plus, Trash2, Zap } from "lucide-react";
import { api } from "@/lib/api";

interface AlertChannel {
  id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  isDefault: boolean;
  createdAt: string;
}

interface AlertHistoryEntry {
  id: string;
  monitorId: string;
  type: string;
  message: string;
  sentAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  email: Mail,
  slack: MessageSquare,
  discord: MessageSquare,
  webhook: Zap,
};

export default function AlertsPage() {
  const { data: channels, refetch } = useApi<AlertChannel[]>("/api/alert-channels");
  const { data: history } = useApi<AlertHistoryEntry[]>("/api/alerts/history?limit=20");

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"email" | "slack" | "discord" | "webhook">("email");
  const [name, setName] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const configMap: Record<string, Record<string, string>> = {
      email: { email: configValue },
      slack: { webhookUrl: configValue },
      discord: { webhookUrl: configValue },
      webhook: { url: configValue },
    };

    try {
      await api("/api/alert-channels", {
        method: "POST",
        token,
        body: JSON.stringify({ type, name, config: configMap[type] }),
      });
      setOpen(false);
      setName("");
      setConfigValue("");
      refetch();
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await api(`/api/alert-channels/${id}`, { method: "DELETE", token });
    refetch();
  };

  const handleTest = async (id: string) => {
    try {
      await api(`/api/alert-channels/${id}/test`, { method: "POST", token });
      alert("Test alert sent!");
    } catch {
      alert("Failed to send test alert");
    }
  };

  const configPlaceholder: Record<string, string> = {
    email: "alerts@example.com",
    slack: "https://hooks.slack.com/services/...",
    discord: "https://discord.com/api/webhooks/...",
    webhook: "https://example.com/webhook",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground">Manage notification channels and view alert history</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Channel
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Alert Channel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["email", "slack", "discord", "webhook"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        type === t
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-800"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-name">Name</Label>
                <Input id="ch-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My alerts" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ch-config">{type === "email" ? "Email Address" : type === "webhook" ? "Webhook URL" : "Webhook URL"}</Label>
                <Input id="ch-config" value={configValue} onChange={(e) => setConfigValue(e.target.value)} placeholder={configPlaceholder[type]} required />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Channels</CardTitle>
        </CardHeader>
        <CardContent>
          {!channels || channels.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No alert channels configured yet.</p>
          ) : (
            <div className="space-y-3">
              {channels.map((ch) => {
                const Icon = typeIcons[ch.type] || Bell;
                return (
                  <div key={ch.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{ch.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{ch.type}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleTest(ch.id)}>Test</Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(ch.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No alerts sent yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant={entry.type === "down" ? "destructive" : "default"}>
                        {entry.type === "down" ? "Down" : "Recovery"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">{entry.message}</TableCell>
                    <TableCell>{new Date(entry.sentAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
