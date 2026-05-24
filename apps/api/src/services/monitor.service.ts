import { eq, and, count } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors, checkResults } from "../db/schema/index.js";
import { PLANS, type PlanKey } from "@uptimeblow/shared";

// ─── Create Monitor ─────────────────────────────────
export async function createMonitor(
  userId: string,
  plan: PlanKey,
  data: {
    name: string;
    type: "http" | "ping" | "port" | "keyword";
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
    intervalSeconds?: number;
    timeoutMs?: number;
    expectedStatus?: number;
    keyword?: string;
    keywordType?: "present" | "absent";
    regions?: string[];
    alertThreshold?: number;
  }
) {
  // Check plan limits
  const planConfig = PLANS[plan];
  const result = await db
    .select({ value: count() })
    .from(monitors)
    .where(eq(monitors.userId, userId));
  const monitorCount = result[0]?.value ?? 0;

  if (monitorCount >= planConfig.maxMonitors) {
    throw new Error(
      `Monitor limit reached. Your ${planConfig.name} plan allows ${planConfig.maxMonitors} monitors.`
    );
  }

  // Enforce minimum interval
  const interval = data.intervalSeconds || planConfig.minInterval;
  if (interval < planConfig.minInterval) {
    throw new Error(
      `Minimum check interval for your plan is ${planConfig.minInterval} seconds.`
    );
  }

  const [monitor] = await db
    .insert(monitors)
    .values({
      userId,
      name: data.name,
      type: data.type,
      url: data.url,
      method: data.method || "GET",
      intervalSeconds: interval,
      timeoutMs: data.timeoutMs || 30000,
      expectedStatus: data.expectedStatus || 200,
      keyword: data.keyword || null,
      keywordType: data.keywordType || null,
      regions: data.regions || ["us-east"],
      alertThreshold: data.alertThreshold || 3,
      status: "pending",
    })
    .returning();

  return monitor!;
}

// ─── Get Monitors ───────────────────────────────────
export async function getMonitors(userId: string) {
  return db
    .select()
    .from(monitors)
    .where(eq(monitors.userId, userId))
    .orderBy(monitors.createdAt);
}

// ─── Get Single Monitor ─────────────────────────────
export async function getMonitorById(userId: string, monitorId: string) {
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
    .limit(1);

  return monitor || null;
}

// ─── Update Monitor ─────────────────────────────────
export async function updateMonitor(
  userId: string,
  monitorId: string,
  plan: PlanKey,
  data: Partial<{
    name: string;
    type: "http" | "ping" | "port" | "keyword";
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD";
    intervalSeconds: number;
    timeoutMs: number;
    expectedStatus: number;
    keyword: string | null;
    keywordType: "present" | "absent" | null;
    regions: string[];
    alertThreshold: number;
  }>
) {
  // Enforce minimum interval if changing
  if (data.intervalSeconds) {
    const planConfig = PLANS[plan];
    if (data.intervalSeconds < planConfig.minInterval) {
      throw new Error(
        `Minimum check interval for your plan is ${planConfig.minInterval} seconds.`
      );
    }
  }

  const [monitor] = await db
    .update(monitors)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
    .returning();

  return monitor || null;
}

// ─── Delete Monitor ─────────────────────────────────
export async function deleteMonitor(userId: string, monitorId: string) {
  const [deleted] = await db
    .delete(monitors)
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
    .returning({ id: monitors.id });

  return !!deleted;
}

// ─── Pause / Resume ─────────────────────────────────
export async function pauseMonitor(userId: string, monitorId: string) {
  const [monitor] = await db
    .update(monitors)
    .set({ isPaused: true, status: "paused", updatedAt: new Date() })
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
    .returning();

  return monitor || null;
}

export async function resumeMonitor(userId: string, monitorId: string) {
  const [monitor] = await db
    .update(monitors)
    .set({ isPaused: false, status: "pending", updatedAt: new Date() })
    .where(and(eq(monitors.id, monitorId), eq(monitors.userId, userId)))
    .returning();

  return monitor || null;
}

// ─── Get Check Results ──────────────────────────────
export async function getCheckResults(
  monitorId: string,
  limit: number = 100,
  offset: number = 0
) {
  return db
    .select()
    .from(checkResults)
    .where(eq(checkResults.monitorId, monitorId))
    .orderBy(checkResults.checkedAt)
    .limit(limit)
    .offset(offset);
}

// ─── Get Monitor Stats ──────────────────────────────
export async function getMonitorStats(userId: string) {
  const allMonitors = await db
    .select({
      status: monitors.status,
    })
    .from(monitors)
    .where(eq(monitors.userId, userId));

  const total = allMonitors.length;
  const up = allMonitors.filter((m) => m.status === "up").length;
  const down = allMonitors.filter((m) => m.status === "down").length;
  const paused = allMonitors.filter((m) => m.status === "paused").length;

  return { total, up, down, paused };
}
