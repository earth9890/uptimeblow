import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  createMonitor,
  getMonitors,
  getMonitorById,
  updateMonitor,
  deleteMonitor,
  pauseMonitor,
  resumeMonitor,
  getCheckResults,
  getMonitorStats,
} from "../services/monitor.service.js";
import { getUserById } from "../services/auth.service.js";

const createMonitorSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["http", "ping", "port", "keyword"]),
  url: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).optional(),
  intervalSeconds: z.number().int().min(30).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  expectedStatus: z.number().int().min(100).max(599).optional(),
  keyword: z.string().optional(),
  keywordType: z.enum(["present", "absent"]).optional(),
  regions: z.array(z.string()).optional(),
  alertThreshold: z.number().int().min(1).max(10).optional(),
});

const updateMonitorSchema = createMonitorSchema.partial();

export async function monitorRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook("onRequest", app.authenticate);

  // ─── List Monitors ────────────────────────────
  app.get("/monitors", async (request) => {
    const monitors = await getMonitors(request.user.userId);
    return { success: true, data: monitors };
  });

  // ─── Create Monitor ───────────────────────────
  app.post("/monitors", async (request, reply) => {
    const body = createMonitorSchema.parse(request.body);
    const user = await getUserById(request.user.userId);
    if (!user) return reply.status(404).send({ success: false, error: "User not found" });

    try {
      const monitor = await createMonitor(request.user.userId, user.plan as any, body);
      return reply.status(201).send({ success: true, data: monitor });
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // ─── Get Monitor ──────────────────────────────
  app.get("/monitors/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const monitor = await getMonitorById(request.user.userId, id);

    if (!monitor) {
      return reply.status(404).send({ success: false, error: "Monitor not found" });
    }

    return { success: true, data: monitor };
  });

  // ─── Update Monitor ───────────────────────────
  app.patch("/monitors/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateMonitorSchema.parse(request.body);
    const user = await getUserById(request.user.userId);
    if (!user) return reply.status(404).send({ success: false, error: "User not found" });

    try {
      const monitor = await updateMonitor(request.user.userId, id, user.plan as any, body);
      if (!monitor) {
        return reply.status(404).send({ success: false, error: "Monitor not found" });
      }
      return { success: true, data: monitor };
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message });
    }
  });

  // ─── Delete Monitor ───────────────────────────
  app.delete("/monitors/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await deleteMonitor(request.user.userId, id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: "Monitor not found" });
    }

    return { success: true, message: "Monitor deleted" };
  });

  // ─── Pause Monitor ────────────────────────────
  app.post("/monitors/:id/pause", async (request, reply) => {
    const { id } = request.params as { id: string };
    const monitor = await pauseMonitor(request.user.userId, id);

    if (!monitor) {
      return reply.status(404).send({ success: false, error: "Monitor not found" });
    }

    return { success: true, data: monitor };
  });

  // ─── Resume Monitor ───────────────────────────
  app.post("/monitors/:id/resume", async (request, reply) => {
    const { id } = request.params as { id: string };
    const monitor = await resumeMonitor(request.user.userId, id);

    if (!monitor) {
      return reply.status(404).send({ success: false, error: "Monitor not found" });
    }

    return { success: true, data: monitor };
  });

  // ─── Get Check Results ────────────────────────
  app.get("/monitors/:id/checks", async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { limit?: string; offset?: string };

    // Verify ownership
    const monitor = await getMonitorById(request.user.userId, id);
    if (!monitor) {
      return reply.status(404).send({ success: false, error: "Monitor not found" });
    }

    const limit = Math.min(parseInt(query.limit || "100", 10), 500);
    const offset = parseInt(query.offset || "0", 10);
    const checks = await getCheckResults(id, limit, offset);

    return { success: true, data: checks };
  });

  // ─── Dashboard Stats ─────────────────────────
  app.get("/dashboard/stats", async (request) => {
    const stats = await getMonitorStats(request.user.userId);
    return { success: true, data: stats };
  });
}
