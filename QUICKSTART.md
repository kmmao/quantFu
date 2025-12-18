# 🚀 快速启动指南

5分钟让系统跑起来!

## 📋 前置要求

- ✅ Docker Desktop已安装并运行
- ✅ Python 3.11+ (检查:`python3 --version`)

---

## Step 1: 启动数据库 (2分钟)

```bash
# 1. 进入项目目录
cd ~/Documents/GitHub/quantFu

# 2. 复制环境变量
cp .env.example .env

# 3. 启动Supabase
make start

# 等待30秒后,访问管理界面
open http://localhost:3001
```

**验证成功标志:**
- 浏览器能打开Supabase Studio
- 左侧能看到数据库表列表

---

## Step 2: 初始化数据 (1分钟)

### 方式A: 使用Makefile(推荐)

```bash
make db-init    # 创建表结构
make db-seed    # 导入初始数据
```

### 方式B: 手动执行SQL

在Supabase Studio界面(http://localhost:3001):

1. 点击左侧 **SQL Editor**
2. 点击 **New query**
3. 粘贴 `database/migrations/001_init_schema.sql` 的内容
4. 点击 **Run** 按钮
5. 重复以上步骤,执行 `database/seed/002_seed_data.sql`

---

## Step 3: 录入初始持仓 (1分钟)

**重要!** 编辑 `database/seed/002_seed_data.sql` 文件:

找到第95行,取消注释并填写实际持仓:

```sql
-- 示例:主账户的PTA持仓
INSERT INTO positions (
    account_id,
    symbol,
    long_position,    -- 改为实际多仓手数
    long_avg_price,   -- 改为实际均价
    short_position,   -- 改为实际空仓手数
    short_avg_price,
    last_price
) VALUES
(
    (SELECT id FROM accounts WHERE polar_account_id = '85178443'),  -- 改为你的账户ID
    'ZCE|F|TA|2505',  -- 改为实际合约
    2,      -- 实际多仓
    5500,   -- 实际均价
    0,      -- 实际空仓
    0,
    5550
);
```

然后重新执行:
```bash
make db-seed
```

---

## Step 4: 启动后端 (1分钟)

```bash
# 1. 进入后端目录
cd backend

# 2. 创建虚拟环境
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 安装依赖
pip install -r requirements.txt

# 4. 复制环境变量
cp .env.example .env

# 5. 启动服务
python main.py
```

**验证成功标志:**
- 终端显示 `Application startup complete`
- 访问 http://localhost:8888/docs 能看到API文档

---

## Step 5: 测试数据推送 (30秒)

```bash
# 在新终端中测试
cd archived
python3 data_pusher.py
```

**预期输出:**
```
==================================================
极星数据推送模块 - 连接测试
==================================================

1. 测试后端连接: http://localhost:8888
   ✅ 连接成功

2. 测试推送成交数据
   ✅ 成交数据推送成功

3. 测试推送持仓快照
   ✅ 持仓快照推送成功

==================================================
测试完成!
==================================================
```

---

## ✅ 完成!系统已就绪

现在你可以:

### 1. 查看API文档
打开 http://localhost:8888/docs

### 2. 查看数据库
打开 http://localhost:3001 → Tables

### 3. 测试API
```bash
# 查询持仓
curl http://localhost:8888/api/positions/85178443

# 查询合约
curl http://localhost:8888/api/contracts
```

### 4. 改造极星策略

参考 `doc/极星策略改造指南.md`,修改v12.py启用数据推送。

---

## 🚨 常见问题

### Q1: make命令不存在

**解决方法:**
```bash
# 手动执行命令
docker-compose up -d
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_init_schema.sql
```

### Q2: 端口被占用

**症状:** 启动时提示 `port is already allocated`

**解决方法:**
```bash
# 查看占用端口的进程
lsof -i :5432  # PostgreSQL
lsof -i :8888  # 后端

# 杀死进程
kill -9 <PID>

# 重新启动
make restart
```

### Q3: Python依赖安装失败

**解决方法:**
```bash
# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

## 📊 下一步

- [ ] 改造极星策略 (见 `doc/极星策略改造指南.md`)
- [ ] 开发前端界面 (阶段2)
- [ ] 集成天勤行情 (阶段2)

---

## 🔗 相关文档

- [完整README](README.md)
- [极星策略改造指南](doc/极星策略改造指南.md)
- [数据库设计](database/migrations/001_init_schema.sql)
- [API文档](http://localhost:8888/docs)
