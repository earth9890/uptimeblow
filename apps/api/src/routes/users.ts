import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  updateUser,
  changePassword,
  getUserById,
} from "../services/auth.service.js";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(128),
});

export async function userRoutes(app: FastifyInstance) {
  // All routes require authentication
  app.addHook("onRequest", app.authenticate);

  // ─── Update Profile ─────────────────────────────
  app.patch("/users/profile", async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);
    const user = await updateUser(request.user.userId, body);

    if (!user) {
      return reply
        .status(404)
        .send({ success: false, error: "User not found" });
    }

    return reply.send({ success: true, data: user });
  });

  // ─── Change Password ───────────────────────────
  app.post("/users/change-password", async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);

    try {
      await changePassword(
        request.user.userId,
        body.currentPassword,
        body.newPassword
      );
      return reply.send({ success: true, message: "Password changed" });
    } catch (err: any) {
      return reply
        .status(400)
        .send({ success: false, error: err.message });
    }
  });

  // ─── Get Profile ───────────────────────────────
  app.get("/users/profile", async (request, reply) => {
    const user = await getUserById(request.user.userId);

    if (!user) {
      return reply
        .status(404)
        .send({ success: false, error: "User not found" });
    }

    return reply.send({ success: true, data: user });
  });
}
