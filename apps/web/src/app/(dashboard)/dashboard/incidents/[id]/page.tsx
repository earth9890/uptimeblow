"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
  updates: IncidentUpdate[];
}

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: incident, loading, refetch } = useApi<Incident>(`/api/incidents/${id}`);

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string>("investigating");
  const [posting, setPosting] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      await api(`/api/incidents/${id}/updates`, {
        method: "POST",
        token,
        body: JSON.stringify({ message, status }),
      });
      setMessage("");
      refetch();
    } catch {}
    setPosting(false);
  };

  const handleResolve = async () => {
    await api(`/api/incidents/${id}/resolve`, { method: "POST", token });
    refetch();
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (!incident) {
    return <div className="text-center py-20 text-muted-foreground">Incident not found</div>;
  }

  const statusOptions = ["investigating", "identified", "monitoring", "resolved"];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{incident.title}</h1>
            <Badge variant={incident.status === "resolved" ? "default" : "destructive"}>
              {incident.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Started {new Date(incident.startedAt).toLocaleString()}
            {incident.resolvedAt && ` · Resolved ${new Date(incident.resolvedAt).toLocaleString()}`}
          </p>
        </div>
        {incident.status !== "resolved" && (
          <Button onClick={handleResolve} variant="outline">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Resolve
          </Button>
        )}
      </div>

      {/* Add Update */}
      {incident.status !== "resolved" && (
        <Card>
          <CardHeader>
            <CardTitle>Post Update</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="grid grid-cols-4 gap-2">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                        status === s
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-800"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="update-msg">Message</Label>
                <Input
                  id="update-msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the current status..."
                  required
                />
              </div>
              <Button type="submit" disabled={posting}>
                {posting ? "Posting..." : "Post Update"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {incident.updates?.map((update, i) => (
              <div key={update.id}>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-xs">
                        {update.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(update.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{update.message}</p>
                  </div>
                </div>
                {i < incident.updates.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
