import os
from typing import Dict, List, Optional, Literal
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine
import pandas as pd

DBType = Literal["postgresql", "oracle", "sqlserver"]


class DatabaseConnector:
    """外部データベース接続クラス"""
    
    def __init__(self, db_type: DBType, custom_config: Optional[Dict] = None):
        """
        Args:
            db_type: データベースタイプ
            custom_config: カスタム接続設定（オプション）
        """
        self.db_type = db_type
        self.engine = self._create_engine(custom_config)
    
    def _create_engine(self, custom_config: Optional[Dict] = None) -> Engine:
        """データベースエンジン作成"""
        
        if custom_config:
            config = custom_config
        else:
            config = self._get_default_config()
        
        connection_string = self._build_connection_string(config)
        
        try:
            engine = create_engine(
                connection_string,
                pool_pre_ping=True,  # 接続チェック
                pool_recycle=3600,   # 1時間で接続リサイクル
                echo=False
            )
            # 接続テスト
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            return engine
        except Exception as e:
            raise Exception(f"Failed to connect to {self.db_type}: {str(e)}")
    
    def _get_default_config(self) -> Dict:
        """デフォルト接続設定取得"""
        
        if self.db_type == "postgresql":
            return {
                "host": os.getenv("SERENA_DB_HOST", "localhost"),
                "port": os.getenv("SERENA_DB_PORT", "5432"),
                "database": os.getenv("SERENA_DB_NAME", "serena_db"),
                "user": os.getenv("SERENA_DB_USER", "postgres"),
                "password": os.getenv("SERENA_DB_PASSWORD", "postgres")
            }
        elif self.db_type == "oracle":
            return {
                "host": os.getenv("ORACLE_DB_HOST", "localhost"),
                "port": os.getenv("ORACLE_DB_PORT", "1521"),
                "service_name": os.getenv("ORACLE_DB_SERVICE", "XEPDB1"),
                "user": os.getenv("ORACLE_DB_USER", "system"),
                "password": os.getenv("ORACLE_DB_PASSWORD", "oracle")
            }
        elif self.db_type == "sqlserver":
            return {
                "host": os.getenv("SQLSERVER_DB_HOST", "localhost"),
                "port": os.getenv("SQLSERVER_DB_PORT", "1433"),
                "database": os.getenv("SQLSERVER_DB_NAME", "master"),
                "user": os.getenv("SQLSERVER_DB_USER", "sa"),
                "password": os.getenv("SQLSERVER_DB_PASSWORD", "")
            }
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")
    
    def _build_connection_string(self, config: Dict) -> str:
        """接続文字列構築"""
        
        if self.db_type == "postgresql":
            return f"postgresql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
        
        elif self.db_type == "oracle":
            # Oracle接続文字列
            dsn = f"{config['host']}:{config['port']}/{config['service_name']}"
            return f"oracle+cx_oracle://{config['user']}:{config['password']}@{dsn}"
        
        elif self.db_type == "sqlserver":
            # SQL Server接続文字列
            return f"mssql+pymssql://{config['user']}:{config['password']}@{config['host']}:{config['port']}/{config['database']}"
        
        else:
            raise ValueError(f"Unsupported database type: {self.db_type}")
    
    def test_connection(self) -> Dict:
        """接続テスト"""
        
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()
            
            return {
                "status": "success",
                "message": f"Successfully connected to {self.db_type}",
                "db_type": self.db_type
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e),
                "db_type": self.db_type
            }
    
    def get_tables(self) -> List[str]:
        """テーブル一覧取得"""
        
        try:
            inspector = inspect(self.engine)
            tables = inspector.get_table_names()
            return tables
        except Exception as e:
            raise Exception(f"Failed to get tables: {str(e)}")
    
    def get_table_schema(self, table_name: str) -> List[Dict]:
        """テーブルスキーマ取得"""
        
        try:
            inspector = inspect(self.engine)
            columns = inspector.get_columns(table_name)
            
            schema = []
            for col in columns:
                schema.append({
                    "name": col["name"],
                    "type": str(col["type"]),
                    "nullable": col["nullable"],
                    "default": str(col.get("default", "None"))
                })
            
            return schema
        except Exception as e:
            raise Exception(f"Failed to get schema for {table_name}: {str(e)}")
    
    def execute_query(self, query: str, limit: Optional[int] = 100) -> Dict:
        """クエリ実行"""
        
        try:
            # LIMIT句を追加（SQL Serverの場合はTOP）
            if limit:
                if self.db_type == "sqlserver":
                    # SELECT の直後に TOP を挿入
                    if query.strip().upper().startswith("SELECT"):
                        query = query.replace("SELECT", f"SELECT TOP {limit}", 1)
                else:
                    # PostgreSQL/Oracle
                    if not query.strip().upper().__contains__("LIMIT"):
                        query = f"{query} LIMIT {limit}"
            
            # DataFrameとして取得
            df = pd.read_sql(query, self.engine)
            
            return {
                "columns": df.columns.tolist(),
                "data": df.to_dict(orient='records'),
                "row_count": len(df),
                "query": query
            }
        except Exception as e:
            raise Exception(f"Query execution failed: {str(e)}")
    
    def get_sample_data(self, table_name: str, limit: int = 10) -> Dict:
        """サンプルデータ取得"""
        
        query = f"SELECT * FROM {table_name}"
        return self.execute_query(query, limit=limit)
    
    def close(self):
        """接続クローズ"""
        if self.engine:
            self.engine.dispose()


async def test_db_connection(db_type: DBType, custom_config: Optional[Dict] = None) -> Dict:
    """DB接続テスト"""
    
    try:
        connector = DatabaseConnector(db_type, custom_config)
        result = connector.test_connection()
        connector.close()
        return result
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "db_type": db_type
        }


async def query_database(
    db_type: DBType,
    query: str,
    custom_config: Optional[Dict] = None,
    limit: Optional[int] = 100
) -> Dict:
    """データベースクエリ実行"""
    
    try:
        connector = DatabaseConnector(db_type, custom_config)
        result = connector.execute_query(query, limit)
        connector.close()
        return result
    except Exception as e:
        raise Exception(f"Database query failed: {str(e)}")