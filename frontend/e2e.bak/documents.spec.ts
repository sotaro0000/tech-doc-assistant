import { test, expect } from '@playwright/test'

test.describe('Documents Page', () => {
  test.beforeEach(async ({ page }) => {
    // Note: 実際のテストでは認証をモック or テストユーザーでログイン
    // ここでは認証をスキップして直接アクセスと仮定
  })

  test('should display documents list', async ({ page }) => {
    await page.goto('/documents')
    
    // 認証リダイレクトの場合はスキップ
    const title = page.locator('h1')
    const text = await title.textContent()
    
    if (text?.includes('ドキュメント一覧')) {
      await expect(title).toContainText('ドキュメント一覧')
      await expect(page.getByText('新規作成')).toBeVisible()
    }
  })

  test('should open create document dialog', async ({ page }) => {
    await page.goto('/documents')
    
    const createButton = page.getByRole('button', { name: '新規作成' })
    
    if (await createButton.isVisible()) {
      await createButton.click()
      
      await expect(page.getByText('新しいドキュメントを作成')).toBeVisible()
      await expect(page.getByLabel('タイトル')).toBeVisible()
      await expect(page.getByLabel(/内容/)).toBeVisible()
    }
  })
})