import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface StatusMonitor {
  displayName: string;
  status: string;
  monitorId: string;
}

interface StatusIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  resolvedAt: string | null;
}

interface StatusPageData {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  overallStatus: string;
  monitors: StatusMonitor[];
  incidents: StatusIncident[];
  recentIncidents: StatusIncident[];
}

export default async function PublicStatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data: StatusPageData;
  try {
    const res = await api<{ success: boolean; data: StatusPageData }>(
      `/api/public/status/${slug}`,
      { next: { revalidate: 30 } } as any
    );
    data = res.data;
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Status page not found.</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    operational: {
      label: "All Systems Operational",
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      icon: CheckCircle2,
    },
    degraded: {
      label: "Partial System Outage",
      color: "text-red-700",
      bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
      icon: XCircle,
    },
    unknown: {
      label: "Status Unknown",
      color: "text-gray-700",
      bg: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800",
      icon: MinusCircle,
    },
  };

  const overall = statusConfig[data.overallStatus] || statusConfig.unknown!;
  const OverallIcon = overall.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt={data.name} className="h-8" />
            ) : (
              <Zap className="h-6 w-6" style={{ color: data.brandColor }} />
            )}
            <h1 className="text-xl font-bold">{data.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        {/* Overall Status Banner */}
        <div className={`rounded-xl border p-6 ${overall.bg}`}>
          <div className="flex items-center gap-3">
            <OverallIcon className={`h-8 w-8 ${overall.color}`} />
            <h2 className={`text-2xl font-bold ${overall.color}`}>
              {overall.label}
            </h2>
          </div>
        </div>

        {/* Active Incidents */}
        {data.incidents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Incidents</h3>
            {data.incidents.map((inc) => (
              <div
                key={inc.id}
                className="rounded-xl border bg-white p-5 dark:bg-gray-900"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <p className="font-medium">{inc.title}</p>
                  <Badge variant="destructive" className="capitalize text-xs">
                    {inc.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  {inc.status} &middot; Started{" "}
                  {new Date(inc.startedAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Monitors */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Services</h3>
          <div className="rounded-xl border bg-white dark:bg-gray-900 overflow-hidden">
            {data.monitors.map((monitor, i) => (
              <div
                key={monitor.monitorId}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < data.monitors.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="font-medium">{monitor.displayName}</span>
                <div className="flex items-center gap-2">
                  {monitor.status === "up" && (
                    <>
                      <span className="text-sm text-emerald-600">Operational</span>
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </>
                  )}
                  {monitor.status === "down" && (
                    <>
                      <span className="text-sm text-red-600">Outage</span>
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    </>
                  )}
                  {monitor.status === "paused" && (
                    <>
                      <span className="text-sm text-gray-500">Maintenance</span>
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-400" />
                    </>
                  )}
                  {monitor.status === "pending" && (
                    <>
                      <span className="text-sm text-amber-600">Checking</span>
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    </>
                  )}
                </div>
              </div>
            ))}
            {data.monitors.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground">
                No services configured.
              </div>
            )}
          </div>
        </div>

        {/* Recent Incidents */}
        {data.recentIncidents.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Past Incidents</h3>
            {data.recentIncidents
              .filter((i) => i.status === "resolved")
              .slice(0, 5)
              .map((inc) => (
                <div
                  key={inc.id}
                  className="rounded-xl border bg-white p-4 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <p className="font-medium">{inc.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Resolved {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString() : ""}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center text-sm text-muted-foreground">
          Powered by{" "}
          <a
            href="https://uptimeblow.com"
            className="font-medium hover:underline"
            style={{ color: data.brandColor }}
          >
            Uptimeblow
          </a>
        </footer>
      </main>
    </div>
  );
}
