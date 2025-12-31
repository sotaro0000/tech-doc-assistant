'use client';
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tech-doc-assistant-production.up.railway.app'
  : 'http://localhost:8001';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Home() {
  const { status } = useSession();
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [dbStatus, setDbStatus] = useState<string>('checking...');
  
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  // 🟢 表示・非表示を切り替えるためのステート
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
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
    } else {
      alert("合言葉が正しくありません。");
    }
  };

  if (status !== 'authenticated' || !isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80-vh]">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">📚 Tech Doc Assistant</h1>
          <p className="text-xl text-gray-600 mb-8">このアプリを利用するには認証が必要です</p>
          
          {status !== 'authenticated' ? (
            <Button size="lg" onClick={() => signIn('github')}>
              GitHubでログインして開始
            </Button>
          ) : (
            <Card className="w-full max-w-sm mx-auto p-6 text-left">
              <CardTitle className="mb-4 text-lg">合言葉を入力</CardTitle>
              <div className="flex flex-col gap-4">
                {/* 🟢 入力欄と切り替えボタンをまとめるグループ */}
                <div className="relative">
                  <Input
                    // 🟢 showPasswordがtrueなら text、falseなら password になる
                    type={showPassword ? "text" : "password"}
                    placeholder="合言葉を入力してください"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                    className="pr-16" // 右側にボタン用のスペースを確保
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-blue-600"
                  >
                    {showPassword ? "非表示" : "表示"}
                  </button>
                </div>
                <Button onClick={handleAuth}>認証する</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // --- これ以降（ログイン後のコンテンツ）は変更なし ---
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Tech Doc Assistant
          </h1>
          <p className="text-xl text-gray-600">
            AI-powered Technical Documentation Management System
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Backend API (FastAPI)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  apiStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">{apiStatus}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database (PostgreSQL)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="font-medium">{dbStatus}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>主な機能</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">📝</span>
                <div>
                  <strong>ドキュメント管理</strong>
                  <p className="text-sm text-gray-600">Markdownドキュメントの作成・編集・削除</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">🤖</span>
                <div>
                  <strong>AI検索・質問応答</strong>
                  <p className="text-sm text-gray-600">GPT-4を使った自然言語検索と要約</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">📊</span>
                <div>
                  <strong>データ分析</strong>
                  <p className="text-sm text-gray-600">pandasによるCSV/Excel分析</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button size="lg" onClick={() => window.location.href = '/documents'}>
            ドキュメント一覧
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = '/chunk-analyzer'}>
            チャンク分析
          </Button>
        </div>
      </div>
    </div>
  );
}