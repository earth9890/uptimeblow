import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import authPlugin from "./plugins/auth.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { monitorRoutes } from "./routes/monitors.js";
import { alertChannelRoutes } from "./routes/alert-channels.js";
import { incidentRoutes } from "./routes/incidents.js";
import { statusPageRoutes } from "./routes/status-pages.js";
import { billingRoutes } from "./routes/billing.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty" }
          : undefined,
    },
  });

  // Plugins
  await app.register(cors, {
    origin: process.env.APP_URL || "http://localhost:3000",
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(authPlugin);

  // Zod validation error handler
  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    if (error.name === "ZodError") {
      return reply.status(400).send({
        success: false,
        error: "Validation error",
        details: JSON.parse(error.message),
      });
    }

    app.log.error(error);
    return reply.status(error.statusCode ?? 500).send({
      success: false,
      error: error.message || "Internal server error",
    });
  });

  // Routes
  await app.register(healthRoutes, { prefix: "/api" });
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(userRoutes, { prefix: "/api" });
  await app.register(monitorRoutes, { prefix: "/api" });
  await app.register(alertChannelRoutes, { prefix: "/api" });
  await app.register(incidentRoutes, { prefix: "/api" });
  await app.register(statusPageRoutes, { prefix: "/api" });
  await app.register(billingRoutes, { prefix: "/api" });

  return app;
}
