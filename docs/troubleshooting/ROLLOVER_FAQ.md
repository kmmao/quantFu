# 换月任务问题排查指南

本文档提供换月任务执行和监控相关问题的诊断步骤和解决方案,涵盖任务状态检查、手动恢复和日志排查。

---

## 目录

1. [换月任务执行失败](#1-换月任务执行失败)
2. [换月任务卡住](#2-换月任务卡住)
3. [换月提醒未触发](#3-换月提醒未触发)
4. [行情数据不足错误](#4-行情数据不足错误)
5. [重复换月任务](#5-重复换月任务)
6. [换月监控服务停止](#6-换月监控服务停止)
7. [换月通知未收到](#7-换月通知未收到)
8. [快速诊断流程](#8-快速诊断流程)

---

## 1. 换月任务执行失败

### 症状

- `rollover_tasks` 表中记录的 `status = 'failed'`
- 换月任务创建成功,但执行失败
- `error_message` 显示 "换月平仓接口未实现" 或 "换月开仓接口未实现"
- 收到任务创建通知,但没有收到执行完成通知

### 根本原因

⚠️ **重要**: 当前版本的换月执行功能(`_close_old_position` 和 `_open_new_position`)尚未实现,所有自动执行都会失败。

代码位置:`backend/services/rollover_service.py`

**平仓接口** (第 321-324 行):
```python
raise NotImplementedError(
    "换月平仓接口未实现,请根据极星API文档完成集成。\n"
    "参考上方TODO注释中的实现方式。"
)
```

**开仓接口** (第 410-413 行):
```python
raise NotImplementedError(
    "换月开仓接口未实现,请根据极星API文档完成集成。\n"
    "参考上方TODO注释中的实现方式。"
)
```

### 排查步骤

```bash
# 1. 查看最近失败的换月任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, old_symbol, new_symbol, direction,
       rollover_volume, status, error_message,
       created_at, completed_at
FROM rollover_tasks
WHERE status = 'failed'
ORDER BY completed_at DESC
LIMIT 10;
"

# 2. 查看后端服务日志
docker-compose logs backend --tail=100 | grep -E "(换月|rollover|NotImplementedError)"

# 3. 检查任务详细信息
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT t.*, c.auto_execute, c.rollover_strategy
FROM rollover_tasks t
LEFT JOIN rollover_configs c ON t.config_id = c.id
ORDER BY t.created_at DESC LIMIT 5;
"
```

### 解决方案

**方案1: 使用手动确认模式(推荐临时方案)**

将换月配置的 `auto_execute` 设置为 `false`,收到任务创建通知后手动在极星策略中执行换月:

```sql
-- 修改所有配置为手动确认模式
UPDATE rollover_configs
SET auto_execute = false
WHERE auto_execute = true;
```

**方案2: 完成极星API集成(长期方案)**

需要实现 `backend/services/rollover_service.py` 中的两个方法:
- `_close_old_position`: 调用极星API平掉旧合约持仓
- `_open_new_position`: 调用极星API开立新合约持仓

集成方式参考代码中的TODO注释。

**方案3: 手动执行换月并更新任务状态**

如果已在极星策略中手动执行了换月,可以手动更新任务记录:

```sql
-- 将失败的任务更新为已完成
UPDATE rollover_tasks
SET status = 'completed',
    completed_at = NOW(),
    error_message = '手动在极星策略中执行'
WHERE id = '任务ID'
  AND status = 'failed';
```

---

## 2. 换月任务卡住

### 症状

- `rollover_tasks` 表中记录的 `status = 'executing'` 超过1小时
- 后端服务运行正常但任务一直无进展
- 没有失败记录也没有完成记录
- 监控服务跳过该任务(因为状态不是 pending)

### 可能原因

| 原因 | 说明 |
|------|------|
| 服务异常中断 | 执行过程中后端服务重启或崩溃 |
| 数据库更新失败 | `update_task_status` 调用失败但异常被静默 |
| 执行超时 | 极星API调用超时但无超时处理机制 |
| 并发冲突 | 多个进程同时处理同一任务 |

### 任务状态流转

```
pending → executing → completed
                  ↘→ failed

⚠️ 问题: 任务可能永久卡在 executing 状态
   - 执行过程中服务崩溃
   - 异常被捕获但状态未更新
   - 无自动超时恢复机制
```

### 排查步骤

```bash
# 1. 查看卡住的任务(执行超过1小时)
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, old_symbol, new_symbol, direction,
       rollover_volume, status, started_at,
       NOW() - started_at as stuck_duration
FROM rollover_tasks
WHERE status = 'executing'
  AND started_at < NOW() - INTERVAL '1 hour';
"

# 2. 查看任务的执行记录(如果有)
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM rollover_executions
WHERE task_id = '任务ID'
ORDER BY created_at;
"

# 3. 检查后端服务最近重启情况
docker-compose logs backend --tail=200 | grep -E "(started|shutdown|error)"

# 4. 查看执行时间段的日志
docker-compose logs backend --since="2024-01-01T10:00:00" --until="2024-01-01T11:00:00" | grep rollover
```

### 解决方案

**方案1: 手动重置卡住的任务(推荐)**

```sql
-- 将卡住超过1小时的任务重置为待执行状态
UPDATE rollover_tasks
SET status = 'pending',
    started_at = NULL,
    error_message = '系统自动重置:执行超时'
WHERE status = 'executing'
  AND started_at < NOW() - INTERVAL '1 hour';
```

**方案2: 将任务标记为失败**

如果确认任务无法恢复执行:

```sql
-- 将卡住的任务标记为失败
UPDATE rollover_tasks
SET status = 'failed',
    completed_at = NOW(),
    error_message = '执行超时,手动标记失败'
WHERE status = 'executing'
  AND started_at < NOW() - INTERVAL '1 hour';
```

**方案3: 手动执行后标记完成**

```sql
-- 如果已手动完成换月,更新任务状态
UPDATE rollover_tasks
SET status = 'completed',
    completed_at = NOW(),
    error_message = '手动执行完成'
WHERE id = '任务ID';
```

**方案4: 创建定时清理任务(长期方案)**

可以考虑添加一个定时任务来自动处理卡住的任务:

```sql
-- 创建定时任务检查脚本(示例)
-- 每小时运行一次,重置超过2小时的执行中任务
UPDATE rollover_tasks
SET status = 'pending',
    started_at = NULL,
    error_message = '自动重置:执行超时'
WHERE status = 'executing'
  AND started_at < NOW() - INTERVAL '2 hours';
```

---

## 3. 换月提醒未触发

### 症状

- 主力合约已切换但未收到换月提醒
- 合约即将到期但未创建换月任务
- `rollover_tasks` 表中无新记录
- 日志中无换月相关信息

### 可能原因

| 原因 | 说明 |
|------|------|
| 换月指数未达阈值 | `rollover_index < rollover_threshold` |
| 配置未启用 | `is_enabled = false` |
| 触发条件未开启 | `trigger_on_main_switch = false` |
| 无持仓 | 该账户在旧合约上无持仓 |
| 行情数据不足 | 无法计算换月指数 |
| 监控服务未运行 | `start_monitoring()` 未启动 |

### 换月触发条件

**主力切换触发** (`trigger_type = 'main_switch'`):
- `trigger_on_main_switch = true`
- `rollover_index >= rollover_threshold`
- 账户在旧合约有持仓

**到期触发** (`trigger_type = 'expiry'`):
- 合约到期日 <= 当前日期 + `days_before_expiry`
- 账户在该合约有持仓

### 排查步骤

```bash
# 1. 检查换月配置状态
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, account_id, exchange, variety_code,
       rollover_strategy, rollover_threshold,
       days_before_expiry, auto_execute,
       trigger_on_main_switch, is_enabled
FROM rollover_configs
WHERE is_enabled = true;
"

# 2. 查看配置汇总视图
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM v_rollover_configs_summary
WHERE is_enabled = true;
"

# 3. 检查最近的主力切换记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT exchange, variety_code, variety_name,
       old_main_contract, new_main_contract,
       rollover_index, switch_date
FROM main_contract_switches
ORDER BY switch_date DESC LIMIT 10;
"

# 4. 检查相关持仓
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT p.account_id, p.symbol, p.long_position, p.short_position
FROM positions p
WHERE p.symbol LIKE '%合约品种%';
"

# 5. 查看监控服务日志
docker-compose logs backend --tail=100 | grep -E "(换月监控|check_main_contract|check_expiring)"
```

### 解决方案

**方案1: 调整换月阈值**

```sql
-- 降低换月指数阈值
UPDATE rollover_configs
SET rollover_threshold = 0.5  -- 默认0.7,降低后更容易触发
WHERE exchange = 'CZCE' AND variety_code = 'TA';
```

**方案2: 启用主力切换触发**

```sql
-- 启用主力切换触发
UPDATE rollover_configs
SET trigger_on_main_switch = true,
    is_enabled = true
WHERE account_id = '账户ID';
```

**方案3: 手动创建换月任务**

如果自动触发失效,可以手动创建任务:

```sql
-- 手动创建换月任务
INSERT INTO rollover_tasks (
    config_id, account_id, old_symbol, new_symbol,
    variety_name, direction, old_position, rollover_volume,
    trigger_type, status
) VALUES (
    '配置ID', '账户ID', 'TA2501', 'TA2505',
    '甲醇', 'long', 10, 10,
    'manual', 'pending'
);
```

**方案4: 检查监控服务**

```bash
# 确认监控服务是否启动
docker-compose logs backend --tail=50 | grep "换月监控服务启动"

# 如果未看到启动日志,重启后端服务
docker-compose restart backend
```

---

## 4. 行情数据不足错误

### 症状

- `check_rollover_needed()` 返回 "行情数据不足"
- 换月指数无法计算
- 日志中显示行情查询失败
- 监控正常运行但不创建任务

### 根本原因

`RolloverMonitor` 中的行情数据查询方法在发生异常时静默返回 `None`:

代码位置:`backend/services/rollover_monitor.py`

```python
# _get_market_data (第 138-139 行)
except Exception:
    return None  # 静默失败,无日志

# _get_days_to_expiry (第 155-156 行)
except Exception:
    return None  # 静默失败,无日志
```

### 可能原因

| 原因 | 说明 |
|------|------|
| market_data 表无数据 | 行情数据未同步或已过期 |
| 天勤服务未连接 | 无法获取实时行情 |
| 合约代码格式错误 | 查询使用的合约代码与表中不匹配 |
| 数据库查询异常 | Supabase 连接问题 |

### 排查步骤

```bash
# 1. 检查 market_data 表是否有数据
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, last_price, volume, open_interest, updated_at
FROM market_data
WHERE symbol LIKE '%TA%'
ORDER BY updated_at DESC LIMIT 10;
"

# 2. 检查天勤服务连接状态
curl http://localhost:8888/health | jq '.components.tqsdk'

# 3. 检查 contracts 表中的到期日期
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, variety_code, expire_date, is_main_contract
FROM contracts
WHERE variety_code = 'TA'
ORDER BY expire_date;
"

# 4. 启用调试日志查看详细错误
docker-compose logs backend --tail=200 | grep -E "(market_data|行情|quote)"
```

### 解决方案

**方案1: 同步行情数据**

```bash
# 调用天勤服务获取最新行情
curl -X POST http://localhost:8888/api/market-data/sync \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["CZCE.TA2501", "CZCE.TA2505"]}'
```

**方案2: 手动插入行情数据**

```sql
-- 插入测试行情数据
INSERT INTO market_data (symbol, last_price, volume, open_interest, updated_at)
VALUES
  ('CZCE.TA2501', 5800, 100000, 200000, NOW()),
  ('CZCE.TA2505', 5850, 150000, 300000, NOW())
ON CONFLICT (symbol) DO UPDATE
SET last_price = EXCLUDED.last_price,
    volume = EXCLUDED.volume,
    open_interest = EXCLUDED.open_interest,
    updated_at = EXCLUDED.updated_at;
```

**方案3: 检查天勤配置**

```bash
# 确认天勤环境变量配置
cat backend/.env | grep TQSDK

# 测试天勤连接
cd backend && python test_tqsdk_auth.py
```

**方案4: 手动计算换月指数**

如果自动计算失效,可以手动判断是否需要换月:

换月指数计算公式:
```
换月指数 = 新合约持仓量 / 旧合约持仓量

换月建议:
- 换月指数 >= 1.5: 强烈建议换月
- 换月指数 >= 1.2: 建议换月
- 换月指数 >= 1.0: 可以考虑换月
- 换月指数 < 1.0: 暂不换月
```

---

## 5. 重复换月任务

### 症状

- 同一持仓创建了多个换月任务
- `rollover_tasks` 表中有重复记录
- 收到多次换月通知
- 可能导致重复平仓/开仓

### 根本原因

当前版本在创建任务前没有检查是否已存在相同的待执行任务:

代码位置:`backend/services/rollover_service.py` 第 500-510 行

```python
# 创建换月任务时无去重检查
await self.create_task(
    config_id=config["id"],
    account_id=account_id,
    old_symbol=old_symbol,
    new_symbol=switch["new_main_contract"],
    # ...
)
```

### 排查步骤

```bash
# 1. 查看可能重复的任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT old_symbol, new_symbol, direction, account_id,
       COUNT(*) as task_count,
       STRING_AGG(status, ', ') as statuses
FROM rollover_tasks
WHERE status IN ('pending', 'executing')
GROUP BY old_symbol, new_symbol, direction, account_id
HAVING COUNT(*) > 1;
"

# 2. 查看具体的重复任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, old_symbol, new_symbol, status, created_at
FROM rollover_tasks
WHERE old_symbol = '重复的旧合约'
  AND account_id = '账户ID'
ORDER BY created_at;
"
```

### 解决方案

**方案1: 取消重复的任务**

```sql
-- 保留最早创建的任务,取消后续重复任务
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY old_symbol, new_symbol, direction, account_id
        ORDER BY created_at
    ) as rn
    FROM rollover_tasks
    WHERE status = 'pending'
)
UPDATE rollover_tasks
SET status = 'cancelled',
    error_message = '取消重复任务'
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);
```

**方案2: 手动删除重复记录**

```sql
-- 先查看要删除的记录
SELECT * FROM rollover_tasks
WHERE old_symbol = '合约代码'
  AND status = 'pending'
ORDER BY created_at;

-- 删除重复记录(保留第一条)
DELETE FROM rollover_tasks
WHERE id IN ('要删除的ID1', '要删除的ID2');
```

**方案3: 添加唯一约束(长期方案)**

可以考虑在数据库层面添加唯一约束防止重复:

```sql
-- 添加部分唯一索引(仅对 pending 状态生效)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_rollover
ON rollover_tasks (account_id, old_symbol, new_symbol, direction)
WHERE status = 'pending';
```

---

## 6. 换月监控服务停止

### 症状

- 不再有新的换月任务创建
- 后端服务运行但换月监控不工作
- 日志显示 "监控循环错误" 后继续运行但无实际功能
- 长时间无任务状态更新

### 可能原因

| 原因 | 说明 |
|------|------|
| 监控循环异常 | `start_monitoring()` 循环中发生异常 |
| 数据库连接断开 | Supabase 连接异常 |
| 服务未正确启动 | FastAPI 启动时未调用监控 |
| 内存/资源问题 | 长时间运行后资源耗尽 |

### 监控循环机制

代码位置:`backend/services/rollover_service.py` 第 632-653 行

```python
async def start_monitoring(self, interval: int = 300):
    """监控服务,默认5分钟间隔"""
    while True:
        try:
            await self.check_main_contract_switches()
            await self.check_expiring_contracts()
            await self.process_pending_tasks()
        except Exception as e:
            self.logger.error(f"监控循环错误: {e}")
            # 注意: 异常后继续循环,但可能功能已异常
        await asyncio.sleep(interval)
```

### 排查步骤

```bash
# 1. 检查后端服务状态
curl http://localhost:8888/health | jq

# 2. 查看换月监控相关日志
docker-compose logs backend --tail=200 | grep -E "(换月监控|监控循环|rollover_service)"

# 3. 检查最近的任务创建时间
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT MAX(created_at) as last_task_created,
       NOW() - MAX(created_at) as time_since_last
FROM rollover_tasks;
"

# 4. 检查服务运行时长
docker-compose ps | grep backend

# 5. 检查容器资源使用
docker stats quantfu_backend --no-stream
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

# 检查 Supabase 服务状态
docker-compose ps | grep -E "(postgres|kong|rest)"
```

**方案3: 检查配置和视图**

```sql
-- 测试视图查询是否正常
SELECT COUNT(*) FROM v_rollover_configs_summary;
SELECT COUNT(*) FROM v_pending_rollover_tasks;

-- 如果视图查询失败,检查表是否存在
\dt rollover*
```

**方案4: 手动触发检查**

如果监控服务不工作,可以手动调用 API 触发换月检查:

```bash
# 调用换月检查 API (如果已实现)
curl -X POST http://localhost:8888/api/rollover/check
```

---

## 7. 换月通知未收到

### 症状

- 换月任务创建成功(数据库有记录)
- 未收到 ntfy 推送通知
- 任务执行完成但无通知
- 通知功能对所有服务都失效

### 可能原因

| 原因 | 说明 |
|------|------|
| NTFY_URL 未配置 | 环境变量缺失或错误 |
| ntfy 服务不可达 | 网络问题或服务宕机 |
| 通知发送超时 | 5秒超时未成功 |
| 通知阻塞事件循环 | 同步调用导致超时 |

### 排查步骤

```bash
# 1. 检查 NTFY_URL 环境变量
cat backend/.env | grep NTFY

# 2. 测试 ntfy 服务连通性
curl -X POST https://ntfy.zmddg.com/claude \
  -H "Title: 换月测试通知" \
  -d "这是一条换月测试消息"

# 3. 查看通知相关日志
docker-compose logs backend --tail=100 | grep -E "(notification|ntfy|通知)"

# 4. 检查任务是否创建成功
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, old_symbol, new_symbol, status, created_at
FROM rollover_tasks
ORDER BY created_at DESC LIMIT 5;
"
```

### 解决方案

**方案1: 配置 NTFY_URL**

在 `backend/.env` 中添加或修改:

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
  -d '{"title": "换月测试", "message": "测试消息"}'
```

**方案3: 检查网络连通性**

```bash
# 从容器内测试
docker-compose exec backend curl -v https://ntfy.zmddg.com/claude

# 检查 DNS 解析
docker-compose exec backend nslookup ntfy.zmddg.com
```

---

## 8. 快速诊断流程

遇到换月问题时,按以下顺序快速排查:

```
1. 检查服务状态
   ↓
2. 查看任务列表
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

# 2. 查看最近换月任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, old_symbol, new_symbol, direction,
       rollover_volume, status, error_message,
       created_at
FROM rollover_tasks
ORDER BY created_at DESC LIMIT 10;
"

# 3. 查看卡住的任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM rollover_tasks
WHERE status = 'executing'
  AND started_at < NOW() - INTERVAL '1 hour';
"

# 4. 查看活跃配置
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM v_rollover_configs_summary
WHERE is_enabled = true;
"

# 5. 查看后端日志
docker-compose logs backend --tail=50 | grep -E "(换月|rollover)"

# 6. 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"

# 7. 手动重置卡住的任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
UPDATE rollover_tasks
SET status = 'pending', started_at = NULL, error_message = '手动重置'
WHERE status = 'executing'
  AND started_at < NOW() - INTERVAL '1 hour';
"
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| 任务为空 | 监控未运行/配置未启用 | `v_rollover_configs_summary` |
| status='failed' | 执行接口未实现 | `error_message` 字段 |
| status='executing' 超时 | 服务中断/异常未捕获 | `started_at` 时间 |
| 无通知 | NTFY_URL 配置 | `.env` 文件 |
| 不触发 | 阈值/触发条件配置 | `rollover_configs` 配置 |
| 行情不足 | market_data 表/天勤连接 | 行情数据表 |

### 数据库表关系

```
rollover_configs (配置) ──┬──> rollover_tasks (任务)
                         │
                         └──> rollover_executions (执行详情)

main_contract_switches (主力切换记录) ──> 触发换月任务创建

v_rollover_configs_summary (视图) = rollover_configs + positions (联合查询)
v_pending_rollover_tasks (视图) = 待执行任务
```

### 关键字段说明

**rollover_configs 表**:
| 字段 | 说明 |
|------|------|
| `rollover_strategy` | auto/manual (策略类型) |
| `rollover_threshold` | 换月指数阈值 (默认 0.7) |
| `days_before_expiry` | 到期提前天数 |
| `rollover_ratio` | 换月比例 (0-1) |
| `auto_execute` | 是否自动执行 |
| `trigger_on_main_switch` | 主力切换触发 |

**rollover_tasks 表**:
| 字段 | 说明 |
|------|------|
| `status` | pending/executing/completed/failed |
| `trigger_type` | main_switch/expiry/manual |
| `rollover_volume` | 换月手数 |
| `error_message` | 失败原因 |
| `started_at` | 开始执行时间 |
| `completed_at` | 完成时间 |

---

## 已知限制

### 当前版本未实现的功能

1. **换月平仓接口** (`_close_old_position`)
   - 所有自动执行都会在平仓步骤失败
   - 需要手动在极星策略中执行平仓

2. **换月开仓接口** (`_open_new_position`)
   - 即使平仓成功,开仓也会失败
   - 需要手动在极星策略中执行开仓

3. **任务超时恢复机制**
   - 卡住的任务不会自动恢复
   - 需要手动重置或标记失败

4. **重复任务检测**
   - 可能创建重复的换月任务
   - 建议执行前检查是否已有相同任务

### 最佳实践建议

1. **配置建议**: 使用 `auto_execute = false` 手动确认模式,避免自动执行失败
2. **监控建议**: 定期检查 `rollover_tasks` 表的 executing 状态任务
3. **备用方案**: 在极星策略中配置换月提醒作为备用通知
4. **定期维护**: 每周检查并清理卡住的任务

---

## 相关文档

- [WebSocket 问题排查](./WEBSOCKET_FAQ.md)
- [锁仓触发问题排查](./LOCK_TRIGGER_FAQ.md)
- [项目 API 文档](http://localhost:8888/docs) - 后端接口说明

---

*最后更新: 2024-12-24*
