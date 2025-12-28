'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Document {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string | null;
}

export default function DocumentDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`http://localhost:8001/documents/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setDocument(data);
          setEditTitle(data.title);
          setEditContent(data.content);
        }
      } catch (error) {
        console.error('Failed to fetch document:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && params.id) {
      fetchDocument();
    }
  }, [status, params.id]);

  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:8001/documents/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDocument(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">ドキュメントが見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button variant="outline" onClick={() => router.push('/documents')}>
            ← ドキュメント一覧に戻る
          </Button>
        </div>

        <Card>
          <CardHeader>
            {isEditing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold border rounded px-2 py-1 w-full"
              />
            ) : (
              <CardTitle className="text-2xl">{document.title}</CardTitle>
            )}
            <div className="text-sm text-gray-500">
              作成: {new Date(document.created_at).toLocaleString('ja-JP')}
              {document.updated_at && ` / 更新: ${new Date(document.updated_at).toLocaleString('ja-JP')}`}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[400px] border rounded px-3 py-2 font-mono"
              />
            ) : (
              <div className="prose max-w-none whitespace-pre-wrap">
                {document.content}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleUpdate}>保存</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                キャンセル
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>編集</Button>
          )}
        </div>
      </div>
    </div>
  );
}