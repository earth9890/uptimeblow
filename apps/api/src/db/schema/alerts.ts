import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { monitors } from "./monitors.ts";

export const alertChannelTypeEnum = pgEnum("alert_channel_type", [
  "email",
  "slack",
  "discord",
  "webhook",
]);

export const alertChannels = pgTable("alert_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: alertChannelTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  config: jsonb("config").$type<Record<string, unknown>>().notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const alertHistory = pgTable("alert_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  channelId: uuid("channel_id")
    .notNull()
    .references(() => alertChannels.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 20 }).notNull(), // 'down' | 'recovery'
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});
