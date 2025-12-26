import pandas as pd
import numpy as np
import io
import base64
from typing import Dict, List, Optional
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json


class DataAnalyzer:
    """データ分析クラス"""
    
    def __init__(self, file_content: bytes, file_type: str):
        """
        Args:
            file_content: ファイルのバイナリデータ
            file_type: 'csv' or 'excel'
        """
        self.file_type = file_type
        self.df = self._load_data(file_content)
    
    def _load_data(self, file_content: bytes) -> pd.DataFrame:
        """ファイルをDataFrameとして読み込み"""
        
        if self.file_type == 'csv':
            # CSVの場合
            return pd.read_csv(io.BytesIO(file_content))
        elif self.file_type == 'excel':
            # Excelの場合
            return pd.read_excel(io.BytesIO(file_content))
        else:
            raise ValueError(f"Unsupported file type: {self.file_type}")
    
    def get_basic_info(self) -> Dict:
        """基本情報取得"""
        
        return {
            "rows": len(self.df),
            "columns": len(self.df.columns),
            "column_names": self.df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in self.df.dtypes.items()},
            "missing_values": self.df.isnull().sum().to_dict(),
            "memory_usage": f"{self.df.memory_usage(deep=True).sum() / 1024:.2f} KB"
        }
    
    def get_summary_statistics(self) -> Dict:
        """統計サマリー取得"""
        
        # 数値列の統計
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        numeric_stats = {}
        
        if numeric_cols:
            stats_df = self.df[numeric_cols].describe()
            numeric_stats = stats_df.to_dict()
        
        # カテゴリ列の統計
        categorical_cols = self.df.select_dtypes(include=['object']).columns.tolist()
        categorical_stats = {}
        
        for col in categorical_cols:
            value_counts = self.df[col].value_counts().head(10)
            categorical_stats[col] = {
                "unique_values": int(self.df[col].nunique()),
                "top_values": value_counts.to_dict(),
                "most_common": value_counts.index[0] if len(value_counts) > 0 else None
            }
        
        return {
            "numeric": numeric_stats,
            "categorical": categorical_stats
        }
    
    def get_data_preview(self, n: int = 10) -> Dict:
        """データプレビュー"""
        
        return {
            "head": self.df.head(n).to_dict(orient='records'),
            "tail": self.df.tail(n).to_dict(orient='records')
        }
    
    def create_visualizations(self) -> Dict:
        """可視化グラフ生成"""
        
        visualizations = {}
        
        # 数値列の分布図
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        if len(numeric_cols) > 0:
            # ヒストグラム
            for col in numeric_cols[:5]:  # 最初の5列のみ
                fig = px.histogram(
                    self.df,
                    x=col,
                    title=f'{col}の分布',
                    labels={col: col},
                    marginal='box'
                )
                visualizations[f'histogram_{col}'] = json.loads(fig.to_json())
        
        # カテゴリ列の棒グラフ
        categorical_cols = self.df.select_dtypes(include=['object']).columns.tolist()
        
        if len(categorical_cols) > 0:
            for col in categorical_cols[:3]:  # 最初の3列のみ
                value_counts = self.df[col].value_counts().head(10)
                fig = px.bar(
                    x=value_counts.index,
                    y=value_counts.values,
                    title=f'{col}の分布',
                    labels={'x': col, 'y': '件数'}
                )
                visualizations[f'bar_{col}'] = json.loads(fig.to_json())
        
        # 相関行列（数値列が2つ以上ある場合）
        if len(numeric_cols) >= 2:
            corr_matrix = self.df[numeric_cols].corr()
            fig = px.imshow(
                corr_matrix,
                title='相関行列',
                labels=dict(color="相関係数"),
                x=corr_matrix.columns,
                y=corr_matrix.columns,
                color_continuous_scale='RdBu_r',
                aspect="auto"
            )
            visualizations['correlation_matrix'] = json.loads(fig.to_json())
        
        return visualizations
    
    def generate_insights(self) -> List[Dict]:
        """データインサイト生成"""
        
        insights = []
        
        # 欠損値チェック
        missing = self.df.isnull().sum()
        if missing.sum() > 0:
            for col, count in missing[missing > 0].items():
                pct = (count / len(self.df)) * 100
                insights.append({
                    "type": "warning",
                    "title": "欠損値検出",
                    "message": f"列「{col}」に{count}件({pct:.1f}%)の欠損値があります"
                })
        
        # 数値列の異常値チェック
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            Q1 = self.df[col].quantile(0.25)
            Q3 = self.df[col].quantile(0.75)
            IQR = Q3 - Q1
            outliers = ((self.df[col] < (Q1 - 1.5 * IQR)) | (self.df[col] > (Q3 + 1.5 * IQR))).sum()
            
            if outliers > 0:
                pct = (outliers / len(self.df)) * 100
                insights.append({
                    "type": "info",
                    "title": "外れ値検出",
                    "message": f"列「{col}」に{outliers}件({pct:.1f}%)の外れ値があります"
                })
        
        # カテゴリ列の偏りチェック
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            top_value_count = self.df[col].value_counts().iloc[0]
            pct = (top_value_count / len(self.df)) * 100
            
            if pct > 80:
                insights.append({
                    "type": "info",
                    "title": "データの偏り",
                    "message": f"列「{col}」の値が偏っています（最頻値が{pct:.1f}%）"
                })
        
        # データ品質スコア
        missing_score = 100 - (missing.sum() / (len(self.df) * len(self.df.columns)) * 100)
        insights.append({
            "type": "success",
            "title": "データ品質スコア",
            "message": f"欠損値に基づくデータ品質: {missing_score:.1f}/100"
        })
        
        return insights
    
    def run_full_analysis(self) -> Dict:
        """完全分析実行"""
        
        return {
            "basic_info": self.get_basic_info(),
            "statistics": self.get_summary_statistics(),
            "preview": self.get_data_preview(),
            "visualizations": self.create_visualizations(),
            "insights": self.generate_insights()
        }


async def analyze_file(file_content: bytes, file_type: str) -> Dict:
    """ファイル分析のメイン関数"""
    
    try:
        analyzer = DataAnalyzer(file_content, file_type)
        result = analyzer.run_full_analysis()
        return result
    except Exception as e:
        raise Exception(f"Analysis failed: {str(e)}")