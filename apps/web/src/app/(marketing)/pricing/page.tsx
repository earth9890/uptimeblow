import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for personal projects",
    features: [
      "25 monitors",
      "2-minute check interval",
      "HTTP, ping, port, keyword checks",
      "Email alerts",
      "1 status page",
      "Multi-region checks",
    ],
    cta: "Start Free",
    href: "/register",
    popular: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "For indie hackers and small teams",
    features: [
      "100 monitors",
      "1-minute check interval",
      "Everything in Free",
      "Slack, Discord, Webhook alerts",
      "Incident management",
      "3 status pages",
      "SMS alerts (add-on)",
    ],
    cta: "Start Free Trial",
    href: "/register",
    popular: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing businesses",
    features: [
      "500 monitors",
      "30-second check interval",
      "Everything in Starter",
      "On-call scheduling",
      "Escalation policies",
      "Unlimited status pages",
      "PDF uptime reports",
    ],
    cta: "Start Free Trial",
    href: "/register",
    popular: false,
  },
  {
    name: "Business",
    price: "$69",
    period: "/month",
    description: "For teams with advanced needs",
    features: [
      "2,000 monitors",
      "30-second check interval",
      "Everything in Pro",
      "Team management",
      "SSO / SAML",
      "Audit logs",
      "Priority support",
    ],
    cta: "Contact Sales",
    href: "/register",
    popular: false,
  },
];

export default function PricingPage() {
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

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            No hidden fees. No surprise bills. Start free and upgrade when you need more.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-xl border bg-white p-6 dark:bg-gray-900 ${
                plan.popular
                  ? "border-indigo-500 ring-2 ring-indigo-500"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                  plan.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "border hover:bg-muted"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "What happens when I hit my monitor limit?",
                a: "You'll need to upgrade to add more monitors. Existing monitors continue working — we never pause your monitoring.",
              },
              {
                q: "Can I switch plans at any time?",
                a: "Yes! Upgrade or downgrade anytime. Changes take effect immediately and billing is prorated.",
              },
              {
                q: "Do you offer annual billing?",
                a: "Not yet, but it's coming soon with a 20% discount. Sign up for monthly now and we'll migrate you when annual launches.",
              },
              {
                q: "What check regions do you support?",
                a: "We check from US East, EU West, and Asia Pacific. A monitor is only marked down when 2+ regions agree — no false positives.",
              },
              {
                q: "Is there a free trial for paid plans?",
                a: "Yes! All paid plans come with a 14-day free trial. No credit card required to start.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-medium">{faq.q}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
