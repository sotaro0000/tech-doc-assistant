import pytest
from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    """テストクライアント"""
    return TestClient(app)

@pytest.fixture
def sample_document():
    """サンプルドキュメントデータ"""
    return {
        "document_id": "test-doc-1",
        "title": "Test Document",
        "content": "# Test\n\nThis is a test document."
    }

@pytest.fixture
def sample_query():
    """サンプル検索クエリ"""
    return {
        "query": "test query",
        "top_k": 5
    }