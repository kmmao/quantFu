# 期货量化管理平台 QuantFu

中国期货量化交易管理平台,集成极星量化策略与天勤行情,实现持仓监控、锁仓管理、换月提醒等功能。

## 📋 系统架构

```
极星量化(v12.py策略) → 推送成交数据 → 后端服务(FastAPI)
                                          ↓
天勤TqSDK行情 → 实时价格推送 → Supabase数据库 → WebSocket → Web前端(Next.js)
```

## 🚀 快速开始

### 方式1: 一键启动 (推荐)

```bash
# 1. 克隆项目
git clone https://github.com/allen/quantFu.git
cd quantFu

# 2. 配置环境变量
cp .env.example .env
vim .env  # 修改必要配置 (见下方说明)

# 3. 一键启动
./scripts/start.sh
```

**必须修改的配置项 (.env):**
```env
POSTGRES_PASSWORD=your-strong-password        # 数据库密码
JWT_SECRET=your-jwt-secret-32-chars          # JWT密钥
TQSDK_USER=your-tqsdk-username               # 天勤账号
TQSDK_PASSWORD=your-tqsdk-password           # 天勤密码
POLAR_API_KEY=your-polar-api-key             # 极星API密钥
```

启动后访问:
- **前端界面**: http://localhost:3000
- **API文档**: http://localhost:8888/docs
- **Supabase Studio**: http://localhost:3001

**停止服务:**
```bash
./scripts/stop.sh
```

**系统监控:**
```bash
./scripts/monitor.sh
```

---

### 方式2: 手动启动

### 1. 环境要求

- Docker & Docker Compose
- Node.js 18+ (用于前端开发)
- Python 3.11+ (用于后端开发)

### 2. 启动Supabase数据库

```bash
# 1. 复制环境变量配置
cp .env.example .env

# 2. 修改.env中的密码(必须!)
# POSTGRES_PASSWORD, JWT_SECRET等

# 3. 启动Supabase容器
docker-compose up -d

# 4. 等待服务启动(约30秒)
docker-compose logs -f

# 5. 访问Supabase Studio管理界面
open http://localhost:3001
```

### 3. 初始化数据

```bash
# 方式1:通过psql执行种子文件
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/002_seed_data.sql

# 方式2:通过Supabase Studio界面手动执行SQL
# 打开 http://localhost:3001 → SQL Editor → 粘贴执行
```

### 4. 修改初始持仓数据

**重要!** 编辑 `database/seed/002_seed_data.sql` 文件:

1. **第10-14行**: 修改3个账户的实际信息
2. **第95行开始**: 取消注释并填写实际持仓数据
3. **第117行开始**: 如有历史锁仓,填写legacy字段

示例:
```sql
-- 主账户的PTA持仓
INSERT INTO positions (
    account_id,
    symbol,
    long_position,    -- 多仓手数
    long_avg_price,   -- 多仓均价
    short_position,   -- 空仓手数
    short_avg_price,  -- 空仓均价
    last_price        -- 当前价(天勤会自动更新)
) VALUES
(
    (SELECT id FROM accounts WHERE polar_account_id = '85178443'),
    'ZCE|F|TA|2505',
    2,      -- 实际多仓数量
    5500,   -- 实际均价
    0,      -- 实际空仓数量
    0,
    5550    -- 参考价格
);
```

### 5. 验证数据库

```bash
# 连接数据库查询
docker exec -it quantfu_postgres psql -U postgres -d postgres

# 查看账户
SELECT * FROM accounts;

# 查看合约映射
SELECT * FROM contracts;

# 查看持仓
SELECT * FROM v_positions_summary;

# 退出
\q
```

## 📁 项目结构

