import NextAuth, { type DefaultSession, type AuthOptions, type Session } from "next-auth";
import { type JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { User as UserModel } from "@/lib/models/User";
import { connectDB } from "@/lib/db";
import type { User } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: "admin" | "customer" | "canteen_staff";
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: "admin" | "customer" | "canteen_staff";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "admin" | "customer" | "canteen_staff";
    email: string;
    name: string;
    image?: string | null;
  }
}

export const authConfig: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Ensure a secret is provided in production
  ...(process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET ? {
    get secret() { throw new Error('NEXTAUTH_SECRET is required in production'); }
  } : {}),
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        try {
          await connectDB();
          const user = await UserModel.findOne({ email: credentials.email.toLowerCase() }).select("+password");

          if (!user || !user.password) {
            throw new Error("Invalid email or password");
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          const userObj: User = {
            id: user._id.toString(),
            name: user.name || '',
            email: user.email || '',
            role: (user.role?.toLowerCase() || 'customer') as "customer" | "admin" | "canteen_staff",
          };

          console.log('[authorize] ✅ User authenticated:', { id: userObj.id, email: userObj.email, role: userObj.role });
          return userObj;
        } catch (error) {
          console.error('[authorize] ❌ Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    // ✅ JWT callback: Store role in token
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },

    // ✅ Session callback: Expose role in session
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    }
  },
};

export const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
export default handler;
