'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">📚 Tech Doc Assistant</CardTitle>
          <CardDescription>ログインして開始</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            // ✅ prompt: 'select_account' を追加
            onClick={() => signIn('github', { callbackUrl: '/', prompt: 'select_account' })}
          >
            {/* SVG アイコン */}
            GitHubでログイン
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}