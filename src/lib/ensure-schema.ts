import { prisma } from "@/lib/db";
import { INIT_SQL } from "@/lib/init-sql";

declare global {
  // eslint-disable-next-line no-var
  var __dbInitialized: boolean | undefined;
}

/**
 * On Vercel serverless, SQLite in /tmp is ephemeral.
 * Run schema creation SQL (embedded) on first API request.
 */
export async function ensureSchema() {
  if (globalThis.__dbInitialized) return;
  globalThis.__dbInitialized = true;

  try {
    // Quick check - if User table exists, schema is ready
    const rows = await prisma.$queryRawUnsafe(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
    );
    if (Array.isArray(rows) && rows.length > 0) return;
  } catch {
    // DB might not exist or no tables - continue to init
  }

  // Tables don't exist - create them from embedded SQL
  for (const stmt of INIT_SQL) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch {
      // Skip errors (e.g. table already exists)
    }
  }
}
