import { Queue } from "bullmq";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { monitors } from "../db/schema/index.js";
import { createRedisConnection } from "../utils/redis.js";

const CHECK_QUEUE_NAME = "monitor-checks";

let checkQueue: Queue | null = null;

export function getCheckQueue(): Queue {
  if (!checkQueue) {
    checkQueue = new Queue(CHECK_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
        attempts: 1, // No retries — we want to record failures
      },
    });
  }
  return checkQueue;
}

/**
 * Syncs all active monitors to the BullMQ scheduler.
 * Creates repeatable jobs for each non-paused monitor.
 */
export async function syncMonitorJobs() {
  const queue = getCheckQueue();

  // Remove all existing repeatable jobs first
  const repeatableJobs = await queue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key);
  }

  // Get all active monitors
  const activeMonitors = await db
    .select()
    .from(monitors)
    .where(eq(monitors.isPaused, false));

  // Schedule each monitor
  for (const monitor of activeMonitors) {
    await scheduleMonitor(monitor.id, monitor.intervalSeconds);
  }

  console.log(
    `[Scheduler] Synced ${activeMonitors.length} monitor jobs`
  );
}

/**
 * Schedule a single monitor for recurring checks.
 */
export async function scheduleMonitor(
  monitorId: string,
  intervalSeconds: number
) {
  const queue = getCheckQueue();

  await queue.add(
    "check",
    { monitorId },
    {
      repeat: {
        every: intervalSeconds * 1000,
      },
      jobId: `monitor-${monitorId}`,
    }
  );
}

/**
 * Remove a monitor from the schedule.
 */
export async function unscheduleMonitor(monitorId: string) {
  const queue = getCheckQueue();
  const repeatableJobs = await queue.getRepeatableJobs();

  for (const job of repeatableJobs) {
    if (job.id === `monitor-${monitorId}`) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
