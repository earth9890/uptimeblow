import crypto from "node:crypto";

export async function sendWebhookAlert(
  config: { url: string; secret?: string },
  monitor: { id: string; name: string; url: string },
  type: "down" | "recovery",
  errorMessage: string | null
) {
  const payload = {
    event: type === "down" ? "monitor.down" : "monitor.recovery",
    monitor: {
      id: monitor.id,
      name: monitor.name,
      url: monitor.url,
    },
    error: errorMessage,
    timestamp: new Date().toISOString(),
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Uptimeblow-Webhook/1.0",
  };

  // Sign payload if secret is configured
  if (config.secret) {
    const signature = crypto
      .createHmac("sha256", config.secret)
      .update(body)
      .digest("hex");
    headers["X-Uptimeblow-Signature"] = `sha256=${signature}`;
  }

  await fetch(config.url, {
    method: "POST",
    headers,
    body,
  });
}
