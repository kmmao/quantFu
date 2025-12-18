# 核心引擎层 (Engines) 指南

> QuantFu 后端的核心计算引擎,负责持仓重建和锁仓执行等关键业务逻辑

**⚠️ 本文档由 AI 生成 - 最后更新: 2025-12-18**

---

## 📌 模块职责

引擎层是后端的核心业务逻辑层,实现复杂的计算和执行逻辑。

**职责范围:**
- 根据成交记录重建持仓状态
- 计算持仓均价和浮动盈亏
- 执行锁仓操作和记录历史
- 更新持仓锁定状态
- 验证持仓数据完整性

**不在范围:**
- 不提供 HTTP API(由 main.py 调用)
- 不直接接收极星数据(由 API 层接收后调用引擎)
- 不负责下单到交易所(由极星策略负责)

---

## 📁 文件结构

```
engines/
├── __init__.py           # 模块初始化
├── position_engine.py    # 持仓计算引擎(204行)
├── lock_engine.py        # 锁仓执行引擎(332行)
└── .claude/guide.md      # 本文档
```

### 文件说明

- **position_engine.py**: 持仓重建算法,根据成交记录计算持仓
- **lock_engine.py**: 锁仓执行逻辑,下单、记录、状态更新

---

## ⚙️ 主要功能

### 1. 持仓计算引擎 (PositionEngine)

#### 核心算法

持仓重建采用**逐笔回放**算法:

```
1. 获取所有成交记录(按时间正序)
2. 初始化: 多仓=0, 空仓=0, 均价=0
3. 逐笔处理:
   - 买开 → 增加多仓,加权平均计算多仓均价
   - 卖平 → 减少多仓
   - 卖开 → 增加空仓,加权平均计算空仓均价
   - 买平 → 减少空仓
4. 获取最新价格(天勤或缓存)
5. 计算浮盈:
   - 多仓浮盈 = (最新价 - 多仓均价) × 多仓量 × 合约乘数
   - 空仓浮盈 = (空仓均价 - 最新价) × 空仓量 × 合约乘数
6. 更新数据库(upsert)
```

**加权平均算法**:

```python
# 多仓开仓
if 当前有多仓:
    旧成本 = 多仓均价 × 原多仓量
    新成本 = 本次成交价 × 本次成交量
    新多仓量 = 原多仓量 + 本次成交量
    新多仓均价 = (旧成本 + 新成本) / 新多仓量
else:
    新多仓量 = 本次成交量
    新多仓均价 = 本次成交价
```

#### rebuild_position()

根据成交记录重建持仓。

**用途**:
- 接收极星成交后自动调用
- 手动修复持仓不一致时调用

**参数**:
- `account_id: str` - 账户UUID
- `symbol: str` - 合约代码(极星格式)

**返回**: `Dict` - 更新后的持仓信息

**示例**:
```python
from engines.position_engine import PositionEngine

engine = PositionEngine()

# 重建持仓
result = await engine.rebuild_position(
    account_id="xxx-uuid",
    symbol="ZCE|F|TA|2505"
)

print(result)
# {
#     "account_id": "xxx-uuid",
#     "symbol": "ZCE|F|TA|2505",
#     "long_position": 5,
#     "long_avg_price": 5500.0,
#     "long_profit": 2500.0,
#     "short_position": 2,
#     "short_avg_price": 5600.0,
#     "short_profit": -200.0,
#     "last_price": 5550.0,
#     "updated_at": "2025-01-15T10:30:00"
# }
```

**调用时机**:
1. POST `/api/trades` 接收成交后自动调用
2. POST `/api/positions/rebuild/{account_id}/{symbol}` 手动触发

#### get_all_positions()

获取账户所有持仓。

**参数**:
- `account_id: str` - 账户UUID

**返回**: `list` - 持仓列表

**示例**:
```python
positions = await engine.get_all_positions("xxx-uuid")
for pos in positions:
    print(f"{pos['symbol']}: 多{pos['long_position']} 空{pos['short_position']}")
```

#### update_position_price()

更新持仓的最新价格和浮盈。

**用途**: 定时任务从天勤获取最新价后调用

