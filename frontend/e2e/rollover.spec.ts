import { test, expect } from '@playwright/test';

/**
 * 换月相关页面 E2E 测试
 */
test.describe('换月任务页面', () => {
  test('应该能够访问换月任务页面', async ({ page }) => {
    const response = await page.goto('/rollover-tasks');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});

test.describe('换月统计页面', () => {
  test('应该能够访问换月统计页面', async ({ page }) => {
    const response = await page.goto('/rollover-stats');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
