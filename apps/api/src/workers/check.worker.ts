import { Worker, type Job } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors, checkResults } from "../db/schema/index.js";
import { createRedisConnection } from "../utils/redis.js";
import { getRedis } from "../utils/redis.js";
import { performHttpCheck } from "../services/checkers/http.checker.js";
import { performPingCheck } from "../services/checkers/ping.checker.js";
import { performPortCheck } from "../services/checkers/port.checker.js";
import { evaluateAlert } from "../services/alert-evaluator.js";

const CHECK_QUEUE_NAME = "monitor-checks";

interface CheckJobData {
  monitorId: string;
}

async function processCheck(job: Job<CheckJobData>) {
  const { monitorId } = job.data;

  // Fetch monitor config
  const [monitor] = await db
    .select()
    .from(monitors)
    .where(eq(monitors.id, monitorId))
    .limit(1);

  if (!monitor || monitor.isPaused) return;

  // Run check based on type
  let result: {
    status: "up" | "down";
    responseTimeMs: number;
    statusCode?: number | null;
    errorMessage: string | null;
  };

  switch (monitor.type) {
    case "http":
    case "keyword":
      result = await performHttpCheck({
        url: monitor.url,
        method: monitor.method,
        timeoutMs: monitor.timeoutMs,
        expectedStatus: monitor.expectedStatus,
        keyword: monitor.keyword,
        keywordType: monitor.keywordType as "present" | "absent" | null,
      });
      break;

    case "ping":
      result = await performPingCheck({
        url: monitor.url,
        timeoutMs: monitor.timeoutMs,
      });
      break;

    case "port":
      result = await performPortCheck({
        url: monitor.url,
        timeoutMs: monitor.timeoutMs,
      });
      break;

    default:
      return;
  }

  // Store check result
  await db.insert(checkResults).values({
    monitorId,
    region: "us-east", // TODO: multi-region
    status: result.status,
    responseTimeMs: result.responseTimeMs,
    statusCode: result.statusCode ?? null,
    errorMessage: result.errorMessage,
  });

  // Update monitor status
  const previousStatus = monitor.status;
  const newConsecutiveFailures =
    result.status === "down" ? monitor.consecutiveFailures + 1 : 0;
  const newStatus =
    result.status === "up"
      ? "up"
      : newConsecutiveFailures >= monitor.alertThreshold
        ? "down"
        : monitor.status === "up"
          ? "up" // Not enough failures yet
          : "down";

  await db
    .update(monitors)
    .set({
      status: newStatus,
      consecutiveFailures: newConsecutiveFailures,
      lastCheckedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(monitors.id, monitorId));

  // Update Redis cache for real-time status
  const redis = getRedis();
  await redis.set(
    `monitor:status:${monitorId}`,
    JSON.stringify({
      status: newStatus,
      responseTimeMs: result.responseTimeMs,
      lastCheckedAt: new Date().toISOString(),
    }),
    "EX",
    600 // 10 min TTL
  );

  // Evaluate alerts on status change
  if (previousStatus !== newStatus) {
    await evaluateAlert(monitor, previousStatus, newStatus, result.errorMessage);
  }
}

export function startCheckWorker() {
  const worker = new Worker(CHECK_QUEUE_NAME, processCheck, {
    connection: createRedisConnection(),
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 1000, // 50 checks per second max
    },
  });

  worker.on("completed", (job) => {
    // Quiet — only log errors
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[Worker] Check failed for job ${job?.id}: ${err.message}`
    );
  });

  console.log("[Worker] Check worker started");
  return worker;
}
