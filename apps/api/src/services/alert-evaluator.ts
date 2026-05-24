import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  alertChannels,
  alertHistory,
  incidents,
  incidentUpdates,
} from "../db/schema/index.js";
import { getRedis } from "../utils/redis.js";
import { sendAlertEmail } from "./notifiers/email.notifier.js";
import { sendSlackAlert } from "./notifiers/slack.notifier.js";
import { sendDiscordAlert } from "./notifiers/discord.notifier.js";
import { sendWebhookAlert } from "./notifiers/webhook.notifier.js";

interface MonitorInfo {
  id: string;
  userId: string;
  name: string;
  url: string;
  alertThreshold: number;
}

/**
 * Evaluate whether to send alerts based on status change.
 * Also auto-creates/resolves incidents.
 */
export async function evaluateAlert(
  monitor: MonitorInfo,
  previousStatus: string,
  newStatus: string,
  errorMessage: string | null
) {
  const redis = getRedis();

  // Check cooldown — don't spam alerts
  const cooldownKey = `alert:cooldown:${monitor.id}`;
  const inCooldown = await redis.get(cooldownKey);

  if (newStatus === "down" && previousStatus !== "down") {
    // ── Monitor went DOWN ──────────────────────────
    if (inCooldown) return;

    // Set 5-min cooldown
    await redis.set(cooldownKey, "1", "EX", 300);

    // Auto-create incident
    const [incident] = await db
      .insert(incidents)
      .values({
        userId: monitor.userId,
        monitorId: monitor.id,
        title: `${monitor.name} is down`,
        severity: "major",
        status: "investigating",
      })
      .returning();

    if (incident) {
      await db.insert(incidentUpdates).values({
        incidentId: incident.id,
        message: errorMessage || "Monitor detected as down",
        status: "investigating",
        createdBy: monitor.userId,
      });
    }

    // Send alerts to all user's channels
    await dispatchAlerts(monitor, "down", errorMessage);
  } else if (newStatus === "up" && previousStatus === "down") {
    // ── Monitor RECOVERED ──────────────────────────
    await redis.del(cooldownKey);

    // Resolve open incidents for this monitor
    const openIncidents = await db
      .select()
      .from(incidents)
      .where(eq(incidents.monitorId, monitor.id));

    for (const incident of openIncidents) {
      if (incident.status !== "resolved") {
        await db
          .update(incidents)
          .set({
            status: "resolved",
            resolvedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(incidents.id, incident.id));

        await db.insert(incidentUpdates).values({
          incidentId: incident.id,
          message: "Monitor has recovered",
          status: "resolved",
          createdBy: monitor.userId,
        });
      }
    }

    // Send recovery alerts
    await dispatchAlerts(monitor, "recovery", null);
  }
}

async function dispatchAlerts(
  monitor: MonitorInfo,
  type: "down" | "recovery",
  errorMessage: string | null
) {
  const channels = await db
    .select()
    .from(alertChannels)
    .where(eq(alertChannels.userId, monitor.userId));

  const message =
    type === "down"
      ? `🔴 ${monitor.name} is DOWN\nURL: ${monitor.url}\nReason: ${errorMessage || "Unknown"}`
      : `🟢 ${monitor.name} is back UP\nURL: ${monitor.url}`;

  for (const channel of channels) {
    try {
      switch (channel.type) {
        case "email":
          await sendAlertEmail(
            channel.config as { email: string },
            monitor.name,
            type,
            message
          );
          break;
        case "slack":
          await sendSlackAlert(
            channel.config as { webhookUrl: string },
            message
          );
          break;
        case "discord":
          await sendDiscordAlert(
            channel.config as { webhookUrl: string },
            message
          );
          break;
        case "webhook":
          await sendWebhookAlert(
            channel.config as { url: string; secret?: string },
            monitor,
            type,
            errorMessage
          );
          break;
      }

      // Log successful alert
      await db.insert(alertHistory).values({
        monitorId: monitor.id,
        channelId: channel.id,
        type,
        message,
      });
    } catch (err) {
      console.error(
        `[Alert] Failed to send ${channel.type} alert for ${monitor.name}:`,
        err
      );
    }
  }
}
