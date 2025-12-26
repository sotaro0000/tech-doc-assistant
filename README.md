# 📚 Tech Doc Assistant

AI-powered Technical Documentation Management System

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 概要

Tech Doc Assistantは、技術ドキュメントをAIで管理・検索できるフルスタックWebアプリケーションです。来月の新規プロジェクト配属に向けて、実務で使用する技術スタックを網羅的に学習するために開発しました。

### 主な機能

- 📝 **ドキュメント管理**: Markdownベースのドキュメント作成・編集・削除
- 🤖 **AI検索**: GPT-4とベクトルDBを使った自然言語検索
- 💬 **質問応答**: RAG(Retrieval-Augmented Generation)による回答生成
- 📥 **Notion連携**: NotionページのMarkdownインポート
- 📊 **データ分析**: CSV/Excelファイルのアップロードと自動分析
- 🗄️ **外部DB接続**: PostgreSQL/Oracle/SQL Serverへの接続とクエリ実行
- 🔐 **認証**: GitHub OAuthによるログイン

---

## 🛠️ 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS, shadcn/ui, HeadlessUI
- **認証**: NextAuth.js
- **状態管理**: React Hooks
- **テスト**: Jest, Playwright

### バックエンド
- **Framework**: FastAPI
- **ORM**: Prisma, SQLAlchemy
- **AI**: OpenAI GPT-4, Pinecone
- **データ処理**: pandas, Plotly
- **テスト**: pytest

### インフラ
- **Database**: PostgreSQL 15
- **コンテナ**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **デプロイ**: Azure Container Apps / AWS ECS

---

## 🚀 クイックスタート

### 前提条件

- Node.js 20以上
- Python 3.11以上
- Docker & Docker Compose
- PostgreSQL 15以上（またはDockerで起動）

### 1. リポジトリクローン
```bash
git clone https://github.com/yourusername/tech-doc-assistant.git
cd tech-doc-assistant
```

### 2. 環境変数設定
```bash
cp .env.example .env
# .envファイルを編集して必要なAPIキーを設定
```

### 3. Dockerで起動（推奨）
```bash
# ビルド
docker-compose -f docker-compose.prod.yml build

# 起動
docker-compose -f docker-compose.prod.yml up -d

# アクセス
# Frontend: http://localhost:3001
# Backend API: http://localhost:8001/docs
```

### 4. ローカル開発環境
```bash
# PostgreSQL起動
docker-compose up -d postgres

# バックエンド
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# フロントエンド（別ターミナル）
cd frontend
npm install
npx prisma migrate dev
npm run dev
```

---

## 📖 使い方

### ドキュメント管理

1. GitHubでログイン
2. 「新規作成」からMarkdownドキュメントを作成
3. 自動的にチャンク分割され、ベクトルDBに保存

### AI検索

1. 「AI検索」メニューを選択
2. 自然言語でクエリを入力
3. 関連ドキュメントが類似度順に表示

### Notionインポート

1. Notion統合を作成（https://notion.so/my-integrations）
2. ページに統合を接続
3. 「Notionインポート」からページURLを入力

### データ分析

1. 「データ分析」メニューを選択
2. CSV/Excelファイルをアップロード
3. 自動で統計分析・可視化

---

## 🧪 テスト
```bash
# バックエンドテスト
cd backend
pytest --cov

# フロントエンドテスト
cd frontend
npm test

# E2Eテスト
npm run test:e2e
```

---

## 📦 デプロイ

詳細は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

### Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Azure Container Apps
```bash
az containerapp create \
  --name tech-doc-frontend \
  --resource-group tech-doc-rg \
  --environment tech-doc-env \
  --image <registry>.azurecr.io/frontend:latest
```

---

## 🗂️ プロジェクト構成
```
tech-doc-assistant/
├── frontend/              # Next.jsアプリケーション
│   ├── src/
│   │   ├── app/          # App Router
│   │   ├── components/   # UIコンポーネント
│   │   └── lib/          # ユーティリティ
│   ├── e2e/              # E2Eテスト
│   └── prisma/           # Prismaスキーマ
│
├── backend/              # FastAPIアプリケーション
│   ├── main.py           # エントリーポイント
│   ├── services/         # ビジネスロジック
│   └── tests/            # pytestテスト
│
├── docker-compose.yml    # 開発環境
├── docker-compose.prod.yml  # 本番環境
└── .github/
    └── workflows/        # CI/CD
```

---

## 🎓 学習ポイント

このプロジェクトで習得した技術:

- ✅ Next.js 14 App Router
- ✅ FastAPI + Pythonバックエンド
- ✅ PostgreSQL + Prisma/SQLAlchemy
- ✅ OpenAI API統合
- ✅ ベクトルDB（Pinecone）
- ✅ RAG実装
- ✅ Notion API連携
- ✅ 外部DB接続（Oracle/SQL Server）
- ✅ pandas データ分析
- ✅ Docker/Docker Compose
- ✅ GitHub Actions CI/CD
- ✅ テスト（Jest/Playwright/pytest）

---

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

---

## 🙏 謝辞

- [Next.js](https://nextjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenAI](https://openai.com/)
- [Pinecone](https://www.pinecone.io/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 お問い合わせ

質問や提案がある場合は、Issueを作成してください。

---

**作成者**: [あなたの名前]  
**作成日**: 2024年12月  
**目的**: 来月の新規プロジェクト配属に向けた技術スタック学習

## 📸 スクリーンショット

### ホーム画面
![Home](./docs/screenshots/home.png)

### ドキュメント管理
![Documents](./docs/screenshots/documents.png)

### AI検索
![AI Search](./docs/screenshots/ai-search.png)

### データ分析
![Data Analysis](./docs/screenshots/data-analysis.png)

## 🎥 デモ動画

[![Demo Video](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
```

---

## 📜 Step 5: ライセンスの追加

**LICENSE ファイルを作成（MIT License推奨）:**
```
MIT License

Copyright (c) 2024 [あなたの名前]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.