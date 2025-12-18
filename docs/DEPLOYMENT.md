# QuantFu 部署指南

本文档提供 QuantFu 期货量化管理平台的详细部署步骤。

---

## 📋 目录

- [部署架构](#部署架构)
- [环境要求](#环境要求)
- [本地开发部署](#本地开发部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [故障排查](#故障排查)
- [监控与维护](#监控与维护)

---

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                        前端层                            │
│  Next.js (Port 3000) - Web界面                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                        后端层                            │
│  FastAPI (Port 8888) - 业务逻辑 + 天勤行情               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      Supabase层                          │
│  Kong (Port 8000) - API网关                             │
│  PostgREST (Port 3000) - REST API                       │
│  Realtime (Port 4000) - WebSocket                       │
│  Studio (Port 3001) - 管理界面                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                       数据库层                           │
│  PostgreSQL (Port 5432) - 核心数据存储                  │
└─────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────┐
│                      数据源层                            │
│  极星量化 v12.py - 成交推送                             │
│  天勤TqSDK - 行情推送                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 环境要求

### 最低配置

- **CPU**: 2核
- **内存**: 4GB
- **磁盘**: 20GB SSD
- **网络**: 稳定互联网连接

### 推荐配置

- **CPU**: 4核+
- **内存**: 8GB+
- **磁盘**: 50GB+ SSD
- **网络**: 10Mbps+ 带宽

### 软件依赖

- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (前端开发)
- **Python**: 3.11+ (后端开发)
- **Git**: 2.30+

---

## 🚀 本地开发部署

### Step 1: 克隆项目

```bash
git clone https://github.com/allen/quantFu.git
cd quantFu
```

### Step 2: 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
vim .env
```

**必须修改的配置项:**

```env
# 1. 数据库密码
POSTGRES_PASSWORD=your-strong-password-here

# 2. JWT密钥 (至少32字符)
JWT_SECRET=your-super-secret-jwt-token-at-least-32-chars

# 3. 天勤账号 (https://www.shinnytech.com/ 注册)
TQSDK_USER=your-tqsdk-username
TQSDK_PASSWORD=your-tqsdk-password

# 4. 极星API密钥 (用于验证推送)
POLAR_API_KEY=your-polar-api-key
```

### Step 3: 启动Supabase

```bash
# 启动所有容器
docker-compose up -d

# 查看启动日志
docker-compose logs -f

# 等待所有服务就绪 (约30-60秒)
```

**验证服务状态:**

```bash
docker-compose ps
```

应该看到7个服务全部 `Up`:
- quantfu_postgres
- quantfu_kong
- quantfu_rest
- quantfu_realtime
- quantfu_meta
- quantfu_studio

### Step 4: 初始化数据库

```bash
# 执行数据库迁移
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_initial_schema.sql

# 导入初始数据
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/001_contracts_seed.sql
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/002_seed_data.sql
```

**⚠️ 重要:** 编辑 `database/seed/002_seed_data.sql`,填写实际的:
1. 账户信息 (第10-14行)
2. 持仓数据 (第95行起)
3. 历史锁仓 (第117行起,如有)

### Step 5: 验证数据库

```bash
# 连接数据库
docker exec -it quantfu_postgres psql -U postgres -d postgres

# 查看账户
SELECT * FROM accounts;

# 查看合约映射
SELECT * FROM contracts LIMIT 10;

# 查看持仓
SELECT * FROM v_positions_summary;

# 退出
\q
```

### Step 6: 测试天勤连接

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 测试天勤连接
python test_tqsdk.py
```

**预期输出:**

```
========================================
天勤TqSDK连接测试
========================================
📡 正在连接天勤行情服务...
   账号: your-username
✅ 天勤连接成功!

📊 测试行情数据获取...
  ✅ SHFE.cu2505: 72500.00 (买:72490.00 卖:72510.00)
  ✅ DCE.i2505: 785.50 (买:785.00 卖:786.00)
  ✅ CZCE.TA505: 5510.00 (买:5508.00 卖:5512.00)
  ✅ INE.sc2505: 612.30 (买:612.20 卖:612.40)

📈 行情测试完成: 4/4 成功

✅ TqSDK测试通过!
```

### Step 7: 启动后端服务

```bash
# 在 backend/ 目录下
uvicorn main:app --reload --port 8888
```

**访问 API 文档:**
- Swagger UI: http://localhost:8888/docs
- ReDoc: http://localhost:8888/redoc

### Step 8: 启动前端服务

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**访问前端:**
- 前端界面: http://localhost:3000
- Supabase Studio: http://localhost:3001

### Step 9: 配置极星推送

编辑极星策略 `archived/v12.py`,在顶部增加:

```python
import requests
import json

# QuantFu后端地址
QUANTFU_API = "http://localhost:8888"
POLAR_API_KEY = "your-polar-api-key"  # 与.env中保持一致

def push_trade(trade_data):
    """推送成交数据到QuantFu"""
    try:
        response = requests.post(
            f"{QUANTFU_API}/api/trades",
            headers={
                "Content-Type": "application/json",
                "X-API-Key": POLAR_API_KEY
            },
            json=trade_data,
            timeout=5
        )
        if response.status_code == 200:
            print(f"✅ 成交推送成功: {trade_data['symbol']}")
        else:
            print(f"❌ 成交推送失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 成交推送异常: {e}")
```

在 `market_order()` 函数成交后调用:

```python
def market_order(direction, volume, symbol, account_id):
    # ... 原有下单逻辑 ...

    # 成交后推送数据
    trade_data = {
        "account_id": account_id,
        "polar_account_id": "85178443",  # 极星账号ID
        "symbol": symbol,
        "direction": direction,
        "offset": "开仓" if is_open else "平仓",
        "volume": volume,
        "price": filled_price,
        "trade_time": datetime.now().isoformat()
    }
    push_trade(trade_data)
```

---

## 🏭 生产环境部署

### 架构建议

**单机部署** (适合个人交易者):
```
1台服务器: 数据库 + 后端 + 前端
- 2核4G: 支持2-3个策略实例
- 4核8G: 支持5-10个策略实例
```

**分布式部署** (适合团队):
```
服务器1: PostgreSQL + Supabase (8核16G)
服务器2: 后端API (4核8G)
服务器3: 前端 + Nginx (2核4G)
```

### 生产环境配置

**1. 修改生产环境变量**

```bash
cp .env.example .env.production
vim .env.production
```

```env
# 数据库 (使用强密码)
POSTGRES_PASSWORD=<使用密码管理器生成>
JWT_SECRET=<使用密码管理器生成>

# 域名
SUPABASE_URL=https://api.quantfu.com
NEXT_PUBLIC_BACKEND_URL=https://api.quantfu.com
NEXT_PUBLIC_SUPABASE_URL=https://api.quantfu.com

# 环境标识
NODE_ENV=production
PYTHON_ENV=production

# 日志级别
LOG_LEVEL=WARNING
```

**2. 配置Nginx反向代理**

```nginx
# /etc/nginx/sites-available/quantfu.conf

# 前端
server {
    listen 80;
    server_name quantfu.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 后端API
server {
    listen 80;
    server_name api.quantfu.com;

    location / {
        proxy_pass http://localhost:8888;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket支持
    location /ws {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**3. 配置SSL证书 (Let's Encrypt)**

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d quantfu.com -d api.quantfu.com

# 自动续期
sudo certbot renew --dry-run
```

**4. 配置systemd服务**

**后端服务** (`/etc/systemd/system/quantfu-backend.service`):

```ini
[Unit]
Description=QuantFu Backend API
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=quantfu
WorkingDirectory=/opt/quantfu/backend
Environment="PATH=/opt/quantfu/backend/venv/bin"
ExecStart=/opt/quantfu/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8888 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**前端服务** (`/etc/systemd/system/quantfu-frontend.service`):

```ini
[Unit]
Description=QuantFu Frontend
After=network.target

[Service]
Type=simple
User=quantfu
WorkingDirectory=/opt/quantfu/frontend
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**启动服务:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable quantfu-backend
sudo systemctl enable quantfu-frontend
sudo systemctl start quantfu-backend
sudo systemctl start quantfu-frontend

# 查看状态
sudo systemctl status quantfu-backend
sudo systemctl status quantfu-frontend
```

**5. 配置防火墙**

```bash
# 只开放必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

**6. 配置数据库备份**

创建备份脚本 (`/opt/quantfu/scripts/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/opt/quantfu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="quantfu_backup_${DATE}.sql.gz"

# 创建备份
docker exec quantfu_postgres pg_dump -U postgres -d postgres | gzip > "${BACKUP_DIR}/${FILENAME}"

# 保留最近30天备份
find "${BACKUP_DIR}" -name "quantfu_backup_*.sql.gz" -mtime +30 -delete

echo "✅ 备份完成: ${FILENAME}"
```

**设置定时备份** (每天凌晨3点):

```bash
# 添加到crontab
crontab -e

# 添加以下行
0 3 * * * /opt/quantfu/scripts/backup.sh >> /var/log/quantfu_backup.log 2>&1
```

---

## 🐳 Docker部署

### 使用Docker Compose一键部署

**1. 准备生产环境配置**

```bash
# 修改docker-compose.yml中的密码
vim docker-compose.yml

# 或使用环境变量文件
cp .env.example .env.production
```

**2. 构建并启动**

```bash
# 拉取镜像
docker-compose pull

# 启动服务
docker-compose -f docker-compose.yml --env-file .env.production up -d

# 查看日志
docker-compose logs -f
```

**3. 数据持久化**

确保 `docker-compose.yml` 中配置了数据卷:

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/quantfu/postgres  # 使用独立磁盘
```

### Docker Swarm集群部署 (可选)

适合多服务器高可用部署:

```bash
# 初始化Swarm
docker swarm init

# 部署Stack
docker stack deploy -c docker-compose.yml quantfu

# 扩容服务
docker service scale quantfu_backend=3
```

---

## 🔍 故障排查

### 常见问题

**1. Docker容器启动失败**

```bash
# 查看日志
docker-compose logs postgres

# 常见原因: 端口被占用
lsof -i :5432
kill -9 <PID>

# 重新启动
docker-compose down
docker-compose up -d
```

**2. 天勤连接失败**

```bash
# 测试连接
cd backend
python test_tqsdk.py

# 可能原因:
# - 账号密码错误 → 检查 .env
# - 网络问题 → ping openmd.shinnytech.com
# - 账号未激活 → 登录天勤官网激活
```

**3. 前端无法连接后端**

```bash
# 检查后端运行状态
curl http://localhost:8888/health

# 检查CORS配置
cat .env | grep CORS_ORIGINS

# 检查防火墙
sudo ufw status
```

**4. 持仓数据不一致**

```bash
# 查看最近成交记录
docker exec -it quantfu_postgres psql -U postgres -d postgres
SELECT * FROM trades ORDER BY created_at DESC LIMIT 10;

# 手动触发持仓重建
curl -X POST http://localhost:8888/api/positions/rebuild/{account_id}

# 查看持仓快照对比
SELECT * FROM position_snapshots WHERE is_matched = false;
```

**5. 内存不足**

```bash
# 查看容器资源使用
docker stats

# 限制容器内存
docker-compose.yml:
  postgres:
    mem_limit: 2g
    mem_reservation: 1g
```

---

## 📊 监控与维护

### 系统监控

**1. 安装Prometheus + Grafana (可选)**

```bash
# 添加监控服务到docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**2. 关键指标监控**

- **数据库**: 连接数、查询响应时间、磁盘使用
- **后端**: 请求QPS、错误率、内存使用
- **前端**: 页面加载时间、用户活跃度
- **天勤**: WebSocket连接状态、行情延迟

**3. 日志管理**

```bash
# 集中查看日志
docker-compose logs -f --tail=100

# 导出日志
docker-compose logs > quantfu_logs_$(date +%Y%m%d).log

# 日志轮转 (logrotate)
/var/log/quantfu/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
}
```

### 日常维护

**每日检查:**
- [ ] 查看服务运行状态: `docker-compose ps`
- [ ] 检查错误日志: `docker-compose logs --tail=50`
- [ ] 验证数据备份: `ls -lh /opt/quantfu/backups`

**每周检查:**
- [ ] 磁盘空间: `df -h`
- [ ] 数据库大小: `SELECT pg_size_pretty(pg_database_size('postgres'));`
- [ ] 清理旧日志: `find /var/log/quantfu -mtime +30 -delete`

**每月检查:**
- [ ] 更新系统补丁: `sudo apt update && sudo apt upgrade`
- [ ] 更新Docker镜像: `docker-compose pull && docker-compose up -d`
- [ ] 数据库VACUUM: `docker exec quantfu_postgres vacuumdb -U postgres -d postgres -z`

---

## 📞 技术支持

遇到问题?

1. **查看文档**: [README.md](../README.md)
2. **提交Issue**: [GitHub Issues](https://github.com/allen/quantFu/issues)
3. **查看日志**: `docker-compose logs -f`
4. **联系作者**: allen@example.com

---

**部署完成!** 🎉

下一步:
1. 配置极星策略推送 → [极星策略改造指南](极星策略改造指南.md)
2. 测试完整交易流程
3. 配置监控告警
4. 开始实盘交易
