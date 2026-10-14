import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const vendors = pgTable(
  "vendors",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    website: text("website").notNull().default(""),
    description: text("description").notNull().default(""),
    sourceUrl: text("source_url").notNull(),
    sourcePage: integer("source_page").notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .notNull()
      .defaultNow(),
    refreshedAt: timestamp("refreshed_at", {
      withTimezone: true,
      mode: "date",
    }),
  },
  (table) => [
    check("vendors_source_page_check", sql`${table.sourcePage} IN (1, 2)`),
  ],
);
