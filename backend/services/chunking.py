import os
import re
from typing import List, Dict, Literal
from openai import OpenAI
from pinecone import Pinecone
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    MarkdownHeaderTextSplitter,
)

# クライアント初期化
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

ChunkStrategy = Literal["fixed", "markdown", "semantic", "hybrid"]


class DocumentChunker:
    """ドキュメントチャンク分割クラス"""
    
    def __init__(self, strategy: ChunkStrategy = "markdown"):
        self.strategy = strategy
    
    def chunk_text(self, content: str) -> List[Dict[str, any]]:
        """選択された戦略でテキストを分割"""
        
        if self.strategy == "fixed":
            return self._fixed_length_chunking(content)
        elif self.strategy == "markdown":
            return self._markdown_structure_chunking(content)
        elif self.strategy == "semantic":
            return self._semantic_chunking(content)
        elif self.strategy == "hybrid":
            return self._hybrid_chunking(content)
        else:
            raise ValueError(f"Unknown strategy: {self.strategy}")
    
    def _fixed_length_chunking(self, content: str) -> List[Dict[str, any]]:
        """固定長チャンク分割（シンプル）"""
        
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", "。", "、", " ", ""]
        )
        
        chunks = splitter.split_text(content)
        
        return [
            {
                "text": chunk,
                "metadata": {
                    "strategy": "fixed",
                    "chunk_size": len(chunk)
                }
            }
            for chunk in chunks
        ]
    
    def _markdown_structure_chunking(self, content: str) -> List[Dict[str, any]]:
        """Markdown構造ベースのチャンク分割"""
        
        # Markdownヘッダーで分割
        headers_to_split_on = [
            ("#", "h1"),
            ("##", "h2"),
            ("###", "h3"),
        ]
        
        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on
        )
        
        # まずヘッダーで分割
        md_chunks = markdown_splitter.split_text(content)
        
        result_chunks = []
        for md_chunk in md_chunks:
            chunk_text = md_chunk.page_content
            metadata = md_chunk.metadata
            
            # ヘッダー情報を取得
            headers = []
            if "h1" in metadata:
                headers.append(f"# {metadata['h1']}")
            if "h2" in metadata:
                headers.append(f"## {metadata['h2']}")
            if "h3" in metadata:
                headers.append(f"### {metadata['h3']}")
            
            # 各セクションが長い場合は再分割
            if len(chunk_text) > 800:
                sub_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=600,
                    chunk_overlap=100,
                    separators=["\n\n", "\n", "。", "、", " ", ""]
                )
                sub_chunks = sub_splitter.split_text(chunk_text)
                
                for sub_chunk in sub_chunks:
                    # ヘッダー情報を含める
                    full_text = "\n".join(headers) + "\n\n" + sub_chunk if headers else sub_chunk
                    result_chunks.append({
                        "text": full_text,
                        "metadata": {
                            "strategy": "markdown",
                            "headers": metadata,
                            "chunk_size": len(full_text)
                        }
                    })
            else:
                # ヘッダー情報を含める
                full_text = "\n".join(headers) + "\n\n" + chunk_text if headers else chunk_text
                result_chunks.append({
                    "text": full_text,
                    "metadata": {
                        "strategy": "markdown",
                        "headers": metadata,
                        "chunk_size": len(full_text)
                    }
                })
        
        return result_chunks if result_chunks else self._fixed_length_chunking(content)
    
    def _semantic_chunking(self, content: str) -> List[Dict[str, any]]:
        """セマンティックチャンク分割（意味的なまとまりで分割）"""
        
        # 段落で分割
        paragraphs = re.split(r'\n\n+', content)
        
        chunks = []
        current_chunk = []
        current_length = 0
        max_chunk_size = 600
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            para_length = len(para)
            
            # 現在のチャンクに追加できるか判定
            if current_length + para_length < max_chunk_size:
                current_chunk.append(para)
                current_length += para_length
            else:
                # 現在のチャンクを確定
                if current_chunk:
                    chunks.append({
                        "text": "\n\n".join(current_chunk),
                        "metadata": {
                            "strategy": "semantic",
                            "paragraphs": len(current_chunk),
                            "chunk_size": current_length
                        }
                    })
                
                # 新しいチャンク開始
                current_chunk = [para]
                current_length = para_length
        
        # 最後のチャンク
        if current_chunk:
            chunks.append({
                "text": "\n\n".join(current_chunk),
                "metadata": {
                    "strategy": "semantic",
                    "paragraphs": len(current_chunk),
                    "chunk_size": current_length
                }
            })
        
        return chunks if chunks else self._fixed_length_chunking(content)
    
    def _hybrid_chunking(self, content: str) -> List[Dict[str, any]]:
        """ハイブリッド戦略（Markdown構造 + セマンティック）"""
        
        # まずMarkdown構造で分割
        md_chunks = self._markdown_structure_chunking(content)
        
        # 各チャンクが大きすぎる場合はセマンティック分割
        result_chunks = []
        for chunk in md_chunks:
            if chunk["metadata"]["chunk_size"] > 800:
                # セマンティック分割を適用
                semantic_chunks = self._semantic_chunking(chunk["text"])
                for sc in semantic_chunks:
                    sc["metadata"]["strategy"] = "hybrid"
                    sc["metadata"]["original_headers"] = chunk["metadata"].get("headers", {})
                result_chunks.extend(semantic_chunks)
            else:
                chunk["metadata"]["strategy"] = "hybrid"
                result_chunks.append(chunk)
        
        return result_chunks


