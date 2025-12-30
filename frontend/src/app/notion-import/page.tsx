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
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from 'react-markdown';

// API URL の環境変数対応
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

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

  // 認証チェック
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center gap-4">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-[400px] w-full max-w-4xl" />
      </div>
    );
  }

  // 共通リクエスト関数
  const apiRequest = async (endpoint: string, body: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'エラーが発生しました' }));
      throw new Error(error.detail || 'リクエストに失敗しました');
    }
    return res.json();
  };

  // Notionページ検索
  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/notion/search', {
        query: searchQuery || null,
      });
      setSearchResults(data.pages || []);
    } catch (error: any) {
      alert(`検索失敗: ${error.message}`);
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
    setPageData(null); // 前のデータをクリア
    try {
      const data = await apiRequest('/api/notion/page', {
        page_id: targetId,
      });
      setPageData(data);
      setPageId(targetId);
    } catch (error: any) {
      alert(`プレビュー取得失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ドキュメントとしてインポート
  const handleImport = async () => {
    if (!pageData) return;

    setImporting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Notion] ${pageData.title}`,
          content: pageData.content,
          chunkStrategy: chunkStrategy,
          metadata: {
            source: 'notion',
            notion_url: pageData.url,
            notion_page_id: pageData.page_id
          }
        }),
      });

      if (!res.ok) throw new Error('インポートに失敗しました');

      alert('インポートが完了しました！');
      router.push('/documents');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setImporting(false);
    }
  };

  // URLからページIDを抽出
  const extractPageId = (url: string) => {
    // notion.so/workspace/Page-Name-ID の形式からIDを抽出
    const match = url.match(/([a-f0-9]{32})/);
    return match ? match[1] : url.split('/').pop()?.split('?')[0].replace(/-/g, '') || url;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">📥 Notionインポート</h1>
            <p className="text-slate-500 mt-2">Notionのドキュメントをナレッジベースに取り込みます</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/documents')}>一覧へ戻る</Button>
            <Button variant="outline" onClick={() => router.push('/')}>ホーム</Button>
          </div>
        </div>

        {/* メイン設定エリア */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">取得方法</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="url">URL入力</TabsTrigger>
                    <TabsTrigger value="search">検索</TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <Label htmlFor="pageId" className="text-xs uppercase text-slate-500">Notion URL / ID</Label>
                      <Input
                        id="pageId"
                        placeholder="URLを貼り付け"
                        value={pageId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPageId(val.includes('notion.so') ? extractPageId(val) : val);
                        }}
                      />
                    </div>
                    <Button className="w-full" onClick={() => handlePreview()} disabled={loading}>
                      {loading ? '読み込み中...' : 'プレビュー表示'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="search" className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex gap-2">
                      <Input
                        placeholder="タイトルで検索"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button variant="secondary" onClick={handleSearch} disabled={loading}>検索</Button>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {searchResults.map((page) => (
                        <div 
                          key={page.id} 
                          className="p-2 text-sm border rounded hover:bg-slate-50 cursor-pointer flex justify-between items-center group"
                          onClick={() => handlePreview(page.id)}
                        >
                          <span className="truncate flex-1 mr-2">{page.title}</span>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-7">選択</Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
                  <span>💡</span> 使い方ガイド
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-blue-700 space-y-2 leading-relaxed">
                <p>1. <b>Notion側設定:</b> ページの右上 <code>...</code> メニューから「接続先」を選び、作成したインテグレーションを追加してください。</p>
                <p>2. <b>URL:</b> ページURLをコピーして左のボックスに貼り付けます。</p>
                <p>3. <b>インポート:</b> Markdown変換された内容を確認し、実行ボタンを押してください。</p>
              </CardContent>
            </Card>
          </div>

          {/* プレビュー表示エリア */}
          <div className="lg:col-span-2">
            {pageData ? (
              <Card className="animate-in slide-in-from-right-4 duration-500 shadow-md">
                <CardHeader className="border-b bg-slate-50/50">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <CardTitle className="text-xl">{pageData.title}</CardTitle>
                      <a href={pageData.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                        Notionで元のページを確認 ↗
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <Label className="text-[10px] text-slate-500 mb-1">チャンク分割戦略</Label>
                        <Select value={chunkStrategy} onValueChange={setChunkStrategy}>
                          <SelectTrigger className="w-[140px] h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="fixed">Fixed Size</SelectItem>
                            <SelectItem value="semantic">Semantic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="h-9 mt-auto" onClick={handleImport} disabled={importing}>
                        {importing ? '実行中...' : '📥 インポート'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="rendered">
                    <TabsList className="mb-4">
                      <TabsTrigger value="rendered">表示確認</TabsTrigger>
                      <TabsTrigger value="raw">ソース(MD)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="rendered" className="prose prose-slate max-w-none border rounded-md p-6 bg-white min-h-[400px]">
                      <ReactMarkdown>{pageData.content}</ReactMarkdown>
                    </TabsContent>
                    <TabsContent value="raw">
                      <pre className="p-4 bg-slate-900 text-slate-100 rounded-md overflow-x-auto text-xs font-mono min-h-[400px]">
                        <code>{pageData.content}</code>
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full min-h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div className="text-4xl mb-4">📄</div>
                <p>Notionページを選択、またはURLを入力して<br />プレビューを表示してください</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}