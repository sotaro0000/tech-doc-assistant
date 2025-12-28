'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 環境変数からAPIのURLを取得（未設定ならlocalhost）
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

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
  
  // params.id が 'new' かどうかで新規作成モードを判定
  const isNew = params.id === 'new';

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(!isNew); // 新規作成ならロード不要
  const [isEditing, setIsEditing] = useState(isNew); // 新規作成なら最初から編集モード
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDocument = async () => {
      // 新規作成時はデータ取得をスキップ
      if (isNew) return;

      try {
        const res = await fetch(`${API_URL}/documents/${params.id}`);
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
  }, [status, params.id, isNew]);

  // 保存処理 (新規作成 POST / 更新 PUT)
  const handleSave = async () => {
    try {
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? `${API_URL}/documents` : `${API_URL}/documents/${params.id}`;
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
        }),
      });

      if (res.ok) {
        // 保存成功したら一覧へ戻る
        router.push('/documents');
        router.refresh(); 
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  // 「ドキュメントが見つかりません」の判定を修正 (新規作成時は除外)
  if (!isNew && !document) {
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
            <CardTitle className="text-2xl mb-2">
              {isNew ? "新規作成" : (isEditing ? "ドキュメントを編集" : document?.title)}
            </CardTitle>
            
            {isEditing ? (
              <input
                type="text"
                placeholder="タイトルを入力..."
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-2xl font-bold border rounded px-2 py-1 w-full mt-2"
              />
            ) : null}

            {!isNew && document && (
              <div className="text-sm text-gray-500 mt-2">
                作成: {new Date(document.created_at).toLocaleString('ja-JP')}
                {document.updated_at && ` / 更新: ${new Date(document.updated_at).toLocaleString('ja-JP')}`}
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {isEditing ? (
              <textarea
                placeholder="内容（Markdown形式）を入力..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[400px] border rounded px-3 py-2 font-mono"
              />
            ) : (
              <div className="prose max-w-none whitespace-pre-wrap">
                {document?.content}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave}>保存</Button>
              <Button variant="outline" onClick={() => isNew ? router.push('/documents') : setIsEditing(false)}>
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