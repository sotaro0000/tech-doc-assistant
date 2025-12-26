import os
from typing import List, Dict
from openai import OpenAI
from pinecone import Pinecone

# クライアント初期化
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

async def search_similar_chunks(query: str, top_k: int = 5) -> List[Dict]:
    """クエリに類似するチャンクを検索"""
    
    # 1. クエリをベクトル化
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    query_embedding = response.data[0].embedding
    
    # 2. Pineconeで類似検索
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        include_metadata=True
    )
    
    # 3. 結果を整形
    chunks = []
    for match in results.matches:
        chunks.append({
            "document_id": match.metadata.get("document_id"),
            "title": match.metadata.get("title"),
            "chunk_text": match.metadata.get("chunk_text"),
            "chunk_index": match.metadata.get("chunk_index"),
            "score": match.score
        })
    
    return chunks