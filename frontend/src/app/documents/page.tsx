'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// 環境変数からAPIのURLを取得
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface Document {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/documents`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDocuments(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDocuments();
    }
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ドキュメント一覧</h1>
          <Button onClick={() => router.push('/documents/new')}>新規作成</Button>
          <Button variant="outline" onClick={() => router.push('/notion-import')}>
            📥 Notionインポート
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              ドキュメントがありません。「新規作成」ボタンから作成してください。
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="cursor-pointer hover:shadow-md transition" onClick={() => router.push(`/documents/${doc.id}`)}>
                <CardHeader>
                    <Button variant="outline" onClick={() => router.push('/data-analysis')}>
                        📊データ分析
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/database-connector')}>
                        🗄️ DB接続
                    </Button>
                  <CardTitle>{doc.title}</CardTitle>
                  <CardDescription>
                    作成: {new Date(doc.created_at).toLocaleDateString('ja-JP')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-2">{doc.content.substring(0, 150)}...</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                    >
                      削除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8">
          <Button variant="outline" onClick={() => router.push('/')}>
            ← ホームに戻る
          </Button>
        </div>
      </div>
    </div>
  );
}