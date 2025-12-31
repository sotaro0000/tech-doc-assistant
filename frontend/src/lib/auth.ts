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
    // 🟢 ログインを制限する「門番」の役割
    async signIn({ user }) {
      // ここに許可したいメールアドレスを並べます
      const allowedEmails = [
        "your-email@example.com",     // あなたのメールアドレス
        "friend-email@example.com",   // 許可したい友達のメール
      ];

      // ログインしようとした人のメールがリストにあれば許可 (true)
      if (user.email && allowedEmails.includes(user.email)) {
        return true;
      }

      // リストにない場合は拒否 (false)
      console.warn(`Access denied for: ${user.email}`);
      return false;
    },

    // セッションの処理（既存のものを維持）
    session: async ({ session }) => {
      return session;
    },
  },
  // 拒否された時に表示されるエラーページ（任意設定）
  pages: {
    error: '/auth/error', 
  },
};