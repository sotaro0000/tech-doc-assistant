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
    const features = [
      {
        title: 'ドキュメント管理',
        desc: 'Markdown ベースで作成・編集・整理',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>
        ),
      },
      {
        title: 'AI 検索（RAG）',
        desc: 'GPT-4 × ベクトルDB で自然言語検索',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        ),
      },
      {
        title: '質問応答',
        desc: 'RAG による根拠付きの回答生成',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-5.5A8 8 0 1 1 21 12z" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4 1.8c0 1.7-2.5 2-2.5 3.2M12 17h.01" /></svg>
        ),
      },
      {
        title: 'Notion 連携',
        desc: 'Notion ページを Markdown で取込',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" /></svg>
        ),
      },
      {
        title: 'データ分析',
        desc: 'CSV / Excel を自動で可視化・分析',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-7" /></svg>
        ),
      },
      {
        title: '外部DB接続',
        desc: 'PostgreSQL / Oracle / SQL Server',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>
        ),
      },
    ];
    const techStack = ['Next.js 14', 'TypeScript', 'FastAPI', 'GPT-4 / Pinecone', 'pandas', 'PostgreSQL', 'Docker'];
    return (
      <div className="min-h-[88vh] bg-gradient-to-b from-blue-50/70 to-white">
        <div className="container mx-auto max-w-5xl px-4 py-16">
          {/* Hero */}
          <div className="text-center">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              AI Documentation Platform
            </span>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">📚 Tech Doc Assistant</h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gray-600">
              技術ドキュメントを <span className="font-semibold text-gray-800">AI で管理・検索</span>できるフルスタック Web アプリ。
              GPT-4 と RAG による自然言語検索で、必要な情報に最短でたどり着けます。
            </p>

            {/* ログイン CTA（機能は変更なし） */}
            <div className="flex justify-center">
              {status !== 'authenticated' ? (
                <div className="flex flex-col items-center gap-3">
                  <Button size="lg" onClick={() => signIn('github', { prompt: 'select_account' })}>
                    GitHubでログインして開始
                  </Button>
                  <p className="text-sm text-gray-400">※GitHubアカウントを選択してログインできます</p>
                </div>
              ) : (
                <Card className="mx-auto w-full max-w-sm border-2 border-blue-500/20 p-6 text-left shadow-xl">
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

          {/* Features */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 [&_svg]:h-5 [&_svg]:w-5">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-800">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech stack */}
          <div className="mt-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">Tech Stack</p>
            <div className="flex flex-wrap justify-center gap-2">
              {techStack.map((s) => (
                <span key={s} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{s}</span>
              ))}
            </div>
          </div>
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