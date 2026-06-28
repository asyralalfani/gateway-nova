import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import type { Role } from "@/lib/utils";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    username: string;
    role: Role;
  }
}

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.authSecret || "dev-only-insecure-secret-change-in-production",
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { username: parsed.data.username },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          username: user.username,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.id ?? "");
      session.user.username = String(token.username ?? "");
      session.user.role = (token.role as Role) ?? "VIEWER";
      return session;
    },
  },
});

/**
 * Check whether the current user is allowed to perform CRUD operations.
 * - When AUTH_ENABLED=false: everyone is allowed (returns null = no-user mode).
 * - When AUTH_ENABLED=true: the user must be signed in as ADMIN or EDITOR.
 */
export async function requireEditor() {
  if (!env.authEnabled) return null;

  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "ADMIN" && session.user.role !== "EDITOR") {
    throw new Error("Access denied");
  }
  return session.user;
}

export async function requireAdmin() {
  if (!env.authEnabled) return null;

  const session = await auth();
  if (!session?.user) throw new Error("Not authenticated");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");
  return session.user;
}

export async function currentUser() {
  if (!env.authEnabled) return null;
  const session = await auth();
  return session?.user ?? null;
}
