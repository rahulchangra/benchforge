import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { existsSync } from "fs";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  var __dbInitialized: boolean | undefined;
}

/**
 * On Vercel (serverless), the SQLite file lives in /tmp which is ephemeral.
 * We run `prisma db push` on first access to ensure the schema exists.
 */
function ensureDatabase() {
  if (globalThis.__dbInitialized) return;
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("file:")) {
    const filePath = url.replace("file:", "");
    if (!existsSync(filePath)) {
      try {
        execSync("npx prisma db push --skip-generate --accept-data-loss", {
          env: { ...process.env, DATABASE_URL: url },
          stdio: "pipe",
        });
      } catch {
        // Ignore errors - db push may fail in edge runtime
      }
    }
  }
  globalThis.__dbInitialized = true;
}

// Ensure the DB file + schema exist before creating the client
ensureDatabase();

/** Singleton Prisma client - reuses connection in dev with HMR */
export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;