```
quantFu/
├── archived/           # 极星量化策略文件
│   ├── v12.py         # 当前运行策略
│   └── data_pusher.py # (待创建)数据推送模块
├── backend/           # FastAPI后端服务
│   ├── main.py        # 主应用
│   ├── models/        # 数据模型
│   ├── services/      # 业务服务
│   ├── engines/       # 持仓计算引擎
│   └── utils/         # 工具函数
├── frontend/          # Next.js前端应用
│   ├── app/           # App Router页面
│   ├── components/    # React组件
│   └── lib/           # 工具库
├── database/          # 数据库相关
│   ├── migrations/    # 数据库迁移
│   └── seed/          # 初始数据
├── docs/              # 项目文档
│   ├── development/   # 开发过程文档
│   ├── deployment/    # 部署指南
│   └── integration/   # 集成指南
├── docker-compose.yml # Docker编排文件
└── README.md
```

## 🔧 开发指南

### 后端开发

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8888
```

### 前端开发

```bash
cd frontend
npm install
npm run dev
# 访问 http://localhost:3000
```

## 📊 数据库表说明

| 表名 | 用途 |
|------|------|
| `accounts` | 期货账户主数据 |
| `contracts` | 合约映射(极星↔天勤) |
| `trades` | 成交记录(极星推送) |
| `positions` | 持仓明细(自动计算) |
| `position_snapshots` | 持仓快照(对账) |
| `lock_configs` | 锁仓配置 |
| `rollover_records` | 换月记录 |
| `market_data` | 行情缓存 |
| `notifications` | 系统通知 |

## 🔐 API接口文档

启动后端后访问:
- Swagger UI: http://localhost:8888/docs
- ReDoc: http://localhost:8888/redoc

主要接口:
```
POST /api/trades              # 接收极星成交推送
POST /api/position_snapshots  # 接收持仓快照
GET  /api/positions/{account_id}  # 查询持仓
WS   /ws/positions            # WebSocket实时推送
```

## 📚 文档索引

### 快速参考
- [项目概览](PROJECT_SUMMARY.md) - 系统架构与技术栈
- [快速开始](QUICKSTART.md) - 5分钟上手指南
- [项目状态](docs/PROJECT_STATUS.md) - 当前开发进度

### 集成指南
- [极星策略集成](docs/integration/POLAR_INTEGRATION.md) - v12.py 策略改造
- [V12 集成指南](docs/integration/V12_INTEGRATION_GUIDE.md) - 详细集成步骤
- [V12 可视化指南](docs/integration/V12_INTEGRATION_VISUAL_GUIDE.md) - 图解集成过程

### 部署运维
- [部署指南](docs/deployment/DEPLOYMENT.md) - 生产环境部署

### 故障排除
- [故障排除指南](docs/troubleshooting/) - 常见问题诊断与解决方案
  - [WebSocket FAQ](docs/troubleshooting/WEBSOCKET_FAQ.md) - 连接问题排查
  - [天勤行情 FAQ](docs/troubleshooting/TQSDK_FAQ.md) - 行情服务问题
  - [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md) - 后端API问题
  - [锁仓触发 FAQ](docs/troubleshooting/LOCK_TRIGGER_FAQ.md) - 锁仓功能问题
  - [换月任务 FAQ](docs/troubleshooting/ROLLOVER_FAQ.md) - 换月功能问题
  - [极星数据推送 FAQ](docs/troubleshooting/POLAR_DATA_PUSH_FAQ.md) - 数据推送问题
  - [通知服务 FAQ](docs/troubleshooting/NOTIFICATION_FAQ.md) - 通知服务问题

### 开发历史
- [Phase 2 开发](docs/development/phase2/) - 基础功能开发记录
- [Phase 3 开发](docs/development/phase3/) - 高级功能开发记录

## 🚨 故障排除指南

本章节提供常见问题的快速诊断和解决方案。详细的故障排除文档请参见 [docs/troubleshooting/](docs/troubleshooting/) 目录。

### 📖 故障排除文档目录

| 分类 | 文档 | 涵盖问题 |
|------|------|----------|
| **连接问题** | [WebSocket FAQ](docs/troubleshooting/WEBSOCKET_FAQ.md) | 连接断开、重连失败、JWT错误、订阅不更新 |
| **行情服务** | [天勤行情 FAQ](docs/troubleshooting/TQSDK_FAQ.md) | 连接失败、数据不更新、合约订阅失败、价格异常 |
| **后端服务** | [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md) | 启动失败、API错误、数据库连接问题 |
| **锁仓功能** | [锁仓触发 FAQ](docs/troubleshooting/LOCK_TRIGGER_FAQ.md) | 触发失败、执行失败、条件不满足 |
| **换月功能** | [换月任务 FAQ](docs/troubleshooting/ROLLOVER_FAQ.md) | 任务卡住、执行失败、提醒未触发 |
| **数据推送** | [极星数据推送 FAQ](docs/troubleshooting/POLAR_DATA_PUSH_FAQ.md) | 推送失败、持仓不一致、连接失败 |
| **通知服务** | [通知服务 FAQ](docs/troubleshooting/NOTIFICATION_FAQ.md) | 发送失败、未收到通知、服务超时 |

---

### 🔍 快速诊断流程

#### 📋 一分钟问题定位检查清单

遇到问题时,**按顺序执行以下检查**,快速定位问题范围:

| 步骤 | 检查项 | 命令 | 正常结果 | 异常处理 |
|:---:|--------|------|----------|----------|
| ①  | **服务状态** | `docker-compose ps` | 所有服务 `Up` | → [启动问题](#连接类问题) |
| ②  | **健康检查** | `curl localhost:8888/health` | `{"status":"healthy"}` | → [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md) |
| ③  | **数据库连接** | `docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1"` | 返回 `1` | → [数据库问题](#数据库连接失败) |
| ④  | **环境变量** | `cat .env \| grep -E "(SUPABASE\|TQSDK)"` | 变量已设置 | → 检查 `.env` 配置 |
| ⑤  | **最近日志** | `docker-compose logs --tail=30` | 无 ERROR | → 查看具体错误 |

