import { test, expect } from '@playwright/test';

/**
 * 合约管理页面 E2E 测试
 */
test.describe('合约管理页面', () => {
  test('应该能够成功访问页面', async ({ page }) => {
    const response = await page.goto('/contracts');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('响应式布局测试', async ({ page }) => {
    // 移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/contracts');
    await page.waitForSelector('body', { timeout: 10000 });

    // 桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/contracts');
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
