"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Pause, AlertCircle, Clock } from "lucide-react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  status: string;
  intervalSeconds: number;
  lastCheckedAt: string | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  up: { label: "Up", color: "bg-emerald-500", icon: Activity },
  down: { label: "Down", color: "bg-red-500", icon: AlertCircle },
  paused: { label: "Paused", color: "bg-gray-400", icon: Pause },
  pending: { label: "Pending", color: "bg-amber-400", icon: Clock },
};

export function MonitorCard({ monitor }: { monitor: Monitor }) {
  const config = statusConfig[monitor.status] || statusConfig.pending!;
  const StatusIcon = config.icon;

  const intervalLabel =
    monitor.intervalSeconds >= 60
      ? `${monitor.intervalSeconds / 60}m`
      : `${monitor.intervalSeconds}s`;

  return (
    <Link href={`/dashboard/monitors/${monitor.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color} text-white`}
          >
            <StatusIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{monitor.name}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                {monitor.type.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {monitor.url}
            </p>
          </div>

          <div className="text-right shrink-0">
            <Badge
              variant={monitor.status === "up" ? "default" : "destructive"}
              className="mb-1"
            >
              {config.label}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Every {intervalLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
