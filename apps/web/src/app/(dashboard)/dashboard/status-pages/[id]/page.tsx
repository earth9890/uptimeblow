"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface StatusPageMonitor {
  id: string;
  monitorId: string;
  displayName: string;
  sortOrder: number;
}

interface StatusPageData {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
  logoUrl: string | null;
  monitors: StatusPageMonitor[];
}

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: string;
}

export default function StatusPageEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

  const { data: page, refetch } = useApi<StatusPageData>(`/api/status-pages/${id}`);
  const { data: allMonitors } = useApi<Monitor[]>("/api/monitors");

  const [name, setName] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [addMonitorId, setAddMonitorId] = useState("");
  const [addDisplayName, setAddDisplayName] = useState("");

  // Sync form state when data loads
  if (page && !name) {
    setName(page.name);
    setBrandColor(page.brandColor);
  }

  const handleSave = async () => {
    setSaving(true);
    await api(`/api/status-pages/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ name, brandColor }),
    });
    setSaving(false);
    refetch();
  };

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMonitorId) return;
    await api(`/api/status-pages/${id}/monitors`, {
      method: "POST",
      token,
      body: JSON.stringify({ monitorId: addMonitorId, displayName: addDisplayName || "Monitor" }),
    });
    setAddMonitorId("");
    setAddDisplayName("");
    refetch();
  };

  const handleRemoveMonitor = async (monitorId: string) => {
    await api(`/api/status-pages/${id}/monitors/${monitorId}`, { method: "DELETE", token });
    refetch();
  };

  if (!page) {
    return <div className="flex justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  const assignedIds = new Set(page.monitors.map((m) => m.monitorId));
  const availableMonitors = allMonitors?.filter((m) => !assignedIds.has(m.id)) || [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <h1 className="text-3xl font-bold">{page.name}</h1>

      {/* Settings */}
      <Card>
        <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Brand Color</Label>
            <div className="flex gap-2">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
              <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-32" />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </CardContent>
      </Card>

      {/* Monitors */}
      <Card>
        <CardHeader><CardTitle>Monitors on this page</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {page.monitors.length === 0 ? (
            <p className="text-muted-foreground text-sm">No monitors added yet.</p>
          ) : (
            <div className="space-y-2">
              {page.monitors.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{m.displayName}</span>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveMonitor(m.monitorId)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {availableMonitors.length > 0 && (
            <form onSubmit={handleAddMonitor} className="flex gap-2 pt-2">
              <select
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                value={addMonitorId}
                onChange={(e) => {
                  setAddMonitorId(e.target.value);
                  const mon = allMonitors?.find((m) => m.id === e.target.value);
                  if (mon) setAddDisplayName(mon.name);
                }}
              >
                <option value="">Select a monitor...</option>
                {availableMonitors.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <Input
                placeholder="Display name"
                value={addDisplayName}
                onChange={(e) => setAddDisplayName(e.target.value)}
                className="w-48"
              />
              <Button type="submit" disabled={!addMonitorId}>
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
