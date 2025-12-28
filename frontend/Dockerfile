# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# アプリケーションのビルド
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# ユーザー作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルのコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 権限設定
RUN chown -R nextjs:nodejs /app

USER nextjs

# ポート公開
EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# 起動コマンド
CMD ["node", "server.js"]