**参数**:
- `symbol: str` - 合约代码(极星格式)
- `last_price: float` - 最新价格

**示例**:
```python
# 获取天勤最新价后更新
await engine.update_position_price("ZCE|F|TA|2505", 5550.0)
```

---

### 2. 锁仓执行引擎 (LockEngine)

#### 核心流程

锁仓执行分为以下步骤:

```
1. 获取持仓信息
2. 验证持仓是否足够
3. 记录执行前状态
4. 执行锁仓下单(调用极星API)
5. 计算锁定利润
6. 更新持仓锁定状态
7. 记录执行历史
8. 更新触发记录状态
9. 发送通知
```

#### execute_lock()

执行锁仓操作。

**用途**:
- 自动锁仓:触发服务检测到条件满足时调用
- 手动锁仓:用户确认后调用

**参数**:
- `trigger_id: str` - 触发记录ID
- `account_id: str` - 账户UUID
- `symbol: str` - 合约代码(极星格式)
- `direction: str` - 持仓方向(long/short)
- `lock_volume: int` - 锁定手数
- `trigger_price: float` - 触发价格
- `method: str` - 执行方式(auto/manual),默认 "auto"

**返回**: `Dict[str, Any]` - 执行结果

**成功响应**:
```python
{
    "success": True,
    "execution_id": "exec-uuid",
    "lock_volume": 5,
    "lock_price": 5550.0,
    "locked_profit": 2500.0,
    "order_id": "POLAR_ORDER_123"
}
```

**失败响应**:
```python
{
    "success": False,
    "error": "持仓不足,当前多仓: 3手, 需要锁定: 5手"
}
```

**示例**:
```python
from engines.lock_engine import LockEngine

engine = LockEngine()

# 执行锁仓
result = await engine.execute_lock(
    trigger_id="trigger-uuid",
    account_id="account-uuid",
    symbol="ZCE|F|TA|2505",
    direction="long",        # 锁定多仓
    lock_volume=5,           # 锁定5手
    trigger_price=5550.0,    # 触发价
    method="auto"            # 自动执行
)

if result["success"]:
    print(f"锁仓成功,锁定利润: {result['locked_profit']:.2f}元")
else:
    print(f"锁仓失败: {result['error']}")
```

#### 锁定利润计算

```python
# 多仓锁仓
if direction == "long":
    locked_profit = (
        (trigger_price - long_avg_price)
        × lock_volume
        × multiplier
    )

# 空仓锁仓
else:
    locked_profit = (
        (short_avg_price - trigger_price)
        × lock_volume
        × multiplier
    )
```

#### 锁仓方向

锁仓使用**反向开仓**:

- 锁定多仓 → 卖开(增加空仓)
- 锁定空仓 → 买开(增加多仓)

最终形成对冲持仓(多仓和空仓同时存在)。

---

## 🔗 依赖关系

### 内部依赖

```
PositionEngine
  ├── utils.db (Supabase 客户端)
  └── utils.contract_mapper (格式转换)

LockEngine
  ├── utils.db (Supabase 客户端)
  ├── utils.notification (消息通知)
  └── utils.logger (日志记录)
```

### 被依赖方

```
main.py (API层)
  ├── POST /api/trades → PositionEngine.rebuild_position()
  └── POST /api/lock/execute/{id} → LockEngine.execute_lock()

services/lock_trigger_service.py
  └── LockEngine.execute_lock()
```

---

## 🎯 使用示例

### 完整示例:接收成交并重建持仓

```python
from engines.position_engine import PositionEngine
from utils.db import get_supabase_client

async def handle_trade(trade_data: dict):
    """
    处理极星推送的成交数据

    1. 存储成交记录
    2. 重建持仓
    3. 检查锁仓条件
    """
    supabase = get_supabase_client()
    engine = PositionEngine()

    # 1. 存储成交
    supabase.table("trades").insert({
        "account_id": trade_data["account_id"],
        "symbol": trade_data["symbol"],
        "direction": trade_data["direction"],
        "offset": trade_data["offset"],
        "volume": trade_data["volume"],
        "price": trade_data["price"],
        "timestamp": trade_data["timestamp"]
    }).execute()

    # 2. 重建持仓
    position = await engine.rebuild_position(
        account_id=trade_data["account_id"],
        symbol=trade_data["symbol"]
    )

    print(f"持仓更新: 多{position['long_position']} 空{position['short_position']}")

    # 3. 检查是否需要锁仓
    # (由 lock_trigger_service 负责)
```

