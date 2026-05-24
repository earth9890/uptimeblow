import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  statusPages,
  statusPageMonitors,
  statusPageSubscribers,
  monitors,
  incidents,
  checkResults,
} from "../db/schema/index.js";

const createStatusPageSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  brandColor: z.string().max(7).optional(),
  logoUrl: z.string().url().optional(),
});

const updateStatusPageSchema = createStatusPageSchema.partial();

const addMonitorSchema = z.object({
  monitorId: z.string().uuid(),
  displayName: z.string().min(1).max(255),
  sortOrder: z.number().int().optional(),
});

export async function statusPageRoutes(app: FastifyInstance) {
  // ── Authenticated Routes ──────────────────────
  app.register(async (authApp) => {
    authApp.addHook("onRequest", app.authenticate);

    authApp.get("/status-pages", async (request) => {
      const pages = await db
        .select()
        .from(statusPages)
        .where(eq(statusPages.userId, request.user.userId))
        .orderBy(statusPages.createdAt);
      return { success: true, data: pages };
    });

    authApp.post("/status-pages", async (request, reply) => {
      const body = createStatusPageSchema.parse(request.body);
      try {
        const [page] = await db
          .insert(statusPages)
          .values({
            userId: request.user.userId,
            name: body.name,
            slug: body.slug,
            brandColor: body.brandColor || "#6366f1",
            logoUrl: body.logoUrl || null,
          })
          .returning();
        return reply.status(201).send({ success: true, data: page });
      } catch (err: any) {
        if (err.message?.includes("unique")) {
          return reply.status(409).send({ success: false, error: "Slug already taken" });
        }
        throw err;
      }
    });

    authApp.get("/status-pages/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const [page] = await db
        .select()
        .from(statusPages)
        .where(and(eq(statusPages.id, id), eq(statusPages.userId, request.user.userId)))
        .limit(1);
      if (!page) return reply.status(404).send({ success: false, error: "Not found" });

      const pageMonitors = await db
        .select()
        .from(statusPageMonitors)
        .where(eq(statusPageMonitors.statusPageId, id))
        .orderBy(statusPageMonitors.sortOrder);

      return { success: true, data: { ...page, monitors: pageMonitors } };
    });

    authApp.patch("/status-pages/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = updateStatusPageSchema.parse(request.body);
      const [page] = await db
        .update(statusPages)
        .set({ ...body, updatedAt: new Date() })
        .where(and(eq(statusPages.id, id), eq(statusPages.userId, request.user.userId)))
        .returning();
      if (!page) return reply.status(404).send({ success: false, error: "Not found" });
      return { success: true, data: page };
    });

    authApp.delete("/status-pages/:id", async (request, reply) => {
      const { id } = request.params as { id: string };
      const [deleted] = await db
        .delete(statusPages)
        .where(and(eq(statusPages.id, id), eq(statusPages.userId, request.user.userId)))
        .returning({ id: statusPages.id });
      if (!deleted) return reply.status(404).send({ success: false, error: "Not found" });
      return { success: true, message: "Deleted" };
    });

    // Add monitor to status page
    authApp.post("/status-pages/:id/monitors", async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = addMonitorSchema.parse(request.body);

      const [entry] = await db
        .insert(statusPageMonitors)
        .values({
          statusPageId: id,
          monitorId: body.monitorId,
          displayName: body.displayName,
          sortOrder: body.sortOrder ?? 0,
        })
        .returning();

      return reply.status(201).send({ success: true, data: entry });
    });

    authApp.delete("/status-pages/:id/monitors/:monitorId", async (request, reply) => {
      const { id, monitorId } = request.params as { id: string; monitorId: string };
      await db
        .delete(statusPageMonitors)
        .where(
          and(
            eq(statusPageMonitors.statusPageId, id),
            eq(statusPageMonitors.monitorId, monitorId)
          )
        );
      return { success: true, message: "Removed" };
    });
  });

  // ── Public Routes (no auth) ───────────────────
  app.get("/public/status/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const [page] = await db
      .select()
      .from(statusPages)
      .where(and(eq(statusPages.slug, slug), eq(statusPages.isPublic, true)))
      .limit(1);

    if (!page) {
      return reply.status(404).send({ success: false, error: "Status page not found" });
    }

    // Get monitors assigned to this page
    const pageMonitors = await db
      .select({
        displayName: statusPageMonitors.displayName,
        sortOrder: statusPageMonitors.sortOrder,
        monitorId: statusPageMonitors.monitorId,
        status: monitors.status,
        name: monitors.name,
      })
      .from(statusPageMonitors)
      .innerJoin(monitors, eq(statusPageMonitors.monitorId, monitors.id))
      .where(eq(statusPageMonitors.statusPageId, page.id))
      .orderBy(statusPageMonitors.sortOrder);

    // Get recent incidents
    const recentIncidents = await db
      .select()
      .from(incidents)
      .where(eq(incidents.userId, page.userId))
      .orderBy(desc(incidents.createdAt))
      .limit(10);

    // Calculate overall status
    const allUp = pageMonitors.every((m) => m.status === "up" || m.status === "paused");
    const anyDown = pageMonitors.some((m) => m.status === "down");

    return {
      success: true,
      data: {
        name: page.name,
        slug: page.slug,
        logoUrl: page.logoUrl,
        brandColor: page.brandColor,
        overallStatus: anyDown ? "degraded" : allUp ? "operational" : "unknown",
        monitors: pageMonitors,
        incidents: recentIncidents.filter((i) => i.status !== "resolved").slice(0, 5),
        recentIncidents: recentIncidents,
      },
    };
  });

  // Subscribe to status page
  app.post("/public/status/:slug/subscribe", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { email } = request.body as { email?: string };

    if (!email) return reply.status(400).send({ success: false, error: "Email required" });

    const [page] = await db
      .select({ id: statusPages.id })
      .from(statusPages)
      .where(eq(statusPages.slug, slug))
      .limit(1);

    if (!page) return reply.status(404).send({ success: false, error: "Not found" });

    await db
      .insert(statusPageSubscribers)
      .values({ statusPageId: page.id, email, confirmed: true })
      .onConflictDoNothing();

    return { success: true, message: "Subscribed" };
  });
}
