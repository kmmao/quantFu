# 首页持仓监控修复说明

## ✅ 问题已修复

### 原始错误
```
获取持仓数据失败: {}
at fetchPositions (app/page.tsx:33:17)
```

### 问题原因
首页查询 `v_positions_summary` 视图时出现空对象错误，导致错误处理不清晰，用户不知道如何解决。

---

## 🔧 修复内容

### 1. **改进错误处理** ✅
- 添加明确的错误状态管理
- 在页面顶部显示错误提示
- 提供清晰的错误信息和解决建议

### 2. **优化空状态显示** ✅
- 添加友好的空状态界面
- 提供快捷操作按钮
- 显示快速开始指南

### 3. **增强用户体验** ✅
- 刷新按钮添加加载状态
- 显示最后更新时间
- 提供跳转到测试页面和 Studio 的链接

---

## 📊 数据结构说明

### v_positions_summary 视图

这是一个数据库视图，汇总了持仓信息:

**字段:**
- account_id - 账户ID
- account_name - 账户名称
- variety_name - 品种名称
- symbol - 合约代码
- long_position - 多仓手数
- short_position - 空仓手数
- long_avg_price - 多仓均价
- short_avg_price - 空仓均价
- long_profit - 多仓盈亏
- short_profit - 空仓盈亏
- total_profit - 总盈亏
- net_position - 净持仓
- last_price - 最新价
- updated_at - 更新时间

**数据来源:**
- 基础表: `positions`
- 关联表: `accounts`, `contracts`

---

## 🚀 使用说明

### 1. 查看首页
```
http://localhost:3000
```

### 2. 如果没有数据

页面会显示空状态，包含以下操作:

**选项 A: 使用测试页面创建数据**
1. 点击"测试 Supabase 连接"按钮
2. 在测试页面创建测试账户
3. 返回首页刷新

**选项 B: 使用 Supabase Studio**
1. 点击"打开 Supabase Studio"按钮
2. 在 Studio 中手动添加数据到 `accounts` 和 `positions` 表
3. 返回首页刷新

### 3. 实时更新

首页已配置实时订阅:
- 当 `positions` 表数据变化时自动刷新
- 每 30 秒自动刷新一次（备用机制）
- 手动点击"刷新"按钮立即更新

---

## 🔄 创建测试数据示例

### 方法 1: 通过 Supabase Studio

1. 打开 http://localhost:3001
2. 进入 Table Editor
3. 选择 `accounts` 表，创建账户
4. 选择 `positions` 表，创建持仓

### 方法 2: 通过 SQL

在 Supabase Studio 的 SQL Editor 中执行:

```sql
-- 1. 创建测试账户
INSERT INTO accounts (account_name, polar_account_id, broker, initial_balance, status)
VALUES ('测试账户', 'TEST_001', '测试券商', 100000, 'active')
RETURNING id;

-- 2. 创建测试合约
INSERT INTO contracts (variety_code, variety_name, exchange, polar_symbol, tqsdk_symbol, is_main, multiplier, price_tick, margin_ratio)
VALUES ('RB', '螺纹钢', 'SHFE', 'SHFE.rb2505', 'SHFE.rb2505', true, 10, 1.0, 0.08)
RETURNING id;

-- 3. 创建测试持仓（使用上面返回的 ID）
INSERT INTO positions (
  account_id,
  symbol,
  long_position,
  long_avg_price,
  long_profit,
  last_price
)
VALUES (
  '<账户ID>',
  'SHFE.rb2505',
  10,
  3500.00,
  1000.00,
  3600.00
);
```

### 方法 3: 通过代码

