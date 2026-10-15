import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

const ts = (name: string) => timestamp(name, { mode: "string", withTimezone: true });

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  website: text("website").notNull(),
  description: text("description").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourcePage: integer("source_page").notNull(),
  createdAt: ts("created_at").defaultNow().notNull(),
  updatedAt: ts("updated_at").defaultNow().notNull(),
  refreshedAt: ts("refreshed_at"),
});