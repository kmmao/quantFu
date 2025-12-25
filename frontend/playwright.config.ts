import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试文件目录
  testDir: './e2e',

  // 完全并行运行测试
  fullyParallel: true,

  // CI 环境禁止失败重试
  forbidOnly: !!process.env.CI,

  // CI 环境重试失败的测试
  retries: process.env.CI ? 2 : 0,

  // 并发执行数量
  workers: process.env.CI ? 1 : undefined,

  // 报告格式
  reporter: 'html',

  // 共享配置
  use: {
    // 基础 URL (使用环境变量或默认 3005)
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 失败时录制视频
    video: 'retain-on-failure',

    // 追踪
    trace: 'on-first-retry',
  },

  // 项目配置 - 不同浏览器
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 开发服务器配置
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER ? undefined : {
    command: 'PORT=3005 npm run dev',
    url: 'http://localhost:3005',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
