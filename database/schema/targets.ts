import { pgTable, text, bigint, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// current_amount is intentionally NOT a column — derived from live balance (PRD §11).
export const targets = pgTable(
  "targets",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().default(""),
    targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
    deadline: timestamp("deadline", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("targets_created_at_idx").on(t.createdAt),
    check("targets_amount_check", sql`${t.targetAmount} > 0`),
  ],
);
