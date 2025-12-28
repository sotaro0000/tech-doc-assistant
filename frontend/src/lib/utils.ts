// ヘルパー関数を作成
// frontend/src/lib/utils.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200
  const words = text.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}