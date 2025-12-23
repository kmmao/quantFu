# 极星数据推送问题排查指南

本文档提供极星 (PolarStar) 策略数据推送失败的诊断步骤和解决方案，涵盖成交数据推送、持仓快照对账等常见问题。

---

## 目录

1. [成交数据推送失败 - 账户不存在](#1-成交数据推送失败---账户不存在)
2. [成交数据推送失败 - 数据库写入错误](#2-成交数据推送失败---数据库写入错误)
3. [成交数据推送失败 - 参数验证错误](#3-成交数据推送失败---参数验证错误)
4. [持仓对账不一致](#4-持仓对账不一致)
5. [极星策略无法连接后端](#5-极星策略无法连接后端)
6. [数据推送成功但前端不显示](#6-数据推送成功但前端不显示)
7. [持仓重建失败](#7-持仓重建失败)
8. [快速诊断流程](#8-快速诊断流程)

---

## 1. 成交数据推送失败 - 账户不存在

### 症状

- 极星策略推送成交数据返回 HTTP 404 错误
- 错误信息：`"Account not found: {account_id}"`
- 后端日志显示账户查询失败
- v12.py 策略报告推送失败

### 根本原因

后端 `/api/trades` 接口会根据 `account_id`（极星账户ID）查询 `accounts` 表：

```python
# backend/main.py lines 237-247
account_response = supabase.table("accounts")\
    .select("id")\
    .eq("polar_account_id", trade.account_id)\
    .single()\
    .execute()

if not account_response.data:
    raise HTTPException(
        status_code=404,
        detail=f"Account not found: {trade.account_id}"
    )
```

如果 `accounts` 表中没有对应的 `polar_account_id` 记录，会返回 404 错误。

### 排查步骤

```bash
# 1. 检查 accounts 表中已注册的账户
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, polar_account_id, account_name, broker_name, created_at
FROM accounts
ORDER BY created_at DESC;
"

# 2. 检查极星策略使用的账户ID
# 在 v12.py 中查看 ACCOUNT_ID 配置
grep -n "ACCOUNT_ID" polar/v12.py

# 3. 测试推送接口
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "85178443",
    "symbol": "TA2505",
    "direction": "long",
    "offset": "open",
    "volume": 1,
    "price": 5500.0,
    "order_id": "TEST001",
    "timestamp": "2024-12-24T10:00:00",
    "source": "polar"
  }' | jq

# 4. 检查后端日志
docker-compose logs backend --tail=50 | grep -E "(404|Account not found)"
```

### 解决方案

**方案1: 注册账户**

在数据库中添加极星账户记录：

```sql
-- 插入新账户
INSERT INTO accounts (polar_account_id, account_name, broker_name, is_active)
VALUES ('85178443', '主力账户', '中信期货', true);

-- 验证插入成功
SELECT * FROM accounts WHERE polar_account_id = '85178443';
```

**方案2: 修正极星策略配置**

确保 v12.py 中的 `ACCOUNT_ID` 与数据库中的 `polar_account_id` 一致：

```python
# polar/v12.py
ACCOUNT_ID = "85178443"  # 必须与 accounts 表中的 polar_account_id 一致
BACKEND_URL = "http://localhost:8888"
```

**方案3: 通过前端添加账户**

1. 访问 http://localhost:3000
2. 导航到 "账户管理" 页面
3. 点击 "添加账户"
4. 填写极星账户ID和名称

### 常见错误示例

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Account not found: 85178443` | 账户未注册 | 在 accounts 表中添加记录 |
| `Account not found: None` | account_id 未传递 | 检查 v12.py 推送代码 |
| `Account not found: ` | account_id 为空字符串 | 检查配置文件 |

---

## 2. 成交数据推送失败 - 数据库写入错误

### 症状

- 极星策略推送返回 HTTP 500 错误
- 账户存在但写入失败
- 错误信息包含数据库相关关键词
- 后端日志显示 `insert` 或 `execute` 失败

### 可能原因

| 原因 | 说明 |
|------|------|
| trades 表不存在 | 数据库迁移未执行 |
| 字段类型不匹配 | 数据格式与表结构不一致 |
| 约束冲突 | 重复的 order_id 或外键约束 |
| 数据库连接断开 | Supabase 服务异常 |
| RLS 策略拒绝 | 行级安全策略限制 |

### 排查步骤

```bash
# 1. 检查 trades 表是否存在
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\d trades"

# 2. 查看 trades 表结构
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trades'
ORDER BY ordinal_position;
"

# 3. 检查最近的成交记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM trades ORDER BY created_at DESC LIMIT 5;
"

# 4. 检查是否有约束冲突
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM trades WHERE order_id = 'ORDER123';
"

# 5. 检查 Supabase 服务状态
docker-compose ps | grep -E "(db|kong|rest)"

# 6. 查看详细后端日志
docker-compose logs backend --tail=100 | grep -E "(ERROR|Exception|trades)"
```

### 解决方案

**方案1: 运行数据库迁移**

```bash
# 使用 Supabase CLI
supabase db push

# 或手动执行 SQL 迁移
docker exec -it quantfu_postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql
```

**方案2: 修复重复 order_id**

如果是 order_id 重复导致的冲突：

```sql
-- 检查重复的 order_id
SELECT order_id, COUNT(*)
FROM trades
GROUP BY order_id
HAVING COUNT(*) > 1;

-- 删除重复记录（保留最新的）
DELETE FROM trades a
USING trades b
WHERE a.id < b.id
  AND a.order_id = b.order_id;
```

**方案3: 检查 RLS 策略**

```sql
-- 查看 trades 表的 RLS 状态
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'trades';

-- 临时禁用 RLS 测试
ALTER TABLE trades DISABLE ROW LEVEL SECURITY;

-- 测试后重新启用
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
```

**方案4: 重启数据库服务**

```bash
docker-compose restart db
sleep 10
docker-compose restart backend
```

---

## 3. 成交数据推送失败 - 参数验证错误

### 症状

- 极星策略推送返回 HTTP 422 Unprocessable Entity
- 响应包含 `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`
- 数据格式不符合 Pydantic 模型定义

### 根本原因

后端使用 Pydantic 模型验证请求数据：

```python
# backend/models/schemas.py
class TradeEvent(BaseModel):
    account_id: str           # 字符串，必填
    symbol: str               # 字符串，必填
    direction: str            # "long" 或 "short"
    offset: str               # "open" 或 "close"
    volume: int               # 整数，必填
    price: float              # 浮点数，必填
    order_id: str             # 字符串，必填
    timestamp: datetime       # ISO 格式时间，必填
    source: str = "polar"     # 字符串，默认 "polar"
```

### 排查步骤

```bash
# 1. 查看完整错误响应
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{"account_id": "test"}' | jq

# 2. 验证 JSON 格式
echo '{"account_id": "85178443", "symbol": "TA2505"}' | python -m json.tool

# 3. 查看 API 文档
# 访问 http://localhost:8888/docs 查看 TradeEvent 模型定义
```

### 解决方案

**方案1: 使用正确的请求格式**

成交数据推送正确格式：

```bash
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "85178443",
    "symbol": "TA2505",
    "direction": "long",
    "offset": "open",
    "volume": 1,
    "price": 5500.0,
    "order_id": "ORDER123",
    "timestamp": "2024-12-24T10:00:00",
    "source": "polar"
  }'
```

**方案2: 检查 v12.py 推送代码**

确保极星策略正确构造请求数据：

```python
# polar/v12.py 推送成交数据示例
import requests
from datetime import datetime

def push_trade(account_id, trade_info):
    data = {
        "account_id": str(account_id),          # 必须是字符串
        "symbol": trade_info["symbol"],          # 合约代码
        "direction": "long" if trade_info["direction"] == "买" else "short",
        "offset": "open" if trade_info["offset"] == "开仓" else "close",
        "volume": int(trade_info["volume"]),     # 必须是整数
        "price": float(trade_info["price"]),     # 必须是浮点数
        "order_id": str(trade_info["order_id"]), # 必须是字符串
        "timestamp": datetime.now().isoformat(), # ISO 格式
        "source": "polar"
    }

    response = requests.post(
        f"{BACKEND_URL}/api/trades",
        json=data,
        timeout=10
    )
    return response
```

### 常见验证错误

| 错误类型 | 原因 | 正确格式 |
|---------|------|---------|
| `value_error.missing` | 缺少必填字段 | 添加所有必填字段 |
| `type_error.integer` | volume 不是整数 | `"volume": 1` 而非 `"volume": "1"` |
| `type_error.float` | price 不是浮点数 | `"price": 5500.0` 而非 `"price": "5500"` |
| `value_error.datetime` | timestamp 格式错误 | 使用 ISO 格式 `"2024-12-24T10:00:00"` |
| `value_error.missing` | direction 拼写错误 | `"long"` 或 `"short"` |

---

## 4. 持仓对账不一致

### 症状

- 持仓快照推送返回 `{"matched": false}`
- `position_snapshots` 表中 `is_matched` 为 false
- 后端日志显示 "持仓对账不一致" 警告
- 前端显示的持仓与极星持仓不同

### 根本原因

后端会比较极星推送的持仓与根据成交记录计算的持仓：

```python
# backend/main.py lines 312-317
is_matched = (calculated_long == snapshot.long_position and
              calculated_short == snapshot.short_position)

if not is_matched:
    print(f"⚠️  持仓对账不一致: {snapshot.symbol}")
```

### 可能原因

| 原因 | 说明 |
|------|------|
| 成交记录丢失 | 部分成交未推送成功 |
| 成交记录重复 | 同一笔成交推送多次 |
| 初始持仓未导入 | 历史持仓未录入 |
| 手动平仓未记录 | 在极星外部进行的交易 |
| 计算逻辑错误 | positions 表计算方式问题 |

### 排查步骤

```bash
# 1. 查看最近的对账记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol,
       polar_long_position, calculated_long_position,
       polar_short_position, calculated_short_position,
       diff_long, diff_short, is_matched,
       timestamp
FROM position_snapshots
WHERE is_matched = false
ORDER BY timestamp DESC LIMIT 10;
"

# 2. 检查特定合约的成交记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT direction, offset, SUM(volume) as total_volume, COUNT(*) as trade_count
FROM trades
WHERE symbol = 'TA2505'
  AND account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
GROUP BY direction, offset
ORDER BY direction, offset;
"

# 3. 查看 positions 表计算的持仓
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, long_position, short_position, long_avg_price, short_avg_price
FROM positions
WHERE account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
  AND symbol = 'TA2505';
"

# 4. 检查是否有重复的成交记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT order_id, COUNT(*) as count
FROM trades
WHERE account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
GROUP BY order_id
HAVING COUNT(*) > 1;
"
```

### 解决方案

**方案1: 手动校正持仓**

如果差异较小，可以手动调整 positions 表：

```sql
-- 更新持仓数量以匹配极星
UPDATE positions
SET long_position = 10,
    short_position = 0,
    updated_at = NOW()
WHERE account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
  AND symbol = 'TA2505';
```

**方案2: 重新导入成交记录**

```sql
-- 清空该合约的成交记录并重新导入
DELETE FROM trades
WHERE account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
  AND symbol = 'TA2505';

-- 然后重启极星策略，让其重新推送成交
```

**方案3: 触发持仓重建**

```bash
# 调用持仓重建 API
curl -X POST "http://localhost:8888/api/positions/rebuild" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "85178443",
    "symbol": "TA2505"
  }'
```

**方案4: 添加初始持仓**

如果是历史持仓未导入，需要添加调整记录：

```sql
-- 插入调整成交记录
INSERT INTO trades (account_id, symbol, direction, offset, volume, price, order_id, timestamp, source)
VALUES (
    (SELECT id FROM accounts WHERE polar_account_id = '85178443'),
    'TA2505',
    'long',
    'open',
    10,        -- 需要补齐的多头持仓
    5500.0,    -- 估计的开仓价格
    'ADJUST_001',
    NOW(),
    'manual_adjustment'
);
```

### 对账差异分析

| 情况 | diff_long/diff_short | 可能原因 |
|------|---------------------|---------|
| 计算 > 极星 | 正数 | 成交记录多推送或平仓未记录 |
| 计算 < 极星 | 负数 | 成交记录丢失或初始持仓未导入 |
| 方向相反 | 一正一负 | 多空方向记录错误 |

---

## 5. 极星策略无法连接后端

### 症状

- v12.py 报告 `ConnectionError` 或 `ConnectTimeout`
- 错误信息包含 "Connection refused"
- 极星策略日志显示 HTTP 请求失败
- 后端服务正常但无法收到推送

### 可能原因

| 原因 | 说明 |
|------|------|
| 后端服务未启动 | Docker 容器未运行 |
| 端口配置错误 | 默认端口 8888 被修改 |
| 网络隔离 | Docker 网络配置问题 |
| 防火墙阻止 | 端口未开放 |
| URL 配置错误 | 极星策略中的 BACKEND_URL 不正确 |

### 排查步骤

```bash
# 1. 检查后端服务状态
docker-compose ps backend

# 2. 检查端口是否监听
netstat -tlnp | grep 8888
# 或
ss -tlnp | grep 8888

# 3. 测试本地连接
curl -v http://localhost:8888/health

# 4. 测试从极星策略主机连接
curl -v http://<backend_ip>:8888/health

# 5. 检查防火墙规则
iptables -L -n | grep 8888
# 或
firewall-cmd --list-ports

# 6. 检查 Docker 网络
docker network ls
docker network inspect quantfu_default
```

### 解决方案

**方案1: 启动后端服务**

```bash
# 启动所有服务
docker-compose up -d

# 等待服务启动
sleep 30

# 验证服务状态
docker-compose ps
curl http://localhost:8888/health
```

**方案2: 检查极星策略配置**

```python
# polar/v12.py
# 确保 BACKEND_URL 配置正确

# 本地开发环境
BACKEND_URL = "http://localhost:8888"

# Docker 容器内访问
BACKEND_URL = "http://backend:8888"

# 远程服务器
BACKEND_URL = "http://192.168.1.100:8888"
```

**方案3: 开放防火墙端口**

```bash
# Ubuntu/Debian
ufw allow 8888/tcp

# CentOS/RHEL
firewall-cmd --permanent --add-port=8888/tcp
firewall-cmd --reload
```

**方案4: 配置 Docker 网络**

如果极星策略在 Docker 外运行：

```yaml
# docker-compose.yml
backend:
  ports:
    - "8888:8888"  # 确保端口映射正确
```

如果极星策略在同一 Docker 网络：

```yaml
# docker-compose.yml
polar-strategy:
  networks:
    - quantfu_default

networks:
  quantfu_default:
    external: true
```

### 连接测试脚本

```python
# test_connection.py
import requests
import sys

BACKEND_URL = "http://localhost:8888"

def test_connection():
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"连接成功! 状态码: {response.status_code}")
        print(f"响应: {response.json()}")
        return True
    except requests.exceptions.ConnectionError as e:
        print(f"连接失败: {e}")
        return False
    except requests.exceptions.Timeout:
        print("连接超时")
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        BACKEND_URL = sys.argv[1]
    test_connection()
```

---

## 6. 数据推送成功但前端不显示

### 症状

- API 返回 200 成功
- 数据库中有记录
- 前端页面不显示新数据
- 需要刷新页面才能看到

### 可能原因

| 原因 | 说明 |
|------|------|
| 实时订阅未建立 | Supabase Realtime 问题 |
| 前端缓存 | React 状态未更新 |
| 数据过滤 | 前端查询条件不匹配 |
| WebSocket 断开 | 实时连接中断 |

### 排查步骤

```bash
# 1. 确认数据已写入数据库
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM trades ORDER BY created_at DESC LIMIT 5;
"

# 2. 检查 positions 表是否更新
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM positions WHERE updated_at > NOW() - INTERVAL '5 minutes';
"

# 3. 检查 Supabase Realtime 服务状态
docker-compose logs realtime --tail=20

# 4. 查看前端控制台是否有错误
# 打开浏览器开发者工具 -> Console

# 5. 检查 WebSocket 连接状态
# 打开浏览器开发者工具 -> Network -> WS
```

### 解决方案

**方案1: 刷新前端页面**

最简单的方式是刷新页面重新加载数据。

**方案2: 检查 Realtime 配置**

确保 Supabase Realtime 已启用：

```sql
-- 检查 publication 是否包含需要的表
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 添加表到 publication
ALTER PUBLICATION supabase_realtime ADD TABLE trades;
ALTER PUBLICATION supabase_realtime ADD TABLE positions;
```

**方案3: 重启 Realtime 服务**

```bash
docker-compose restart realtime
sleep 10
# 刷新前端页面
```

**方案4: 检查前端订阅代码**

```typescript
// frontend/lib/supabase-helpers.ts
// 确保订阅正确的表和事件
const channel = supabase
  .channel('positions-changes')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'positions' },
    (payload) => {
      console.log('Position changed:', payload);
      callback(payload);
    }
  )
  .subscribe();
```

**方案5: 使用 API 手动查询**

```bash
# 直接调用 API 获取最新数据
curl http://localhost:8888/api/positions/85178443 | jq
```

---

## 7. 持仓重建失败

### 症状

- 成交推送成功
- 持仓数据未更新
- 后端日志显示 "持仓重建失败"
- 浮盈计算不正确

### 根本原因

成交推送后会触发持仓重建：

```python
# backend/main.py line 267
await position_engine.rebuild_position(account_uuid, trade.symbol)
```

如果重建失败，持仓数据不会更新。

### 可能原因

| 原因 | 说明 |
|------|------|
| position_engine 未初始化 | 服务启动时初始化失败 |
| positions 表约束冲突 | 唯一约束或外键问题 |
| 计算逻辑异常 | 除零或空值访问 |
| 数据库连接断开 | 写入时连接已失效 |

### 排查步骤

```bash
# 1. 检查后端日志中的重建错误
docker-compose logs backend --tail=100 | grep -E "(rebuild|position|ERROR)"

# 2. 检查 positions 表结构
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\d positions"

# 3. 检查是否有约束冲突
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'positions'::regclass;
"

# 4. 手动触发重建
curl -X POST "http://localhost:8888/api/positions/rebuild" \
  -H "Content-Type: application/json" \
  -d '{"account_id": "85178443", "symbol": "TA2505"}'
```

### 解决方案

**方案1: 重启后端服务**

```bash
docker-compose restart backend
sleep 10
docker-compose logs backend --tail=20
```

**方案2: 手动重建持仓**

```sql
-- 清空并重建特定合约的持仓
DELETE FROM positions
WHERE account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
  AND symbol = 'TA2505';

-- 重新计算持仓（根据 trades 表）
INSERT INTO positions (account_id, symbol, long_position, short_position, long_avg_price, short_avg_price)
SELECT
    account_id,
    symbol,
    COALESCE(SUM(CASE WHEN direction = 'long' AND offset = 'open' THEN volume
                      WHEN direction = 'long' AND offset = 'close' THEN -volume
                      ELSE 0 END), 0) as long_position,
    COALESCE(SUM(CASE WHEN direction = 'short' AND offset = 'open' THEN volume
                      WHEN direction = 'short' AND offset = 'close' THEN -volume
                      ELSE 0 END), 0) as short_position,
    0 as long_avg_price,  -- 需要更复杂的计算
    0 as short_avg_price
FROM trades
WHERE account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
  AND symbol = 'TA2505'
GROUP BY account_id, symbol;
```

**方案3: 检查 position_engine 状态**

```bash
# 查看 position_engine 是否正常初始化
docker-compose logs backend | grep -i "position_engine"
```

---

## 8. 快速诊断流程

遇到极星数据推送问题时，按以下顺序快速排查：

```
1. 检查后端服务状态
   ↓
2. 测试网络连通性
   ↓
3. 验证账户配置
   ↓
4. 检查请求格式
   ↓
5. 查看数据库记录
   ↓
6. 分析错误日志
```

### 诊断命令速查

```bash
# 1. 检查服务状态
docker-compose ps
curl http://localhost:8888/health | jq

# 2. 测试推送接口
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{"account_id": "85178443", "symbol": "TEST", "direction": "long", "offset": "open", "volume": 1, "price": 100.0, "order_id": "TEST001", "timestamp": "2024-12-24T10:00:00", "source": "test"}' | jq

# 3. 检查账户是否存在
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT polar_account_id, account_name FROM accounts;
"

# 4. 检查最近成交记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM trades ORDER BY created_at DESC LIMIT 5;
"

# 5. 检查持仓对账状态
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT symbol, is_matched, diff_long, diff_short, timestamp
FROM position_snapshots
ORDER BY timestamp DESC LIMIT 5;
"

# 6. 查看后端错误日志
docker-compose logs backend --tail=50 | grep -E "(ERROR|Exception|404|500)"
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| HTTP 404 | 账户不存在 | accounts 表 |
| HTTP 422 | 参数格式错误 | 请求 JSON 格式 |
| HTTP 500 | 数据库/服务器错误 | 后端日志 |
| 连接超时 | 网络/服务问题 | 服务状态和端口 |
| 对账不一致 | 成交记录问题 | trades 表完整性 |
| 前端不显示 | 实时订阅问题 | Realtime 服务 |

### 极星数据推送 API 清单

| 端点 | 方法 | 说明 | 请求体 |
|------|------|------|--------|
| `/api/trades` | POST | 推送成交数据 | TradeEvent |
| `/api/position_snapshots` | POST | 推送持仓快照 | PositionSnapshot |
| `/api/positions/{account_id}` | GET | 查询持仓 | - |
| `/api/positions/rebuild` | POST | 手动重建持仓 | account_id, symbol |

### TradeEvent 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `account_id` | string | ✅ | 极星账户ID |
| `symbol` | string | ✅ | 合约代码 |
| `direction` | string | ✅ | "long" 或 "short" |
| `offset` | string | ✅ | "open" 或 "close" |
| `volume` | int | ✅ | 成交数量 |
| `price` | float | ✅ | 成交价格 |
| `order_id` | string | ✅ | 订单ID |
| `timestamp` | datetime | ✅ | ISO 格式时间 |
| `source` | string | ⚪ | 默认 "polar" |

### PositionSnapshot 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `account_id` | string | ✅ | 极星账户ID |
| `symbol` | string | ✅ | 合约代码 |
| `long_position` | int | ✅ | 多头持仓 |
| `short_position` | int | ✅ | 空头持仓 |
| `long_avg_price` | float | ✅ | 多头均价 |
| `short_avg_price` | float | ✅ | 空头均价 |
| `long_profit` | float | ✅ | 多头浮盈 |
| `short_profit` | float | ✅ | 空头浮盈 |
| `timestamp` | datetime | ✅ | ISO 格式时间 |

---

## 已知限制

### 当前版本的设计限制

1. **账户查找每次执行**
   - 每次推送都需要查询 accounts 表
   - 建议缓存账户 ID 映射

2. **持仓重建同步执行**
   - 成交推送后同步重建持仓
   - 大量成交时可能影响性能

3. **无推送队列**
   - 推送失败不会自动重试
   - 需要极星策略自行处理重试

4. **对账仅做记录**
   - 对账不一致只记录日志
   - 不会自动修复差异

### 最佳实践建议

1. **推送前检查账户**
   - 确保账户已在 accounts 表注册
   - 在极星策略启动时验证连接

2. **添加重试机制**
   ```python
   # v12.py 推送重试示例
   import time

   def push_with_retry(data, max_retries=3):
       for i in range(max_retries):
           try:
               response = requests.post(f"{BACKEND_URL}/api/trades", json=data, timeout=10)
               if response.status_code == 200:
                   return True
           except Exception as e:
               print(f"推送失败 (尝试 {i+1}/{max_retries}): {e}")
               time.sleep(2 ** i)  # 指数退避
       return False
   ```

3. **定期对账**
   - 每 10 分钟推送持仓快照
   - 发现不一致时及时处理

4. **监控推送状态**
   - 记录每次推送的结果
   - 统计成功率和失败原因

---

## 相关文档

- [后端服务问题排查](./BACKEND_FAQ.md)
- [WebSocket 问题排查](./WEBSOCKET_FAQ.md)
- [天勤行情问题排查](./TQSDK_FAQ.md)
- [API 文档](http://localhost:8888/docs) - Swagger UI

---

*最后更新: 2024-12-24*