---

#### 🔀 问题诊断决策树

根据你遇到的**主要症状**,按照下方流程快速定位问题:

```
你遇到了什么问题?
│
├─► 服务无法启动
│   ├─► 后端启动失败 → 检查环境变量(SUPABASE_KEY/DATABASE_URL)
│   │   └─► docker-compose logs backend --tail=50
│   ├─► 数据库启动失败 → 检查端口占用/磁盘空间
│   │   └─► lsof -i :5432 && docker-compose logs postgres
│   └─► 前端启动失败 → 检查 Node 依赖
│       └─► cd frontend && npm install
│
├─► 数据不更新/不显示
│   ├─► 所有数据都不更新 → 检查数据库/后端连接
│   │   └─► curl localhost:8888/health
│   ├─► 只有行情不更新 → 检查天勤服务
│   │   └─► docker-compose logs backend | grep -i tqsdk
│   ├─► 只有持仓不更新 → 检查极星推送
│   │   └─► 查看最近 trades 记录
│   └─► 实时推送不工作 → 检查 WebSocket/Realtime
│       └─► 查看浏览器控制台 + Supabase Realtime 日志
│
├─► API 返回错误
│   ├─► 500 内部错误 → 查看后端日志找具体异常
│   │   └─► docker-compose logs backend | grep -E "(ERROR|Exception)"
│   ├─► 404 未找到 → 检查资源是否存在(账户/合约)
│   │   └─► 检查 accounts/contracts 表
│   ├─► 422 验证失败 → 检查请求参数格式
│   │   └─► 参考 API 文档: localhost:8888/docs
│   └─► 连接超时 → 检查服务是否运行/网络
│       └─► docker-compose ps && ping localhost
│
├─► 功能异常
│   ├─► 锁仓未触发 → 检查配置和触发条件
│   │   └─► SELECT * FROM v_active_lock_configs;
│   ├─► 换月未提醒 → 检查换月配置和监控服务
│   │   └─► SELECT * FROM rollover_configs WHERE is_enabled;
│   └─► 通知未收到 → 检查 NTFY 配置和网络
│       └─► curl -d "test" $NTFY_URL
│
└─► 价格/数据异常
    ├─► 价格显示 NaN/0 → 非交易时段或合约错误
    │   └─► 检查合约格式映射
    ├─► 持仓对账不一致 → trades 记录不完整
    │   └─► SELECT * FROM position_snapshots WHERE is_matched=false;
    └─► 浮盈计算错误 → 行情价格未更新
        └─► 检查 positions 表 last_price 字段
```

