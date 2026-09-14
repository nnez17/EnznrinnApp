import { pgTable, text, integer, timestamp, index, uniqueIndex, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// One entry per day (date::date unique) mirrors the app's existing rule.
export const diary = pgTable(
  "diary",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    content: text("content").notNull(),
    mood: text("mood"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("diary_date_idx").on(t.date),
    // Must stay byte-identical to migrations/0001: this server rejects ("date")::date
    // in index expressions; repo queries repeat the same expression to match.
    uniqueIndex("diary_date_day_uniq").on(sql`CAST(${t.date} AT TIME ZONE 'UTC' AS date)`),
    check("diary_mood_check", sql`${t.mood} IS NULL OR ${t.mood} IN ('happy','sad','neutral','love','excited','stressed')`),
  ],
);
