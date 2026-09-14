import { pgTable, text, integer, bigint, boolean, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const wishlist = pgTable(
  "wishlist",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    price: bigint("price", { mode: "number" }),
    priority: text("priority").notNull().default("medium"),
    notes: text("notes"),
    isAchieved: boolean("is_achieved").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("wishlist_created_at_idx").on(t.createdAt),
    check("wishlist_priority_check", sql`${t.priority} IN ('low', 'medium', 'high')`),
  ],
);
