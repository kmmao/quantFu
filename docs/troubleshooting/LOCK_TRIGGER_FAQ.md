# 锁仓触发服务问题排查指南

本文档提供锁仓触发和执行相关问题的诊断步骤和解决方案，涵盖配置检查、日志排查和数据库诊断。

---

## 目录

1. [锁仓自动执行失败](#1-锁仓自动执行失败)
2. [触发条件不满足](#2-触发条件不满足)
3. [移动止损不触发](#3-移动止损不触发)
4. [持仓不足错误](#4-持仓不足错误)
5. [锁仓触发服务停止](#5-锁仓触发服务停止)
6. [触发通知未收到](#6-触发通知未收到)
7. [快速诊断流程](#7-快速诊断流程)

---

## 1. 锁仓自动执行失败

### 症状

- `lock_triggers` 表中记录的 `execution_status = 'failed'`
- 锁仓触发成功，但执行失败
- `error_message` 显示 "锁仓下单接口未实现"
- 收到触发通知，但没有收到执行成功通知

### 根本原因

⚠️ **重要**: 当前版本的锁仓执行功能（`_execute_lock_order`）尚未实现，所有自动执行都会失败。

代码位置：`backend/engines/lock_engine.py` 第 203-206 行

```python
raise NotImplementedError(
    "锁仓下单接口未实现,请根据极星API文档完成集成。\n"
    "参考上方TODO注释中的3种集成方式。"
)
```

### 排查步骤

```bash
# 1. 查看最近失败的触发记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, symbol, direction, trigger_condition,
       execution_status, error_message, triggered_at
FROM lock_triggers
WHERE execution_status = 'failed'
ORDER BY triggered_at DESC
LIMIT 10;
"

# 2. 查看后端服务日志
docker-compose logs backend --tail=100 | grep -E "(锁仓执行|NotImplementedError|lock_engine)"

# 3. 检查触发记录详情
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM v_lock_trigger_summary
ORDER BY triggered_at DESC LIMIT 5;
"
```

### 解决方案

**方案1: 使用手动确认模式（推荐临时方案）**

将锁仓配置的 `auto_execute` 设置为 `false`，收到触发通知后手动在极星策略中执行锁仓：

```sql
-- 修改所有配置为手动确认模式
UPDATE lock_configs
SET auto_execute = false
WHERE auto_execute = true;
```

**方案2: 完成极星API集成（长期方案）**

需要实现 `backend/engines/lock_engine.py` 中的 `_execute_lock_order` 方法。三种集成方式：

1. **HTTP API 方式**：调用极星策略的 HTTP 下单接口
2. **WebSocket 方式**：通过 WebSocket 推送锁仓指令到极星策略
3. **被动监听方式**：极星策略监听数据库/WebSocket，自行判断并下单

**方案3: 手动更新触发记录状态**

如果已在极星策略中手动执行了锁仓，可以手动更新触发记录：

```sql
-- 将失败的触发记录更新为已执行
UPDATE lock_triggers
SET execution_status = 'executed',
    execution_time = NOW(),
    execution_result = '手动在极星策略中执行'
WHERE id = '触发记录ID'
  AND execution_status = 'failed';
```

---

## 2. 触发条件不满足

### 症状

- 持仓有利润但未触发锁仓
- 价格已到达目标但未触发
- 配置已创建但一直没有触发记录

### 可能原因

| 原因 | 说明 |
|------|------|
| 阈值设置过高 | 利润阈值或价格阈值设置过于保守 |
| 方向不匹配 | 配置的方向与实际持仓方向不符 |
| 配置未启用 | `is_enabled = false` 或已过期 |
| 持仓为零 | 当前无实际持仓 |
| 触发类型未开启 | `profit_lock_enabled = false` |

### 排查步骤

```bash
# 1. 检查活跃的锁仓配置
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, symbol, direction, trigger_type,
       profit_lock_threshold, trigger_price, stop_loss_price,
       auto_execute, profit_lock_enabled
FROM lock_configs
WHERE is_enabled = true;
"

# 2. 检查当前持仓和利润 (通过视图)
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, direction,
       current_position, current_profit, last_price,
       profit_lock_threshold, trigger_price
FROM v_active_lock_configs;
"

# 3. 对比配置与实际数据
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT
    c.symbol,
    c.direction,
    c.profit_lock_threshold,
    p.long_profit,
    p.short_profit,
    p.long_position,
    p.short_position
FROM lock_configs c
JOIN positions p ON c.account_id = p.account_id AND c.symbol = p.symbol
WHERE c.is_enabled = true;
"
```

### 解决方案

**方案1: 调整触发阈值**

```sql
-- 降低利润触发阈值
UPDATE lock_configs
SET profit_lock_threshold = 5000  -- 改为5000元触发
WHERE symbol = '合约代码' AND account_id = '账户ID';

-- 调整价格触发点
UPDATE lock_configs
SET trigger_price = 3800  -- 调整目标价格
WHERE symbol = '合约代码' AND account_id = '账户ID';
```

**方案2: 修正方向配置**

```sql
-- 确保配置方向与持仓方向一致
UPDATE lock_configs
SET direction = 'long'  -- 或 'short'
WHERE symbol = '合约代码'
  AND account_id = '账户ID';
```

**方案3: 启用触发功能**

```sql
-- 启用利润触发
UPDATE lock_configs
SET profit_lock_enabled = true,
    is_enabled = true
WHERE symbol = '合约代码' AND account_id = '账户ID';
```

**方案4: 验证触发逻辑**

利润触发条件（`trigger_type = 'profit'`）：
```
当前利润 >= profit_lock_threshold
```

价格触发条件（`trigger_type = 'price'`）：
- 多仓：`当前价格 >= trigger_price`
- 空仓：`当前价格 <= trigger_price`

止损触发条件：
- 多仓：`当前价格 <= stop_loss_price`
- 空仓：`当前价格 >= stop_loss_price`

---

## 3. 移动止损不触发

### 症状

- 配置了 `trigger_type = 'trailing'` 但从不触发
- 价格从最高点回落但未锁仓
- 日志中无任何移动止损相关记录

### 根本原因

⚠️ **重要**: 当前版本的移动止损（trailing stop）功能尚未完全实现。

代码位置：`backend/services/lock_trigger_service.py` 第 130-136 行

```python
elif trigger_type == "trailing":
    # 移动止损
    if config.get("trailing_stop"):
        _ = config.get("trailing_distance", 0)
        # 简化实现:从最高价回落一定距离触发
        # 实际应维护最高价/最低价状态
```

移动止损需要：
- 维护持仓期间的最高价/最低价
- 实时计算回落距离
- 当前版本仅有框架代码，实际触发逻辑未实现

### 解决方案

**方案1: 改用价格触发（推荐）**

将移动止损改为固定价格触发：

```sql
-- 将移动止损改为价格触发
UPDATE lock_configs
SET trigger_type = 'price',
    trigger_price = 3850,  -- 设置目标价格
    stop_loss_price = 3700  -- 设置止损价格
WHERE trigger_type = 'trailing'
  AND account_id = '账户ID';
```

**方案2: 使用利润触发**

```sql
-- 改为利润触发
UPDATE lock_configs
SET trigger_type = 'profit',
    profit_lock_enabled = true,
    profit_lock_threshold = 10000  -- 利润达到10000元触发
WHERE trigger_type = 'trailing'
  AND account_id = '账户ID';
```

**方案3: 手动监控价格**

在等待功能完善期间，可以：
1. 使用极星策略自带的移动止损功能
2. 定期手动检查价格并调整固定止损价

---

## 4. 持仓不足错误

### 症状

- `error_message` 显示 "持仓不足"
- 触发成功但执行失败
- 日志显示 "当前{方向}仓: X手, 需要锁定: Y手"

### 可能原因

| 原因 | 说明 |
|------|------|
| 并发执行 | 多个锁仓触发同时执行，重复扣减持仓 |
| 持仓已变化 | 触发时有持仓，执行时持仓已减少 |
| 配置过期 | 配置创建时有持仓，当前已平仓 |
| 锁定比例过高 | `profit_lock_ratio` 设置超过 1.0 |

### 排查步骤

```bash
# 1. 检查当前实际持仓
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, direction,
       long_position, short_position,
       is_long_locked, is_short_locked
FROM positions
WHERE account_id = '账户ID';
"

# 2. 检查触发记录的锁定手数
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, direction, lock_volume, execution_status, error_message
FROM lock_triggers
WHERE account_id = '账户ID'
ORDER BY triggered_at DESC LIMIT 10;
"

# 3. 检查配置的锁定比例
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, direction, profit_lock_ratio
FROM lock_configs
WHERE account_id = '账户ID' AND is_enabled = true;
"
```

### 解决方案

**方案1: 调整锁定比例**

```sql
-- 降低锁定比例到 50%
UPDATE lock_configs
SET profit_lock_ratio = 0.5
WHERE account_id = '账户ID' AND symbol = '合约代码';
```

**方案2: 刷新持仓数据**

如果持仓数据不一致，手动触发持仓同步：

```bash
# 调用持仓快照API进行对账
curl -X POST http://localhost:8888/api/position_snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "极星账户ID",
    "positions": [
      {"symbol": "合约代码", "long_position": 10, "short_position": 0}
    ]
  }'
```

**方案3: 清理失败的触发记录**

```sql
-- 取消失败的触发记录（允许重新触发）
UPDATE lock_triggers
SET execution_status = 'cancelled'
WHERE execution_status = 'failed'
  AND error_message LIKE '%持仓不足%';
```

---

## 5. 锁仓触发服务停止

### 症状

- 不再有新的触发记录产生
- 后端服务运行但锁仓监控不工作
- 日志显示 "锁仓监控服务异常" 后无更多日志

### 可能原因

| 原因 | 说明 |
|------|------|
| 主循环异常 | `check_all_configs()` 中未捕获的异常导致服务停止 |
| 数据库连接断开 | Supabase 连接异常 |
| 服务被手动停止 | `stop()` 被调用 |
| 后端服务重启 | Docker 容器重启但服务未正确恢复 |

代码位置：`backend/services/lock_trigger_service.py` 第 37-39 行

```python
except Exception as e:
    logger.error(f"锁仓监控服务异常: {e}")
    self.running = False  # 服务完全停止
```

### 排查步骤

```bash
# 1. 检查后端服务状态
curl http://localhost:8888/health | jq

# 2. 查看锁仓服务相关日志
docker-compose logs backend --tail=200 | grep -E "(锁仓|lock_trigger|LockTriggerService)"

# 3. 检查最近的触发记录时间
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT MAX(triggered_at) as last_trigger,
       NOW() - MAX(triggered_at) as time_since_last
FROM lock_triggers;
"

# 4. 检查服务运行状态（如果有状态表）
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM service_status WHERE service_name = 'lock_trigger';
"
```

### 解决方案

**方案1: 重启后端服务**

```bash
# 重启整个后端服务
docker-compose restart backend

# 或重启所有服务
docker-compose down && docker-compose up -d
```

**方案2: 检查数据库连接**

```bash
# 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"

# 检查 Supabase 服务
docker-compose ps | grep -E "(postgres|kong|rest)"
```

**方案3: 检查视图是否正常**

```sql
-- 测试视图查询
SELECT COUNT(*) FROM v_active_lock_configs;

-- 如果视图查询失败，可能需要重建
-- 参考 migrations 目录中的视图定义
```

**方案4: 检查日志获取更多信息**

```bash
# 获取详细的错误堆栈
docker-compose logs backend 2>&1 | grep -A 20 "锁仓监控服务异常"
```

---

## 6. 触发通知未收到

### 症状

- 锁仓触发成功（数据库有记录）
- 未收到 ntfy 推送通知
- 通知功能对所有服务都失效

### 可能原因

| 原因 | 说明 |
|------|------|
| NTFY_URL 未配置 | 环境变量缺失或错误 |
| ntfy 服务不可达 | 网络问题或服务宕机 |
| 通知发送超时 | 5秒超时未成功 |
| 通知内容被过滤 | ntfy 服务端规则过滤 |

### 排查步骤

```bash
# 1. 检查 NTFY_URL 环境变量
cat backend/.env | grep NTFY

# 2. 测试 ntfy 服务连通性
curl -X POST https://ntfy.zmddg.com/claude \
  -H "Title: 测试通知" \
  -d "这是一条测试消息"

# 3. 查看通知相关日志
docker-compose logs backend --tail=100 | grep -E "(notification|ntfy|通知)"

# 4. 检查触发记录是否创建成功
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, symbol, trigger_condition, execution_status, triggered_at
FROM lock_triggers
ORDER BY triggered_at DESC LIMIT 5;
"
```

### 解决方案

**方案1: 配置 NTFY_URL**

在 `backend/.env` 中添加或修改：

```env
# 使用公共 ntfy 服务
NTFY_URL=https://ntfy.sh/your-unique-topic

# 或使用自建服务
NTFY_URL=https://ntfy.zmddg.com/your-topic
```

**方案2: 测试通知功能**

```bash
# 直接测试通知 API
curl -X POST http://localhost:8888/api/test-notification \
  -H "Content-Type: application/json" \
  -d '{"title": "测试", "message": "测试消息"}'
```

**方案3: 检查网络连通性**

```bash
# 从容器内测试
docker-compose exec backend curl -v https://ntfy.zmddg.com/claude

# 检查 DNS 解析
docker-compose exec backend nslookup ntfy.zmddg.com
```

**方案4: 使用其他通知渠道**

如果 ntfy 不可用，可以考虑：
- 使用公共 ntfy.sh 服务
- 配置钉钉/企业微信 webhook
- 检查邮件通知配置

---

## 7. 快速诊断流程

遇到锁仓问题时，按以下顺序快速排查：

```
1. 检查服务状态
   ↓
2. 查看触发记录
   ↓
3. 检查配置设置
   ↓
4. 对比持仓数据
   ↓
5. 查看后端日志
```

### 诊断命令速查

```bash
# 1. 服务健康检查
curl http://localhost:8888/health | jq

# 2. 查看最近触发记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, direction, trigger_type, execution_status,
       triggered_at, error_message
FROM lock_triggers
ORDER BY triggered_at DESC LIMIT 10;
"

# 3. 查看活跃配置
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM v_active_lock_configs;
"

# 4. 查看后端日志
docker-compose logs backend --tail=50 | grep -E "(锁仓|lock|trigger)"

# 5. 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| 触发记录为空 | 服务未运行/配置未启用 | `v_active_lock_configs` |
| status='failed' | 执行接口未实现 | `error_message` 字段 |
| 持仓不足 | 配置比例过高/并发问题 | `positions` 表持仓 |
| 无通知 | NTFY_URL 配置 | `.env` 文件 |
| 不触发 | 阈值/方向配置 | `lock_configs` 配置 |

### 数据库表关系

```
lock_configs (配置) ──┬──> lock_triggers (触发记录)
                     │
                     └──> lock_executions (执行历史)

v_active_lock_configs (视图) = lock_configs + positions (联合查询)
```

### 关键字段说明

**lock_configs 表**:
| 字段 | 说明 |
|------|------|
| `trigger_type` | profit/price/trailing (触发类型) |
| `profit_lock_threshold` | 利润触发阈值 |
| `trigger_price` | 价格触发目标 |
| `stop_loss_price` | 止损价格 |
| `profit_lock_ratio` | 锁定比例 (0-1) |
| `auto_execute` | 是否自动执行 |

**lock_triggers 表**:
| 字段 | 说明 |
|------|------|
| `execution_status` | pending/executed/failed/cancelled |
| `trigger_condition` | 触发条件描述 |
| `error_message` | 失败原因 |

---

## 已知限制

### 当前版本未实现的功能

1. **锁仓下单接口** (`_execute_lock_order`)
   - 所有自动执行都会失败
   - 需要手动在极星策略中执行锁仓

2. **移动止损** (`trigger_type = 'trailing'`)
   - 仅有框架代码
   - 建议使用 price 或 profit 类型替代

3. **触发服务自动恢复**
   - 主循环异常后服务完全停止
   - 需要手动重启后端服务

### 最佳实践建议

1. **配置建议**：使用 `auto_execute = false` 手动确认模式
2. **监控建议**：定期检查 `lock_triggers` 表的失败记录
3. **备用方案**：在极星策略中配置条件单作为备用

---

## 相关文档

- [WebSocket 问题排查](./WEBSOCKET_FAQ.md)
- [项目 API 文档](http://localhost:8888/docs) - 后端接口说明
- [极星策略集成指南](../integration/POLAR_INTEGRATION.md) - 如需实现下单接口

---

*最后更新: 2025-12-24*