async def chunk_and_embed(
    document_id: str,
    title: str,
    content: str,
    strategy: ChunkStrategy = "markdown"
) -> Dict:
    """ドキュメントをチャンクに分割し、ベクトル化してPineconeに保存"""
    
    # 1. チャンク分割
    chunker = DocumentChunker(strategy=strategy)
    chunks = chunker.chunk_text(content)
    
    if not chunks:
        raise ValueError("No chunks created from document")
    
    # 2. 各チャンクをベクトル化
    vectors = []
    for i, chunk_data in enumerate(chunks):
        chunk_text = chunk_data["text"]
        chunk_metadata = chunk_data["metadata"]
        
        # OpenAI Embeddingで埋め込みベクトル作成
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=chunk_text
        )
        embedding = response.data[0].embedding
        
        # メタデータ統合
        full_metadata = {
            "document_id": document_id,
            "title": title,
            "chunk_text": chunk_text,
            "chunk_index": i,
            "total_chunks": len(chunks),
            "strategy": strategy,
            **chunk_metadata
        }
        
        # メタデータのサイズ制限（Pineconeの制限対策）
        if len(str(full_metadata)) > 40000:
            # chunk_textを短縮
            full_metadata["chunk_text"] = chunk_text[:1000] + "..."
        
        # ベクトル準備
        vectors.append({
            "id": f"{document_id}_chunk_{i}",
            "values": embedding,
            "metadata": full_metadata
        })
    
    # 3. Pineconeに保存（バッチ処理）
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)
    
    # 4. 統計情報を返す
    chunk_sizes = [c["metadata"]["chunk_size"] for c in chunks]
    
    return {
        "document_id": document_id,
        "strategy": strategy,
        "chunks_created": len(chunks),
        "average_chunk_size": sum(chunk_sizes) / len(chunk_sizes),
        "min_chunk_size": min(chunk_sizes),
        "max_chunk_size": max(chunk_sizes),
        "message": "Document chunked and embedded successfully"
    }


async def delete_document_chunks(document_id: str) -> Dict:
    """ドキュメントに関連するすべてのチャンクを削除"""
    
    # Pineconeから削除
    try:
        index.delete(filter={"document_id": document_id})
    except Exception as e:
        print(f"Error deleting from Pinecone: {e}")
    
    return {
        "document_id": document_id,
        "message": "Document chunks deleted successfully"
    }