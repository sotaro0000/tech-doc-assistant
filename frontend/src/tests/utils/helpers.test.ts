import { formatDate, truncateText, calculateReadingTime } from '@/lib/utils'

describe('Helper Functions', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-12-25')
      const formatted = formatDate(date)
      expect(formatted).toBe('2024/12/25')
    })
  })

  describe('truncateText', () => {
    it('does not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('truncates long text', () => {
      expect(truncateText('Hello World Test', 10)).toBe('Hello Worl...')
    })

    it('handles exact length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello')
    })
  })

  describe('calculateReadingTime', () => {
    it('calculates reading time for short text', () => {
      const text = 'This is a short text.'
      expect(calculateReadingTime(text)).toBe(1)
    })

    it('calculates reading time for long text', () => {
      const text = Array(300).fill('word').join(' ')
      expect(calculateReadingTime(text)).toBe(2)
    })
  })
})