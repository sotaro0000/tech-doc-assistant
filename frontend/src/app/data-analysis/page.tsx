'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import dynamic from 'next/dynamic';

// Plotlyを動的インポート（SSR対策）
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface BasicInfo {
  rows: number;
  columns: number;
  column_names: string[];
  dtypes: Record<string, string>;
  missing_values: Record<string, number>;
  memory_usage: string;
}

interface Insight {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AnalysisResult {
  filename: string;
  file_type: string;
  analysis: {
    basic_info: BasicInfo;
    statistics: any;
    preview: {
      head: any[];
      tail: any[];
    };
    visualizations: Record<string, any>;
    insights: Insight[];
  };
}

export default function DataAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert('ファイルを選択してください');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('http://localhost:8001/api/analyze/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Analysis failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('分析に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    // サンプルCSVをダウンロード
    const csvContent = `name,age,department,salary,experience
Alice,28,Engineering,75000,3
Bob,35,Marketing,65000,7
Charlie,42,Engineering,95000,12
Diana,31,Sales,70000,5
Eve,29,Engineering,80000,4
Frank,38,Marketing,72000,9
Grace,45,Engineering,105000,15
Henry,33,Sales,68000,6
Ivy,27,Marketing,62000,2
Jack,40,Engineering,92000,11`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'sample_employees.csv', { type: 'text/csv' });
    setFile(file);
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'default';
      case 'info': return 'default';
      case 'error': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 データ分析</h1>
            <p className="text-gray-600 mt-2">CSV/ExcelファイルをアップロードしてAI分析</p>
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

        {/* ファイルアップロード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>ファイルアップロード</CardTitle>
            <CardDescription>CSV または Excel ファイルを選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">ファイル選択</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              {file && (
                <p className="text-sm text-gray-500">
                  選択中: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAnalyze} disabled={loading || !file}>
                {loading ? '分析中...' : '📊 分析開始'}
              </Button>
              <Button variant="outline" onClick={loadSampleData}>
                サンプルデータをロード
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 分析結果 */}
        {result && (
          <div className="space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>📋 基本情報</CardTitle>
                <CardDescription>{result.filename}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">行数</p>
                    <p className="text-2xl font-bold">{result.analysis.basic_info.rows}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">列数</p>
                    <p className="text-2xl font-bold">{result.analysis.basic_info.columns}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">メモリ使用量</p>
                    <p className="text-2xl font-bold">{result.analysis.basic_info.memory_usage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">欠損値合計</p>
                    <p className="text-2xl font-bold">
                      {Object.values(result.analysis.basic_info.missing_values).reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* インサイト */}
            {result.analysis.insights.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-bold">💡 インサイト</h2>
                {result.analysis.insights.map((insight, index) => (
                  <Alert key={index} variant={getAlertVariant(insight.type)}>
                    <AlertTitle>{insight.title}</AlertTitle>
                    <AlertDescription>{insight.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* タブコンテンツ */}
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview">データプレビュー</TabsTrigger>
                <TabsTrigger value="statistics">統計情報</TabsTrigger>
                <TabsTrigger value="visualizations">可視化</TabsTrigger>
                <TabsTrigger value="columns">列情報</TabsTrigger>
              </TabsList>

              {/* データプレビュー */}
              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>データプレビュー（先頭10行）</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {result.analysis.basic_info.column_names.map((col) => (
                              <th key={col} className="px-4 py-2 text-left font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {result.analysis.preview.head.map((row, index) => (
                            <tr key={index} className="border-b">
                              {result.analysis.basic_info.column_names.map((col) => (
                                <td key={col} className="px-4 py-2">
                                  {String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 統計情報 */}
              <TabsContent value="statistics" className="space-y-4">
                {result.analysis.statistics.numeric && Object.keys(result.analysis.statistics.numeric).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>数値列の統計</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="px-4 py-2 text-left">統計量</th>
                              {Object.keys(result.analysis.statistics.numeric).map((col) => (
                                <th key={col} className="px-4 py-2 text-left">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((stat) => (
                              <tr key={stat} className="border-b">
                                <td className="px-4 py-2 font-medium">{stat}</td>
                                {Object.keys(result.analysis.statistics.numeric).map((col) => (
                                  <td key={col} className="px-4 py-2">
                                    {result.analysis.statistics.numeric[col][stat]?.toFixed(2) ?? '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.analysis.statistics.categorical && Object.keys(result.analysis.statistics.categorical).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>カテゴリ列の統計</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(result.analysis.statistics.categorical).map(([col, stats]: [string, any]) => (
                        <div key={col}>
                          <h4 className="font-medium mb-2">{col}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            ユニーク値: {stats.unique_values} | 最頻値: {stats.most_common}
                          </p>
                          <div className="text-sm space-y-1">
                            {Object.entries(stats.top_values).map(([value, count]: [string, any]) => (
                              <div key={value} className="flex justify-between">
                                <span>{value}</span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* 可視化 */}
              <TabsContent value="visualizations" className="space-y-4">
                {Object.entries(result.analysis.visualizations).map(([key, plotData]) => (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <Plot
                        data={plotData.data}
                        layout={plotData.layout}
                        config={{ responsive: true }}
                        style={{ width: '100%', height: '500px' }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* 列情報 */}
              <TabsContent value="columns" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>列情報</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.analysis.basic_info.column_names.map((col) => (
                        <div key={col} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{col}</p>
                              <p className="text-sm text-gray-500">
                                型: {result.analysis.basic_info.dtypes[col]}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">
                                欠損値: {result.analysis.basic_info.missing_values[col]}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}