import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/db";

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "benchforge-default-session-secret-min32chars",

  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder-client-secret",
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
    }),
  ],

  session: { strategy: "jwt" },

  // Required for Vercel deployment
  trustHost: true,

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (!account || !profile) return false;

      const githubId = String(profile.id ?? account.providerAccountId);
      const email =
        (profile.email as string) ?? `${githubId}@github.placeholder`;
      const name = (profile.name as string) ?? (profile.login as string) ?? "";
      const avatarUrl = (profile.avatar_url as string) ?? null;

      await prisma.user.upsert({
        where: { githubId },
        create: {
          email,
          name,
          avatarUrl,
          githubId,
          githubToken: account.access_token ?? null,
        },
        update: {
          email,
          name,
          avatarUrl,
          githubToken: account.access_token ?? null,
        },
      });

      return true;
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        const githubId = String(profile.id ?? account.providerAccountId);

        const user = await prisma.user.findUnique({ where: { githubId } });
        if (user) {
          token.userId = user.id;
          token.githubToken = user.githubToken;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
