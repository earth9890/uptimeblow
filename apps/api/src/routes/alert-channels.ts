import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { alertChannels, alertHistory } from "../db/schema/index.js";
import { sendAlertEmail } from "../services/notifiers/email.notifier.js";
import { sendSlackAlert } from "../services/notifiers/slack.notifier.js";
import { sendDiscordAlert } from "../services/notifiers/discord.notifier.js";

const createChannelSchema = z.object({
  type: z.enum(["email", "slack", "discord", "webhook"]),
  name: z.string().min(1).max(255),
  config: z.record(z.unknown()),
  isDefault: z.boolean().optional(),
});

const updateChannelSchema = createChannelSchema.partial();

export async function alertChannelRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  // ─── List Channels ─────────────────────────────
  app.get("/alert-channels", async (request) => {
    const channels = await db
      .select()
      .from(alertChannels)
      .where(eq(alertChannels.userId, request.user.userId))
      .orderBy(alertChannels.createdAt);

    return { success: true, data: channels };
  });

  // ─── Create Channel ────────────────────────────
  app.post("/alert-channels", async (request, reply) => {
    const body = createChannelSchema.parse(request.body);

    const [channel] = await db
      .insert(alertChannels)
      .values({
        userId: request.user.userId,
        type: body.type,
        name: body.name,
        config: body.config,
        isDefault: body.isDefault ?? false,
      })
      .returning();

    return reply.status(201).send({ success: true, data: channel });
  });

  // ─── Update Channel ────────────────────────────
  app.patch("/alert-channels/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateChannelSchema.parse(request.body);

    const [channel] = await db
      .update(alertChannels)
      .set(body)
      .where(
        and(
          eq(alertChannels.id, id),
          eq(alertChannels.userId, request.user.userId)
        )
      )
      .returning();

    if (!channel) {
      return reply.status(404).send({ success: false, error: "Channel not found" });
    }

    return { success: true, data: channel };
  });

  // ─── Delete Channel ────────────────────────────
  app.delete("/alert-channels/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [deleted] = await db
      .delete(alertChannels)
      .where(
        and(
          eq(alertChannels.id, id),
          eq(alertChannels.userId, request.user.userId)
        )
      )
      .returning({ id: alertChannels.id });

    if (!deleted) {
      return reply.status(404).send({ success: false, error: "Channel not found" });
    }

    return { success: true, message: "Channel deleted" };
  });

  // ─── Test Channel ──────────────────────────────
  app.post("/alert-channels/:id/test", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [channel] = await db
      .select()
      .from(alertChannels)
      .where(
        and(
          eq(alertChannels.id, id),
          eq(alertChannels.userId, request.user.userId)
        )
      )
      .limit(1);

    if (!channel) {
      return reply.status(404).send({ success: false, error: "Channel not found" });
    }

    const testMessage = "🧪 This is a test alert from Uptimeblow. If you see this, your alert channel is working!";

    try {
      switch (channel.type) {
        case "email":
          await sendAlertEmail(
            channel.config as { email: string },
            "Test Monitor",
            "down",
            testMessage
          );
          break;
        case "slack":
          await sendSlackAlert(
            channel.config as { webhookUrl: string },
            testMessage
          );
          break;
        case "discord":
          await sendDiscordAlert(
            channel.config as { webhookUrl: string },
            testMessage
          );
          break;
        case "webhook":
          await fetch((channel.config as { url: string }).url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "test",
              message: testMessage,
              timestamp: new Date().toISOString(),
            }),
          });
          break;
      }

      return { success: true, message: "Test alert sent" };
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: `Failed to send test: ${err.message}`,
      });
    }
  });

  // ─── Alert History ─────────────────────────────
  app.get("/alerts/history", async (request) => {
    const query = request.query as { limit?: string; offset?: string };
    const limit = Math.min(parseInt(query.limit || "50", 10), 200);
    const offset = parseInt(query.offset || "0", 10);

    // Get alert history for user's monitors
    const history = await db
      .select()
      .from(alertHistory)
      .orderBy(alertHistory.sentAt)
      .limit(limit)
      .offset(offset);

    return { success: true, data: history };
  });
}