### 完整示例:执行锁仓

```python
from engines.lock_engine import LockEngine
from utils.notification import send_notification

async def auto_lock(trigger_data: dict):
    """
    自动执行锁仓

    1. 验证触发条件
    2. 执行锁仓
    3. 发送通知
    """
    engine = LockEngine()

    # 执行锁仓
    result = await engine.execute_lock(
        trigger_id=trigger_data["trigger_id"],
        account_id=trigger_data["account_id"],
        symbol=trigger_data["symbol"],
        direction=trigger_data["direction"],
        lock_volume=trigger_data["lock_volume"],
        trigger_price=trigger_data["trigger_price"],
        method="auto"
    )

    # 发送通知
    if result["success"]:
        await send_notification(
            title="锁仓执行成功",
            message=f"""
合约: {trigger_data['symbol']}
方向: {trigger_data['direction']}
锁定手数: {result['lock_volume']}
锁定价格: {result['lock_price']}
锁定利润: {result['locked_profit']:.2f}元
            """.strip(),
            priority="high",
            tags="lock,success"
        )
    else:
        await send_notification(
            title="锁仓执行失败",
            message=f"失败原因: {result['error']}",
            priority="urgent",
            tags="lock,error"
        )

    return result
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建引擎层文档 | AI |
| 2025-12-18 | 整理 | 补充算法说明和示例 | AI |

---

## 🎯 最佳实践

### 1. 持仓重建

```python
# ✅ 推荐:每次成交后立即重建
await engine.rebuild_position(account_id, symbol)

# ❌ 不推荐:批量延迟重建(数据可能不一致)
```

### 2. 锁仓执行

```python
# ✅ 推荐:检查执行结果
result = await engine.execute_lock(...)
if not result["success"]:
    logger.error(f"锁仓失败: {result['error']}")
    # 处理失败情况

# ❌ 不推荐:不检查结果
await engine.execute_lock(...)  # 不知道是否成功
```

### 3. 错误处理

```python
# ✅ 推荐:捕获异常并记录
try:
    result = await engine.rebuild_position(account_id, symbol)
except Exception as e:
    logger.error(f"持仓重建失败: {e}")
    # 发送告警
    await send_notification("持仓重建失败", str(e), priority="urgent")

# ❌ 不推荐:不处理异常
result = await engine.rebuild_position(account_id, symbol)  # 可能抛异常
```

### 4. 并发控制

```python
# ✅ 推荐:使用锁避免并发重建同一持仓
import asyncio

_rebuild_locks = {}

async def safe_rebuild(account_id: str, symbol: str):
    key = f"{account_id}:{symbol}"

    if key not in _rebuild_locks:
        _rebuild_locks[key] = asyncio.Lock()

    async with _rebuild_locks[key]:
        return await engine.rebuild_position(account_id, symbol)

