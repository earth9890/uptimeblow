import type { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, subscriptions } from "../db/schema/index.js";

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia" as any,
  });
}

const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
  business: process.env.STRIPE_PRICE_BUSINESS || "",
};

export async function billingRoutes(app: FastifyInstance) {
  // ── Create Checkout Session ───────────────────
  app.post(
    "/billing/checkout",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const { plan } = request.body as { plan?: string };

      if (!plan || !PRICE_IDS[plan]) {
        return reply.status(400).send({ success: false, error: "Invalid plan" });
      }

      // Get or create Stripe customer
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, request.user.userId))
        .limit(1);

      let customerId = sub?.stripeCustomerId;

      if (!customerId) {
        const customer = await getStripe().customers.create({
          email: request.user.email,
          metadata: { userId: request.user.userId },
        });
        customerId = customer.id;

        await db
          .insert(subscriptions)
          .values({
            userId: request.user.userId,
            plan: "free",
            stripeCustomerId: customerId,
          })
          .onConflictDoNothing();
      }

      const session = await getStripe().checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
        success_url: `${process.env.APP_URL}/dashboard/settings?billing=success`,
        cancel_url: `${process.env.APP_URL}/dashboard/settings?billing=cancel`,
        metadata: {
          userId: request.user.userId,
          plan,
        },
      });

      return { success: true, data: { url: session.url } };
    }
  );

  // ── Customer Portal ───────────────────────────
  app.post(
    "/billing/portal",
    { onRequest: [app.authenticate] },
    async (request, reply) => {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, request.user.userId))
        .limit(1);

      if (!sub?.stripeCustomerId) {
        return reply.status(400).send({ success: false, error: "No billing account" });
      }

      const session = await getStripe().billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${process.env.APP_URL}/dashboard/settings`,
      });

      return { success: true, data: { url: session.url } };
    }
  );

  // ── Stripe Webhook ────────────────────────────
  app.post(
    "/billing/webhook",
    { config: { rawBody: true } },
    async (request, reply) => {
      const sig = request.headers["stripe-signature"];
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return reply.status(400).send({ error: "Missing signature" });
      }

      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(
          request.body as string,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch {
        return reply.status(400).send({ error: "Invalid signature" });
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan;

          if (userId && plan) {
            await db
              .update(users)
              .set({ plan: plan as any, updatedAt: new Date() })
              .where(eq(users.id, userId));

            await db
              .update(subscriptions)
              .set({
                plan: plan as any,
                status: "active",
                stripeSubscriptionId: session.subscription as string,
              })
              .where(eq(subscriptions.userId, userId));
          }
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, customerId))
            .limit(1);

          if (sub) {
            await db
              .update(subscriptions)
              .set({
                status: subscription.status,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              })
              .where(eq(subscriptions.id, sub.id));
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;

          const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.stripeCustomerId, customerId))
            .limit(1);

          if (sub) {
            await db
              .update(subscriptions)
              .set({ status: "canceled", plan: "free" })
              .where(eq(subscriptions.id, sub.id));

            await db
              .update(users)
              .set({ plan: "free", updatedAt: new Date() })
              .where(eq(users.id, sub.userId));
          }
          break;
        }
      }

      return reply.status(200).send({ received: true });
    }
  );
}
