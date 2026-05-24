import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-8 w-8" />
          <span className="text-2xl font-bold">Uptimeblow</span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Beautiful uptime monitoring
            <br />
            that won&apos;t blow your budget.
          </h1>
          <p className="mt-4 text-lg text-indigo-200">
            Monitor your websites, APIs, and services. Get instant alerts when
            things go down. Beautiful status pages included.
          </p>
        </div>
        <p className="text-sm text-indigo-300">
          Trusted by indie hackers and small teams worldwide.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
