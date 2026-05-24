import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Globe,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 dark:bg-gray-950/80">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">Uptimeblow</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6 dark:bg-indigo-950 dark:text-indigo-300">
          <Zap className="h-3.5 w-3.5" />
          Beautiful monitoring, honest pricing
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
          Uptime monitoring that
          <span className="text-indigo-600"> won&apos;t blow</span> your budget
        </h1>
        <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Monitor your websites, APIs, and services. Get instant alerts when things go down.
          Beautiful status pages included. Starting at $0/month.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Start monitoring free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-medium hover:bg-muted transition-colors"
          >
            View pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          25 free monitors &middot; 2-min checks &middot; No credit card required
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything you need to stay online
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          From simple uptime checks to incident management and beautiful status pages — all in one tool.
        </p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Activity,
              title: "Uptime Monitoring",
              desc: "HTTP, ping, port, and keyword checks from multiple regions. Know within seconds when something goes down.",
            },
            {
              icon: Bell,
              title: "Instant Alerts",
              desc: "Get notified via email, Slack, Discord, or webhook. No more finding out about outages from your users.",
            },
            {
              icon: AlertTriangle,
              title: "Incident Management",
              desc: "Auto-create incidents on failure. Track timeline, post updates, and resolve — all built in. From $9/mo.",
            },
            {
              icon: Globe,
              title: "Beautiful Status Pages",
              desc: "Public status pages that actually look good. Custom branding, real-time updates, email subscriptions.",
            },
            {
              icon: Shield,
              title: "Multi-Region Checks",
              desc: "Checks from US, Europe, and Asia. A monitor is only marked down when multiple regions agree.",
            },
            {
              icon: Clock,
              title: "30-Second Checks",
              desc: "Check as often as every 30 seconds. Faster detection means faster response. Available on Pro.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border bg-white p-6 dark:bg-gray-900"
            >
              <feature.icon className="h-8 w-8 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="bg-indigo-600 text-white py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Why not UptimeRobot or Better Stack?
          </h2>
          <p className="text-indigo-200 mb-12 max-w-xl mx-auto">
            We took what&apos;s great about both and made it affordable.
          </p>
          <div className="grid gap-8 sm:grid-cols-3 text-left">
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-2">vs UptimeRobot</h3>
              <ul className="space-y-2 text-indigo-100 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Faster free tier (2-min vs 5-min)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Beautiful status pages (not dated)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Built-in incident management
                </li>
              </ul>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-2">vs Better Stack</h3>
              <ul className="space-y-2 text-indigo-100 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Incidents from $9/mo (not $24)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Generous free tier
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Same beautiful design
                </li>
              </ul>
            </div>
            <div className="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
              <h3 className="font-semibold text-lg mb-2">vs Pingdom</h3>
              <ul className="space-y-2 text-indigo-100 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Free tier (they have none)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> Modern UI, not legacy
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> 10x better value at every tier
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Start monitoring in 60 seconds
        </h2>
        <p className="text-muted-foreground mb-8">
          No credit card required. 25 free monitors forever.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Create free account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium">Uptimeblow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Uptimeblow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
