"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Pause } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { MonitorCard } from "@/components/monitors/monitor-card";
import { CreateMonitorDialog } from "@/components/monitors/create-monitor-dialog";

interface Stats {
  total: number;
  up: number;
  down: number;
  paused: number;
}

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  status: string;
  intervalSeconds: number;
  lastCheckedAt: string | null;
}

export default function DashboardPage() {
  const { data: stats, refetch: refetchStats } = useApi<Stats>("/api/dashboard/stats");
  const { data: monitors, refetch: refetchMonitors } = useApi<Monitor[]>("/api/monitors");

  const refetchAll = () => {
    refetchStats();
    refetchMonitors();
  };

  const downMonitors = monitors?.filter((m) => m.status === "down") || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your monitoring status
          </p>
        </div>
        <CreateMonitorDialog onCreated={refetchAll} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Monitors
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Up</CardTitle>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.up ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Down</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.down ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">
              {stats?.paused ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Down monitors alert */}
      {downMonitors.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              {downMonitors.length} monitor{downMonitors.length > 1 ? "s" : ""}{" "}
              down
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {downMonitors.map((m) => (
              <MonitorCard key={m.id} monitor={m} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* All monitors */}
      <Card>
        <CardHeader>
          <CardTitle>All Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          {!monitors || monitors.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p>
                No monitors configured yet. Add your first monitor to get
                started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {monitors.map((m) => (
                <MonitorCard key={m.id} monitor={m} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
