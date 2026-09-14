-- Initial schema (mirrors database/schema/*.ts) + seed users.
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "type" text NOT NULL,
  "amount" bigint NOT NULL,
  "note" text NOT NULL DEFAULT '',
  "transaction_date" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "transactions_type_check" CHECK ("type" IN ('income', 'expense')),
  CONSTRAINT "transactions_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_user_id_idx" ON "transactions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_transaction_date_idx" ON "transactions" ("transaction_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions" ("type");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "targets" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL DEFAULT '',
  "target_amount" bigint NOT NULL,
  "deadline" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "targets_amount_check" CHECK ("target_amount" > 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "targets_created_at_idx" ON "targets" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist" (
  "id" text PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "price" bigint,
  "priority" text NOT NULL DEFAULT 'medium',
  "notes" text,
  "is_achieved" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "wishlist_priority_check" CHECK ("priority" IN ('low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_created_at_idx" ON "wishlist" ("created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diary" (
  "id" text PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "date" timestamptz NOT NULL,
  "content" text NOT NULL,
  "mood" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "diary_mood_check" CHECK ("mood" IS NULL OR "mood" IN ('happy','sad','neutral','love','excited','stressed'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diary_date_idx" ON "diary" ("date");
--> statement-breakpoint
-- (("date")::date) is a syntax error on this server (Neon PG18); the immutable
-- UTC form is the only one accepted, and repo queries use the identical
-- expression so the index (and ON CONFLICT inference) actually match.
CREATE UNIQUE INDEX IF NOT EXISTS "diary_date_day_uniq" ON "diary" (CAST(("date") AT TIME ZONE 'UTC' AS date));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cycle" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "last_period_start" text NOT NULL,
  "cycle_length" integer NOT NULL DEFAULT 28,
  "period_duration" integer NOT NULL DEFAULT 5,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "cycle_id_single_check" CHECK ("id" = 1),
  CONSTRAINT "cycle_length_check" CHECK ("cycle_length" BETWEEN 21 AND 35),
  CONSTRAINT "cycle_duration_check" CHECK ("period_duration" BETWEEN 2 AND 10)
);
--> statement-breakpoint
-- Seed the two app users; ensureUserIds()/userIDForName() depend on these.
INSERT INTO "users" ("name") VALUES ('Noval'), ('Kharin') ON CONFLICT ("name") DO NOTHING;
