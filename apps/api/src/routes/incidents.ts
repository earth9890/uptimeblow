import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { incidents, incidentUpdates } from "../db/schema/index.js";

const createIncidentSchema = z.object({
  title: z.string().min(1).max(500),
  monitorId: z.string().uuid().optional(),
  severity: z.enum(["minor", "major", "critical"]).optional(),
});

const updateIncidentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  severity: z.enum(["minor", "major", "critical"]).optional(),
  status: z
    .enum(["investigating", "identified", "monitoring", "resolved"])
    .optional(),
});

const createUpdateSchema = z.object({
  message: z.string().min(1),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
});

export async function incidentRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  // ─── List Incidents ────────────────────────────
  app.get("/incidents", async (request) => {
    const query = request.query as {
      status?: string;
      limit?: string;
      offset?: string;
    };

    let q = db
      .select()
      .from(incidents)
      .where(eq(incidents.userId, request.user.userId))
      .orderBy(desc(incidents.createdAt))
      .limit(Math.min(parseInt(query.limit || "50", 10), 200))
      .offset(parseInt(query.offset || "0", 10));

    const result = await q;

    // Filter by status in JS (simpler than dynamic SQL)
    const filtered = query.status
      ? result.filter((i) => i.status === query.status)
      : result;

    return { success: true, data: filtered };
  });

  // ─── Create Incident ───────────────────────────
  app.post("/incidents", async (request, reply) => {
    const body = createIncidentSchema.parse(request.body);

    const [incident] = await db
      .insert(incidents)
      .values({
        userId: request.user.userId,
        monitorId: body.monitorId || null,
        title: body.title,
        severity: body.severity || "major",
        status: "investigating",
      })
      .returning();

    // Create initial update
    await db.insert(incidentUpdates).values({
      incidentId: incident!.id,
      message: "Incident created",
      status: "investigating",
      createdBy: request.user.userId,
    });

    return reply.status(201).send({ success: true, data: incident });
  });

  // ─── Get Incident ─────────────────────────────
  app.get("/incidents/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [incident] = await db
      .select()
      .from(incidents)
      .where(
        and(eq(incidents.id, id), eq(incidents.userId, request.user.userId))
      )
      .limit(1);

    if (!incident) {
      return reply
        .status(404)
        .send({ success: false, error: "Incident not found" });
    }

    // Get updates
    const updates = await db
      .select()
      .from(incidentUpdates)
      .where(eq(incidentUpdates.incidentId, id))
      .orderBy(desc(incidentUpdates.createdAt));

    return { success: true, data: { ...incident, updates } };
  });

  // ─── Update Incident ──────────────────────────
  app.patch("/incidents/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateIncidentSchema.parse(request.body);

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.title) updateData.title = body.title;
    if (body.severity) updateData.severity = body.severity;
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "resolved") {
        updateData.resolvedAt = new Date();
      }
    }

    const [incident] = await db
      .update(incidents)
      .set(updateData)
      .where(
        and(eq(incidents.id, id), eq(incidents.userId, request.user.userId))
      )
      .returning();

    if (!incident) {
      return reply
        .status(404)
        .send({ success: false, error: "Incident not found" });
    }

    return { success: true, data: incident };
  });

  // ─── Add Incident Update ──────────────────────
  app.post("/incidents/:id/updates", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createUpdateSchema.parse(request.body);

    // Verify ownership
    const [incident] = await db
      .select({ id: incidents.id })
      .from(incidents)
      .where(
        and(eq(incidents.id, id), eq(incidents.userId, request.user.userId))
      )
      .limit(1);

    if (!incident) {
      return reply
        .status(404)
        .send({ success: false, error: "Incident not found" });
    }

    const [update] = await db
      .insert(incidentUpdates)
      .values({
        incidentId: id,
        message: body.message,
        status: body.status,
        createdBy: request.user.userId,
      })
      .returning();

    // Also update the incident status
    const incidentUpdate: Record<string, unknown> = {
      status: body.status,
      updatedAt: new Date(),
    };
    if (body.status === "resolved") {
      incidentUpdate.resolvedAt = new Date();
    }
    await db
      .update(incidents)
      .set(incidentUpdate)
      .where(eq(incidents.id, id));

    return reply.status(201).send({ success: true, data: update });
  });

  // ─── Resolve Incident ─────────────────────────
  app.post("/incidents/:id/resolve", async (request, reply) => {
    const { id } = request.params as { id: string };

    const [incident] = await db
      .update(incidents)
      .set({
        status: "resolved",
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(incidents.id, id), eq(incidents.userId, request.user.userId))
      )
      .returning();

    if (!incident) {
      return reply
        .status(404)
        .send({ success: false, error: "Incident not found" });
    }

    await db.insert(incidentUpdates).values({
      incidentId: id,
      message: "Incident resolved",
      status: "resolved",
      createdBy: request.user.userId,
    });

    return { success: true, data: incident };
  });
}
