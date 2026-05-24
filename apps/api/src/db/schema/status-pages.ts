import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users.ts";
import { monitors } from "./monitors.ts";

export const statusPages = pgTable("status_pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  customDomain: varchar("custom_domain", { length: 255 }),
  logoUrl: text("logo_url"),
  brandColor: varchar("brand_color", { length: 7 }).notNull().default("#6366f1"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const statusPageMonitors = pgTable("status_page_monitors", {
  id: uuid("id").primaryKey().defaultRandom(),
  statusPageId: uuid("status_page_id")
    .notNull()
    .references(() => statusPages.id, { onDelete: "cascade" }),
  monitorId: uuid("monitor_id")
    .notNull()
    .references(() => monitors.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const statusPageSubscribers = pgTable("status_page_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  statusPageId: uuid("status_page_id")
    .notNull()
    .references(() => statusPages.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  confirmToken: text("confirm_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
