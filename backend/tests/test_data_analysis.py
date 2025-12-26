import pytest
import pandas as pd
import io
from services.data_analysis import DataAnalyzer

class TestDataAnalyzer:
    """データ分析クラスのテスト"""
    
    @pytest.fixture
    def sample_csv(self):
        """サンプルCSVデータ"""
        csv_content = """name,age,department,salary
Alice,28,Engineering,75000
Bob,35,Marketing,65000
Charlie,42,Engineering,95000
Diana,31,Sales,70000"""
        return csv_content.encode('utf-8')
    
    def test_load_csv(self, sample_csv):
        """CSV読み込みのテスト"""
        analyzer = DataAnalyzer(sample_csv, 'csv')
        
        assert len(analyzer.df) == 4
        assert list(analyzer.df.columns) == ['name', 'age', 'department', 'salary']
    
    def test_basic_info(self, sample_csv):
        """基本情報取得のテスト"""
        analyzer = DataAnalyzer(sample_csv, 'csv')
        info = analyzer.get_basic_info()
        
        assert info["rows"] == 4
        assert info["columns"] == 4
        assert "name" in info["column_names"]
        assert "age" in info["column_names"]
    
    def test_summary_statistics(self, sample_csv):
        """統計サマリーのテスト"""
        analyzer = DataAnalyzer(sample_csv, 'csv')
        stats = analyzer.get_summary_statistics()
        
        assert "numeric" in stats
        assert "categorical" in stats
        assert "age" in stats["numeric"]
        assert "salary" in stats["numeric"]
    
    def test_data_preview(self, sample_csv):
        """データプレビューのテスト"""
        analyzer = DataAnalyzer(sample_csv, 'csv')
        preview = analyzer.get_data_preview(n=2)
        
        assert "head" in preview
        assert "tail" in preview
        assert len(preview["head"]) <= 2
        assert len(preview["tail"]) <= 2
    
    def test_generate_insights(self, sample_csv):
        """インサイト生成のテスト"""
        analyzer = DataAnalyzer(sample_csv, 'csv')
        insights = analyzer.generate_insights()
        
        assert isinstance(insights, list)
        assert all("type" in insight for insight in insights)
        assert all("title" in insight for insight in insights)
        assert all("message" in insight for insight in insights)