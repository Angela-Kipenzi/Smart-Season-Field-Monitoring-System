import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    // Prefer a direct connection (e.g. Supabase non-pooler / port 5432) for migrations.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
  },
});
