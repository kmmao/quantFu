# QuantFu 快速启动指南

## 🚀 启动开发环境

### 1️⃣ 首次启动前检查环境

运行环境检查脚本，确保所有依赖就绪：

```bash
make check
# 或者直接运行
./check-env.sh
```

### 2️⃣ 启动完整开发环境

```bash
make dev-full
```

这个命令会：
- ✅ 清理旧的端口占用进程
- ✅ 启动 Supabase 数据库服务 (Docker)
- ✅ 后台启动 FastAPI 后端 (端口 8888)
- ✅ 前台启动 Next.js 前端 (端口 3000)

### 3️⃣ 访问服务

启动完成后，你可以访问：

- 🎨 **前端界面**: http://localhost:3000
- 🔌 **后端 API**: http://localhost:8888/docs (Swagger UI)
- 📊 **Supabase Studio**: http://localhost:3001
- 🗄️ **PostgreSQL**: localhost:5432

## 📋 常用命令

### 环境检查

```bash
make check              # 检查所有依赖是否完整
```

### Git 提交

```bash
make commit             # 交互式提交 (遵循 Conventional Commits)
make quick-commit       # 快速提交所有更改

# 详细文档: scripts/GIT_COMMIT_GUIDE.md
```

### 开发环境管理

```bash
make dev-full           # 启动完整开发环境 (数据库+后端+前端)
make dev-stop           # 停止开发环境
make dev-clean-ports    # 清理占用的端口
```

### 查看日志

```bash
make dev-logs-backend   # 查看后端日志
make dev-logs-frontend  # 查看前端日志
make dev-logs-both      # 同时查看前后端日志
```

或者直接查看日志文件：

```bash
tail -f backend/backend.log   # 后端日志
tail -f frontend/frontend.log # 前端日志
```

### 数据库管理

```bash
make start              # 仅启动 Supabase 数据库
make stop               # 停止数据库
make db-shell           # 进入数据库 Shell
make db-init            # 初始化数据库表结构
make db-seed            # 导入种子数据
make db-reset           # 重置数据库 (危险操作！)
```

### 代码质量

```bash
# 前端
cd frontend
npm run lint            # 代码检查
npm run build           # 构建生产版本
npm run test            # 运行 E2E 测试
npm run test:ui         # 运行测试 (UI 模式)

# 后端
cd backend
source .venv/bin/activate
pytest                  # 运行单元测试
```

## 🔧 故障排查

### 问题 1: 端口被占用

**症状**: 启动时提示端口 3000/8888 被占用

**解决**:
```bash
make dev-clean-ports
```

### 问题 2: Docker 服务未启动

**症状**: `Cannot connect to the Docker daemon`

**解决**: 启动 Docker Desktop 应用

### 问题 3: 前端依赖缺失

**症状**: `Module not found` 错误

**解决**:
```bash
cd frontend
npm install
```

### 问题 4: 后端虚拟环境问题

**症状**: `ModuleNotFoundError` 或 Python 包导入错误

**解决** (推荐使用 uv):
```bash
cd backend
rm -rf .venv
uv venv && uv sync
```

或使用传统方式:
```bash
cd backend
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 问题 5: 数据库连接失败

**症状**: 后端无法连接数据库

**检查步骤**:
1. 确认 Docker 容器运行中: `docker ps`
2. 检查 .env 文件中的数据库密码配置
3. 重启数据库: `make restart`

## 📝 开发工作流

### 典型的开发流程

1. **启动环境**
   ```bash
   make dev-full
   ```

2. **开发代码**
   - 前端代码自动热重载 (修改后自动刷新)
   - 后端代码自动重启 (uvicorn --reload)

3. **查看日志** (新开终端)
   ```bash
   make dev-logs-both
   ```

4. **运行测试**
   ```bash
   # 前端测试
   cd frontend && npm test

   # 后端测试 (使用 uv)
   cd backend && uv run pytest
   # 或使用传统方式
   cd backend && source .venv/bin/activate && pytest
   ```

5. **停止环境**
   ```bash
   make dev-stop
   # 或者直接 Ctrl+C 停止前端，然后运行
   make dev-stop
   ```

### Git 工作流

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
# 功能开发
git checkout -b feature/your-feature
# ... 编写代码 ...
git add .
git commit -m "feat: 添加新功能描述"

# Bug 修复
git checkout -b fix/bug-name
# ... 修复代码 ...
git commit -m "fix: 修复 XXX 问题"

# 重构
git commit -m "refactor: 重构 XXX 模块"

# 文档更新
git commit -m "docs: 更新 XXX 文档"

# 测试
git commit -m "test: 添加 XXX 测试"
```

## ⚡ 性能优化建议

### 开发环境优化

1. **使用 uv 管理 Python 依赖** (推荐):
   - uv 比传统 pip 快 10-100 倍
   - 安装: `curl -LsSf https://astral.sh/uv/install.sh | sh`
   - 项目已配置好 `pyproject.toml`，直接使用 `uv sync`
2. **使用 SSD**: 确保项目在 SSD 上，提升 Docker 和 Node.js 性能
3. **分配足够的 Docker 资源**:
   - Docker Desktop → Settings → Resources
   - 建议至少 4GB 内存，2 CPU 核心
4. **使用 npm/yarn 缓存**: 避免重复安装依赖

### 代码编辑器配置

推荐安装以下 VSCode 插件：
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Python
- Docker
- GitLens

## 📚 更多资源

- [完整开发规范](.claude/CLAUDE.md)
- [架构设计文档](.claude/core/architecture-principles.md)
- [测试策略](.claude/core/testing-strategy.md)
- [API 文档](http://localhost:8888/docs) (启动后端后访问)

## 🆘 需要帮助？

遇到问题？尝试以下步骤：

1. 运行环境检查: `make check`
2. 查看日志: `make dev-logs-both`
3. 重启服务: `make dev-stop && make dev-full`
4. 检查 GitHub Issues
5. 联系团队成员

---

**最后更新**: 2025-12-23
**维护者**: allen + AI
