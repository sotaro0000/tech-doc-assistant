'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';

interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
}

interface NotionPageData {
  title: string;
  content: string;
  page_id: string;
  url: string;
}

export default function NotionImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [pageId, setPageId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NotionPage[]>([]);
  const [pageData, setPageData] = useState<NotionPageData | null>(null);
  const [chunkStrategy, setChunkStrategy] = useState('markdown');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  // Notionページ検索
  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8001/api/notion/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery || null,
        }),
      });

      const data = await res.json();
      setSearchResults(data.pages || []);
    } catch (error) {
      console.error('Search failed:', error);
      alert('検索に失敗しました。Notion統合が正しく設定されているか確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // Notionページプレビュー
  const handlePreview = async (id?: string) => {
    const targetId = id || pageId;
    if (!targetId) {
      alert('ページIDを入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8001/api/notion/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: targetId,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await res.json();
      setPageData(data);
      setPageId(targetId);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('ページの取得に失敗しました。ページIDとNotion統合の接続を確認してください。');
    } finally {
      setLoading(false);
    }
  };

  // ドキュメントとしてインポート
  const handleImport = async () => {
    if (!pageData) {
      alert('プレビューを表示してください');
      return;
    }

    setImporting(true);
    try {
      // 1. Next.js APIでドキュメント作成
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Notion] ${pageData.title}`,
          content: pageData.content,
          chunkStrategy: chunkStrategy,
        }),
      });

      if (res.ok) {
        alert('インポートが完了しました！');
        router.push('/documents');
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('インポートに失敗しました');
    } finally {
      setImporting(false);
    }
  };

  // URLからページIDを抽出
  const extractPageId = (url: string) => {
    const match = url.match(/([a-f0-9]{32})/);
    return match ? match[1] : url.replace(/-/g, '');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📥 Notionインポート</h1>
            <p className="text-gray-600 mt-2">NotionページをMarkdownとしてインポートできます</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/documents')}>
              ドキュメント一覧
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              ホーム
            </Button>
          </div>
        </div>

        {/* タブ */}
        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">URLから取得</TabsTrigger>
            <TabsTrigger value="search">検索から選択</TabsTrigger>
          </TabsList>

          {/* URLから取得タブ */}
          <TabsContent value="url" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NotionページURL / ID</CardTitle>
                <CardDescription>
                  NotionページのURLまたはページIDを入力してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pageId">ページURL / ID</Label>
                  <Input
                    id="pageId"
                    placeholder="https://notion.so/ページ名-xxxxx または xxxxx"
                    value={pageId}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPageId(value.includes('notion.so') ? extractPageId(value) : value);
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    例: https://notion.so/Tech-Docs-1234567890abcdef1234567890abcdef
                  </p>
                </div>
                <Button onClick={() => handlePreview()} disabled={loading}>
                  {loading ? 'プレビュー取得中...' : 'プレビュー'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 検索タブ */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notionページ検索</CardTitle>
                <CardDescription>
                  統合が接続されているページを検索できます
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="検索キーワード（省略可）"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? '検索中...' : '検索'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 検索結果 */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">検索結果 ({searchResults.length}件)</h3>
                {searchResults.map((page) => (
                  <Card key={page.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{page.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            最終更新: {new Date(page.last_edited_time).toLocaleDateString('ja-JP')}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(page.id)}
                        >
                          プレビュー
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* プレビュー */}
        {pageData && (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{pageData.title}</CardTitle>
                    <CardDescription>
                      <a href={pageData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Notionで開く →
                      </a>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={chunkStrategy} onValueChange={setChunkStrategy}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="markdown">Markdown</SelectItem>
                        <SelectItem value="semantic">Semantic</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleImport} disabled={importing}>
                      {importing ? 'インポート中...' : '📥 ドキュメントとしてインポート'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">プレビュー</TabsTrigger>
                    <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview" className="mt-4">
                    <div className="prose max-w-none p-6 border rounded-lg bg-white">
                      <ReactMarkdown>{pageData.content}</ReactMarkdown>
                    </div>
                  </TabsContent>
                  <TabsContent value="markdown" className="mt-4">
                    <pre className="p-6 border rounded-lg bg-gray-50 overflow-x-auto">
                      <code className="text-sm">{pageData.content}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 使い方ガイド */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>💡 使い方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>1. Notion統合を作成:</strong> https://notion.so/my-integrations</p>
            <p><strong>2. ページに統合を接続:</strong> ページ右上「•••」→「接続」→統合を選択</p>
            <p><strong>3. ページURLをコピー:</strong> ブラウザのアドレスバーからコピー</p>
            <p><strong>4. このページに貼り付け:</strong> 「プレビュー」で内容確認</p>
            <p><strong>5. インポート:</strong> チャンク戦略を選んでインポート</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}