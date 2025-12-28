'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const API_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? 'https://tech-doc-assistant-production.up.railway.app'
  : 'http://localhost:8001';

interface ChunkResult {
  chunks_count: number;
  average_size: number;
  min_size: number;
  max_size: number;
  sample_chunks: string[];
}

interface AnalysisResults {
  [key: string]: ChunkResult;
}

export default function ChunkAnalyzerPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);

  const insertSampleText = () => {
    setContent(`# Next.jsとは

Next.jsはReactベースのフルスタックWebフレームワークです。

## 主な特徴

### サーバーサイドレンダリング (SSR)
ページをサーバー側でレンダリングし、SEOとパフォーマンスを向上させます。

### 静的サイト生成 (SSG)
ビルド時にHTMLを生成し、高速な配信を実現します。

## インストール方法

\`\`\`bash
npx create-next-app@latest my-app
cd my-app
npm run dev
\`\`\`

## ディレクトリ構造

Next.js 13以降では、App Routerが推奨されています。

- \`app/\` - ページとレイアウト
- \`components/\` - 再利用可能なコンポーネント
- \`public/\` - 静的ファイル

## まとめ

Next.jsは、モダンなWeb開発に必要な機能を備えた強力なフレームワークです。
`);
  };

  const analyzeChunks = async () => {
    if (!content.trim()) {
      setError('テキストを入力してください');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(`${API_URL}/api/chunk/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: 'temp',
          title: 'Analysis',
          content: content,
          strategy: 'markdown',
        }),
      });

      if (!response.ok) {
        throw new Error(`分析に失敗しました: ${response.status}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">チャンク分割アナライザー</h1>
            <p className="text-gray-600 mt-2">
              異なるチャンク分割戦略を比較・分析します
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/')}>
              ホームに戻る
            </Button>
            <Button variant="outline" onClick={() => router.push('/documents')}>
              ドキュメント一覧
            </Button>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>テキスト入力</CardTitle>
            <CardDescription>
              分析したいテキストを入力してください（Markdown形式推奨）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={insertSampleText}>
                  サンプルテキストを挿入
                </Button>
                <Button variant="outline" onClick={() => setContent('')}>
                  クリア
                </Button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="# 見出し&#10;&#10;本文をここに入力..."
                className="w-full min-h-[300px] rounded-md border px-3 py-2 font-mono text-sm"
              />
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>文字数: {content.length}</span>
                <span>行数: {content.split('\n').length}</span>
              </div>
              
              {/* 分析ボタン */}
              <Button 
                onClick={analyzeChunks} 
                disabled={loading || !content.trim()}
                className="w-full"
              >
                {loading ? '分析中...' : 'チャンク分割を分析'}
              </Button>
              
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 分析結果 */}
        {results && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>分析結果</CardTitle>
              <CardDescription>
                各戦略でのチャンク分割結果を比較
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results).map(([strategy, result]) => (
                  <Card key={strategy}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize">{strategy}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">チャンク数:</span>
                          <span className="font-semibold">{result.chunks_count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">平均サイズ:</span>
                          <span className="font-semibold">{Math.round(result.average_size)} 文字</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">最小サイズ:</span>
                          <span className="font-semibold">{result.min_size} 文字</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">最大サイズ:</span>
                          <span className="font-semibold">{result.max_size} 文字</span>
                        </div>
                      </div>
                      {result.sample_chunks && result.sample_chunks.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">サンプルチャンク:</p>
                          <div className="space-y-2">
                            {result.sample_chunks.map((chunk, idx) => (
                              <div 
                                key={idx} 
                                className="p-2 bg-gray-50 rounded text-xs font-mono overflow-hidden"
                              >
                                {chunk}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>チャンク分割戦略について</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Fixed（固定長分割）</h3>
                <p className="text-sm text-gray-600">
                  テキストを固定の文字数で機械的に分割します。
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Markdown（構造ベース分割）</h3>
                <p className="text-sm text-gray-600">
                  見出し（#）やコードブロックなど、Markdownの構造を認識して分割します。
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Semantic（意味的分割）</h3>
                <p className="text-sm text-gray-600">
                  段落や文の意味的なまとまりを考慮して分割します。
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Hybrid（ハイブリッド）</h3>
                <p className="text-sm text-gray-600">
                  Markdownとセマンティックを組み合わせた方式。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}