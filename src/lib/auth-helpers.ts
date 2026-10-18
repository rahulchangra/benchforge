import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Get the current session (server-side).
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  return auth();
}

/**
 * Get the full User record from Prisma for the current session.
 * Returns null if not authenticated or user not found.
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
  });
}

/**
 * Require authentication — throws a 401 NextResponse if not authenticated.
 * Use in API route handlers.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    throw NextResponse.json(
      { error: "User not found" },
      { status: 401 }
    );
  }

  return user;
}
