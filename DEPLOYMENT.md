# デプロイガイド

## 目次
- [ローカル環境](#ローカル環境)
- [Docker環境](#docker環境)
- [Azure Container Apps](#azure-container-apps)
- [AWS ECS/Fargate](#aws-ecsfargate)

---

## ローカル環境

### 前提条件
- Node.js 20以上
- Python 3.11以上
- PostgreSQL 15以上

### セットアップ
```bash
# リポジトリクローン
git clone <repository-url>
cd tech-doc-assistant

# 環境変数設定
cp .env.example .env
# .envファイルを編集

# PostgreSQL起動
docker-compose up -d postgres

# バックエンド
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# フロントエンド
cd frontend
npm install
npx prisma migrate dev
npm run dev
```

---

## Docker環境

### ビルドと起動
```bash
# .env設定
cp .env.example .env
# .envを編集

# ビルド
docker-compose -f docker-compose.prod.yml build

# 起動
docker-compose -f docker-compose.prod.yml up -d

# ログ確認
docker-compose -f docker-compose.prod.yml logs -f
```

### アクセス
- Frontend: http://localhost:3001
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## Azure Container Apps

### 1. Azure CLIセットアップ
```bash
# Azure CLIインストール
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# ログイン
az login
```

### 2. リソース作成
```bash
# リソースグループ
az group create --name tech-doc-rg --location japaneast

# Container Registry
az acr create \
  --resource-group tech-doc-rg \
  --name techdocacr \
  --sku Basic

# PostgreSQL
az postgres flexible-server create \
  --resource-group tech-doc-rg \
  --name tech-doc-postgres \
  --location japaneast \
  --admin-user dbadmin \
  --admin-password <secure-password> \
  --sku-name Standard_B1ms \
  --version 15

# Container Apps環境
az containerapp env create \
  --name tech-doc-env \
  --resource-group tech-doc-rg \
  --location japaneast
```

### 3. イメージプッシュ
```bash
# ACRログイン
az acr login --name techdocacr

# ビルド&プッシュ
docker build -t techdocacr.azurecr.io/backend:latest ./backend
docker push techdocacr.azurecr.io/backend:latest

docker build -t techdocacr.azurecr.io/frontend:latest ./frontend
docker push techdocacr.azurecr.io/frontend:latest
```

### 4. デプロイ
```bash
# Backend
az containerapp create \
  --name tech-doc-backend \
  --resource-group tech-doc-rg \
  --environment tech-doc-env \
  --image techdocacr.azurecr.io/backend:latest \
  --target-port 8001 \
  --ingress external \
  --registry-server techdocacr.azurecr.io \
  --cpu 0.5 --memory 1.0Gi \
  --min-replicas 1 --max-replicas 3

# Frontend
az containerapp create \
  --name tech-doc-frontend \
  --resource-group tech-doc-rg \
  --environment tech-doc-env \
  --image techdocacr.azurecr.io/frontend:latest \
  --target-port 3001 \
  --ingress external \
  --registry-server techdocacr.azurecr.io \
  --cpu 0.5 --memory 1.0Gi \
  --min-replicas 1 --max-replicas 3
```

---

## AWS ECS/Fargate

### 1. AWS CLIセットアップ
```bash
# AWS CLI設定
aws configure
```

### 2. ECRリポジトリ作成
```bash
aws ecr create-repository --repository-name tech-doc-backend
aws ecr create-repository --repository-name tech-doc-frontend
```

### 3. イメージプッシュ
```bash
# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com

# ビルド&プッシュ
docker build -t <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/tech-doc-backend:latest ./backend
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/tech-doc-backend:latest
```

### 4. タスク定義とサービス作成
ECS Consoleまたはterraformで設定

---

## 環境変数

必須の環境変数:
- `DATABASE_URL`: PostgreSQL接続文字列
- `NEXTAUTH_SECRET`: NextAuth秘密鍵
- `GITHUB_ID`, `GITHUB_SECRET`: GitHub OAuth
- `OPENAI_API_KEY`: OpenAI APIキー
- `PINECONE_API_KEY`: Pinecone APIキー
- `PINECONE_INDEX_NAME`: Pineconeインデックス名

---

## トラブルシューティング

### Docker起動失敗
```bash
# ログ確認
docker-compose -f docker-compose.prod.yml logs

# コンテナ再起動
docker-compose -f docker-compose.prod.yml restart
```

### データベース接続エラー
- 接続文字列確認
- PostgreSQLが起動しているか確認
- ファイアウォール設定確認