import { test, expect } from '@playwright/test';

/**
 * 锁仓系统页面 E2E 测试
 */
test.describe('锁仓页面', () => {
  test('应该能够访问锁仓页面', async ({ page }) => {
    const response = await page.goto('/lock');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});

test.describe('锁仓配置页面', () => {
  test('应该能够访问锁仓配置页面', async ({ page }) => {
    const response = await page.goto('/lock-config');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
