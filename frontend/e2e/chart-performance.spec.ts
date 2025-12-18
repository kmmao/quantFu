import { test, expect } from '@playwright/test';

/**
 * 图表与绩效页面 E2E 测试
 */
test.describe('图表页面', () => {
  test('应该能够访问图表页面', async ({ page }) => {
    const response = await page.goto('/chart');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});

test.describe('绩效页面', () => {
  test('应该能够访问绩效页面', async ({ page }) => {
    const response = await page.goto('/performance');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
