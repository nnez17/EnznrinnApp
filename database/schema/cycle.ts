import { pgTable, integer, text, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Singleton row (id = 1) replacing the old Firestore `cycles/current` doc.
export const cycle = pgTable(
  "cycle",
  {
    id: integer("id").primaryKey().default(1),
    lastPeriodStart: text("last_period_start").notNull(),
    cycleLength: integer("cycle_length").notNull().default(28),
    periodDuration: integer("period_duration").notNull().default(5),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("cycle_id_single_check", sql`${t.id} = 1`),
    check("cycle_length_check", sql`${t.cycleLength} BETWEEN 21 AND 35`),
    check("cycle_duration_check", sql`${t.periodDuration} BETWEEN 2 AND 10`),
  ],
);
