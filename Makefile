# 期货量化管理平台 - 主 Makefile
#
# 快速开始:
#   make check      - 检查环境
#   make dev        - 启动开发环境
#   前端命令: cd frontend && make help
#   后端命令: cd backend && make help

.PHONY: help check start stop restart clean status logs
.PHONY: dev dev-stop install test
.PHONY: db-init db-seed db-reset db-shell
.PHONY: commit quick-commit

# ==========================================
# 核心命令
# ==========================================

help: ## 显示帮助信息
	@echo "═══════════════════════════════════════════"
	@echo "  期货量化管理平台 - 可用命令"
	@echo "═══════════════════════════════════════════"
	@echo ""
	@echo "🚀 开发流程:"
	@grep -E '^(check|dev|dev-stop|logs|test|install):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🐳 环境管理:"
	@grep -E '^(start|stop|restart|clean|status):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🗄️  数据库:"
	@grep -E '^(db-init|db-seed|db-reset|db-shell):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📝 Git:"
	@grep -E '^(commit|quick-commit):.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "📦 模块化命令:"
	@echo "  \033[36mfrontend        \033[0m cd frontend && make help (构建、测试、UI组件)"
	@echo "  \033[36mbackend         \033[0m cd backend && make help  (测试、格式化、类型检查)"
	@echo ""

# ==========================================
# 开发流程
# ==========================================

check: ## 检查开发环境依赖
	@./check-env.sh

dev: _dev-clean-ports ## 启动完整开发环境 (数据库+后端+前端)
	@echo "🚀 启动完整开发环境..."
	@$(MAKE) start
	@echo "⏳ 等待数据库就绪..."
	@sleep 5
	@echo "🔧 后台启动后端..."
	@if command -v uv &> /dev/null; then \
		cd backend && uv run uvicorn main:app --reload --port 8888 > backend.log 2>&1 & echo $$! > /tmp/quantfu-backend.pid; \
	else \
		cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8888 > backend.log 2>&1 & echo $$! > /tmp/quantfu-backend.pid; \
	fi
	@sleep 2
	@echo ""
	@echo "📋 日志文件位置："
	@echo "   后端: $(PWD)/backend/backend.log"
	@echo "   前端: $(PWD)/frontend/frontend.log"
	@echo ""
	@echo "💡 在新终端查看日志："
	@echo "   后端: make logs COMPONENT=backend"
	@echo "   前端: make logs COMPONENT=frontend"
	@echo "   全部: make logs"
	@echo ""
	@echo "🎨 启动前端(主进程)..."
	@cd frontend && npm run dev

dev-stop: ## 停止开发环境
	@echo "🛑 停止开发环境..."
	@if [ -f /tmp/quantfu-backend.pid ]; then \
		echo "  停止后端进程..."; \
		kill `cat /tmp/quantfu-backend.pid` 2>/dev/null || true; \
		rm /tmp/quantfu-backend.pid; \
	fi
	@$(MAKE) _dev-clean-ports
	@echo "  停止数据库..."
	@$(MAKE) stop
	@echo "✅ 开发环境已停止"

logs: ## 查看实时日志 (COMPONENT=backend/frontend/all, 默认all)
	@if [ "$(COMPONENT)" = "backend" ]; then \
		echo "🔍 查看后端日志 (Ctrl+C 退出)..."; \
		tail -f backend/backend.log; \
	elif [ "$(COMPONENT)" = "frontend" ]; then \
		echo "🔍 查看前端日志 (Ctrl+C 退出)..."; \
		tail -f frontend/frontend.log; \
	else \
		echo "🔍 查看前后端日志 (Ctrl+C 退出)..."; \
		tail -f backend/backend.log frontend/frontend.log; \
	fi

install: ## 安装所有依赖
	@echo "📦 安装后端依赖..."
	@if command -v uv &> /dev/null; then \
		echo "  使用 uv 安装后端依赖..."; \
		cd backend && uv venv && uv sync; \
	else \
		echo "  使用 pip 安装后端依赖..."; \
		cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt; \
	fi
	@echo "📦 安装前端依赖..."
	@cd frontend && npm install
	@echo "✅ 依赖安装完成"

test: ## 运行所有测试 (SCOPE=backend/frontend/all, 默认all)
	@if [ "$(SCOPE)" = "backend" ]; then \
		echo "🧪 运行后端测试..."; \
		cd backend && make test; \
	elif [ "$(SCOPE)" = "frontend" ]; then \
		echo "🧪 运行前端测试..."; \
		cd frontend && make test; \
	else \
		echo "🧪 运行所有测试..."; \
		cd backend && make test && cd ../frontend && make test; \
	fi

# ==========================================
# 环境管理
# ==========================================

start: ## 启动所有服务
	@echo "🚀 启动 Supabase 服务..."
	@docker-compose up -d
	@echo "⏳ 等待服务就绪(30秒)..."
	@sleep 30
	@echo "✅ 服务已启动!"
	@echo "📊 Supabase Studio: http://localhost:3001"
	@echo "🔌 PostgreSQL: localhost:5432"
	@echo "📡 REST API: http://localhost:3333"

