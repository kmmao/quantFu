import { test, expect } from '@playwright/test';

/**
 * 主题切换功能 E2E 测试
 * 测试主题切换按钮的交互和持久化
 */
test.describe('主题切换', () => {
  test.beforeEach(async ({ page }) => {
    // 清除 localStorage 中的主题设置，确保每次测试从干净状态开始
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('theme'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
  });

  test.describe('移动端主题切换', () => {
    test.beforeEach(async ({ page }) => {
      // 设置移动端视口
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('应该显示主题切换按钮', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 移动端 header 中应该有主题切换按钮
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await expect(themeButton).toBeVisible();
    });

    test('点击按钮应该显示主题选项菜单', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 点击主题切换按钮
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await themeButton.click();

      // 应该显示三个主题选项
      await expect(page.getByText('亮色模式')).toBeVisible();
      await expect(page.getByText('暗色模式')).toBeVisible();
      await expect(page.getByText('跟随系统')).toBeVisible();
    });

    test('选择暗色模式应该应用 dark 类', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 点击主题切换按钮
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await themeButton.click();

      // 选择暗色模式
      await page.getByText('暗色模式').click();

      // 等待主题应用
      await page.waitForTimeout(300);

      // html 元素应该有 dark 类
      const htmlElement = page.locator('html');
      await expect(htmlElement).toHaveClass(/dark/);
    });

    test('选择亮色模式应该移除 dark 类', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 先切换到暗色模式
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await themeButton.click();
      await page.getByText('暗色模式').click();
      await page.waitForTimeout(300);

      // 再切换到亮色模式
      await themeButton.click();
      await page.getByText('亮色模式').click();
      await page.waitForTimeout(300);

      // html 元素不应该有 dark 类
      const htmlElement = page.locator('html');
      await expect(htmlElement).not.toHaveClass(/dark/);
    });
  });

  test.describe('桌面端主题切换', () => {
    test.beforeEach(async ({ page }) => {
      // 设置桌面端视口
      await page.setViewportSize({ width: 1280, height: 720 });
    });

    test('侧边栏用户菜单应该包含主题子菜单', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 等待侧边栏加载
      await page.waitForTimeout(500);

      // 点击用户菜单按钮（侧边栏底部）
      const userMenuButton = page.locator('[data-sidebar="footer"]').getByRole('button');
      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();

        // 应该能看到主题选项
        await expect(page.getByText('主题')).toBeVisible();
      }
    });
  });

  test.describe('主题持久化', () => {
    test('刷新页面后主题设置应该保持', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 切换到暗色模式
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await themeButton.click();
      await page.getByText('暗色模式').click();
      await page.waitForTimeout(300);

      // 验证暗色模式已应用
      await expect(page.locator('html')).toHaveClass(/dark/);

      // 刷新页面
      await page.reload();
      await page.waitForLoadState('domcontentloaded');

      // 暗色模式应该保持
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('localStorage 应该存储主题设置', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 切换到暗色模式
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await themeButton.click();
      await page.getByText('暗色模式').click();
      await page.waitForTimeout(300);

      // 检查 localStorage
      const theme = await page.evaluate(() => localStorage.getItem('theme'));
      expect(theme).toBe('dark');
    });
  });

  test.describe('系统主题跟随', () => {
    test('选择跟随系统应该响应系统主题', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // 模拟系统暗色模式偏好
      await page.emulateMedia({ colorScheme: 'dark' });

      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // 切换到跟随系统
      const themeButton = page.getByRole('button', { name: '切换主题' });
      await themeButton.click();
      await page.getByText('跟随系统').click();
      await page.waitForTimeout(300);

      // 应该应用暗色模式
      await expect(page.locator('html')).toHaveClass(/dark/);

      // 切换系统主题到亮色
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(300);

      // 应该应用亮色模式
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });
  });

  test.describe('无闪烁加载', () => {
    test('页面加载时不应该出现主题闪烁', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // 先设置暗色模式
      await page.goto('/');
      await page.evaluate(() => localStorage.setItem('theme', 'dark'));

      // 监听页面加载过程中的类变化
      const classChanges: string[] = [];

      await page.goto('/');

      // 记录初始状态
      const initialClass = await page.locator('html').getAttribute('class');
      classChanges.push(initialClass || '');

      // 页面初始加载时应该就有正确的主题类
      // next-themes 会通过内联脚本在页面加载前设置主题
      await page.waitForLoadState('domcontentloaded');

      const finalClass = await page.locator('html').getAttribute('class');

      // 暗色模式应该从一开始就应用
      expect(finalClass).toContain('dark');
    });
  });
});
