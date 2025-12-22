# 期货量化管理平台 - Makefile

.PHONY: help setup start stop restart logs clean db-init db-seed db-reset

help: ## 显示帮助信息
	@echo "期货量化管理平台 - 可用命令:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## 初始化项目(首次运行)
	@echo "🚀 初始化项目..."
	@cp .env.example .env 2>/dev/null || echo ".env已存在"
	@echo "✅ 请编辑.env文件,修改密码和配置"
	@echo "📝 然后运行: make start"

start: ## 启动所有服务
	@echo "🚀 启动Supabase服务..."
	docker-compose up -d
	@echo "⏳ 等待服务就绪(30秒)..."
	@sleep 30
	@echo "✅ 服务已启动!"
	@echo "📊 Supabase Studio: http://localhost:3001"
	@echo "🔌 PostgreSQL: localhost:5432"
	@echo "📡 REST API: http://localhost:3000"

stop: ## 停止所有服务
	@echo "🛑 停止服务..."
	docker-compose down
	@echo "✅ 服务已停止"

restart: stop start ## 重启所有服务

logs: ## 查看日志
	docker-compose logs -f

clean: ## 清理所有容器和数据
	@echo "⚠️  警告:这将删除所有数据!"
	@read -p "确认删除? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker-compose down -v
	@echo "✅ 已清理"

db-init: ## 初始化数据库表结构
	@echo "📋 执行数据库迁移..."
	docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_init_schema.sql
	@echo "✅ 数据库表结构已创建"

db-seed: ## 导入初始数据
	@echo "🌱 导入种子数据..."
	docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/002_seed_data.sql
	@echo "✅ 初始数据已导入"
	@echo "📝 请编辑 database/seed/002_seed_data.sql 填写实际持仓数据"

db-reset: ## 重置数据库(删除并重建)
	@echo "⚠️  警告:这将删除所有数据!"
	@read -p "确认重置? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker exec -i quantfu_postgres psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	@$(MAKE) db-init
	@$(MAKE) db-seed
	@echo "✅ 数据库已重置"

db-shell: ## 进入数据库Shell
	docker exec -it quantfu_postgres psql -U postgres -d postgres

db-backup: ## 备份数据库
	@echo "💾 备份数据库..."
	@mkdir -p backups
	docker exec quantfu_postgres pg_dump -U postgres -d postgres > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ 备份完成: backups/backup_*.sql"

db-restore: ## 从备份恢复(需指定文件: make db-restore FILE=backups/xxx.sql)
	@echo "📥 恢复数据库..."
	docker exec -i quantfu_postgres psql -U postgres -d postgres < $(FILE)
	@echo "✅ 恢复完成"

dev-backend: ## 启动后端开发服务器
	cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8888

dev-frontend: ## 启动前端开发服务器
	cd frontend && npm run dev

test: ## 运行测试
	@echo "🧪 运行测试..."
	cd backend && pytest

install: ## 安装依赖
	@echo "📦 安装后端依赖..."
	cd backend && pip install -r requirements.txt
	@echo "📦 安装前端依赖..."
	cd frontend && npm install
	@echo "✅ 依赖安装完成"

# ========== 前端开发命令 ==========

dev-clean-ports: ## 清理占用的端口进程
	@echo "🧹 检查并清理旧进程..."
	@# 清理 3000 端口的 Node.js 进程 (前端)
	@NODE_PIDS=$$(lsof -ti:3000 -sTCP:LISTEN 2>/dev/null | xargs -I {} sh -c 'ps -p {} -o comm= | grep -q node && echo {}' 2>/dev/null); \
	if [ -n "$$NODE_PIDS" ]; then \
		echo "  ⚠️  发现 3000 端口的 Node.js 进程，正在清理..."; \
		echo "$$NODE_PIDS" | xargs kill -9 2>/dev/null || true; \
		echo "  ✅ Node.js 进程已清理"; \
	else \
		echo "  ✓ 3000 端口空闲"; \
	fi
	@# 清理 8888 端口的 Python 进程 (后端)
	@PYTHON_PIDS=$$(lsof -ti:8888 -sTCP:LISTEN 2>/dev/null | xargs -I {} sh -c 'ps -p {} -o comm= | grep -q Python && echo {}' 2>/dev/null); \
	if [ -n "$$PYTHON_PIDS" ]; then \
		echo "  ⚠️  发现 8888 端口的 Python 进程，正在清理..."; \
		echo "$$PYTHON_PIDS" | xargs kill -9 2>/dev/null || true; \
		echo "  ✅ Python 进程已清理"; \
	else \
		echo "  ✓ 8888 端口空闲"; \
	fi
	@# 也可以通过进程名直接清理
	@pkill -9 -f "next-server" 2>/dev/null || true
	@pkill -9 -f "uvicorn.*main:app" 2>/dev/null || true
	@# 清理旧的 PID 文件
	@rm -f /tmp/quantfu-backend.pid 2>/dev/null || true
	@echo "✅ 端口清理完成"

