import { Resend } from "resend";

const FROM_EMAIL = "Uptimeblow Alerts <alerts@uptimeblow.com>";

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY || "");
}

export async function sendAlertEmail(
  config: { email: string },
  monitorName: string,
  type: "down" | "recovery",
  message: string
) {
  const subject =
    type === "down"
      ? `🔴 Alert: ${monitorName} is DOWN`
      : `🟢 Recovered: ${monitorName} is back UP`;

  const bgColor = type === "down" ? "#dc2626" : "#16a34a";

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: config.email,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: ${bgColor}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">${subject}</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <pre style="white-space: pre-wrap; font-family: sans-serif; color: #374151;">${message}</pre>
          <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">
            — Uptimeblow Monitoring
          </p>
        </div>
      </div>
    `,
  });
}
