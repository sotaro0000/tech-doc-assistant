from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
import os
from dotenv import load_dotenv
from typing import Optional

from database import SessionLocal, engine
from models import Base, Document
from fastapi import File, UploadFile
import io

# 環境変数読み込み
load_dotenv()

# テーブル作成
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Tech Doc Assistant API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB依存性
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# === モデル定義 ===
class ChunkRequest(BaseModel):
    document_id: str
    title: str
    content: str
    strategy:str = "markdown"

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

# === ヘルスチェック ===
@app.get("/")
def read_root():
    return {"message": "Tech Doc Assistant API is running!"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    """データベース接続をチェック"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unhealthy: {str(e)}")

# === ドキュメント CRUD ===
@app.get("/documents", response_model=List[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    """ドキュメント一覧を取得"""
    documents = db.query(Document).order_by(Document.created_at.desc()).all()
    return documents

@app.get("/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """ドキュメントを取得"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@app.post("/documents", response_model=DocumentResponse)
def create_document(doc: DocumentCreate, db: Session = Depends(get_db)):
    """ドキュメントを作成"""
    document = Document(
        title=doc.title,
        content=doc.content
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

@app.put("/documents/{document_id}", response_model=DocumentResponse)
def update_document(document_id: int, doc: DocumentUpdate, db: Session = Depends(get_db)):
    """ドキュメントを更新"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc.title is not None:
        document.title = doc.title
    if doc.content is not None:
        document.content = doc.content
    
    document.updated_at = datetime.now()
    db.commit()
    db.refresh(document)
    return document

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """ドキュメントを削除"""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

# === チャンク分割エンドポイント ===
@app.post("/api/chunk")
async def chunk_document(request: ChunkRequest):
    """ドキュメントをチャンクに分割してベクトル化"""
    from services.chunking import chunk_and_embed
    
    try:
        result = await chunk_and_embed(
            document_id=request.document_id,
            title=request.title,
            content=request.content,
            strategy=request.strategy
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 検索エンドポイント ===
@app.post("/api/search")
async def search_documents(request: SearchRequest):
    """ベクトル検索でドキュメントを検索"""
    from services.search import search_similar_chunks
    
    try:
        results = await search_similar_chunks(
            query=request.query,
            top_k=request.top_k
        )
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === 質問応答エンドポイント ===
@app.post("/api/ask")
async def ask_question(request: QuestionRequest):
    """RAGで質問に回答"""
    from services.qa import answer_question
    
    try:
        answer = await answer_question(
            question=request.question,
            document_ids=request.document_ids
        )
        return answer
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === チャンク削除エンドポイント ===
@app.delete("/api/chunk/{document_id}")
async def delete_chunks(document_id: str):
    """ドキュメントのチャンクを削除"""
    from services.chunking import delete_document_chunks
    
    try:
        result = await delete_document_chunks(document_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === チャンク分割戦略の比較エンドポイント（新規）===
@app.post("/api/chunk/compare")
async def compare_chunking_strategies(request: ChunkRequest):
    """異なる戦略でチャンク分割を比較"""
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
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

# === Notion関連のモデル ===
class NotionPageRequest(BaseModel):
    page_id: str

class NotionSearchRequest(BaseModel):
    query: Optional[str] = None

class NotionImportRequest(BaseModel):
    page_id: str
    chunk_strategy: str = "markdown"

# === Notionページ取得エンドポイント ===
@app.post("/api/notion/page")
async def get_notion_page(request: NotionPageRequest):
    """NotionページをMarkdownとして取得"""
    from services.notion_service import get_notion_page_as_markdown
    
    try:
        result = await get_notion_page_as_markdown(request.page_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === Notionページ検索エンドポイント ===
@app.post("/api/notion/search")
async def search_notion(request: NotionSearchRequest):
    """Notionページを検索"""
    from services.notion_service import search_notion_pages
    
    try:
        results = await search_notion_pages(request.query)
        return {"pages": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === Notionインポート（ページ取得 + チャンク化）===
@app.post("/api/notion/import")
async def import_notion_page(request: NotionImportRequest):
    """Notionページをインポートしてチャンク化"""
    from services.notion_service import get_notion_page_as_markdown
    from services.chunking import chunk_and_embed
    
    try:
        # 1. Notionページ取得
        page_data = await get_notion_page_as_markdown(request.page_id)
        
        # 2. チャンク化（ドキュメントIDはNext.js側で生成されたものを使う想定）
        # ここでは一時的なIDを使用
        temp_doc_id = f"notion_{request.page_id}"
        
        chunk_result = await chunk_and_embed(
            document_id=temp_doc_id,
            title=page_data["title"],
            content=page_data["content"],
            strategy=request.chunk_strategy
        )
        
        return {
            **page_data,
            "chunk_stats": chunk_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# === データ分析エンドポイント ===
@app.post("/api/analyze/upload")
async def analyze_uploaded_file(file: UploadFile = File(...)):
    """アップロードされたファイルを分析"""
    from services.data_analysis import analyze_file
    
    try:
        # ファイル内容を読み込み
        content = await file.read()
        
        # ファイルタイプ判定
        if file.filename.endswith('.csv'):
            file_type = 'csv'
        elif file.filename.endswith(('.xlsx', '.xls')):
            file_type = 'excel'
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV or Excel.")
        
        # 分析実行
        result = await analyze_file(content, file_type)
        
        return {
            "filename": file.filename,
            "file_type": file_type,
            "analysis": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === データ分析（URL指定）===
@app.post("/api/analyze/url")
async def analyze_from_url(url: str):
    """URLからファイルをダウンロードして分析"""
    import requests
    from services.data_analysis import analyze_file
    
    try:
        # ファイルダウンロード
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # ファイルタイプ判定
        if url.endswith('.csv'):
            file_type = 'csv'
        elif url.endswith(('.xlsx', '.xls')):
            file_type = 'excel'
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # 分析実行
        result = await analyze_file(response.content, file_type)
        
        return {
            "url": url,
            "file_type": file_type,
            "analysis": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))