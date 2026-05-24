import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";

export const monitorTypeEnum = pgEnum("monitor_type", [
  "http",
  "ping",
  "port",
  "keyword",
]);

export const monitorStatusEnum = pgEnum("monitor_status", [
  "up",
  "down",
  "paused",
  "pending",
]);

export const httpMethodEnum = pgEnum("http_method", [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
]);

export const monitors = pgTable("monitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: monitorTypeEnum("type").notNull().default("http"),
  url: text("url").notNull(),
  method: httpMethodEnum("method").notNull().default("GET"),
  intervalSeconds: integer("interval_seconds").notNull().default(120),
  timeoutMs: integer("timeout_ms").notNull().default(30000),
  expectedStatus: integer("expected_status").notNull().default(200),
  keyword: text("keyword"),
  keywordType: varchar("keyword_type", { length: 10 }), // 'present' | 'absent'
  regions: jsonb("regions").$type<string[]>().notNull().default(["us-east"]),
  isPaused: boolean("is_paused").notNull().default(false),
  alertThreshold: integer("alert_threshold").notNull().default(3),
  status: monitorStatusEnum("status").notNull().default("pending"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const checkResults = pgTable("check_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  region: varchar("region", { length: 50 }).notNull(),
  status: varchar("status", { length: 10 }).notNull(), // 'up' | 'down'
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
