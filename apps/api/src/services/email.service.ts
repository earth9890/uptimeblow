import { Resend } from "resend";

const FROM_EMAIL = "Uptimeblow <noreply@uptimeblow.com>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured — email sending disabled");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your Uptimeblow account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Welcome to Uptimeblow!</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Verify Email
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your Uptimeblow password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Reset Password
        </a>
        <p style="margin-top: 24px; color: #666; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
