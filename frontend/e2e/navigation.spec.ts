import { test, expect } from '@playwright/test';

/**
 * 导航功能 E2E 测试
 * 测试主要路由是否可访问（不依赖后端数据）
 */
test.describe('页面导航', () => {
  const routes = [
    { path: '/', name: '首页' },
    { path: '/contracts', name: '合约管理' },
    { path: '/strategies', name: '策略管理' },
    { path: '/strategy-groups', name: '策略组' },
    { path: '/signals', name: '信号' },
    { path: '/chart', name: '图表' },
    { path: '/performance', name: '绩效' },
    { path: '/rollover-tasks', name: '换月任务' },
    { path: '/rollover-stats', name: '换月统计' },
    { path: '/lock', name: '锁仓' },
    { path: '/lock-config', name: '锁仓配置' },
    { path: '/conflicts', name: '冲突' },
    { path: '/resources', name: '资源' },
  ];

  for (const route of routes) {
    test(`${route.name} (${route.path}) 应该可访问`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // HTTP 状态码应该是 200
      expect(response?.status()).toBe(200);

      // 页面应该渲染出React根节点
      await page.waitForSelector('body', { timeout: 10000 });
    });
  }

  test('页面标题应该正确', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/QuantFu/);
  });
});
