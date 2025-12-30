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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// API URL の環境変数対応
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

interface ConnectionConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  service_name?: string;
}

interface QueryResult {
  columns: string[];
  data: any[];
  row_count: number;
  query: string;
}

interface TableSchema {
  name: string;
  type: string;
  nullable: boolean;
  default: string;
}

export default function DatabaseConnectorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [dbType, setDbType] = useState<string>('postgresql');
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig>({
    host: 'localhost',
    port: '5432',
    database: 'test_db',
    user: 'postgres',
    password: 'postgres',
  });
  
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableSchema, setTableSchema] = useState<TableSchema[]>([]);
  const [query, setQuery] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 認証チェック
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
        <div className="text-center animate-pulse text-slate-500">読み込み中...</div>
      </div>
    );
  }

  // 汎用フェッチ関数（DRY原則に基づき統一）
  const dbFetch = async (endpoint: string, body: any) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || 'APIリクエストに失敗しました');
    }
    return res.json();
  };

  const handleDbTypeChange = (value: string) => {
    setDbType(value);
    const defaults: Record<string, Partial<ConnectionConfig>> = {
      postgresql: { port: '5432', service_name: undefined },
      oracle: { port: '1521', service_name: 'XEPDB1' },
      sqlserver: { port: '1433', service_name: undefined }
    };
    setConfig(prev => ({ ...prev, ...defaults[value] }));
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setConnectionStatus(null);
    try {
      const data = await dbFetch('/api/database/test', {
        db_type: dbType,
        custom_config: useCustomConfig ? config : null,
      });

      setConnectionStatus(data);
      if (data.status === 'success') {
        await fetchTables();
      }
    } catch (error: any) {
      setConnectionStatus({
        status: 'error',
        message: error.message || '接続に失敗しました',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const data = await dbFetch('/api/database/tables', {
        db_type: dbType,
        custom_config: useCustomConfig ? config : null,
      });
      setTables(data.tables || []);
    } catch (error: any) {
      console.error('Failed to fetch tables:', error.message);
    }
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setLoading(true);
    try {
      const data = await dbFetch('/api/database/schema', {
        db_type: dbType,
        table_name: tableName,
        custom_config: useCustomConfig ? config : null,
      });
      setTableSchema(data.schema || []);
      setQuery(`SELECT * FROM ${tableName} LIMIT 10`);
    } catch (error: any) {
      alert(`スキーマの取得に失敗しました: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await dbFetch('/api/database/query', {
        db_type: dbType,
        query: query,
        custom_config: useCustomConfig ? config : null,
        limit: 100,
      });
      setQueryResult(data);
    } catch (error: any) {
      alert(`クエリ実行失敗: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-end border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">🗄️ データベース接続</h1>
            <p className="text-gray-500 mt-1">外部データベースのカタログ参照とクエリ実行</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/documents')}>書類一覧</Button>
            <Button variant="outline" onClick={() => router.push('/')}>ホーム</Button>
          </div>
        </div>

        {/* 接続プロファイル設定 */}
        <Card className="border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="text-lg">接続プロファイル</CardTitle>
            <CardDescription>Railway環境からアクセス可能なデータベース情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>DBタイプ</Label>
                <Select value={dbType} onValueChange={handleDbTypeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL</SelectItem>
                    <SelectItem value="oracle">Oracle Database</SelectItem>
                    <SelectItem value="sqlserver">Microsoft SQL Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="customConfig"
                  checked={useCustomConfig}
                  onChange={(e) => setUseCustomConfig(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                <Label htmlFor="customConfig" className="cursor-pointer">カスタム設定を手動入力する</Label>
              </div>
            </div>

            {useCustomConfig && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-xl border animate-in fade-in duration-300">
                <div className="space-y-1">
                  <Label className="text-xs">ホスト</Label>
                  <Input value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ポート</Label>
                  <Input value={config.port} onChange={(e) => setConfig({ ...config, port: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DB名</Label>
                  <Input value={config.database} onChange={(e) => setConfig({ ...config, database: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ユーザー</Label>
                  <Input value={config.user} onChange={(e) => setConfig({ ...config, user: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">パスワード</Label>
                  <Input type="password" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} />
                </div>
                {dbType === 'oracle' && (
                  <div className="space-y-1">
                    <Label className="text-xs">サービス名</Label>
                    <Input value={config.service_name || ''} onChange={(e) => setConfig({ ...config, service_name: e.target.value })} />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button onClick={handleTestConnection} disabled={loading} className="w-40">
                {loading ? '接続中...' : '🔌 接続テスト'}
              </Button>
              {connectionStatus && (
                <div className={`text-sm font-medium ${connectionStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {connectionStatus.status === 'success' ? '✓ 接続に成功しました' : `✕ ${connectionStatus.message}`}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 作業エリア */}
        {connectionStatus?.status === 'success' && (
          <Tabs defaultValue="tables" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="tables">データ構造</TabsTrigger>
              <TabsTrigger value="query">SQL実行</TabsTrigger>
            </TabsList>

            <TabsContent value="tables" className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-2">
              {/* テーブルリスト */}
              <Card className="md:col-span-1 h-fit">
                <div className="p-4 border-b font-semibold bg-slate-50 text-sm">テーブル ({tables.length})</div>
                <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto">
                  {tables.map((table) => (
                    <Button
                      key={table}
                      variant={selectedTable === table ? 'default' : 'ghost'}
                      className="w-full justify-start text-xs h-9"
                      onClick={() => handleTableSelect(table)}
                    >
                      {table}
                    </Button>
                  ))}
                </div>
              </Card>

              {/* スキーマ詳細 */}
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="text-md">{selectedTable || 'テーブルを選択してください'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {tableSchema.length > 0 ? (
                    <div className="overflow-hidden border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b text-slate-500">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">カラム名</th>
                            <th className="px-4 py-2 text-left font-medium">型</th>
                            <th className="px-4 py-2 text-left font-medium">Null</th>
                            <th className="px-4 py-2 text-left font-medium">デフォルト</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {tableSchema.map((col, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-mono">{col.name}</td>
                              <td className="px-4 py-2 text-slate-500">{col.type}</td>
                              <td className="px-4 py-2">{col.nullable ? 'Yes' : 'No'}</td>
                              <td className="px-4 py-2 text-xs text-slate-400">{col.default === 'None' ? '-' : col.default}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-slate-400 italic">
                      テーブルを選択すると詳細が表示されます
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="query" className="space-y-4 animate-in slide-in-from-bottom-2">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="rounded-lg border bg-slate-950 p-4">
                    <Label className="text-slate-400 mb-2 block text-xs">SQL Editor</Label>
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full min-h-[120px] bg-transparent text-slate-100 font-mono text-sm outline-none resize-none"
                      placeholder="SELECT * FROM users LIMIT 10"
                    />
                  </div>
                  <Button onClick={handleExecuteQuery} disabled={loading} size="lg">
                    {loading ? '実行中...' : '▶ クエリを実行'}
                  </Button>
                </CardContent>
              </Card>

              {queryResult && (
                <Card className="overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <span className="text-sm font-bold">実行結果: {queryResult.row_count}件</span>
                    <span className="text-xs text-slate-400 font-mono line-clamp-1">{queryResult.query}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white border-b">
                        <tr>
                          {queryResult.columns.map(c => <th key={c} className="px-4 py-2 text-left bg-slate-50/50">{c}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {queryResult.data.map((row, i) => (
                          <tr key={i} className="hover:bg-blue-50/30">
                            {queryResult.columns.map(c => (
                              <td key={c} className="px-4 py-2 whitespace-nowrap">{String(row[c] ?? '')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* ガイド */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 items-start">
          <div className="text-blue-500 mt-1">💡</div>
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-bold">ネットワークに関する注意</p>
            <p>Railway等のクラウド環境から社内ネットワーク上のDBへ接続する場合、DB側のFirewallでバックエンドの外部IPを許可するか、VPN/トンネル接続が必要になる場合があります。</p>
          </div>
        </div>
      </div>
    </div>
  );
}