---

#### ⚡ 快速诊断命令大全

<details>
<summary><strong>展开查看所有诊断命令</strong></summary>

**服务状态检查**
```bash
# 查看所有容器状态
docker-compose ps

# 快速健康检查
curl -s localhost:8888/health | jq

# 详细健康检查
curl -s localhost:8888/health/detailed | jq '.components'
```

**日志查看**
```bash
# 查看所有服务最近日志
docker-compose logs --tail=50

# 查看后端错误日志
docker-compose logs backend 2>&1 | grep -E "(ERROR|Exception|Traceback)"

# 查看天勤相关日志
docker-compose logs backend | grep -i tqsdk

# 实时跟踪日志
docker-compose logs -f backend
```

**数据库诊断**
```bash
# 测试数据库连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1"

# 查看最近成交
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT symbol, direction, volume, price, created_at FROM trades ORDER BY created_at DESC LIMIT 5;"

# 查看持仓汇总
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM v_positions_summary;"

# 检查锁仓配置
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT id, position_id, trigger_type, profit_threshold, is_enabled FROM lock_configs;"

# 检查换月任务
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT id, old_symbol, new_symbol, status, error_message FROM rollover_tasks ORDER BY created_at DESC LIMIT 5;"
```

**网络和连接测试**
```bash
# 测试 API 端点
curl -s localhost:8888/api/accounts | jq

# 测试天勤连接
cd backend && python test_tqsdk.py

# 测试 ntfy 通知
curl -d "QuantFu 测试通知" $(grep NTFY_URL .env | cut -d= -f2)

# 检查端口占用
lsof -i :8888 -i :5432 -i :3000 -i :3001
```

**资源监控**
```bash
# 查看容器资源使用
docker stats --no-stream

# 查看磁盘使用
docker system df

# 清理未使用资源
docker system prune -f
```

</details>

---

#### 🎯 按问题类型快速跳转

| 我遇到的问题是... | 快速检查 | 详细文档 |
|------------------|----------|----------|
| **无法启动服务** | `docker-compose logs [service]` | [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md) |
| **前端数据不实时** | 检查浏览器控制台 WebSocket 错误 | [WebSocket FAQ](docs/troubleshooting/WEBSOCKET_FAQ.md) |
| **行情价格不更新** | `grep -i tqsdk` 后端日志 | [天勤行情 FAQ](docs/troubleshooting/TQSDK_FAQ.md) |
| **极星推送失败** | 检查 accounts 表有无对应账户 | [极星数据推送 FAQ](docs/troubleshooting/POLAR_DATA_PUSH_FAQ.md) |
| **锁仓不触发** | `SELECT * FROM v_active_lock_configs` | [锁仓触发 FAQ](docs/troubleshooting/LOCK_TRIGGER_FAQ.md) |
| **换月不提醒** | `SELECT * FROM rollover_configs` | [换月任务 FAQ](docs/troubleshooting/ROLLOVER_FAQ.md) |
| **通知收不到** | `curl -d "test" $NTFY_URL` | [通知服务 FAQ](docs/troubleshooting/NOTIFICATION_FAQ.md) |

---

### 🛠️ 常见问题速查

#### 连接类问题

<details>
<summary><strong>Docker容器启动失败</strong></summary>

```bash
# 查看日志
docker-compose logs postgres

# 常见原因:5432端口被占用
lsof -i :5432
kill -9 <PID>

# 重新启动
docker-compose down
docker-compose up -d
```

📖 详细排查: [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md)
</details>

<details>
<summary><strong>后端服务启动失败 - 环境变量缺失</strong></summary>

**症状**: 后端服务启动后立即退出,日志显示 `ValidationError` 或 `pydantic` 相关错误

