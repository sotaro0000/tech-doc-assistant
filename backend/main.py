from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import os
import io
import requests
from dotenv import load_dotenv

from database import SessionLocal, engine
from models import Base, Document
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()
app = FastAPI(title="Tech Doc Assistant API")

# === CORS設定 ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://tech-doc-assistant.vercel.app",
        "https://tech-doc-assistant-production.up.railway.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === レート制限設定 ===
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# === データベース初期化 ===
@app.on_event("startup")
def startup_event():
    # アプリ起動時にテーブルを作成
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === リクエスト/レスポンスモデル定義 ===
class ChunkRequest(BaseModel):
    document_id: str
    title: str
    content: str
    strategy: str = "markdown"

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

class QuestionRequest(BaseModel):
    question: str
    document_ids: Optional[List[str]] = None

class DocumentCreate(BaseModel):
    title: str
    content: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class NotionPageRequest(BaseModel):
    page_id: str

class NotionSearchRequest(BaseModel):
    query: Optional[str] = None

class NotionImportRequest(BaseModel):
    page_id: str
    chunk_strategy: str = "markdown"

class DBConnectionTest(BaseModel):
    db_type: str
    custom_config: Optional[dict] = None

class DBQueryRequest(BaseModel):
    db_type: str
    query: str
    custom_config: Optional[dict] = None
    limit: Optional[int] = 100

class DBTableRequest(BaseModel):
    db_type: str
    table_name: str
    custom_config: Optional[dict] = None

# === ヘルスチェック ===
@app.get("/")
def read_root():
    return {"message": "Tech Doc Assistant API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unhealthy: {str(e)}")

# === ドキュメント CRUD ===
@app.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return documents

@app.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.post("/documents", response_model=DocumentResponse)
def create_document(doc: DocumentCreate, db: Session = Depends(get_db)):
    document = Document(title=doc.title, content=doc.content)
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

@app.put("/documents/{document_id}", response_model=DocumentResponse)
def update_document(document_id: int, doc: DocumentUpdate, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.title is not None: document.title = doc.title
    if doc.content is not None: document.content = doc.content
    document.updated_at = datetime.now()
    db.commit()
    db.refresh(document)
    return document

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

# === チャンク/検索/QA (RAG関連) ===
@app.post("/api/chunk")
async def chunk_document(request: ChunkRequest):
    from services.chunking import chunk_and_embed
    try:
        return await chunk_and_embed(
            document_id=request.document_id,
            title=request.title,
            content=request.content,
            strategy=request.strategy
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
@limiter.limit("10/minute")
async def search_documents(request: Request, search_req: SearchRequest):
    from services.search import search_similar_chunks
    try:
        results = await search_similar_chunks(query=search_req.query, top_k=search_req.top_k)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ask")
async def ask_question(request: QuestionRequest):
    from services.qa import answer_question
    try:
        return await answer_question(question=request.question, document_ids=request.document_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chunk/compare")
async def compare_chunking_strategies(request: ChunkRequest):
    from services.chunking import DocumentChunker
    try:
        strategies = ["fixed", "markdown", "semantic", "hybrid"]
        results = {}
        for strategy in strategies:
            chunker = DocumentChunker(strategy=strategy)
            chunks = chunker.chunk_text(request.content)
            chunk_sizes = [c["metadata"]["chunk_size"] for c in chunks]
            results[strategy] = {
                "chunks_count": len(chunks),
                "average_size": sum(chunk_sizes) / len(chunk_sizes) if chunk_sizes else 0,
                "min_size": min(chunk_sizes) if chunk_sizes else 0,
                "max_size": max(chunk_sizes) if chunk_sizes else 0,
                "sample_chunks": [c["text"][:200] + "..." for c in chunks[:3]]
            }
        return results
    except Exception as e:
        # ここで ModuleNotFoundError (langchain) が出る場合は requirements.txt を確認
        raise HTTPException(status_code=500, detail=str(e))

# === Notionサービス ===
@app.post("/api/notion/page")
async def get_notion_page(request: NotionPageRequest):
    from services.notion_service import get_notion_page_as_markdown
    try:
        return await get_notion_page_as_markdown(request.page_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/notion/search")
async def search_notion(request: NotionSearchRequest):
    from services.notion_service import search_notion_pages
    try:
        return {"pages": await search_notion_pages(request.query)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === データベース接続サービス ===
@app.post("/api/database/test")
async def test_database_connection(request: DBConnectionTest):
    from services.database_connector import test_db_connection
    try:
        return await test_db_connection(request.db_type, request.custom_config)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/database/tables")
async def get_database_tables(request: DBConnectionTest):
    from services.database_connector import DatabaseConnector
    try:
        connector = DatabaseConnector(request.db_type, request.custom_config)
        tables = connector.get_tables()
        connector.close()
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/database/query")
async def execute_database_query(request: DBQueryRequest):
    from services.database_connector import query_database
    try:
        return await query_database(request.db_type, request.query, request.custom_config, request.limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 起動設定 ===
if __name__ == "__main__":
    import uvicorn
    # Railway環境では環境変数 PORT が割り当てられる
    port = int(os.getenv("PORT", 8001))
    # 開発時は reload=True、本番時は False にするのが一般的
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)