import { test, expect } from '@playwright/test';

/**
 * 其他业务页面 E2E 测试
 */
test.describe('策略组页面', () => {
  test('应该能够访问策略组页面', async ({ page }) => {
    const response = await page.goto('/strategy-groups');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});

test.describe('信号页面', () => {
  test('应该能够访问信号页面', async ({ page }) => {
    const response = await page.goto('/signals');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});

test.describe('冲突页面', () => {
  test('应该能够访问冲突页面', async ({ page }) => {
    const response = await page.goto('/conflicts');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});

test.describe('资源页面', () => {
  test('应该能够访问资源页面', async ({ page }) => {
    const response = await page.goto('/resources');
    expect(response?.status()).toBe(200);
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
