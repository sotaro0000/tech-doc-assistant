import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# PostgreSQL接続URL（環境変数から取得、なければローカル用デフォルト）
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/tech_doc_db"
)

# Railwayの場合、postgres://をpostgresql://に変換
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# エンジン作成
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# セッションファクトリ作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Baseクラス（モデルの基底クラス）
Base = declarative_base()