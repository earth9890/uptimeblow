"use client";

import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Pause, Play, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useState } from "react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  method: string;
  status: string;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatus: number;
  keyword: string | null;
  keywordType: string | null;
  alertThreshold: number;
  consecutiveFailures: number;
  isPaused: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
}

interface CheckResult {
  id: string;
  status: string;
  region: string;
  responseTimeMs: number | null;
  statusCode: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: monitor,
    loading,
    refetch,
  } = useApi<Monitor>(`/api/monitors/${id}`);

  const { data: checks } = useApi<CheckResult[]>(
    `/api/monitors/${id}/checks?limit=50`
  );

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

  const handlePauseResume = async () => {
    setActionLoading(true);
    try {
      const endpoint = monitor?.isPaused
        ? `/api/monitors/${id}/resume`
        : `/api/monitors/${id}/pause`;
      await api(endpoint, { method: "POST", token });
      refetch();
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this monitor? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      await api(`/api/monitors/${id}`, { method: "DELETE", token });
      router.push("/dashboard/monitors");
    } catch {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Monitor not found</p>
      </div>
    );
  }

  const intervalLabel =
    monitor.intervalSeconds >= 60
      ? `${monitor.intervalSeconds / 60} min`
      : `${monitor.intervalSeconds}s`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {monitor.name}
            </h1>
            <Badge
              variant={monitor.status === "up" ? "default" : "destructive"}
            >
              {monitor.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{monitor.url}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePauseResume}
            disabled={actionLoading}
          >
            {monitor.isPaused ? (
              <>
                <Play className="mr-1 h-4 w-4" /> Resume
              </>
            ) : (
              <>
                <Pause className="mr-1 h-4 w-4" /> Pause
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={actionLoading}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Config Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {monitor.type.toUpperCase()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{intervalLabel}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alert Threshold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {monitor.alertThreshold} failures
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Checked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {monitor.lastCheckedAt
                ? new Date(monitor.lastCheckedAt).toLocaleTimeString()
                : "Never"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Check History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {!checks || checks.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No check results yet. Checks will appear here once the monitor
              starts running.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Status Code</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Checked At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <Badge
                        variant={
                          check.status === "up" ? "default" : "destructive"
                        }
                      >
                        {check.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {check.responseTimeMs != null
                        ? `${check.responseTimeMs}ms`
                        : "—"}
                    </TableCell>
                    <TableCell>{check.statusCode ?? "—"}</TableCell>
                    <TableCell>{check.region}</TableCell>
                    <TableCell>
                      {new Date(check.checkedAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-red-500">
                      {check.errorMessage || "—"}
                    </TableCell>
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
