import os
from typing import List, Dict, Optional
from openai import OpenAI
from pinecone import Pinecone

# クライアント初期化
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

async def answer_question(question: str, document_ids: Optional[List[str]] = None) -> Dict:
    """RAG (Retrieval-Augmented Generation) で質問に回答"""
    
    # 1. 質問をベクトル化
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=question
    )
    query_embedding = response.data[0].embedding
    
    # 2. 関連チャンクを検索
    filter_dict = {}
    if document_ids:
        filter_dict = {"document_id": {"$in": document_ids}}
    
    results = index.query(
        vector=query_embedding,
        top_k=5,
        include_metadata=True,
        filter=filter_dict if filter_dict else None
    )
    
    # 3. コンテキストを構築
    context_chunks = []
    sources = []
    for match in results.matches:
        chunk_text = match.metadata.get("chunk_text", "")
        title = match.metadata.get("title", "")
        context_chunks.append(f"[{title}]\n{chunk_text}")
        sources.append({
            "document_id": match.metadata.get("document_id"),
            "title": title,
            "score": match.score
        })
    
    context = "\n\n".join(context_chunks)
    
    # 4. GPT-4で回答生成
    system_prompt = """あなたは技術ドキュメントのアシスタントです。
提供されたコンテキストに基づいて、ユーザーの質問に正確に答えてください。
コンテキストに情報がない場合は、「提供された情報では回答できません」と答えてください。"""

    user_prompt = f"""コンテキスト:
{context}

質問: {question}

上記のコンテキストに基づいて、質問に答えてください。"""

    chat_response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=500
    )
    
    answer = chat_response.choices[0].message.content
    
    return {
        "question": question,
        "answer": answer,
        "sources": sources,
        "context_used": len(context_chunks)
    }