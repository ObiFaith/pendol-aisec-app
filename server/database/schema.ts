import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const vendors = sqliteTable(
  "vendors",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    website: text("website").notNull().default(""),
    description: text("description").notNull().default(""),
    sourceUrl: text("source_url").notNull(),
    sourcePage: integer("source_page").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    refreshedAt: text("refreshed_at"),
  },
  (table) => [
    check("vendors_source_page_check", sql`${table.sourcePage} IN (1, 2)`),
  ],
);
