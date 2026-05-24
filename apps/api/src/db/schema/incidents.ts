import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { monitors } from "./monitors.ts";

export const severityEnum = pgEnum("severity", [
  "minor",
  "major",
  "critical",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
]);

export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  monitorId: uuid("monitor_id").references(() => monitors.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 500 }).notNull(),
  severity: severityEnum("severity").notNull().default("major"),
  status: incidentStatusEnum("status").notNull().default("investigating"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const incidentUpdates = pgTable("incident_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  incidentId: uuid("incident_id")
    .notNull()
    .references(() => incidents.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: incidentStatusEnum("status").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