stop: ## 停止所有服务
	@echo "🛑 停止服务..."
	@docker-compose down
	@echo "✅ 服务已停止"

restart: stop start ## 重启所有服务

clean: ## 清理所有容器和数据 (⚠️ 危险操作)
	@echo "⚠️  警告: 这将删除所有数据!"
	@read -p "确认删除? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker-compose down -v
	@echo "✅ 已清理"

status: ## 查看服务状态
	@echo "📊 服务状态:"
	@docker-compose ps
	@echo ""
	@echo "🔗 访问地址:"
	@echo "  前端开发: http://localhost:3000"
	@echo "  后端 API: http://localhost:8888/docs"
	@echo "  Supabase Studio: http://localhost:3001"
	@echo "  PostgREST API: http://localhost:3333"

# ==========================================
# 数据库管理
# ==========================================

db-init: ## 初始化数据库表结构
	@echo "📋 执行数据库迁移..."
	@echo "  1/2 创建 Supabase 角色和权限..."
	@docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/000_supabase_roles.sql
	@echo "  2/2 创建数据库表结构..."
	@docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_init_schema.sql
	@echo "🔄 重启 PostgREST 刷新 schema cache..."
	@docker restart quantfu_rest > /dev/null 2>&1
	@sleep 2
	@echo "✅ 数据库初始化完成"
	@echo "📊 PostgREST API: http://localhost:3333"

db-seed: ## 导入初始数据
	@echo "🌱 导入种子数据..."
	@docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/002_seed_data.sql
	@echo "✅ 初始数据已导入"
	@echo "📝 请编辑 database/seed/002_seed_data.sql 填写实际持仓数据"

db-reset: ## 重置数据库 (删除并重建, ⚠️ 危险操作)
	@echo "⚠️  警告: 这将删除所有数据!"
	@read -p "确认重置? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@docker exec -i quantfu_postgres psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@$(MAKE) db-init
	@$(MAKE) db-seed
	@echo "✅ 数据库已重置"

db-shell: ## 进入数据库 Shell
	@docker exec -it quantfu_postgres psql -U postgres -d postgres

# 数据库高级功能（隐藏，不在主 help 中显示）
db-backup:
	@echo "💾 备份数据库..."
	@mkdir -p backups
	@docker exec quantfu_postgres pg_dump -U postgres -d postgres > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ 备份完成: backups/backup_*.sql"

db-restore:
	@echo "📥 恢复数据库..."
	@docker exec -i quantfu_postgres psql -U postgres -d postgres < $(FILE)
	@echo "✅ 恢复完成"

# ==========================================
# Git 提交
# ==========================================

commit: ## 交互式 Git 提交 (遵循 Conventional Commits)
	@./scripts/git-commit.sh

quick-commit: ## 快速提交当前所有更改
	@echo "🚀 快速提交..."
	@./scripts/quick-commit.sh

# ==========================================
# 内部命令 (不显示在 help 中)
# ==========================================

_dev-clean-ports:
	@echo "🧹 检查并清理旧进程..."
	@NODE_PIDS=$$(lsof -ti:3000 -sTCP:LISTEN 2>/dev/null | xargs -I {} sh -c 'ps -p {} -o comm= | grep -q node && echo {}' 2>/dev/null); \
	if [ -n "$$NODE_PIDS" ]; then \
		echo "  ⚠️  发现 3000 端口的 Node.js 进程，正在清理..."; \
		echo "$$NODE_PIDS" | xargs kill -9 2>/dev/null || true; \
		echo "  ✅ Node.js 进程已清理"; \
	else \
		echo "  ✓ 3000 端口空闲"; \
	fi
	@PYTHON_PIDS=$$(lsof -ti:8888 -sTCP:LISTEN 2>/dev/null | xargs -I {} sh -c 'ps -p {} -o comm= | grep -q Python && echo {}' 2>/dev/null); \
	if [ -n "$$PYTHON_PIDS" ]; then \
		echo "  ⚠️  发现 8888 端口的 Python 进程，正在清理..."; \
		echo "$$PYTHON_PIDS" | xargs kill -9 2>/dev/null || true; \
		echo "  ✅ Python 进程已清理"; \
	else \
		echo "  ✓ 8888 端口空闲"; \
	fi
	@pkill -9 -f "next-server" 2>/dev/null || true
	@pkill -9 -f "uvicorn.*main:app" 2>/dev/null || true
	@rm -f /tmp/quantfu-backend.pid 2>/dev/null || true
	@echo "✅ 端口清理完成"

# ==========================================
# 遗留命令兼容性 (逐步废弃)
# ==========================================

dev-full: dev
	@echo "⚠️  'dev-full' 已废弃，请使用 'make dev'"

setup:
	@echo "⚠️  'setup' 已废弃"
	@echo "📝 首次设置请参考: QUICK_START.md"
	@echo "💡 快速开始: make check && make install && make dev"

init:
	@echo "⚠️  'init' 已废弃"
	@echo "📝 首次初始化请运行:"
	@echo "  1. make install"
	@echo "  2. make start"
	@echo "  3. make db-init"
	@echo "  4. make dev"
