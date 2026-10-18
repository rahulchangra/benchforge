/**
 * With PostgreSQL (Neon), the schema is persistent.
 * This is a no-op kept for API compatibility with withErrorHandling.
 */
export async function ensureSchema() {
  // No-op: PostgreSQL schema is managed via prisma db push / migrate
}
