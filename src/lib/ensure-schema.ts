import { prisma } from "@/lib/db";
import { readFileSync } from "fs";
import { join } from "path";

declare global {
  // eslint-disable-next-line no-var
  var __dbInitialized: boolean | undefined;
}

/**
 * On Vercel serverless, SQLite in /tmp is ephemeral.
 * Run schema creation SQL on first API request.
 */
export async function ensureSchema() {
  if (globalThis.__dbInitialized) return;
  globalThis.__dbInitialized = true;

  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
    );
    if (Array.isArray(rows) && rows.length > 0) return;
  } catch {
    // DB might not exist or no tables
  }

  try {
    const sqlPath = join(process.cwd(), "prisma", "init.sql");
    const sql = readFileSync(sqlPath, "utf-8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    for (const stmt of statements) {
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch {
        // Skip errors
      }
    }
  } catch {
    globalThis.__dbInitialized = false;
  }
}
