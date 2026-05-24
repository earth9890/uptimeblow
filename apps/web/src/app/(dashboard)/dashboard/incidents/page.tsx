"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Plus } from "lucide-react";
import { api } from "@/lib/api";

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  createdAt: string;
}

const severityColors: Record<string, string> = {
  minor: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  major: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusColors: Record<string, string> = {
  investigating: "bg-red-500",
  identified: "bg-orange-500",
  monitoring: "bg-amber-500",
  resolved: "bg-emerald-500",
};

export default function IncidentsPage() {
  const { data: incidents, refetch } = useApi<Incident[]>("/api/incidents");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<"minor" | "major" | "critical">("major");
  const [loading, setLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/api/incidents", {
        method: "POST",
        token,
        body: JSON.stringify({ title, severity }),
      });
      setOpen(false);
      setTitle("");
      refetch();
    } catch {}
    setLoading(false);
  };

  const active = incidents?.filter((i) => i.status !== "resolved") || [];
  const resolved = incidents?.filter((i) => i.status === "resolved") || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">Track and manage service incidents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Create Incident
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Incident</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inc-title">Title</Label>
                <Input id="inc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="API endpoints returning 500" required />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["minor", "major", "critical"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSeverity(s)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        severity === s
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Incidents */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active ({active.length})</h2>
        {active.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No active incidents. All systems operational.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {active.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Resolved ({resolved.length})</h2>
          <div className="space-y-3">
            {resolved.map((inc) => (
              <IncidentCard key={inc.id} incident={inc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const duration = incident.resolvedAt
    ? formatDuration(new Date(incident.startedAt), new Date(incident.resolvedAt))
    : formatDuration(new Date(incident.startedAt), new Date());

  return (
    <Link href={`/dashboard/incidents/${incident.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`h-3 w-3 rounded-full ${statusColors[incident.status] || "bg-gray-400"}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{incident.title}</p>
              <Badge className={severityColors[incident.severity]}>{incident.severity}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {incident.status} &middot; {duration}
            </p>
          </div>
          <Badge variant={incident.status === "resolved" ? "default" : "destructive"}>
            {incident.status}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}
