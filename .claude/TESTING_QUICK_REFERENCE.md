# 测试快速参考卡片

> 日常开发中的测试速查手册

---

## 🚀 常用命令

### 前端 E2E 测试

```bash
# 进入前端目录
cd frontend

# 运行所有测试
npm test

# UI 模式 (推荐)
npm run test:ui

# 显示浏览器
npm run test:headed

# 调试模式
npm run test:debug

# 查看报告
npm run test:report

# 只运行某个文件
npx playwright test homepage.spec.ts

# 只运行某个测试
npx playwright test -g "应该能够访问"
```

### 后端测试

```bash
cd backend

# 运行所有测试
pytest

# 显示详细输出
pytest -v

# 只运行某个文件
pytest tests/test_risk.py

# 查看覆盖率
pytest --cov
```

---

## 📝 测试模板

### E2E 测试模板

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

### 后端测试模板

```python
def test_function_name():
    """测试描述"""
    # Arrange
    input_data = {'key': 'value'}

    # Act
    result = function_to_test(input_data)

    # Assert
    assert result == expected_value
```

---

## 📊 覆盖率要求速查

| 类型 | 最低 | 目标 |
|-----|-----|-----|
| 前端 E2E | 80% | 90% |
| 前端组件 | 60% | 80% |
| 后端 API | 80% | 90% |
| 核心业务 | 90% | 95% |
| 交易/风控 | **100%** | **100%** |

---

## ✅ 提交前检查

- [ ] `cd frontend && npm test` - E2E 测试通过
- [ ] `cd backend && pytest` - 单元测试通过
- [ ] `npm run lint` - Linter 通过
- [ ] 覆盖率达标 (≥80%)

---

## 🤖 使用 AI 写测试

### Playwright MCP 已配置

直接向 AI 提出需求：

```
"帮我为 /contracts 页面创建 E2E 测试"
"测试失败了,帮我看看"
"优化测试性能"
```

AI 会：
- ✅ 自动分析页面
- ✅ 生成测试代码
- ✅ 运行验证
- ✅ 修复 Bug
- ✅ 优化性能

---

## 🔗 详细文档

完整测试策略: [.claude/core/testing-strategy.md](.claude/core/testing-strategy.md)

---

**快速开始**: `cd frontend && npm run test:ui`
