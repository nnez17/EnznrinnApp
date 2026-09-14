import {
  pgTable, text, integer, bigint, timestamp, index, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// balance is intentionally NOT a column — derived via SQL window function (PRD §10).
export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    note: text("note").notNull().default(""),
    transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("transactions_user_id_idx").on(t.userId),
    index("transactions_transaction_date_idx").on(t.transactionDate),
    index("transactions_type_idx").on(t.type),
    check("transactions_type_check", sql`${t.type} IN ('income', 'expense')`),
    check("transactions_amount_check", sql`${t.amount} > 0`),
  ],
);
