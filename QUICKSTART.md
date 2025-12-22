# QuantFu 快速启动指南

> 5分钟上手期货量化管理平台

---

## 🚀 首次使用(完整初始化)

```bash
# 1. 克隆项目
git clone https://github.com/allen/quantFu.git
cd quantFu

# 2. 一键初始化(会自动安装依赖、启动数据库、创建表结构)
make init

# 3. 启动开发环境
make dev-full
```

**访问地址:**
- 前端: http://localhost:3000
- 后端API: http://localhost:8888/docs
- 数据库管理: http://localhost:3001

---

## 📋 日常开发命令

### 启动服务

```bash
# 启动完整开发环境(数据库+后端+前端)
make dev-full

# 只启动数据库
make start

# 只启动前端
make dev-frontend

# 只启动后端
make dev-backend
```

### 停止服务

```bash
# 停止开发环境
make dev-stop

# 停止数据库
make stop

# Ctrl+C 停止前端/后端
```

### 查看状态

```bash
# 查看服务状态
make status

# 查看实时日志
make logs
```

---

## 🎨 前端开发

### 添加 UI 组件

```bash
# 添加单个组件
make ui-add COMP=popover

# 添加多个组件(需要分别执行)
make ui-add COMP=tooltip
make ui-add COMP=calendar
```

**可用组件列表:** https://ui.shadcn.com/docs/components

### 代码检查和测试

```bash
# 代码检查(ESLint)
make frontend-lint

# 运行测试(Playwright)
make frontend-test

# 测试 UI 模式(可视化)
make frontend-test-ui

# 构建生产版本
make frontend-build
```

---

## 🗄️ 数据库管理

### 基础操作

```bash
# 进入数据库 Shell
make db-shell

# 查看表结构
\dt

# 退出
\q
```

### 数据操作

```bash
# 重新导入种子数据
make db-seed

# 完全重置数据库(危险!)
make db-reset

# 备份数据库
make db-backup

# 从备份恢复
make db-restore FILE=backups/backup_20251222_120000.sql
```

---

## 🔧 常见问题

### 1. 端口被占用

```bash
# 停止所有服务
make stop

# 检查端口占用
lsof -i :3000  # 前端
lsof -i :8888  # 后端
lsof -i :5432  # 数据库
```

### 2. 数据库连接失败

```bash
# 检查 Docker 容器状态
docker ps

# 查看数据库日志
make logs
```

### 3. 前端依赖问题

```bash
# 重新安装依赖
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 4. 后端依赖问题

```bash
# 重新安装依赖
cd backend
pip install -r requirements.txt --force-reinstall
```

---

## 📚 更多命令

```bash
# 查看所有可用命令
make help

# 清理所有容器和数据(谨慎!)
make clean
```

---

## 🎯 开发工作流推荐

### 方案 A: 只开发前端

```bash
# 1. 启动数据库
make start

# 2. 启动前端
make dev-frontend
```

### 方案 B: 全栈开发

```bash
# 一键启动所有服务
make dev-full
```

### 方案 C: 分离调试

**终端 1 - 数据库:**
```bash
make start
```

**终端 2 - 后端:**
```bash
make dev-backend
```

**终端 3 - 前端:**
```bash
make dev-frontend
```

---

## 🔐 环境变量配置

首次使用需要编辑 `.env` 文件:

```env
# 必须修改
POSTGRES_PASSWORD=your-strong-password
JWT_SECRET=your-jwt-secret-32-chars

# 如需使用天勤和极星
TQSDK_USER=your-tqsdk-username
TQSDK_PASSWORD=your-tqsdk-password
POLAR_API_KEY=your-polar-api-key
```

---

**最后更新:** 2025-12-22
**版本:** 1.0.0