**快速检查**:
```bash
# 检查容器状态
docker-compose ps

# 检查必填环境变量
cat backend/.env | grep -E "(SUPABASE_KEY|DATABASE_URL)"

# 查看启动日志
docker-compose logs backend --tail=30
```

**必填环境变量清单**:
- `SUPABASE_KEY` - Supabase 匿名密钥
- `DATABASE_URL` - PostgreSQL 连接字符串

📖 详细排查: [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md#1-服务启动失败---环境变量缺失)
</details>

<details>
<summary><strong>数据库连接失败</strong></summary>

**症状**: API 返回 500 错误,健康检查显示 `"database": "error"`

**快速检查**:
```bash
# 检查 Supabase 服务状态
docker-compose ps | grep -E "(db|kong|rest)"

# 测试数据库直接连接
docker exec -it quantfu_postgres psql -U postgres -c "SELECT 1;"

# 检查 PostgREST 连接
curl -v http://localhost:8000/rest/v1/ \
  -H "apikey: your-supabase-anon-key"
```

**常见原因**:
- PostgreSQL/Kong/PostgREST 容器未运行
- SUPABASE_URL 配置错误
- 数据库未初始化

📖 详细排查: [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md#2-服务启动失败---数据库连接失败)
</details>

<details>
<summary><strong>WebSocket连接断开/重连失败</strong></summary>

**症状**: 前端实时数据停止更新,控制台显示连接错误

**快速检查**:
```bash
# 检查后端健康状态
curl http://localhost:8888/health

# 检查Supabase Realtime
docker-compose logs supabase-realtime
```

**常见原因**:
- JWT过期或签名错误
- 网络不稳定
- 后端服务重启

📖 详细排查: [WebSocket FAQ](docs/troubleshooting/WEBSOCKET_FAQ.md)
</details>

<details>
<summary><strong>天勤行情无数据/连接超时</strong></summary>

**快速检查**:
```bash
# 检查天勤账号配置
cat .env | grep TQSDK

# 查看后端日志
docker-compose logs backend | grep -i tqsdk

# 测试天勤连接
cd backend && python test_tqsdk.py
```

**常见原因**:
- 账号密码错误
- 网络无法访问天勤服务器
- 非交易时段无实时数据

📖 详细排查: [天勤行情 FAQ](docs/troubleshooting/TQSDK_FAQ.md)
</details>

<details>
<summary><strong>合约订阅失败/价格显示NaN</strong></summary>

**症状**: 某些合约无行情数据,价格显示为 NaN 或 0

**快速检查**:
```bash
# 检查合约格式映射
curl "http://localhost:8888/api/contracts/convert/polar-to-tqsdk?polar_symbol=ZCE|F|TA|2505"

# 查看订阅失败日志
docker-compose logs backend | grep "订阅失败"

# 检查合约是否到期
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM contracts WHERE tqsdk_symbol LIKE '%2412%';"
```

**常见原因**:
- 合约格式转换错误(郑商所 ZCE→CZCE)
- 合约已到期或未上市
- 非交易时段无成交数据

**合约格式对照**:
| 极星格式 | 天勤格式 |
|---------|---------|
| ZCE\|F\|TA\|2505 | CZCE.TA2505 |
| SHFE\|F\|RB\|2505 | SHFE.rb2505 |
| DCE\|Z\|V\|2505 | DCE.v2505 |

📖 详细排查: [天勤行情 FAQ](docs/troubleshooting/TQSDK_FAQ.md#4-合约订阅失败)
</details>

<details>
<summary><strong>行情数据延迟</strong></summary>

**症状**: 价格更新明显滞后,持仓浮盈不实时

**快速检查**:
```bash
# 检查行情循环是否正常
docker-compose logs backend --tail=20 | grep "行情"

# 测试行情接口响应时间
time curl http://localhost:8888/api/kline/CZCE.TA2505

# 检查系统资源
docker stats
```

**常见原因**:
- 行情循环阻塞或崩溃
- 网络延迟过高
- 数据库写入延迟
- 系统资源不足

📖 详细排查: [天勤行情 FAQ](docs/troubleshooting/TQSDK_FAQ.md#8-行情数据延迟)
</details>

#### 数据类问题

<details>
<summary><strong>持仓数据不一致</strong></summary>

**诊断步骤**:
```bash
# 1. 检查极星推送的成交记录
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM trades ORDER BY created_at DESC LIMIT 10;"

# 2. 检查持仓快照对比
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM position_snapshots WHERE is_matched = false;"

# 3. 手动触发持仓重建
curl -X POST http://localhost:8888/api/positions/rebuild/{account_id}
```

📖 详细排查: [极星数据推送 FAQ](docs/troubleshooting/POLAR_DATA_PUSH_FAQ.md)
</details>

<details>
<summary><strong>极星数据推送失败</strong></summary>

**快速检查**:
```bash
# 测试API连通性
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 检查账户是否存在
curl http://localhost:8888/api/accounts
```

**常见原因**:
- 后端服务未启动
- 账户UUID不存在 (404错误)
- 参数格式错误 (422错误)

📖 详细排查: [极星数据推送 FAQ](docs/troubleshooting/POLAR_DATA_PUSH_FAQ.md)
</details>

<details>
<summary><strong>API 返回 500 内部错误</strong></summary>

**症状**: API 调用返回 HTTP 500 Internal Server Error

**快速检查**:
```bash
# 查看完整错误日志
docker-compose logs backend --tail=100 | grep -E "(ERROR|Exception|Traceback)"

# 检查数据库表是否存在
docker exec -it quantfu_postgres psql -U postgres -d postgres -c "\dt"

# 检查视图是否正常
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT COUNT(*) FROM v_positions_summary;"
```

**常见错误及原因**:
| 错误信息 | 原因 |
|---------|------|
| `relation "xxx" does not exist` | 表/视图不存在,需运行迁移 |
| `permission denied` | RLS 策略限制 |
| `NoneType has no attribute` | 空值访问,检查前置数据 |

📖 详细排查: [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md#3-api-返回-500-错误)
</details>

<details>
<summary><strong>API 返回 422 参数验证失败</strong></summary>

**症状**: POST/PUT 请求返回 HTTP 422 Unprocessable Entity

**快速检查**:
```bash
# 查看API文档了解参数要求
# 访问 http://localhost:8888/docs

# 测试成交推送格式
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

**常见原因**:
- 缺少必填字段
- 字段类型不匹配(如字符串传了数字)
- 枚举值错误(direction 只接受 "long"/"short")

📖 详细排查: [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md#5-api-返回-422---参数验证失败)
</details>

#### 服务类问题

<details>
<summary><strong>锁仓触发失败</strong></summary>

**快速检查**:
```bash
# 查看锁仓配置状态
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM v_active_lock_configs;"

# 检查锁仓服务日志
docker-compose logs backend | grep -i lock
```

**⚠️ 已知限制**: 自动执行功能(auto_execute)尚未实现,当前仅支持触发通知

📖 详细排查: [锁仓触发 FAQ](docs/troubleshooting/LOCK_TRIGGER_FAQ.md)
</details>

<details>
<summary><strong>换月任务卡住/执行失败</strong></summary>

**快速检查**:
```bash
# 查看换月任务状态
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM rollover_tasks WHERE status IN ('pending', 'executing');"

# 检查换月监控日志
docker-compose logs backend | grep -i rollover
```

**⚠️ 已知限制**: 自动换月执行功能尚未实现,当前仅支持提醒

📖 详细排查: [换月任务 FAQ](docs/troubleshooting/ROLLOVER_FAQ.md)
</details>

<details>
<summary><strong>通知未收到</strong></summary>

**快速检查**:
```bash
# 检查ntfy配置
cat .env | grep NTFY

# 测试ntfy发送
curl -d "测试通知" https://ntfy.sh/your-topic
```

**常见原因**:
- NTFY_URL未配置或配置错误
- 手机客户端未订阅正确的topic
- 网络无法访问ntfy服务器

📖 详细排查: [通知服务 FAQ](docs/troubleshooting/NOTIFICATION_FAQ.md)
</details>

<details>
<summary><strong>通知发送失败 - 服务器无响应/超时</strong></summary>

**症状**: 后端日志显示 `[通知] 发送异常: Connection refused` 或 `Read timed out`

**快速检查**:
```bash
# 检查 NTFY_URL 配置
cat backend/.env | grep NTFY_URL

# 在后端容器内测试连通性
docker-compose exec backend curl -v https://ntfy.zmddg.com/test

# 手动发送测试通知
curl -X POST https://ntfy.zmddg.com/YOUR-TOPIC \
  -H "Title: 测试" \
  -H "Priority: high" \
  -d "测试消息 $(date)"
```

**解决方案**:
- 如果自建服务器不可用,临时切换到官方服务: `NTFY_URL=https://ntfy.sh/quantfu-alerts-RANDOM`
- 检查网络出站规则是否允许访问外部服务

📖 详细排查: [通知服务 FAQ](docs/troubleshooting/NOTIFICATION_FAQ.md#1-通知发送失败---服务器无响应)
</details>

<details>
<summary><strong>锁仓触发条件不满足</strong></summary>

**症状**: 持仓有利润但锁仓未触发

**快速检查**:
```bash
# 检查锁仓配置
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT id, position_id, trigger_type, trigger_price, profit_threshold,
          is_enabled, auto_execute
   FROM lock_configs WHERE is_enabled = true;"

# 检查当前持仓利润
docker exec -it quantfu_postgres psql -U postgres -d postgres -c \
  "SELECT * FROM v_active_lock_configs;"
```

**常见原因**:
- 利润阈值设置过高
- 方向不匹配(多头配置对空头持仓)
- `is_enabled` 为 false
- 锁仓触发服务未运行

📖 详细排查: [锁仓触发 FAQ](docs/troubleshooting/LOCK_TRIGGER_FAQ.md#2-触发条件不满足)
</details>

<details>
<summary><strong>健康检查异常</strong></summary>

**症状**: `/health` 返回 `"status": "unhealthy"` 或有警告信息

**快速检查**:
```bash
# 基础健康检查
curl http://localhost:8888/health | jq

# 详细健康检查
curl http://localhost:8888/health/detailed | jq

# 查看各组件状态
curl http://localhost:8888/health/detailed | jq '.components'

# 查看警告列表
curl http://localhost:8888/health/detailed | jq '.warnings'
```

**常见警告解读**:
| 警告信息 | 原因 | 解决方案 |
|---------|------|---------|
| Database connection failed | 数据库不可用 | 检查 PostgreSQL 服务 |
| TqSDK not configured | 天勤未配置 | 可忽略或配置 TQSDK 环境变量 |
| High CPU/memory usage | 资源不足 | 检查容器资源限制 |

📖 详细排查: [后端服务 FAQ](docs/troubleshooting/BACKEND_FAQ.md#7-健康检查接口异常)
</details>

---

### 🆘 获取帮助

如果以上方法无法解决问题:

1. **查看完整日志**: `docker-compose logs --tail=100`
2. **检查GitHub Issues**: [项目Issues页面](https://github.com/allen/quantFu/issues)
3. **提交新Issue**: 请附上错误日志和复现步骤

## 📈 后续开发计划

### 阶段1:基础监控(当前)
- [x] Supabase数据库
- [ ] 后端API服务
- [ ] 极星策略推送
- [ ] 天勤行情集成
- [ ] Web前端基础页面

### 阶段2:智能提醒
- [ ] 换月监测与提醒
- [ ] 锁仓自动触发
- [ ] 持仓风险预警
- [ ] 多渠道通知(ntfy/邮件/微信)

### 阶段3:自动化
- [ ] 自动换月执行
- [ ] 策略参数远程配置
- [ ] 多策略并行管理
- [ ] 移动端App

## 📄 许可证

MIT License

## 👥 贡献

欢迎提交Issue和Pull Request!

## 📧 联系方式

- 作者: Allen
- 项目地址: https://github.com/allen/quantFu
