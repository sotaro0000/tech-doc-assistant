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
      <div
        className="min-h-[88vh] bg-white"
        style={{
          backgroundImage: "radial-gradient(115% 55% at 50% -6%, #ecfdf5 0%, rgba(236,253,245,0) 58%)",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="mx-auto max-w-5xl px-5 py-14 sm:py-16">
          <p className="font-mono text-xs tracking-wider text-emerald-700">// AI documentation platform</p>

          <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* 左：見出し + CTA */}
            <div>
              <p className="font-mono text-sm text-zinc-400">Tech&nbsp;Doc&nbsp;Assistant</p>
              <h1 className="mt-2 text-3xl font-bold leading-[1.2] tracking-tight text-zinc-900 sm:text-[2.5rem]">
                技術ドキュメントを、<br />
                AIで&ldquo;探す&rdquo;。
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-600">
                GPT-4 と RAG（ベクトル検索）で、ドキュメントに自然言語で質問。Markdown 管理・Notion 連携・データ分析・外部DB接続までを備えた、開発者向けのフルスタック・ドキュメント基盤です。
              </p>

              <div className="mt-7">
                {status !== 'authenticated' ? (
                  <div className="flex flex-col items-start gap-2">
                    <button
                      onClick={() => signIn('github', { prompt: 'select_account' })}
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 hover:shadow-md"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                        <path d="M12 2A10 10 0 0 0 8.8 21.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
                      </svg>
                      GitHub でログインして開始
                    </button>
                    <p className="font-mono text-xs text-zinc-400">※ GitHub アカウントを選択してログインできます</p>
                  </div>
                ) : (
                  <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-zinc-500">passphrase required</p>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="合言葉を入力"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                          className="pr-16 font-mono"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-400 hover:text-emerald-700">
                          {showPassword ? "hide" : "show"}
                        </button>
                      </div>
                      <Button onClick={handleAuth} className="w-full bg-emerald-600 text-white hover:bg-emerald-700">認証する</Button>
                      <button onClick={() => signOut()} className="font-mono text-xs text-zinc-400 underline">別のアカウントでログインし直す</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右：ターミナル演出 */}
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl">
              <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 font-mono text-[11px] text-zinc-500">tech-doc-assistant</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
                <span className="text-emerald-400">$</span> ask <span className="text-amber-300">&quot;OAuth 認証フローの仕様は？&quot;</span>
                {"\n"}
                <span className="text-zinc-500">↳ retrieving from vector store…</span>
                {"\n"}
                <span className="text-zinc-500">  matched 3 docs →</span> <span className="text-sky-300">auth/oauth.md</span> <span className="text-sky-300">auth/jwt.md</span> <span className="text-sky-300">api/login.md</span>
                {"\n\n"}
                <span className="text-emerald-400">✓</span> GPT-4 が根拠付きで回答を生成
                {"\n"}
                <span className="text-zinc-600"># RAG · Pinecone · 出典リンク付き</span>
              </pre>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-16">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">// how it works</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ["01", "GitHub でログイン", "数秒で開始。面倒なアカウント登録は不要"],
                ["02", "ドキュメントを集約", "Markdown 作成・Notion / CSV 取込で社内ナレッジを一元化"],
                ["03", "自然言語で質問", "RAG が出典（根拠）付きで回答を生成"],
              ].map(([n, t, d]) => (
                <div key={n} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <span className="font-mono text-sm font-medium text-emerald-600">{n}</span>
                  <p className="mt-1.5 text-sm font-medium text-zinc-900">{t}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-12">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">// features</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-zinc-400 [&_svg]:h-4 [&_svg]:w-4">
                    {f.icon}
                    <span className="font-mono text-[11px] text-zinc-300">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                  <h3 className="mt-2.5 text-sm font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tech stack */}
          <div className="mt-10">
            <p className="font-mono text-xs uppercase tracking-wider text-zinc-400">// stack</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {techStack.map((s) => (
                <span key={s} className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[11px] text-zinc-600">{s}</span>
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