# ❌ 不推荐:并发重建可能导致数据不一致
```

---

## ⚠️ 注意事项

### 1. 持仓计算

- **时间顺序很重要**:成交记录必须按时间正序处理
- **平仓不影响均价**:平仓只减少持仓量,不重新计算均价
- **合约乘数**:不同品种乘数不同(铁矿石10, PTA5, 股指300)
- **数值精度**:使用 Decimal 计算,避免 float 精度问题

### 2. 锁仓执行

- **下单接口未实现**:`lock_engine.py` 中的 `_execute_lock_order()` 需要集成
- **三种集成方式**:
  1. 调用极星策略的 HTTP 接口
  2. 通过 WebSocket 推送指令到极星
  3. 极星策略监听数据库,自动执行
- **持仓验证**:锁仓前必须验证持仓是否足够
- **原子操作**:锁仓执行应保证原子性(要么全部成功,要么全部失败)

### 3. 数据库操作

- **upsert 操作**:持仓表使用 `upsert` 避免重复记录
- **冲突键**:`(account_id, symbol)` 唯一约束
- **视图查询**:复杂查询使用 `v_positions_summary` 视图

### 4. 性能优化

- **批量更新**:如果有多个合约,可批量更新价格
- **缓存最新价**:避免频繁查询天勤 API
- **异步操作**:所有 IO 操作使用 async/await

### 5. 锁定状态

- **is_long_locked / is_short_locked**:标记是否已锁定
- **lock_price**:记录锁定时的价格
- **legacy_position**:记录遗留持仓(部分锁仓时)

---

## 🐛 常见问题

### Q: 持仓重建后数据还是不对?

A: 检查以下几点:

1. **成交记录完整性**:查看 `trades` 表是否有遗漏
   ```sql
   SELECT * FROM trades
   WHERE account_id = 'xxx' AND symbol = 'ZCE|F|TA|2505'
   ORDER BY timestamp;
   ```

2. **direction 和 offset 是否正确**:
   - 买开(buy + open)→ 增加多仓
   - 卖平(sell + close)→ 减少多仓
   - 卖开(sell + open)→ 增加空仓
   - 买平(buy + close)→ 减少空仓

3. **合约代码是否一致**:极星格式 `ZCE|F|TA|2505`

4. **手动修复**:
   ```bash
   curl -X POST http://localhost:8888/api/positions/rebuild/85178443/ZCE|F|TA|2505
   ```

### Q: 锁仓执行失败:"NotImplementedError"

A: 锁仓下单接口未实现,需要完成以下步骤:

1. 打开 `engines/lock_engine.py`
2. 找到 `_execute_lock_order()` 方法
3. 根据极星 API 文档完成集成(见方法中的 TODO 注释)
4. 选择三种集成方式之一:
   - HTTP API 调用
   - WebSocket 推送
   - 数据库监听

### Q: 浮盈计算不对?

A: 检查以下参数:

```python
# 多仓浮盈
long_profit = (last_price - long_avg_price) × long_position × multiplier

# 检查:
# 1. last_price 是否是最新价
# 2. long_avg_price 是否正确计算(加权平均)
# 3. multiplier 是否是正确的合约乘数
```

### Q: 为什么有时持仓会"翻倍"?

A: 可能是重复调用 `rebuild_position()` 导致,检查:

1. **API 是否重复调用**:极星不要重复推送同一笔成交
2. **trades 表是否有重复记录**:
   ```sql
   SELECT order_id, COUNT(*)
   FROM trades
   GROUP BY order_id
   HAVING COUNT(*) > 1;
   ```
3. **使用 upsert 而不是 insert**:持仓表应该 upsert

### Q: 锁仓后持仓变化是什么样的?

A: 锁仓是**反向开仓**,不是平仓:

**锁定多仓前**:
```
多仓: 10手 @5500
空仓: 0手
```

**锁定 5手多仓后**:
```
多仓: 10手 @5500  (不变)
空仓: 5手 @5550   (新增,锁定价)
```

**效果**: 5手多仓被锁定,剩余 5手多仓继续浮动

### Q: 如何测试持仓引擎?

A: 创建测试用例:

```python
import pytest
from engines.position_engine import PositionEngine

@pytest.mark.asyncio
async def test_rebuild_position():
    """测试持仓重建"""
    engine = PositionEngine()

    # 准备测试数据:插入成交记录
    # ...

    # 执行重建
    result = await engine.rebuild_position(
        account_id="test-account",
        symbol="ZCE|F|TA|2505"
    )

    # 断言结果
    assert result["long_position"] == 5
    assert result["long_avg_price"] == 5500.0
```

---

## 🔗 相关文档

- [后端总体架构](../../.claude/guide.md)
- [数据模型文档](../../models/.claude/guide.md)
- [工具函数文档](../../utils/.claude/guide.md)
- [业务服务文档](../../services/.claude/guide.md)
- [数据库设计文档](../../../docs/database-design.md)

---

**文档维护者**: AI Assistant
**项目负责人**: allen
**最后审核**: 2025-12-18
