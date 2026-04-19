
// This file was generated (has been modified) by Prisma and assumes you have installed the following:
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// datasource.url here is read by the Prisma CLI (schema engine) for
// migrations. We point it at DIRECT_URL so migrations use Supabase's
// session-mode pooler (port 5432), which supports prepared statements
// and advisory locks. The Prisma Client at runtime uses schema.prisma's
// datasource, which points at DATABASE_URL (pooled, port 6543).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  engine: "classic",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
