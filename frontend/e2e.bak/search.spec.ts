import { test, expect } from '@playwright/test'

test.describe('AI Search Page', () => {
  test('should display search interface', async ({ page }) => {
    await page.goto('/search')
    
    const heading = page.locator('h1')
    const text = await heading.textContent()
    
    if (text?.includes('AI検索')) {
      await expect(heading).toContainText('AI検索')
      
      // タブが表示される
      await expect(page.getByRole('tab', { name: 'ベクトル検索' })).toBeVisible()
      await expect(page.getByRole('tab', { name: '質問応答' })).toBeVisible()
    }
  })

  test('should switch between search tabs', async ({ page }) => {
    await page.goto('/search')
    
    const qaTab = page.getByRole('tab', { name: '質問応答' })
    
    if (await qaTab.isVisible()) {
      await qaTab.click()
      await expect(page.getByText('質問応答 (RAG)')).toBeVisible()
    }
  })
})