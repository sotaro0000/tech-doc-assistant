from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# PostgreSQL接続URL
# 形式: postgresql://ユーザー名:パスワード@ホスト:ポート/データベース名
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/tech_doc_db"

# エンジン作成
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# セッションファクトリ作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Baseクラス（モデルの基底クラス）
Base = declarative_base()