```typescript
import { supabase } from '@/lib/supabase'

// 创建账户
const { data: account } = await supabase
  .from('accounts')
  .insert({
    account_name: '测试账户',
    polar_account_id: 'TEST_001',
    broker: '测试券商',
    initial_balance: 100000,
    status: 'active'
  })
  .select()
  .single()

// 创建持仓
await supabase
  .from('positions')
  .insert({
    account_id: account.id,
    symbol: 'SHFE.rb2505',
    long_position: 10,
    long_avg_price: 3500.00,
    long_profit: 1000.00,
    last_price: 3600.00
  })
```

---

## 📱 页面功能

### 顶部统计卡片
- **总盈亏**: 所有持仓的盈亏合计（绿色正数，红色负数）
- **持仓品种**: 品种总数 + 盈利/亏损分布
- **净持仓**: 所有持仓手数的绝对值合计

### 持仓明细表
显示每个持仓的详细信息:
- 品种和合约代码
- 账户名称
- 多仓/空仓手数和均价
- 净持仓（多仓 - 空仓）
- 最新价
- 盈亏（带涨跌箭头）

### 实时更新
- 数据库变化时自动刷新
- 显示最后更新时间（相对时间）
- 手动刷新按钮

---

## ⚠️ 注意事项

### 视图依赖
`v_positions_summary` 视图依赖以下表:
- `positions` - 必须存在
- `accounts` - 必须存在
- `contracts` - 可选（用于显示品种名称）

如果表不存在或为空，视图会返回空结果。

### 权限配置
确保 Supabase RLS（行级安全）策略允许访问:
- 当前使用 ANON_KEY 访问
- 开发环境 RLS 未启用（UNRESTRICTED）
- 生产环境需要配置适当的 RLS 策略

### 数据一致性
视图中的 `total_profit` 和 `net_position` 是计算字段:
```sql
total_profit = long_profit + short_profit
net_position = long_position - short_position
```

确保基础数据正确才能获得准确的汇总信息。

---

## 🐛 故障排查

### 页面显示"数据加载失败"

**检查步骤:**
1. 确认 Supabase 服务运行:
   ```bash
   docker ps --filter "name=quantfu"
   ```

2. 测试视图查询:
   ```bash
   curl -H "apikey: YOUR_KEY" http://localhost:8000/rest/v1/v_positions_summary
   ```

3. 检查浏览器控制台错误信息

### 页面显示"暂无持仓数据"

这是正常状态，表示:
- ✅ Supabase 连接正常
- ✅ 视图可访问
- ❌ 没有持仓数据

**解决方法:**
- 按照上面的"创建测试数据示例"添加数据

### 实时更新不工作

**可能原因:**
1. Realtime 服务未运行
2. 浏览器连接断开
3. WebSocket 被阻止

**检查方法:**
```bash
# 检查 Realtime 容器
docker ps --filter "name=quantfu_realtime"

# 查看日志
docker logs quantfu_realtime --tail 50
```

---

## 🔄 与后端集成

如果要显示实时行情数据:

1. **后端服务更新 positions 表**
   - 定期从交易所获取最新价
   - 更新 `last_price` 字段
   - 计算并更新 `long_profit`, `short_profit`

2. **前端自动刷新**
   - Realtime 订阅自动触发刷新
   - 或使用定时刷新机制

3. **性能优化**
   - 考虑使用物化视图而不是普通视图
   - 为频繁查询的字段添加索引
   - 限制返回的数据量（如只显示有持仓的品种）

---

## 📝 后续改进建议

1. **添加筛选和排序**
   - 按品种筛选
   - 按盈亏排序
   - 按账户分组

2. **添加图表可视化**
   - 盈亏分布饼图
   - 持仓时间线
   - 品种占比

3. **添加风险指标**
   - 总保证金使用率
   - 单品种最大持仓比例
   - 风险度预警

4. **优化性能**
   - 虚拟滚动（大量数据时）
   - 数据分页
   - 缓存策略

5. **移动端优化**
   - 响应式表格
   - 触摸手势支持
   - PWA 离线支持

---

**修复完成时间:** 2025-12-19
**修复人:** Claude
**状态:** ✅ 已修复并优化
