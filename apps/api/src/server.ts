import "dotenv/config";
import { buildApp } from "./app.js";
import { startCheckWorker } from "./workers/check.worker.js";
import { syncMonitorJobs } from "./workers/scheduler.js";

const PORT = parseInt(process.env.PORT || "4000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Uptimeblow API running at http://${HOST}:${PORT}`);

    // Start check worker and sync jobs
    // Only start if Redis is available (skip in dev without Redis)
    if (process.env.REDIS_URL) {
      startCheckWorker();
      await syncMonitorJobs();
      app.log.info("Check worker and scheduler started");
    } else {
      app.log.warn(
        "REDIS_URL not set — check worker disabled. Set REDIS_URL to enable monitoring."
      );
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
