import { defineConfig } from "drizzle-kit";

// DATABASE_URL comes from environment (never committed).
export default defineConfig({
  schema: "./schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
