'use client';
const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tech-doc-assistant-production.up.railway.app'
  : 'http://localhost:8001';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { status } = useSession();
  const [apiStatus, setApiStatus] = useState<string>('checking...');
  const [dbStatus, setDbStatus] = useState<string>('checking...');

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
              <CardDescription></CardDescription>
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
              <CardDescription></CardDescription>
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
          {status === 'authenticated' ? (
            <>
              <Button size="lg" onClick={() => window.location.href = '/documents'}>
                ドキュメント一覧
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = '/chunk-analyzer'}>
                チャンク分析
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={() => signIn('github')}>
              GitHubでログイン
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}