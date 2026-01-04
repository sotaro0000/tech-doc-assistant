'use client';

import { useSession, signIn, signOut } from 'next-auth/react'; // signOut を追加
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tech-doc-assistant-production.up.railway.app'
  : 'http://localhost:8001';

export default function Home() {
  const { status, data: session } = useSession();
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [dbStatus, setDbStatus] = useState<string>('checking...');
  
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const savedAuth = localStorage.getItem('app_authorized');
    if (savedAuth === 'true') {
      setIsAuthorized(true);
    }
    setIsCheckingAuth(false);

    fetch(`${API_URL}/health`).then(res => res.json()).then(data => setApiStatus(data.status)).catch(() => setApiStatus('disconnected'));
    fetch(`${API_URL}/health/db`).then(res => res.json()).then(data => setDbStatus(data.database)).catch(() => setDbStatus('disconnected'));
  }, []);

  const handleAuth = () => {
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
    if (passwordInput === correctPassword) {
      setIsAuthorized(true);
      localStorage.setItem('app_authorized', 'true');
    } else {
      alert("合言葉が正しくありません。");
    }
  };

  if (isCheckingAuth) return null;

  if (status !== 'authenticated' || !isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Tech Doc Assistant</h1>
          <p className="text-xl text-gray-600 mb-8">このアプリを利用するには認証が必要です</p>
          
          {status !== 'authenticated' ? (
            <div className="flex flex-col items-center gap-4">
              <Button size="lg" onClick={() => signIn('github', { prompt: 'select_account' })}>
                GitHubでログインして開始
              </Button>
              <p className="text-sm text-gray-400">※GitHubアカウントを選択してログインできます</p>
            </div>
          ) : (
            <Card className="w-full max-w-sm mx-auto p-6 text-left border-2 border-blue-500/20 shadow-xl">
              <CardTitle className="mb-4 text-lg">🔑 合言葉を入力</CardTitle>
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="合言葉を入力してください"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    className="pr-16"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-blue-600">
                    {showPassword ? "非表示" : "表示"}
                  </button>
                </div>
                <Button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700 text-white">認証する</Button>
                {/* 合言葉画面でも別アカウントに切り替えられるようにログアウトボタンを設置 */}
                <button onClick={() => signOut()} className="text-xs text-gray-400 underline">別のアカウントでログインし直す</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Tech Doc Assistant</h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-blue-600 font-medium">👤 Logged in as: {session?.user?.name || session?.user?.email}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => { localStorage.removeItem('app_authorized'); window.location.reload(); }}
                className="text-xs text-gray-400 hover:text-orange-500 underline"
              >
                合言葉の認証をリセット
              </button>
              <button 
                onClick={() => { localStorage.removeItem('app_authorized'); signOut({ callbackUrl: '/' }); }}
                className="text-xs text-gray-400 hover:text-red-500 underline"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
        {/* ...（残りのステータスカードなどは変更なし）... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader><CardTitle className="text-sm text-gray-500">Backend API</CardTitle></CardHeader>
            <CardContent><span className="font-bold text-lg">{apiStatus}</span></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-gray-500">Database</CardTitle></CardHeader>
            <CardContent><span className="font-bold text-lg">{dbStatus}</span></CardContent>
          </Card>
        </div>
        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = '/documents'}>ドキュメント一覧</Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = '/chunk-analyzer'}>チャンク分析</Button>
        </div>
      </div>
    </div>
  );
}