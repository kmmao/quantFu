# QuantFu 后端 API 服务指南

> QuantFu 期货交易管理平台的后端 API 服务,基于 FastAPI 构建,提供持仓管理、锁仓策略、换月管理等核心功能

**⚠️ 本文档由 AI 生成 - 最后更新: 2025-12-18**

---

## 📌 模块职责

QuantFu 后端是一个基于 FastAPI 的 RESTful API 服务,负责:

**职责范围:**
- 接收极星量化策略推送的成交数据和持仓快照
- 根据成交记录重建和维护持仓状态
- 提供持仓查询、K线数据、实时行情等 API
- 管理锁仓配置和触发执行
- 处理合约信息同步和主力合约识别
- 管理策略参数的远程配置
- 处理换月任务的监控和执行
- 支持多策略协同和资源分配

**不在范围:**
- 不负责下单执行(由极星量化策略负责)
- 不提供前端页面(前端是独立的 Next.js 应用)
- 不进行策略回测(由极星平台负责)
- 不直接连接期货交易所(通过极星和天勤 SDK)

---

## 📁 文件结构

```
backend/
├── .claude/
│   └── guide.md          # 本文档
├── main.py               # FastAPI 主应用(1880行)
├── config.py             # 配置管理
├── requirements.txt      # Python 依赖
├── .env.example          # 环境变量示例
├── models/
│   ├── __init__.py
│   ├── schemas.py        # Pydantic 数据模型
│   └── .claude/guide.md  # 数据模型文档
├── services/             # 业务服务层
│   ├── __init__.py
│   ├── contract_service.py        # 合约管理
│   ├── kline_service.py          # K线数据
│   ├── lock_trigger_service.py   # 锁仓触发
│   ├── multi_strategy_service.py # 多策略管理
│   ├── rollover_service.py       # 换月管理
│   ├── rollover_monitor.py       # 换月监控
│   ├── strategy_param_service.py # 策略参数
│   ├── tqsdk_service.py          # 天勤服务
│   └── .claude/guide.md          # 服务层文档
├── engines/              # 核心计算引擎
│   ├── __init__.py
│   ├── position_engine.py        # 持仓计算引擎
│   ├── lock_engine.py            # 锁仓执行引擎
│   └── .claude/guide.md          # 引擎文档
├── utils/                # 工具函数
│   ├── __init__.py
│   ├── db.py                     # 数据库连接
│   ├── contract_mapper.py        # 合约格式转换
│   ├── notification.py           # 消息通知
│   └── .claude/guide.md          # 工具文档
└── api/                  # (保留目录,暂未使用)
```

### 核心文件说明

