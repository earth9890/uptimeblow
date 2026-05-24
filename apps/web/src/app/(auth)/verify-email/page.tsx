"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    api("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold">Verifying your email...</h2>
        <p className="text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Email verified!</h2>
          <p className="text-muted-foreground">
            Your email has been verified. You can now use all features.
          </p>
        </div>
        <Link href="/dashboard">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <XCircle className="mx-auto h-16 w-16 text-red-500" />
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Verification failed</h2>
        <p className="text-muted-foreground">
          This link is invalid or has already been used.
        </p>
      </div>
      <Link href="/login">
        <Button variant="outline">Go to login</Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Verifying...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
