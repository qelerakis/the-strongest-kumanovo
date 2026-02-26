import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

declare module "next-auth" {
  interface User {
    role: "admin" | "member";
    memberId: string | null;
  }
  interface Session {
    user: {
      id: string;
      username: string;
      role: "admin" | "member";
      memberId: string | null;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    role: "admin" | "member";
    memberId: string | null;
    username: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });

        if (!user) return null;

        const isValid = compareSync(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.username,
          role: user.role as "admin" | "member",
          memberId: user.memberId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.memberId = user.memberId;
        token.username = user.name ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role as "admin" | "member";
      session.user.memberId = token.memberId as string | null;
      session.user.username = token.username as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