- **main.py**: FastAPI 主应用,包含所有 API 路由定义(1880行)
- **config.py**: 基于 Pydantic Settings 的配置管理
- **models/schemas.py**: 所有 Pydantic 数据模型定义
- **engines/**: 核心业务逻辑引擎(持仓计算、锁仓执行)
- **services/**: 业务服务层,封装具体功能模块
- **utils/**: 通用工具函数(数据库、格式转换、通知)

---

## ⚙️ 核心架构

### 1. 技术栈

| 技术 | 版本 | 用途 |
|-----|------|-----|
| Python | 3.10+ | 编程语言 |
| FastAPI | 0.109.0 | Web 框架 |
| Uvicorn | 0.27.0 | ASGI 服务器 |
| Supabase | 2.3.0 | PostgreSQL 数据库客户端 |
| TqSDK | 3.6.2 | 天勤量化 SDK(行情数据) |
| Pydantic | 2.5.3 | 数据验证和模型 |
| SQLAlchemy | 2.0.25 | ORM(备用) |

### 2. 架构分层

```
┌─────────────────────────────────────────────┐
│         API Layer (FastAPI Routes)         │
│  main.py - 所有 HTTP 接口定义              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Service Layer (业务服务)           │
│  contract_service, kline_service,          │
│  strategy_param_service, etc.              │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Engine Layer (计算引擎)             │
│  position_engine - 持仓计算                 │
│  lock_engine - 锁仓执行                     │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Data Layer (数据访问)               │
│  utils/db.py - Supabase 客户端             │
│  PostgreSQL 数据库                          │
└─────────────────────────────────────────────┘
```

### 3. 数据流

#### 成交数据流(极星 → 后端)
```
极星策略 → POST /api/trades → PositionEngine
                              ↓
                         重建持仓 → Supabase
```

#### 持仓查询流
```
前端/客户端 → GET /api/positions/{account_id}
              ↓
         查询 v_positions_summary 视图 → 返回持仓列表
```

#### K线数据流
```
前端 → GET /api/kline/{symbol}
       ↓
   KlineService → TqSDK API → 返回 K线数据
```

---

## 🔗 API 路由总览

### 健康检查

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/` | 根路径,返回服务信息 |
| GET | `/health` | 基础健康检查 |
| GET | `/health/detailed` | 详细健康检查(含系统指标) |

### 极星数据接收

| 方法 | 路径 | 说明 |
|-----|------|-----|
| POST | `/api/trades` | 接收成交数据 |
| POST | `/api/position_snapshots` | 接收持仓快照(对账) |

### 持仓管理

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/positions/{account_polar_id}` | 获取账户所有持仓 |
| POST | `/api/positions/rebuild/{account_polar_id}/{symbol}` | 手动触发持仓重建 |

### 合约管理

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/contracts` | 获取所有合约 |
| GET | `/api/contracts/list` | 获取合约列表(带筛选) |
| GET | `/api/contracts/main` | 获取主力合约 |
| GET | `/api/contracts/expiring` | 获取即将到期合约 |
| GET | `/api/contracts/convert/polar-to-tqsdk` | 合约格式转换 |
| POST | `/api/contracts/sync/{symbol}` | 同步单个合约 |
| POST | `/api/contracts/sync-variety/{exchange}/{variety_code}` | 同步品种合约 |
| GET | `/api/contracts/main-switches` | 主力合约切换历史 |
| GET | `/api/contracts/expiry-alerts` | 到期提醒配置 |
| POST | `/api/contracts/expiry-alerts` | 创建到期提醒 |
| PUT | `/api/contracts/expiry-alerts/{alert_id}` | 更新到期提醒 |
| DELETE | `/api/contracts/expiry-alerts/{alert_id}` | 删除到期提醒 |
| POST | `/api/contracts/calculate-margin` | 计算保证金 |

### 锁仓管理

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/lock/configs` | 获取锁仓配置 |
| POST | `/api/lock/configs` | 创建锁仓配置 |
| PUT | `/api/lock/configs/{config_id}` | 更新锁仓配置 |
| DELETE | `/api/lock/configs/{config_id}` | 删除锁仓配置 |
| GET | `/api/lock/triggers` | 获取锁仓触发记录 |
| POST | `/api/lock/execute/{trigger_id}` | 手动执行锁仓 |
| GET | `/api/lock/executions` | 获取锁仓执行历史 |

### K线和行情

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/kline/{symbol}` | 获取K线数据 |
| GET | `/api/kline/{symbol}/with-positions` | K线+持仓标记 |
| GET | `/api/quote/{symbol}` | 获取实时行情 |

### 策略参数管理

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/strategies` | 获取策略列表 |
| POST | `/api/strategies` | 创建策略定义 |
| GET | `/api/strategies/{strategy_id}/params` | 获取参数定义 |
| POST | `/api/strategies/{strategy_id}/params` | 添加参数定义 |
| GET | `/api/strategy-instances` | 获取策略实例 |
| POST | `/api/strategy-instances` | 创建策略实例 |
| PUT | `/api/strategy-instances/{instance_id}/status` | 更新实例状态 |
| POST | `/api/strategy-instances/{instance_id}/heartbeat` | 更新心跳 |
| GET | `/api/strategy-instances/{instance_id}/params` | 获取实例参数 |
| PUT | `/api/strategy-instances/{instance_id}/params/{param_key}` | 设置单个参数 |
| PUT | `/api/strategy-instances/{instance_id}/params` | 批量设置参数 |
| GET | `/api/strategy-instances/{instance_id}/params/history` | 参数变更历史 |
| POST | `/api/strategy-instances/{instance_id}/params/{param_key}/rollback` | 回滚参数 |
| GET | `/api/strategy-templates` | 获取参数模板 |
| POST | `/api/strategy-templates` | 创建参数模板 |
| POST | `/api/strategy-instances/{instance_id}/apply-template/{template_id}` | 应用模板 |

### 换月管理

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/rollover/configs` | 获取换月配置 |
| POST | `/api/rollover/configs` | 创建换月配置 |
| PUT | `/api/rollover/configs/{config_id}` | 更新换月配置 |
| DELETE | `/api/rollover/configs/{config_id}` | 删除换月配置 |
| GET | `/api/rollover/tasks` | 获取换月任务 |
| POST | `/api/rollover/tasks` | 创建换月任务 |
| POST | `/api/rollover/tasks/{task_id}/execute` | 执行换月任务 |
| POST | `/api/rollover/tasks/{task_id}/cancel` | 取消换月任务 |
| GET | `/api/rollover/statistics` | 换月统计 |

### 多策略管理

| 方法 | 路径 | 说明 |
|-----|------|-----|
| GET | `/api/strategy-groups` | 获取策略组 |
| POST | `/api/strategy-groups` | 创建策略组 |
| PUT | `/api/strategy-groups/{group_id}` | 更新策略组 |
| POST | `/api/strategy-groups/{group_id}/members` | 添加成员 |
| DELETE | `/api/strategy-groups/{group_id}/members/{instance_id}` | 移除成员 |
| GET | `/api/strategy-signals` | 获取交易信号 |
| POST | `/api/strategy-signals` | 创建交易信号 |
| POST | `/api/strategy-signals/{signal_id}/process` | 处理交易信号 |
| GET | `/api/strategy-performance` | 获取策略性能 |
| POST | `/api/strategy-performance` | 记录策略性能 |
| GET | `/api/strategy-performance/ranking` | 性能排名 |
| GET | `/api/strategy-conflicts` | 获取策略冲突 |
| POST | `/api/strategy-conflicts/{conflict_id}/resolve` | 解决冲突 |
| GET | `/api/resource-usage/{group_id}` | 资源使用情况 |

### WebSocket

| 方法 | 路径 | 说明 |
|-----|------|-----|
| WS | `/ws/positions` | 实时持仓推送(待实现) |

---

## 🔗 依赖关系

### 外部依赖

- **Supabase (PostgreSQL)**: 核心数据存储
  - 账户、持仓、成交、锁仓配置等所有业务数据
  - 使用视图简化复杂查询

- **天勤 TqSDK**: 行情数据源
  - K线历史数据
  - 实时行情
  - 合约信息

- **极星量化平台**: 策略执行和成交推送
  - 推送成交数据到 `/api/trades`
  - 推送持仓快照到 `/api/position_snapshots`
  - (待集成)接收锁仓指令

### 内部依赖

```
main.py (API Layer)
  ├── models.schemas (数据模型)
  ├── engines.position_engine (持仓计算)
  ├── engines.lock_engine (锁仓执行)
  ├── services.* (各业务服务)
  ├── utils.db (数据库连接)
  └── utils.contract_mapper (格式转换)
```

### 被依赖方

- **前端 Next.js 应用**: 调用所有 API 接口
- **极星策略脚本**: 推送成交数据和持仓快照
- **监控系统**: 调用 `/health/detailed` 健康检查

---

## 🎯 使用示例

### 1. 启动服务

```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入:
# - SUPABASE_URL
# - SUPABASE_KEY
# - DATABASE_URL
# - TQSDK_ACCOUNT
# - TQSDK_PASSWORD

# 启动开发服务器(热重载)
python main.py

# 或使用 uvicorn
uvicorn main:app --host 0.0.0.0 --port 8888 --reload
```

### 2. API 调用示例

#### 接收极星成交数据

```python
# 在极星策略中调用
import requests

def on_trade(context, trade):
    """成交回调"""
    payload = {
        "account_id": "85178443",
        "symbol": "ZCE|F|TA|2505",
        "direction": "buy",
        "offset": "open",
        "volume": 2,
        "price": 5500.0,
        "order_id": "ORDER123456",
        "timestamp": "2025-01-15T10:30:00",
        "source": "polar"
    }

    response = requests.post(
        "http://backend:8888/api/trades",
        json=payload
    )
    print(response.json())
```

#### 查询持仓

```bash
# 获取账户持仓
curl http://localhost:8888/api/positions/85178443

# 响应示例
{
  "total": 3,
  "positions": [
    {
      "symbol": "ZCE|F|TA|2505",
      "variety_name": "PTA",
      "long_position": 5,
      "long_avg_price": 5500.0,
      "long_profit": 2500.0,
      "short_position": 0,
      "is_long_locked": false,
      "last_price": 5550.0
    }
  ]
}
```

#### 获取K线数据

```bash
# 获取5分钟K线
curl "http://localhost:8888/api/kline/CZCE.TA2505?duration=300&length=100"

# 获取K线+持仓标记
curl "http://localhost:8888/api/kline/CZCE.TA2505/with-positions?account_id=xxx&duration=300"
```

#### 创建锁仓配置

```bash
curl -X POST http://localhost:8888/api/lock/configs \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "xxx-uuid",
    "symbol": "ZCE|F|TA|2505",
    "direction": "long",
    "trigger_type": "profit_ratio",
    "trigger_value": 0.10,
    "lock_ratio": 0.50,
    "auto_execute": true
  }'
```

### 3. 健康检查

```bash
# 基础健康检查
curl http://localhost:8888/health

# 详细健康检查(监控用)
curl http://localhost:8888/health/detailed
```

---

## 📝 配置管理

### 环境变量

在 `.env` 文件中配置:

```env
# Supabase 配置
SUPABASE_URL=http://localhost:8000
SUPABASE_KEY=your_supabase_anon_key

# 数据库配置(用于 SQLAlchemy)
DATABASE_URL=postgresql://user:pass@localhost:5432/quantfu

# 天勤配置
TQSDK_ACCOUNT=your_phone_number
TQSDK_PASSWORD=your_password

# 服务配置
HOST=0.0.0.0
PORT=8888

# Ntfy 通知配置
NTFY_URL=https://ntfy.zmddg.com/claude
```

### 配置类

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_key: str

    # Database
    database_url: str

    # TqSDK
    tqsdk_account: Optional[str] = None
    tqsdk_password: Optional[str] = None

    # Server
    host: str = "0.0.0.0"
    port: int = 8888

    # Notification
    ntfy_url: str = "https://ntfy.zmddg.com/claude"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-12-18 | 新增 | 创建后端架构文档 | AI |
| 2025-12-18 | 整理 | 完善 API 路由列表 | AI |

---

## 🎯 最佳实践

### 1. API 设计原则

- **RESTful 风格**: 使用标准 HTTP 方法(GET/POST/PUT/DELETE)
- **统一响应格式**: 使用 `ResponseModel` 包装所有响应
- **错误处理**: 使用 HTTPException 返回标准错误
- **参数验证**: 使用 Pydantic 模型自动验证

### 2. 数据库操作

- **使用 Supabase 客户端**: 不直接写 SQL,使用 Supabase Python 客户端
- **视图优先**: 复杂查询使用数据库视图(`v_positions_summary`, `v_active_lock_configs`)
- **原子操作**: 关键操作(如持仓重建)保证原子性

### 3. 异步编程

- **async/await**: 所有 IO 操作使用 async
- **阻塞操作**: TqSDK 是同步库,在独立线程中运行
- **连接管理**: TqSDK 连接用完即关闭(`service.close()`)

### 4. 错误处理

```python
# 标准错误处理模式
@app.post("/api/example")
async def example_endpoint(data: SomeModel):
    try:
        # 业务逻辑
        result = await some_service.do_something(data)

        return ResponseModel(
            code=200,
            message="Success",
            data=result
        )

    except HTTPException:
        raise  # 重新抛出 HTTP 异常

    except Exception as e:
        # 未预期异常
        raise HTTPException(status_code=500, detail=str(e))
```

### 5. 日志记录

```python
# 使用标准 logging
import logging

logger = logging.getLogger(__name__)

logger.info("操作成功")
logger.warning("警告信息")
logger.error("错误信息")
```

---

## ⚠️ 注意事项

### 1. 合约格式转换

- 极星格式: `ZCE|F|TA|2505`
- 天勤格式: `CZCE.TA2505`
- 使用 `ContractMapper` 工具类转换
- 数据库存储使用极星格式(因为数据来自极星)

### 2. 持仓计算

- 持仓通过成交记录重建(不直接存储极星持仓)
- 开仓使用加权平均计算均价
- 平仓减少仓位,不影响均价
- 持仓快照用于对账,不作为数据源

### 3. TqSDK 连接

- TqSDK 是同步库,不支持 async
- 每次请求创建连接,用完关闭(避免连接泄漏)
- 连接失败会自动重试

### 4. 锁仓执行

- 锁仓引擎 `lock_engine.py` 的下单接口未实现
- 需要根据极星 API 文档完成集成
- 提供了3种集成方式的示例代码

### 5. CORS 配置

- 开发环境允许所有来源(`allow_origins=["*"]`)
- 生产环境需改为具体前端域名

### 6. 性能考虑

- K线数据量大,使用流式响应
- 持仓列表使用数据库视图减少查询次数
- 健康检查接口不记录日志(避免日志过多)

---

## 🐛 常见问题

### Q: 为什么持仓数据和极星不一致?

A: 检查以下几点:
1. 极星是否正常推送成交数据到 `/api/trades`
2. 查看 `position_snapshots` 表的对账记录
3. 手动调用 `/api/positions/rebuild/{account_id}/{symbol}` 重建持仓
4. 检查成交记录的 `direction` 和 `offset` 是否正确

### Q: TqSDK 连接失败怎么办?

A: 检查以下配置:
1. `.env` 中 `TQSDK_ACCOUNT` 和 `TQSDK_PASSWORD` 是否正确
2. 天勤账户是否有效(登录 https://www.shinnytech.com/ 确认)
3. 网络是否能访问天勤服务器
4. 查看日志中的详细错误信息

### Q: 如何查看 API 文档?

A: 启动服务后访问:
- Swagger UI: `http://localhost:8888/docs`
- ReDoc: `http://localhost:8888/redoc`

### Q: 锁仓为什么不执行?

A: 可能原因:
1. 锁仓配置的 `auto_execute` 为 false(需手动确认)
2. 锁仓引擎的下单接口未实现(见 `lock_engine.py` 中的 TODO)
3. 持仓不足,无法锁定
4. 触发条件未满足

### Q: 如何添加新的 API 接口?

A: 在 `main.py` 中添加:

```python
@app.post("/api/your-endpoint")
async def your_endpoint(request: YourModel):
    """接口说明"""
    try:
        # 业务逻辑
        result = await your_service.do_something()

        return ResponseModel(
            code=200,
            message="Success",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Q: 如何部署到生产环境?

A: 生产部署步骤:

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置环境变量
cp .env.example .env.production
# 编辑 .env.production

# 3. 使用 gunicorn + uvicorn workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8888 \
  --access-logfile - \
  --error-logfile -

# 4. 使用 systemd 管理服务
# 参考 systemd service 文件配置

# 5. 使用 Nginx 反向代理
# 参考 nginx 配置
```

---

## 🔗 相关文档

- [数据模型文档](../models/.claude/guide.md)
- [工具函数文档](../utils/.claude/guide.md)
- [引擎模块文档](../engines/.claude/guide.md)
- [业务服务文档](../services/.claude/guide.md)
- [数据库设计文档](../../docs/database-design.md)
- [API 集成指南](../../docs/api-integration.md)

---

**文档维护者**: AI Assistant
**项目负责人**: allen
**最后审核**: 2025-12-18
