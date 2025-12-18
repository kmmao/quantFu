import { test, expect } from '@playwright/test';

/**
 * 首页基础 E2E 测试
 */
test.describe('首页', () => {
  test('应该能够成功访问首页', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('应该能够在不同视口尺寸下正常渲染', async ({ page }) => {
    // 移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });

    // 平板
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });

    // 桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
