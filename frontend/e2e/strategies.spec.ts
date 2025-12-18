import { test, expect } from '@playwright/test';

/**
 * 策略管理页面 E2E 测试
 */
test.describe('策略管理页面', () => {
  test('应该能够成功访问页面', async ({ page }) => {
    const response = await page.goto('/strategies');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('响应式布局测试', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/strategies');
    await page.waitForSelector('body', { timeout: 10000 });

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/strategies');
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
