import pytest
from services.chunking import DocumentChunker

class TestDocumentChunker:
    """ドキュメントチャンククラスのテスト"""
    
    @pytest.fixture
    def sample_markdown(self):
        return """# Main Title

## Section 1

This is the first section with some content.

## Section 2

This is the second section.

### Subsection 2.1

More detailed content here.
"""
    
    def test_fixed_chunking(self, sample_markdown):
        """固定長チャンク分割のテスト"""
        chunker = DocumentChunker(strategy="fixed")
        chunks = chunker.chunk_text(sample_markdown)
        
        assert len(chunks) > 0
        assert all("text" in chunk for chunk in chunks)
        assert all("metadata" in chunk for chunk in chunks)
        assert all(chunk["metadata"]["strategy"] == "fixed" for chunk in chunks)
    
    def test_markdown_chunking(self, sample_markdown):
        """Markdown構造ベースチャンク分割のテスト"""
        chunker = DocumentChunker(strategy="markdown")
        chunks = chunker.chunk_text(sample_markdown)
        
        assert len(chunks) > 0
        assert all("text" in chunk for chunk in chunks)
        assert all(chunk["metadata"]["strategy"] == "markdown" for chunk in chunks)
    
    def test_semantic_chunking(self, sample_markdown):
        """セマンティックチャンク分割のテスト"""
        chunker = DocumentChunker(strategy="semantic")
        chunks = chunker.chunk_text(sample_markdown)
        
        assert len(chunks) > 0
        assert all("metadata" in chunk for chunk in chunks)
        assert all("paragraphs" in chunk["metadata"] for chunk in chunks)
    
    def test_hybrid_chunking(self, sample_markdown):
        """ハイブリッドチャンク分割のテスト"""
        chunker = DocumentChunker(strategy="hybrid")
        chunks = chunker.chunk_text(sample_markdown)
        
        assert len(chunks) > 0
        assert all(chunk["metadata"]["strategy"] == "hybrid" for chunk in chunks)
    
    def test_empty_content(self):
        """空コンテンツのテスト"""
        chunker = DocumentChunker(strategy="fixed")
        chunks = chunker.chunk_text("")
        
        assert len(chunks) == 0 or len(chunks) == 1