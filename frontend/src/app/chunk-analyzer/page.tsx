'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChunkAnalyzerPage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
`);
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
            </div>
          </CardContent>
        </Card>

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