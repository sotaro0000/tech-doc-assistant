export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🚀 Tech Doc Assistant - デモサイト
        </h1>
        
        <div className="prose max-w-none">
          <h2>概要</h2>
          <p>
            AI-powered Technical Documentation Management System
          </p>
          
          <h2>主な機能</h2>
          <ul>
            <li>📝 Markdownドキュメント管理</li>
            <li>🤖 GPT-4によるAI検索</li>
            <li>💬 RAG質問応答システム</li>
            <li>📥 Notion API連携</li>
            <li>📊 データ分析機能</li>
            <li>🗄️ 外部DB接続</li>
          </ul>
          
          <h2>技術スタック</h2>
          <ul>
            <li>Frontend: Next.js 14, TypeScript, Tailwind CSS</li>
            <li>Backend: FastAPI, Python</li>
            <li>Database: PostgreSQL, Pinecone</li>
            <li>AI: OpenAI GPT-4</li>
            <li>Deploy: Vercel, Railway</li>
          </ul>
          
          <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3>⚠️ デモサイトについて</h3>
            <p>
              このサイトはデモ環境です。テストアカウントでログインして機能をお試しいただけます。
            </p>
            <p className="text-sm text-gray-600">
              ※ ソースコードは非公開です
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}