# 后端服务问题排查指南

本文档提供后端服务启动失败、API 报错相关问题的诊断步骤和解决方案，涵盖环境配置、数据库连接和 API 调用问题。

---

## 目录

1. [服务启动失败 - 环境变量缺失](#1-服务启动失败---环境变量缺失)
2. [服务启动失败 - 数据库连接失败](#2-服务启动失败---数据库连接失败)
3. [API 返回 500 错误](#3-api-返回-500-错误)
4. [API 返回 404 - 账户不存在](#4-api-返回-404---账户不存在)
5. [API 返回 422 - 参数验证失败](#5-api-返回-422---参数验证失败)
6. [API 响应缓慢或超时](#6-api-响应缓慢或超时)
7. [健康检查接口异常](#7-健康检查接口异常)
8. [快速诊断流程](#8-快速诊断流程)

---

## 1. 服务启动失败 - 环境变量缺失

### 症状

- 后端服务启动后立即退出
- 日志显示 `ValidationError` 或 `pydantic` 相关错误
- Docker 容器状态为 `Exited`
- 错误信息包含 "field required" 或 "value is not a valid"

### 根本原因

`backend/config.py` 使用 Pydantic Settings 进行配置管理，以下字段为必填：

```python
# backend/config.py
class Settings(BaseSettings):
    supabase_url: str = "http://localhost:8000"
    supabase_key: str          # 必填，无默认值
    database_url: str          # 必填，无默认值
    tqsdk_account: Optional[str] = None
    tqsdk_password: Optional[str] = None
```

如果 `.env` 文件缺少必填字段，服务启动时会抛出 `ValidationError`。

### 排查步骤

```bash
# 1. 检查容器状态
docker-compose ps

# 2. 查看后端服务日志
docker-compose logs backend --tail=50

# 3. 检查 .env 文件是否存在
ls -la backend/.env

# 4. 检查必填环境变量
cat backend/.env | grep -E "(SUPABASE_KEY|DATABASE_URL)"

# 5. 验证环境变量格式
docker-compose exec backend env | grep -E "(SUPABASE|DATABASE)"
```

### 解决方案

**方案1: 补全 .env 文件**

在 `backend/.env` 中添加必填配置：

```env
# Supabase 配置 (必填)
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=your-supabase-anon-key

# 数据库配置 (必填)
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/postgres

# 天勤配置 (可选)
TQSDK_ACCOUNT=your-tqsdk-account
TQSDK_PASSWORD=your-tqsdk-password

# 通知配置 (可选)
NTFY_URL=https://ntfy.sh/your-topic
```

**方案2: 从 Docker Compose 注入环境变量**

在 `docker-compose.yml` 中配置：

```yaml
backend:
  environment:
    - SUPABASE_URL=http://kong:8000
    - SUPABASE_KEY=${SUPABASE_ANON_KEY}
    - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
```

**方案3: 验证配置是否正确**

```bash
# 进入容器测试配置加载
docker-compose run --rm backend python -c "from config import settings; print(settings)"

# 如果成功，会打印配置信息
# 如果失败，会显示具体的 ValidationError
```

### 常见错误示例

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `supabase_key field required` | SUPABASE_KEY 未设置 | 在 .env 中添加 |
| `database_url field required` | DATABASE_URL 未设置 | 在 .env 中添加 |
| `value is not a valid integer` | PORT 格式错误 | 确保是数字格式 |

---

## 2. 服务启动失败 - 数据库连接失败

### 症状

- 服务启动但日志显示 "Database connection failed"
- 健康检查接口返回 `"database": "error"`
- API 调用返回 500 错误
- 日志显示 `connection refused` 或 `timeout`

### 可能原因

| 原因 | 说明 |
|------|------|
| Supabase 服务未启动 | Kong/PostgREST/PostgreSQL 容器未运行 |
| 网络配置错误 | Docker 网络不通或 URL 配置错误 |
| 认证失败 | SUPABASE_KEY 无效或过期 |
| 数据库未初始化 | 缺少必要的表和视图 |
| 连接池耗尽 | 并发请求过多 |

### 排查步骤

```bash
# 1. 检查所有 Supabase 服务状态
docker-compose ps | grep -E "(db|kong|rest|auth)"

# 2. 测试数据库直接连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"

# 3. 测试 Supabase REST API
curl -v http://localhost:8000/rest/v1/ \
  -H "apikey: your-supabase-anon-key"

# 4. 检查 PostgREST 日志
docker-compose logs rest --tail=50

# 5. 检查后端到数据库的网络连通性
docker-compose exec backend ping db

# 6. 验证 accounts 表是否存在
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\dt accounts"
```

### 解决方案

**方案1: 重启 Supabase 服务**

```bash
# 重启所有服务
docker-compose down
docker-compose up -d

# 等待服务完全启动后再启动后端
sleep 30
docker-compose logs backend --tail=10
```

**方案2: 修正 Supabase URL**

确保 `SUPABASE_URL` 指向正确的地址：

```env
# 容器内访问使用服务名
SUPABASE_URL=http://kong:8000

# 本地开发使用 localhost
SUPABASE_URL=http://localhost:8000
```

**方案3: 检查 Supabase Key**

```bash
# 从 Supabase 容器获取正确的 key
docker-compose exec kong cat /var/run/secrets/anon_key

# 或查看 .env.example 中的默认值
cat .env.example | grep ANON_KEY
```

**方案4: 初始化数据库**

```bash
# 运行数据库迁移
docker exec -it quantfu_postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql

# 或使用 supabase CLI
supabase db push
```

**方案5: 检查连接池状态**

```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看连接详情
SELECT datname, usename, client_addr, state
FROM pg_stat_activity
WHERE datname = 'postgres';

-- 如果连接数过高，重启服务释放连接
```

---

## 3. API 返回 500 错误

### 症状

- API 调用返回 HTTP 500 Internal Server Error
- 响应体只有 `{"detail": "错误信息"}`
- 前端显示 "服务器内部错误"

### 可能原因

当前后端的异常处理模式会将所有未捕获的异常转换为 500 错误：

```python
# backend/main.py 通用异常处理模式
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```

常见触发原因：

| 原因 | 说明 |
|------|------|
| 数据库查询失败 | 表不存在/字段不存在/权限不足 |
| 外部服务不可用 | 天勤/ntfy 服务连接失败 |
| 数据格式错误 | 返回数据无法序列化 |
| 业务逻辑异常 | 除零/空值访问等 |

### 排查步骤

```bash
# 1. 查看完整的后端日志
docker-compose logs backend --tail=100 | grep -E "(ERROR|Exception|Traceback)"

# 2. 开启详细日志级别
docker-compose exec backend python -c "import logging; logging.basicConfig(level=logging.DEBUG)"

# 3. 使用 curl 测试具体接口
curl -v http://localhost:8888/api/positions/85178443

# 4. 检查返回的错误详情
curl -s http://localhost:8888/api/kline/INVALID.SYMBOL | jq

# 5. 查看 Supabase REST API 日志
docker-compose logs rest --tail=50
```

### 解决方案

**方案1: 根据错误信息定位问题**

常见错误信息及解决方案：

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `relation "xxx" does not exist` | 表/视图不存在 | 运行数据库迁移 |
| `column "xxx" does not exist` | 字段不存在 | 检查数据库 schema |
| `permission denied` | RLS 策略限制 | 检查 Supabase 权限配置 |
| `NoneType has no attribute` | 空值访问 | 检查前置数据是否存在 |
| `connection refused` | 外部服务不可用 | 检查服务状态 |

**方案2: 检查数据库表结构**

```bash
# 列出所有表
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\dt"

# 检查特定表结构
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\d accounts"

# 列出所有视图
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\dv"
```

**方案3: 检查视图是否正常**

```sql
-- 测试常用视图
SELECT COUNT(*) FROM v_positions_summary;
SELECT COUNT(*) FROM v_active_lock_configs;
SELECT COUNT(*) FROM v_rollover_task_summary;

-- 如果视图查询失败，可能需要重建
-- 参考 supabase/migrations/ 目录
```

**方案4: 检查 RLS 策略**

```sql
-- 查看 RLS 状态
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 临时禁用 RLS 进行测试
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;
```

---

## 4. API 返回 404 - 账户不存在

### 症状

- API 返回 `{"detail": "Account not found: xxx"}`
- 使用极星账户 ID 但找不到对应记录
- 持仓、成交等接口都返回 404

### 可能原因

| 原因 | 说明 |
|------|------|
| 账户未注册 | accounts 表中没有该账户记录 |
| ID 格式错误 | 使用了 UUID 而不是 polar_account_id |
| 数据被删除 | 账户记录已删除 |

### 排查步骤

```bash
# 1. 查看所有已注册账户
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT id, polar_account_id, account_name, created_at
FROM accounts;
"

# 2. 搜索特定账户
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT * FROM accounts
WHERE polar_account_id = '85178443'
   OR account_name LIKE '%85178443%';
"

# 3. 检查 API 使用的是哪个字段
curl http://localhost:8888/api/positions/85178443
```

### 解决方案

**方案1: 注册账户**

```sql
-- 插入新账户
INSERT INTO accounts (polar_account_id, account_name, broker_name)
VALUES ('85178443', '测试账户', '中信期货');
```

**方案2: 使用正确的 ID**

API 使用的是 `polar_account_id`（极星账户ID），不是数据库的 UUID：

```bash
# 正确：使用极星账户ID
curl http://localhost:8888/api/positions/85178443

# 错误：使用 UUID
curl http://localhost:8888/api/positions/550e8400-e29b-41d4-a716-446655440000
```

**方案3: 检查账户关联**

```sql
-- 检查账户是否有关联数据
SELECT
    a.polar_account_id,
    (SELECT COUNT(*) FROM positions WHERE account_id = a.id) as positions,
    (SELECT COUNT(*) FROM trades WHERE account_id = a.id) as trades
FROM accounts a;
```

---

## 5. API 返回 422 - 参数验证失败

### 症状

- API 返回 HTTP 422 Unprocessable Entity
- 响应包含 `{"detail": [{"loc": [...], "msg": "...", "type": "..."}]}`
- POST/PUT 请求被拒绝

### 可能原因

FastAPI 使用 Pydantic 进行参数验证，常见验证失败原因：

| 错误类型 | 说明 |
|---------|------|
| `value_error.missing` | 缺少必填字段 |
| `type_error.integer` | 类型不匹配 |
| `value_error.any_str.min_length` | 字符串太短 |
| `value_error.number.not_gt` | 数值超出范围 |

### 排查步骤

```bash
# 1. 查看完整的错误响应
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# 2. 查看 API 文档了解参数要求
# 访问 http://localhost:8888/docs

# 3. 检查请求体格式
echo '{"account_id": "test"}' | python -m json.tool
```

### 解决方案

**方案1: 查看 API 文档**

访问 Swagger UI 查看接口参数要求：

```
http://localhost:8888/docs
```

**方案2: 参照正确的请求格式**

成交推送 `/api/trades` 示例：

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

持仓快照 `/api/position_snapshots` 示例：

```bash
curl -X POST http://localhost:8888/api/position_snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "85178443",
    "symbol": "TA2505",
    "long_position": 10,
    "short_position": 0,
    "long_avg_price": 5500.0,
    "short_avg_price": 0,
    "long_profit": 1000.0,
    "short_profit": 0,
    "timestamp": "2024-12-24T10:00:00"
  }'
```

**方案3: 检查数据类型**

```python
# models/schemas.py 中定义的字段类型
class TradeEvent(BaseModel):
    account_id: str           # 字符串
    symbol: str               # 字符串
    direction: str            # "long" 或 "short"
    offset: str               # "open" 或 "close"
    volume: int               # 整数
    price: float              # 浮点数
    order_id: str             # 字符串
    timestamp: datetime       # ISO 格式时间
    source: str = "polar"     # 默认值
```

---

## 6. API 响应缓慢或超时

### 症状

- API 请求响应时间超过 10 秒
- 前端显示 "请求超时"
- Nginx 返回 504 Gateway Timeout
- 后端日志无明显错误

### 可能原因

| 原因 | 说明 |
|------|------|
| 数据库查询慢 | 无索引/大数据量/复杂查询 |
| 天勤 API 阻塞 | K线/行情接口等待数据 |
| 同步阻塞调用 | notification.py 使用 requests.post |
| 资源不足 | CPU/内存使用过高 |

### 排查步骤

```bash
# 1. 检查系统资源
docker stats

# 2. 测试各个接口响应时间
time curl http://localhost:8888/health
time curl http://localhost:8888/api/contracts
time curl http://localhost:8888/api/kline/CZCE.TA2505

# 3. 检查数据库慢查询
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND query_start < now() - interval '5 seconds';
"

# 4. 检查健康检查详情
curl http://localhost:8888/health/detailed | jq
```

### 解决方案

**方案1: 添加数据库索引**

```sql
-- 常用查询的索引
CREATE INDEX IF NOT EXISTS idx_trades_account_symbol
ON trades(account_id, symbol);

CREATE INDEX IF NOT EXISTS idx_positions_account
ON positions(account_id);

CREATE INDEX IF NOT EXISTS idx_lock_triggers_status
ON lock_triggers(execution_status);
```

**方案2: 检查天勤连接**

```bash
# 如果 K线接口慢，可能是天勤连接问题
curl http://localhost:8888/health/detailed | jq '.components.tqsdk'

# 检查天勤是否已配置
cat backend/.env | grep TQSDK
```

**方案3: 增加超时配置**

在 `docker-compose.yml` 中配置 Nginx 超时：

```yaml
nginx:
  environment:
    - PROXY_READ_TIMEOUT=120s
    - PROXY_CONNECT_TIMEOUT=60s
```

**方案4: 监控资源使用**

```bash
# 查看 CPU/内存使用
docker-compose exec backend top

# 如果资源不足，增加 Docker 资源限制
docker-compose up -d --scale backend=2
```

---

## 7. 健康检查接口异常

### 症状

- `/health` 返回 `"status": "unhealthy"`
- `/health/detailed` 显示警告信息
- Docker 健康检查失败导致容器重启
- 监控系统告警

### 健康检查响应解读

```json
{
  "status": "healthy",       // healthy/degraded/unhealthy
  "timestamp": "...",
  "components": {
    "database": {"status": "ok"},    // ok/error
    "tqsdk": {"status": "configured"}  // configured/not_configured
  },
  "metrics": {
    "accounts": 5,
    "positions": 20,
    "latest_trade": "2024-12-24T10:00:00Z"
  },
  "warnings": [],            // 警告列表
  "system": {
    "cpu_percent": 15.2,
    "memory_percent": 45.0
  }
}
```

### 常见警告及解决方案

| 警告信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Database connection failed` | 数据库不可用 | 检查 PostgreSQL 服务 |
| `TqSDK not configured` | 天勤未配置 | 添加 TQSDK 环境变量 |
| `No trades in the last hour` | 无成交数据 | 正常（非交易时段）或检查数据推送 |
| `High CPU usage: 85%` | CPU 使用过高 | 检查是否有死循环或优化代码 |
| `High memory usage: 90%` | 内存不足 | 增加内存或检查内存泄漏 |
| `High disk usage: 95%` | 磁盘空间不足 | 清理日志/数据或扩容 |

### 排查步骤

```bash
# 1. 获取详细健康状态
curl http://localhost:8888/health/detailed | jq

# 2. 检查各组件状态
curl http://localhost:8888/health/detailed | jq '.components'

# 3. 查看警告列表
curl http://localhost:8888/health/detailed | jq '.warnings'

# 4. 检查系统资源
curl http://localhost:8888/health/detailed | jq '.system'
```

### 解决方案

**方案1: 修复数据库连接**

参考 [服务启动失败 - 数据库连接失败](#2-服务启动失败---数据库连接失败)

**方案2: 配置天勤（可选）**

如果不需要天勤行情功能，可以忽略此警告。如需配置：

```env
# backend/.env
TQSDK_ACCOUNT=your-account
TQSDK_PASSWORD=your-password
```

**方案3: 清理磁盘空间**

```bash
# 清理 Docker 无用资源
docker system prune -a --volumes

# 清理日志
docker-compose logs --tail=0 > /dev/null
truncate -s 0 /var/lib/docker/containers/*/*-json.log
```

**方案4: 增加资源限制**

```yaml
# docker-compose.yml
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '0.5'
        memory: 512M
```

---

## 8. 快速诊断流程

遇到后端问题时，按以下顺序快速排查：

```
1. 检查服务状态
   ↓
2. 查看启动日志
   ↓
3. 测试健康检查
   ↓
4. 检查数据库连接
   ↓
5. 查看详细错误日志
```

### 诊断命令速查

```bash
# 1. 检查所有服务状态
docker-compose ps

# 2. 查看后端启动日志
docker-compose logs backend --tail=30

# 3. 基础健康检查
curl http://localhost:8888/health | jq

# 4. 详细健康检查
curl http://localhost:8888/health/detailed | jq

# 5. 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"

# 6. 查看错误日志
docker-compose logs backend 2>&1 | grep -E "(ERROR|Exception|failed)"

# 7. 检查环境变量
cat backend/.env | grep -E "(SUPABASE|DATABASE)"
```

### 问题定位表

| 现象 | 可能问题 | 首先检查 |
|------|---------|---------|
| 容器 Exited | 环境变量缺失 | `.env` 文件 |
| health unhealthy | 数据库连接失败 | Supabase 服务状态 |
| 所有 API 500 | 数据库/表不存在 | 数据库迁移状态 |
| 特定 API 404 | 账户/数据不存在 | accounts 表数据 |
| 请求超时 | 慢查询/资源不足 | `docker stats` |
| 422 错误 | 参数格式错误 | API 文档 |

### 环境变量清单

**必填环境变量：**

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `SUPABASE_KEY` | Supabase 匿名密钥 | `eyJhbGciOiJIUzI1...` |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://postgres:xxx@db:5432/postgres` |

**可选环境变量：**

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SUPABASE_URL` | Supabase API 地址 | `http://localhost:8000` |
| `TQSDK_ACCOUNT` | 天勤账号 | 无 |
| `TQSDK_PASSWORD` | 天勤密码 | 无 |
| `NTFY_URL` | 通知服务地址 | `https://ntfy.zmddg.com/claude` |
| `HOST` | 服务监听地址 | `0.0.0.0` |
| `PORT` | 服务监听端口 | `8888` |

### 常用 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 服务信息 |
| `/health` | GET | 基础健康检查 |
| `/health/detailed` | GET | 详细健康检查 |
| `/docs` | GET | API 文档 (Swagger UI) |
| `/api/trades` | POST | 接收成交数据 |
| `/api/position_snapshots` | POST | 接收持仓快照 |
| `/api/positions/{account_id}` | GET | 查询持仓 |

---

## 已知限制

### 当前版本的设计限制

1. **通用异常处理**
   - 所有未捕获异常返回 500
   - 错误信息可能不够详细
   - 建议开启 DEBUG 日志查看完整堆栈

2. **无连接池管理**
   - Supabase 客户端使用单例模式
   - 高并发时可能出现连接问题
   - 建议限制并发请求数

3. **部分接口无 Pydantic 验证**
   - 锁仓配置等接口使用 `dict` 类型
   - 参数验证不如严格
   - 需要调用方确保数据格式正确

4. **同步阻塞调用**
   - `notification.py` 使用 `requests.post`
   - 可能阻塞事件循环
   - 通知发送超时 5 秒

### 最佳实践建议

1. **启动前检查清单**
   - 确认 `.env` 文件存在且完整
   - 确认 Supabase 服务已启动
   - 确认数据库迁移已执行

2. **监控建议**
   - 定期调用 `/health/detailed`
   - 监控 CPU/内存使用
   - 关注警告信息

3. **日志建议**
   - 开发环境开启 DEBUG 级别
   - 生产环境使用 INFO 级别
   - 保留最近 7 天日志

---

## 相关文档

- [WebSocket 问题排查](./WEBSOCKET_FAQ.md)
- [锁仓触发问题排查](./LOCK_TRIGGER_FAQ.md)
- [换月任务问题排查](./ROLLOVER_FAQ.md)
- [天勤行情问题排查](./TQSDK_FAQ.md)
- [极星数据推送问题排查](./POLAR_DATA_PUSH_FAQ.md)
- [通知服务问题排查](./NOTIFICATION_FAQ.md)
- [API 文档](http://localhost:8888/docs) - Swagger UI

---

*最后更新: 2025-12-24*