dev-full: dev-clean-ports ## 启动完整开发环境(数据库+后端+前端)
	@echo "🚀 启动完整开发环境..."
	@$(MAKE) start
	@echo "⏳ 等待数据库就绪..."
	@sleep 5
	@echo "🔧 后台启动后端..."
	@cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8888 > backend.log 2>&1 & echo $$! > /tmp/quantfu-backend.pid
	@sleep 2
	@echo ""
	@echo "📋 日志文件位置："
	@echo "   后端: $(PWD)/backend/backend.log"
	@echo "   前端: $(PWD)/frontend/frontend.log"
	@echo ""
	@echo "💡 在新终端查看日志："
	@echo "   后端: tail -f $(PWD)/backend/backend.log"
	@echo "   前端: tail -f $(PWD)/frontend/frontend.log"
	@echo ""
	@echo "🎨 启动前端(主进程)..."
	@cd frontend && npm run dev

dev-stop: ## 停止开发环境
	@echo "🛑 停止开发环境..."
	@# 停止后端进程
	@if [ -f /tmp/quantfu-backend.pid ]; then \
		echo "  停止后端进程..."; \
		kill `cat /tmp/quantfu-backend.pid` 2>/dev/null || true; \
		rm /tmp/quantfu-backend.pid; \
	fi
	@# 清理所有相关端口
	@$(MAKE) dev-clean-ports
	@# 停止数据库
	@echo "  停止数据库..."
	@$(MAKE) stop
	@echo "✅ 开发环境已停止"

dev-logs-backend: ## 查看后端实时日志
	@echo "🔍 查看后端日志 (Ctrl+C 退出)..."
	@tail -f backend/backend.log

dev-logs-frontend: ## 查看前端实时日志
	@echo "🔍 查看前端日志 (Ctrl+C 退出)..."
	@tail -f frontend/frontend.log

dev-logs-both: ## 同时查看前后端日志
	@echo "🔍 查看前后端日志 (Ctrl+C 退出)..."
	@tail -f backend/backend.log frontend/frontend.log

frontend-build: ## 构建前端生产版本
	@echo "🏗️  构建前端..."
	cd frontend && npm run build
	@echo "✅ 前端构建完成"

frontend-lint: ## 前端代码检查
	@echo "🔍 检查前端代码..."
	cd frontend && npm run lint
	@echo "✅ 代码检查完成"

frontend-test: ## 运行前端测试
	@echo "🧪 运行前端测试..."
	cd frontend && npm run test
	@echo "✅ 测试完成"

frontend-test-ui: ## 运行前端测试(UI模式)
	cd frontend && npm run test:ui

ui-add: ## 添加shadcn组件(使用: make ui-add COMP=button)
	@if [ -z "$(COMP)" ]; then \
		echo "❌ 请指定组件名: make ui-add COMP=button"; \
		exit 1; \
	fi
	@echo "📦 添加 shadcn/ui 组件: $(COMP)..."
	cd frontend && npx shadcn@latest add $(COMP) --yes
	@echo "✅ 组件添加完成"

# ========== 完整流程命令 ==========

init: setup install start db-init db-seed ## 完整初始化(首次使用)
	@echo "🎉 项目初始化完成!"
	@echo "📝 下一步: make dev-full 启动开发环境"

status: ## 查看服务状态
	@echo "📊 服务状态:"
	@docker-compose ps
	@echo ""
	@echo "🔗 访问地址:"
	@echo "  前端: http://localhost:3000"
	@echo "  后端: http://localhost:8888/docs"
	@echo "  数据库: http://localhost:3001"
