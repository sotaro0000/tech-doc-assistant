import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // 明示的に true を返すことで、AccessDenied エラーを防ぎます
    async signIn() {
      return true;
    },
    async session({ session }) {
      return session;
    },
  },
  // 秘密鍵。RailwayのVariablesにある NEXTAUTH_SECRET と一致させます
  secret: process.env.NEXTAUTH_SECRET,
};