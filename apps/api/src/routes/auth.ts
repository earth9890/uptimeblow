import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  registerUser,
  loginUser,
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  findOrCreateOAuthUser,
  getUserById,
} from "../services/auth.service.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/email.service.js";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(128),
});

const oauthSchema = z.object({
  provider: z.enum(["google", "github"]),
  providerId: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().optional(),
});

export async function authRoutes(app: FastifyInstance) {
  // ─── Register ───────────────────────────────────
  app.post("/auth/register", async (request, reply) => {
    const body = registerSchema.parse(request.body);

    try {
      const { user, emailVerifyToken } = await registerUser(
        body.email,
        body.name,
        body.password
      );

      // Send verification email (non-blocking)
      sendVerificationEmail(user.email, emailVerifyToken).catch((err) =>
        app.log.error(err, "Failed to send verification email")
      );

      const accessToken = app.jwt.sign({
        userId: user.id,
        email: user.email,
      });
      const refreshToken = await createRefreshToken(user.id);

      return reply.status(201).send({
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (err: any) {
      if (err.message === "Email already registered") {
        return reply.status(409).send({ success: false, error: err.message });
      }
      throw err;
    }
  });

  // ─── Login ──────────────────────────────────────
  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    try {
      const user = await loginUser(body.email, body.password);
      const accessToken = app.jwt.sign({
        userId: user.id,
        email: user.email,
      });
      const refreshToken = await createRefreshToken(user.id);

      return reply.send({
        success: true,
        data: { user, accessToken, refreshToken },
      });
    } catch {
      return reply
        .status(401)
        .send({ success: false, error: "Invalid email or password" });
    }
  });

  // ─── Refresh Token ─────────────────────────────
  app.post("/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (!refreshToken) {
      return reply
        .status(400)
        .send({ success: false, error: "Refresh token required" });
    }

    const user = await validateRefreshToken(refreshToken);
    if (!user) {
      return reply
        .status(401)
        .send({ success: false, error: "Invalid refresh token" });
    }

    // Rotate refresh token
    await revokeRefreshToken(refreshToken);
    const newRefreshToken = await createRefreshToken(user.id);
    const accessToken = app.jwt.sign({
      userId: user.id,
      email: user.email,
    });

    return reply.send({
      success: true,
      data: { user, accessToken, refreshToken: newRefreshToken },
    });
  });

  // ─── Logout ─────────────────────────────────────
  app.post("/auth/logout", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return reply.send({ success: true, message: "Logged out" });
  });

  // ─── Verify Email ──────────────────────────────
  app.post("/auth/verify-email", async (request, reply) => {
    const { token } = request.body as { token?: string };

    if (!token) {
      return reply
        .status(400)
        .send({ success: false, error: "Token required" });
    }

    try {
      await verifyEmail(token);
      return reply.send({ success: true, message: "Email verified" });
    } catch {
      return reply
        .status(400)
        .send({ success: false, error: "Invalid verification token" });
    }
  });

  // ─── Forgot Password ──────────────────────────
  app.post("/auth/forgot-password", async (request, reply) => {
    const body = forgotPasswordSchema.parse(request.body);
    const result = await requestPasswordReset(body.email);

    if (result) {
      sendPasswordResetEmail(body.email, result.resetToken).catch((err) =>
        app.log.error(err, "Failed to send password reset email")
      );
    }

    // Always return success to prevent email enumeration
    return reply.send({
      success: true,
      message: "If an account exists, a reset email has been sent",
    });
  });

  // ─── Reset Password ───────────────────────────
  app.post("/auth/reset-password", async (request, reply) => {
    const body = resetPasswordSchema.parse(request.body);

    try {
      await resetPassword(body.token, body.password);
      return reply.send({ success: true, message: "Password reset successful" });
    } catch {
      return reply
        .status(400)
        .send({ success: false, error: "Invalid or expired reset token" });
    }
  });

  // ─── OAuth Callback ───────────────────────────
  app.post("/auth/oauth", async (request, reply) => {
    const body = oauthSchema.parse(request.body);

    const user = await findOrCreateOAuthUser(
      body.provider,
      body.providerId,
      body.email,
      body.name,
      body.avatarUrl
    );

    const accessToken = app.jwt.sign({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = await createRefreshToken(user.id);

    return reply.send({
      success: true,
      data: { user, accessToken, refreshToken },
    });
  });

  // ─── Get Current User ─────────────────────────
  app.get(
    "/auth/me",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.userId);

      if (!user) {
        return reply
          .status(404)
          .send({ success: false, error: "User not found" });
      }

      return reply.send({ success: true, data: user });
    }
  );
}
