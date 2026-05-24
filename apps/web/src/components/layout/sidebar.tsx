"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  Globe,
  LayoutDashboard,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/monitors", label: "Monitors", icon: Activity },
  { href: "/dashboard/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/status-pages", label: "Status Pages", icon: Globe },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Zap className="h-6 w-6 text-indigo-500" />
        <span className="text-xl font-bold">Uptimeblow</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">
          <p className="font-medium">Free Plan</p>
          <p>3 / 25 monitors</p>
          <Link
            href="/dashboard/settings#billing"
            className="mt-1 inline-block text-indigo-500 hover:underline"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </aside>
  );
}
