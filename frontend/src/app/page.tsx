'use client';

import { useSession, signIn } from 'next-auth/react';
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
    // 1. ローカルストレージから合言葉の認証状態を復元
    const savedAuth = localStorage.getItem('app_authorized');
    if (savedAuth === 'true') {
      setIsAuthorized(true);
    }
    setIsCheckingAuth(false);

    // 2. ヘルスチェックの実行
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => setApiStatus(data.status))
      .catch(() => setApiStatus('disconnected'));

    fetch(`${API_URL}/health/db`)
      .then(res => res.json())
      .then(data => setDbStatus(data.database))
      .catch(() => setDbStatus('disconnected'));
  }, []);

  const handleAuth = () => {
    const correctPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;
    if (passwordInput === correctPassword) {
      setIsAuthorized(true);
      // ✅ 修正点: 合言葉が正解ならブラウザに保存する
      localStorage.setItem('app_authorized', 'true');
    } else {
      alert("合言葉が正しくありません。");
    }
  };

  // 読み込み中は何も表示しない（チラつき防止）
  if (isCheckingAuth) return null;

  // 認証（GitHubログイン または 合言葉）が済んでいない場合
  if (status !== 'authenticated' || !isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Tech Doc Assistant</h1>
          <p className="text-xl text-gray-600 mb-8">このアプリを利用するには認証が必要です</p>
          
          {status !== 'authenticated' ? (
            <div className="flex flex-col items-center gap-4">
              <Button size="lg" onClick={() => signIn('github')}>
                GitHubでログインして開始
              </Button>
              <p className="text-sm text-gray-400">※GitHubアカウントをお持ちの方ならどなたでも利用可能です</p>
            </div>
          ) : (
            <Card className="w-full max-w-sm mx-auto p-6 text-left border-2 border-blue-500/20 shadow-xl">
              <CardTitle className="mb-4 text-lg flex items-center gap-2">
                <span>🔑</span> 合言葉を入力
              </CardTitle>
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 hover:text-blue-600"
                  >
                    {showPassword ? "非表示" : "表示"}
                  </button>
                </div>
                <Button onClick={handleAuth} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  認証する
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // --- ログイン・認証後のメインコンテンツ ---
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Tech Doc Assistant</h1>
          <p className="text-xl text-gray-600 mb-2">
            AI-powered Technical Documentation Management System
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
            <span>👤 Logged in as: {session?.user?.name || session?.user?.email}</span>
            <button 
              onClick={() => { localStorage.removeItem('app_authorized'); window.location.reload(); }}
              className="text-xs text-gray-400 hover:text-red-500 underline ml-2"
            >
              認証をリセット
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader><CardTitle className="text-sm text-gray-500">Backend API (FastAPI)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-bold text-lg">{apiStatus}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm text-gray-500">Database (PostgreSQL)</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-bold text-lg">{dbStatus}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 overflow-hidden">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-lg">主な機能</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <li className="space-y-2">
                <span className="text-2xl">📝</span>
                <div className="font-bold">ドキュメント管理</div>
                <p className="text-xs text-gray-500 leading-relaxed">Markdownドキュメントの作成・編集・削除を直感的に行えます。</p>
              </li>
              <li className="space-y-2">
                <span className="text-2xl">🤖</span>
                <div className="font-bold">AI検索・質問応答</div>
                <p className="text-xs text-gray-500 leading-relaxed">GPT-4がドキュメントを読み取り、最適な回答を提供します。</p>
              </li>
              <li className="space-y-2">
                <span className="text-2xl">📊</span>
                <div className="font-bold">データ分析</div>
                <p className="text-xs text-gray-500 leading-relaxed">CSVやExcelファイルをアップロードしてAIが分析をサポートします。</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button size="lg" className="px-8" onClick={() => window.location.href = '/documents'}>
            ドキュメント一覧
          </Button>
          <Button size="lg" variant="outline" className="px-8" onClick={() => window.location.href = '/chunk-analyzer'}>
            チャンク分析
          </Button>
        </div>
      </div>
    </div>
  );
}