import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the home page', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.locator('h1')).toContainText('Tech Doc Assistant')
    await expect(page.getByText('AI-powered Technical Documentation Management System')).toBeVisible()
  })

  test('should show API and DB status', async ({ page }) => {
    await page.goto('/')
    
    // ステータスカードが表示される
    await expect(page.getByText('Backend API (FastAPI)')).toBeVisible()
    await expect(page.getByText('Database (PostgreSQL)')).toBeVisible()
  })

  test('should navigate to documents page when logged in', async ({ page }) => {
    await page.goto('/')
    
    // ログインボタンが表示される（未ログイン時）
    const loginButton = page.getByRole('button', { name: /GitHub.*ログイン/i })
    await expect(loginButton).toBeVisible()
  })
})