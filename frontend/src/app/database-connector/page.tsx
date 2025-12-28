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

  const handleDbTypeChange = (value: string) => {
    setDbType(value);
    // デフォルトポート設定
    if (value === 'postgresql') {
      setConfig({ ...config, port: '5432', service_name: undefined });
    } else if (value === 'oracle') {
      setConfig({ ...config, port: '1521', service_name: 'XEPDB1' });
    } else if (value === 'sqlserver') {
      setConfig({ ...config, port: '1433', service_name: undefined });
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8001/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: dbType,
          custom_config: useCustomConfig ? config : null,
        }),
      });

      const data = await res.json();
      setConnectionStatus(data);
      
      if (data.status === 'success') {
        // テーブル一覧取得
        await fetchTables();
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus({
        status: 'error',
        message: 'Failed to connect',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    try {
      const res = await fetch('http://localhost:8001/api/database/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: dbType,
          custom_config: useCustomConfig ? config : null,
        }),
      });

      const data = await res.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    }
  };

  const handleTableSelect = async (tableName: string) => {
    setSelectedTable(tableName);
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:8001/api/database/schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: dbType,
          table_name: tableName,
          custom_config: useCustomConfig ? config : null,
        }),
      });

      const data = await res.json();
      setTableSchema(data.schema || []);
      
      // サンプルクエリ設定
      setQuery(`SELECT * FROM ${tableName}`);
    } catch (error) {
      console.error('Failed to fetch schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      alert('クエリを入力してください');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8001/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          db_type: dbType,
          query: query,
          custom_config: useCustomConfig ? config : null,
          limit: 100,
        }),
      });

      if (!res.ok) {
        throw new Error('Query execution failed');
      }

      const data = await res.json();
      setQueryResult(data);
    } catch (error) {
      console.error('Query execution failed:', error);
      alert('クエリの実行に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🗄️ データベース接続</h1>
            <p className="text-gray-600 mt-2">外部データベースに接続してデータを取得</p>
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

        {/* 接続設定 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>接続設定</CardTitle>
            <CardDescription>データベースの種類と接続情報を設定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dbType">データベースタイプ</Label>
                <Select value={dbType} onValueChange={handleDbTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="postgresql">PostgreSQL (Serena)</SelectItem>
                    <SelectItem value="oracle">Oracle (Codex)</SelectItem>
                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={useCustomConfig}
                    onChange={(e) => setUseCustomConfig(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">カスタム接続設定を使用</span>
                </label>
              </div>
            </div>

            {useCustomConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label htmlFor="host">ホスト</Label>
                  <Input
                    id="host"
                    value={config.host}
                    onChange={(e) => setConfig({ ...config, host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="port">ポート</Label>
                  <Input
                    id="port"
                    value={config.port}
                    onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database">データベース名</Label>
                  <Input
                    id="database"
                    value={config.database}
                    onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  />
                </div>
                {dbType === 'oracle' && (
                  <div className="space-y-2">
                    <Label htmlFor="service">サービス名</Label>
                    <Input
                      id="service"
                      value={config.service_name || ''}
                      onChange={(e) => setConfig({ ...config, service_name: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="user">ユーザー名</Label>
                  <Input
                    id="user"
                    value={config.user}
                    onChange={(e) => setConfig({ ...config, user: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={config.password}
                    onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  />
                </div>
              </div>
            )}

            <Button onClick={handleTestConnection} disabled={loading}>
              {loading ? '接続中...' : '🔌 接続テスト'}
            </Button>

            {connectionStatus && (
              <Alert variant={connectionStatus.status === 'success' ? 'default' : 'destructive'}>
                <AlertTitle>
                  {connectionStatus.status === 'success' ? '✅ 接続成功' : '❌ 接続失敗'}
                </AlertTitle>
                <AlertDescription>{connectionStatus.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* テーブル一覧とクエリ実行 */}
        {connectionStatus?.status === 'success' && (
          <Tabs defaultValue="tables" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tables">テーブル一覧</TabsTrigger>
              <TabsTrigger value="query">クエリ実行</TabsTrigger>
            </TabsList>

            {/* テーブル一覧タブ */}
            <TabsContent value="tables" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* テーブルリスト */}
                <Card>
                  <CardHeader>
                    <CardTitle>テーブル ({tables.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {tables.map((table) => (
                        <Button
                          key={table}
                          variant={selectedTable === table ? 'default' : 'outline'}
                          className="w-full justify-start"
                          onClick={() => handleTableSelect(table)}
                        >
                          {table}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* テーブルスキーマ */}
                {selectedTable && (
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>{selectedTable} のスキーマ</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {tableSchema.map((col, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{col.name}</p>
                                <p className="text-sm text-gray-500">{col.type}</p>
                              </div>
                              <div className="text-right text-sm">
                                <p>{col.nullable ? 'NULL可' : 'NOT NULL'}</p>
                                {col.default !== 'None' && (
                                  <p className="text-gray-500">default: {col.default}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* クエリ実行タブ */}
            <TabsContent value="query" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SQLクエリ</CardTitle>
                  <CardDescription>
                    実行するSQLクエリを入力してください（最大100行まで取得）
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full min-h-[150px] rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                    placeholder="SELECT * FROM table_name"
                  />
                  <Button onClick={handleExecuteQuery} disabled={loading}>
                    {loading ? '実行中...' : '▶️ クエリ実行'}
                  </Button>
                </CardContent>
              </Card>

              {/* クエリ結果 */}
              {queryResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      クエリ結果 ({queryResult.row_count}行)
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {queryResult.query}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            {queryResult.columns.map((col) => (
                              <th key={col} className="px-4 py-2 text-left font-medium">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.data.map((row, index) => (
                            <tr key={index} className="border-b">
                              {queryResult.columns.map((col) => (
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
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* 使い方ガイド */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>💡 使い方</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>1. データベースタイプを選択:</strong> PostgreSQL/Oracle/SQL Server</p>
            <p><strong>2. 接続情報を入力:</strong> カスタム設定を使用する場合はチェック</p>
            <p><strong>3. 接続テスト:</strong> 接続が成功すればテーブル一覧が表示されます</p>
            <p><strong>4. テーブル選択:</strong> テーブルをクリックしてスキーマを確認</p>
            <p><strong>5. クエリ実行:</strong> SQLクエリを入力して実行</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
