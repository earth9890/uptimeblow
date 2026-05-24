"use client";

import { useApi } from "@/hooks/use-api";
import { MonitorCard } from "@/components/monitors/monitor-card";
import { CreateMonitorDialog } from "@/components/monitors/create-monitor-dialog";
import { Activity } from "lucide-react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  status: string;
  intervalSeconds: number;
  lastCheckedAt: string | null;
}

export default function MonitorsPage() {
  const { data: monitors, loading, refetch } = useApi<Monitor[]>("/api/monitors");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitors</h1>
          <p className="text-muted-foreground">
            Track your websites, APIs, and services
          </p>
        </div>
        <CreateMonitorDialog onCreated={refetch} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">
            Loading monitors...
          </div>
        </div>
      ) : !monitors || monitors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No monitors yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Add your first monitor to start tracking uptime.
          </p>
          <CreateMonitorDialog onCreated={refetch} />
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  );
}
