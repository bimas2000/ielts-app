import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Uses DATABASE_URL from .env.local (Neon PostgreSQL)
    url: process.env.DATABASE_URL ?? "",
  },
});
