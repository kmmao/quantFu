# 测试策略

> QuantFu 期货量化管理平台 - 完整测试策略与规范

---

## 📋 目录

- [测试技术栈](#测试技术栈)
- [覆盖率要求](#覆盖率要求)
- [E2E 测试规范 (Playwright)](#e2e-测试规范-playwright)
- [Playwright MCP 集成](#playwright-mcp-集成)
- [测试命名规范](#测试命名规范)
- [测试金字塔](#测试金字塔)
- [最佳实践](#最佳实践)

---

## 测试技术栈

### 前端测试

- **E2E 测试框架**: Playwright 1.57+
- **UI 组件库**: shadcn/ui (React + TypeScript)
- **测试覆盖率工具**: Playwright HTML Reporter
- **MCP 集成**: `@executeautomation/playwright-mcp-server`

### 后端测试

- **单元测试**: pytest (Python)
- **API 测试**: pytest + httpx
- **覆盖率工具**: coverage.py

### 数据库测试

- **工具**: pytest + psycopg2
- **策略**: 使用 Docker 容器运行测试数据库

---

## 覆盖率要求

| 代码类型 | 最低覆盖率 | 目标覆盖率 | 说明 |
|---------|-----------|-----------|------|
| 前端 E2E | 80% | 90% | 所有页面路由必须测试 |
| 前端组件 | 60% | 80% | 关键组件优先 |
| 后端 API | 80% | 90% | 所有 API 端点必须测试 |
| 业务逻辑 | 90% | 95% | 核心交易逻辑 100% |
| 工具函数 | 80% | 90% | 纯函数优先测试 |
| 整体项目 | 70% | 85% | 持续提升 |

### 特殊要求

- **核心交易模块**: 必须 100% 覆盖
- **风控模块**: 必须 100% 覆盖
- **资金管理**: 必须 100% 覆盖
- **数据同步**: 必须有集成测试

---

## E2E 测试规范 (Playwright)

### 配置文件

**位置**: `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试文件目录
  testDir: './e2e',

  // 完全并行运行
  fullyParallel: true,

  // CI 环境设置
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // 报告
  reporter: 'html',

  // 共享配置
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // 浏览器配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 测试文件结构

```
frontend/
├── e2e/                          # E2E 测试目录
│   ├── homepage.spec.ts          # 首页测试
│   ├── navigation.spec.ts        # 路由测试
│   ├── contracts.spec.ts         # 合约管理测试
│   ├── strategies.spec.ts        # 策略管理测试
│   ├── chart-performance.spec.ts # 图表&绩效测试
│   ├── rollover.spec.ts          # 换月系统测试
│   ├── lock-system.spec.ts       # 锁仓系统测试
│   └── other-pages.spec.ts       # 其他页面测试
└── playwright.config.ts          # Playwright 配置
```

### 测试策略

#### 基础可访问性测试 (当前标准)

对于**不依赖后端数据**的测试：

```typescript
import { test, expect } from '@playwright/test';

test.describe('页面名称', () => {
  test('应该能够成功访问页面', async ({ page }) => {
    const response = await page.goto('/path');

    // 验证 HTTP 200
    expect(response?.status()).toBe(200);

    // 验证页面渲染
    await page.waitForSelector('body', { timeout: 10000 });
  });

  test('响应式布局测试', async ({ page }) => {
    // 移动端
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/path');
    await page.waitForSelector('body', { timeout: 10000 });

    // 桌面端
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/path');
    await page.waitForSelector('body', { timeout: 10000 });
  });
});
```

#### 业务逻辑测试 (需要时使用)

对于**需要测试交互**的场景：

```typescript
test.describe('业务功能', () => {
  test('用户可以创建新策略', async ({ page }) => {
    await page.goto('/strategies');

    // 点击创建按钮
    await page.getByRole('button', { name: '创建策略' }).click();

    // 填写表单
    await page.getByLabel('策略名称').fill('测试策略');
    await page.getByLabel('品种').selectOption('RB');

    // 提交
    await page.getByRole('button', { name: '确定' }).click();

    // 验证成功提示
    await expect(page.getByText('创建成功')).toBeVisible();
  });
});
```

### 测试原则

1. **不依赖真实数据** - 基础测试只验证页面可访问性
2. **快速执行** - 30个测试应在 15 秒内完成
3. **稳定可靠** - 避免因网络或数据问题导致失败
4. **容错设计** - 页面加载状态、错误状态都应能通过测试

---

## Playwright MCP 集成

### 什么是 Playwright MCP

Playwright MCP (Model Context Protocol) 是一个让 AI 助手能够直接操作 Playwright 测试的工具。

**核心优势**:
- AI 可以自动编写测试
- AI 可以调试失败的测试
- AI 可以生成测试报告
- AI 可以优化测试性能

### 配置 MCP Server

**位置**: `.mcp.json`

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@executeautomation/playwright-mcp-server"
      ],
      "env": {
        "PLAYWRIGHT_PROJECT_DIR": "/Users/sangreal/Documents/GitHub/quantFu/frontend"
      }
    }
  }
}
```

### 使用 MCP 的工作流

1. **AI 自动创建测试**
   ```
   提示: "帮我为 /contracts 页面创建 E2E 测试"
   AI 会: 分析页面 -> 生成测试代码 -> 运行验证
   ```

2. **AI 调试失败测试**
   ```
   提示: "homepage.spec.ts 测试失败了,帮我看看"
   AI 会: 读取错误 -> 查看截图 -> 修复代码 -> 重新测试
   ```

3. **AI 优化测试性能**
   ```
   提示: "测试太慢了,帮我优化"
   AI 会: 分析瓶颈 -> 并行化测试 -> 减少等待时间
   ```

### 最佳实践

#### ✅ DO (推荐做法)

- **让 AI 批量创建基础测试** - AI 可以快速生成所有页面的可访问性测试
- **让 AI 修复 UI 组件缺失** - AI 会在测试过程中发现并修复缺失组件
- **使用 AI 生成测试报告** - AI 可以分析测试结果并生成文档
- **让 AI 优化测试性能** - AI 可以自动识别慢测试并优化

#### ❌ DON'T (避免的做法)

- **不要让 AI 测试敏感操作** - 支付、删库等操作需要人工审查
- **不要完全依赖 AI** - 关键测试需要人工 review
- **不要跳过测试理解** - 了解 AI 生成的测试代码

---

## 测试命名规范

### 文件命名

- **E2E 测试**: `*.spec.ts` (放在 `frontend/e2e/`)
- **单元测试**: `*.test.ts` (放在 `__tests__/` 或与源文件同目录)
- **集成测试**: `*.integration.test.ts`

### 测试函数命名

**格式**: `应该 + 动作 + 预期结果`

```typescript
// ✅ 好的命名
test('应该能够成功访问首页')
test('应该能够创建新策略')
test('应该能够在合约到期前7天发送提醒')

// ❌ 不好的命名
test('test1')
test('homepage')
test('create strategy')
```

### 测试分组

使用 `describe` 清晰分组：

```typescript
test.describe('合约管理页面', () => {
  test.describe('列表功能', () => {
    test('应该能够显示所有合约')
    test('应该能够按品种筛选')
  });

  test.describe('创建功能', () => {
    test('应该能够创建新合约')
    test('应该能够验证必填字段')
  });
});
```

---

## 测试金字塔

### QuantFu 测试金字塔

```
      ╱▔▔▔▔▔▔▔╲
     ╱  E2E     ╲    15% - Playwright 测试核心流程
    ╱─────────────╲
   ╱  Integration  ╲  25% - API + 数据库集成测试
  ╱─────────────────╲
 ╱     Unit          ╲ 60% - 业务逻辑、工具函数
╱───────────────────────╲
```

### 各层测试职责

#### 单元测试 (60%)

**测试对象**: 纯函数、工具类、业务逻辑

```python
# backend/tests/test_risk_calculator.py
def test_calculate_margin():
    """测试保证金计算"""
    result = calculate_margin(
        symbol='RB2505',
        price=3500,
        lots=10,
        margin_rate=0.12
    )
    assert result == 42000
```

#### 集成测试 (25%)

**测试对象**: API 端点、数据库操作、外部服务

```python
# backend/tests/integration/test_trade_api.py
def test_create_trade_order(client, db):
    """测试创建交易订单"""
    response = client.post('/api/trades', json={
        'symbol': 'RB2505',
        'direction': 'BUY',
        'lots': 10
    })
    assert response.status_code == 201
    assert db.query(Trade).count() == 1
```

#### E2E 测试 (15%)

**测试对象**: 关键业务流程

```typescript
// frontend/e2e/critical-flows.spec.ts
test('完整交易流程', async ({ page }) => {
  // 1. 登录
  await page.goto('/login');
  await page.fill('[name=username]', 'trader');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');

  // 2. 创建策略
  await page.goto('/strategies');
  await page.click('text=创建策略');
  // ...

  // 3. 启动策略
  await page.click('text=启动');

  // 4. 验证持仓
  await page.goto('/');
  await expect(page.getByText('RB2505')).toBeVisible();
});
```

---

## 最佳实践

### 1. 测试独立性

```typescript
// ✅ 好的做法 - 每个测试独立
test('测试1', async ({ page }) => {
  await page.goto('/');
  // 自己准备数据
});

test('测试2', async ({ page }) => {
  await page.goto('/');
  // 自己准备数据,不依赖测试1
});

// ❌ 坏的做法 - 测试之间有依赖
let sharedData;
test('测试1', async ({ page }) => {
  sharedData = await createData();
});

test('测试2', async ({ page }) => {
  // 依赖测试1的数据
  await useData(sharedData);
});
```

### 2. 合理使用等待

```typescript
// ✅ 好的做法 - 明确等待条件
await page.waitForSelector('table', { timeout: 10000 });
await page.waitForResponse(resp => resp.url().includes('/api/data'));

// ❌ 坏的做法 - 固定时间等待
await page.waitForTimeout(5000);  // 脆弱且慢
```

### 3. 使用 Page Object 模式

对于复杂页面,使用 Page Object 封装：

```typescript
// pages/ContractsPage.ts
export class ContractsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/contracts');
  }

  async createContract(data: ContractData) {
    await this.page.click('text=创建合约');
    await this.page.fill('[name=symbol]', data.symbol);
    await this.page.fill('[name=price]', data.price);
    await this.page.click('button[type=submit]');
  }

  async getFirstContract() {
    return this.page.locator('table tr').first();
  }
}

// 测试中使用
test('创建合约', async ({ page }) => {
  const contractsPage = new ContractsPage(page);
  await contractsPage.goto();
  await contractsPage.createContract({
    symbol: 'RB2505',
    price: '3500'
  });

  const firstRow = await contractsPage.getFirstContract();
  await expect(firstRow).toContainText('RB2505');
});
```

### 4. 测试数据管理

```typescript
// fixtures/test-data.ts
export const TEST_CONTRACTS = {
  rb2505: {
    symbol: 'RB2505',
    name: '螺纹钢2505',
    price: 3500,
    margin_rate: 0.12
  },
  hc2505: {
    symbol: 'HC2505',
    name: '热卷2505',
    price: 3200,
    margin_rate: 0.10
  }
};

// 在测试中使用
import { TEST_CONTRACTS } from './fixtures/test-data';

test('测试合约', async ({ page }) => {
  const contract = TEST_CONTRACTS.rb2505;
  // 使用测试数据
});
```

---

## 🔄 CI/CD 集成

### GitHub Actions 配置

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📊 测试报告

### 查看报告

```bash
# 运行测试
npm test

# 查看 HTML 报告
npm run test:report
```

### 报告内容

- ✅ 通过的测试数量
- ❌ 失败的测试详情
- 📸 失败时的截图
- 🎥 失败时的视频录制
- ⏱️ 每个测试的执行时间
- 📈 测试趋势分析

---

## 🚀 快速开始

### 运行测试

```bash
# 进入前端目录
cd frontend

# 运行所有 E2E 测试
npm test

# UI 模式 (推荐用于开发)
npm run test:ui

# 显示浏览器运行
npm run test:headed

# 调试模式
npm run test:debug

# 只运行特定文件
npx playwright test homepage.spec.ts

# 只运行特定测试
npx playwright test -g "应该能够访问首页"
```

### 创建新测试

1. 在 `frontend/e2e/` 创建 `*.spec.ts` 文件
2. 遵循测试模板
3. 运行测试验证
4. 提交代码

**模板**:

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能名称', () => {
  test('应该能够...', async ({ page }) => {
    // 1. 访问页面
    const response = await page.goto('/path');
    expect(response?.status()).toBe(200);

    // 2. 验证渲染
    await page.waitForSelector('body', { timeout: 10000 });

    // 3. 测试交互 (可选)
    await page.click('button');
    await expect(page.getByText('成功')).toBeVisible();
  });
});
```

---

## 📝 检查清单

### 新功能开发

开发新功能时,请确认:

- [ ] 已编写单元测试 (如有业务逻辑)
- [ ] 已编写集成测试 (如有 API)
- [ ] 已编写 E2E 测试 (如有页面)
- [ ] 测试覆盖率达标
- [ ] 所有测试通过
- [ ] 已更新相关文档

### Bug 修复

修复 Bug 时,请确认:

- [ ] 已添加重现 Bug 的测试
- [ ] 测试在修复前失败
- [ ] 测试在修复后通过
- [ ] 已考虑边界情况

---

## 🔗 相关资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright MCP Server](https://github.com/executeautomation/playwright-mcp-server)
- [测试最佳实践](https://martinfowler.com/articles/practical-test-pyramid.html)

---

**最后更新**: 2025-12-19
**状态**: ✅ 已完成并投入使用
