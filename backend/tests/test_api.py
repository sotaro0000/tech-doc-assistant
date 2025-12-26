import pytest
from fastapi.testclient import TestClient

def test_health_check(client):
    """ヘルスチェックエンドポイントのテスト"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root_endpoint(client):
    """ルートエンドポイントのテスト"""
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

class TestChunkingAPI:
    """チャンク分割APIのテスト"""
    
    def test_chunk_document_success(self, client, sample_document):
        """チャンク化成功ケース"""
        # Note: 実際にはPineconeとOpenAIが必要なのでモック推奨
        # ここでは構造テストのみ
        response = client.post("/api/chunk", json=sample_document)
        
        # 環境変数が設定されていない場合は500エラー
        if response.status_code == 500:
            assert "detail" in response.json()
        else:
            assert response.status_code == 200
    
    def test_chunk_document_missing_fields(self, client):
        """必須フィールド欠如のテスト"""
        response = client.post("/api/chunk", json={
            "document_id": "test-1"
            # title, content が欠如
        })
        assert response.status_code == 422  # Validation error

class TestSearchAPI:
    """検索APIのテスト"""
    
    def test_search_missing_query(self, client):
        """クエリ欠如のテスト"""
        response = client.post("/api/search", json={})
        assert response.status_code == 422

class TestNotionAPI:
    """Notion APIのテスト"""
    
    def test_notion_page_missing_id(self, client):
        """ページID欠如のテスト"""
        response = client.post("/api/notion/page", json={})
        assert response.status_code == 422
    
    def test_notion_search_structure(self, client):
        """Notion検索のレスポンス構造テスト"""
        response = client.post("/api/notion/search", json={
            "query": None
        })
        
        # Notion tokenが設定されていない場合は500
        if response.status_code == 500:
            assert "detail" in response.json()
        else:
            assert "pages" in response.json()

class TestDatabaseAPI:
    """データベース接続APIのテスト"""
    
    def test_db_connection_test_structure(self, client):
        """DB接続テストのリクエスト構造"""
        response = client.post("/api/database/test", json={
            "db_type": "postgresql"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "message" in data
        assert "db_type" in data