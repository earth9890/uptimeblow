import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; email: string };
    user: { userId: string; email: string };
  }
}

async function authPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || "dev-secret-change-me",
    sign: { expiresIn: "15m" },
  });

  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch {
        reply.status(401).send({ success: false, error: "Unauthorized" });
      }
    }
  );
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(authPlugin, { name: "auth" });
