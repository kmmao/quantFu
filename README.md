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

## 📱 极星策略改造

### 方式1:修改现有v12.py

在 `v12.py` 顶部增加:
```python
from data_pusher import push_trade, push_position_snapshot
```

在 `market_order()` 和 `close_postion()` 函数中增加推送调用。

详见:`docs/极星策略改造指南.md`

### 方式2:创建新版本v12-fi.py

复制v12.py为v12-fi.py,在新文件中集成推送逻辑。

## 🚨 常见问题

### 1. Docker容器启动失败

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

### 2. 持仓数据不一致

- 检查极星策略是否正常推送:`SELECT * FROM trades ORDER BY created_at DESC LIMIT 10;`
- 手动触发持仓重建:调用后端API `POST /api/positions/rebuild/{account_id}`
- 查看持仓快照对比:`SELECT * FROM position_snapshots WHERE is_matched = false;`

### 3. 天勤行情无数据

- 检查天勤账号密码:`cat .env | grep TQSDK`
- 查看后端日志:`docker-compose logs backend`
- 测试天勤连接:运行 `backend/test_tqsdk.py`

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
