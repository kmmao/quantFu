# QuantFu 后端 - Makefile
#
# 快速开始:
#   make dev        - 启动开发服务器
#   make test       - 运行测试
#
# 注意: 本项目使用 uv 包管理器 (如果可用)

.PHONY: help dev test lint format type-check clean
.PHONY: install update

# 检测 uv 是否可用
UV_AVAILABLE := $(shell command -v uv 2> /dev/null)

help: ## 显示帮助信息
	@echo "═══════════════════════════════════════════"
	@echo "  QuantFu 后端 - 可用命令"
	@echo "═══════════════════════════════════════════"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@if [ -n "$(UV_AVAILABLE)" ]; then \
		echo "📦 包管理器: uv (高速)"; \
	else \
		echo "📦 包管理器: pip (标准)"; \
		echo "💡 安装 uv 以提升速度: curl -LsSf https://astral.sh/uv/install.sh | sh"; \
	fi
	@echo ""
	@echo "💡 提示: 主项目命令请返回根目录运行 'make help'"
	@echo ""

# ==========================================
# 开发命令
# ==========================================

dev: ## 启动开发服务器 (http://localhost:8888)
	@echo "🔧 启动后端开发服务器..."
ifdef UV_AVAILABLE
	@uv run uvicorn main:app --reload --port 8888
else
	@source .venv/bin/activate && uvicorn main:app --reload --port 8888
endif

dev-bg: ## 后台启动开发服务器
	@echo "🔧 后台启动后端开发服务器..."
ifdef UV_AVAILABLE
	@uv run uvicorn main:app --reload --port 8888 > backend.log 2>&1 & echo $$! > /tmp/quantfu-backend.pid
else
	@source .venv/bin/activate && uvicorn main:app --reload --port 8888 > backend.log 2>&1 & echo $$! > /tmp/quantfu-backend.pid
endif
	@echo "✅ 后端服务已在后台启动"
	@echo "📋 查看日志: make logs"

stop: ## 停止后台服务
	@if [ -f /tmp/quantfu-backend.pid ]; then \
		echo "🛑 停止后端服务..."; \
		kill `cat /tmp/quantfu-backend.pid` 2>/dev/null || true; \
		rm /tmp/quantfu-backend.pid; \
		echo "✅ 后端服务已停止"; \
	else \
		echo "❌ 未找到运行中的后台服务"; \
	fi

# ==========================================
# 测试命令
# ==========================================

test: ## 运行测试
	@echo "🧪 运行后端测试..."
ifdef UV_AVAILABLE
	@uv run pytest
else
	@source .venv/bin/activate && pytest
endif

test-verbose: ## 运行测试 (详细模式)
	@echo "🧪 运行测试 (详细模式)..."
ifdef UV_AVAILABLE
	@uv run pytest -v
else
	@source .venv/bin/activate && pytest -v
endif

test-coverage: ## 运行测试并生成覆盖率报告
	@echo "🧪 运行测试并生成覆盖率..."
ifdef UV_AVAILABLE
	@uv run pytest --cov=. --cov-report=html --cov-report=term
else
	@source .venv/bin/activate && pytest --cov=. --cov-report=html --cov-report=term
endif
	@echo "📊 覆盖率报告: htmlcov/index.html"

test-watch: ## 运行测试 (监听模式)
	@echo "🧪 运行测试 (监听模式)..."
ifdef UV_AVAILABLE
	@uv run pytest-watch
else
	@source .venv/bin/activate && pytest-watch
endif

# ==========================================
# 代码质量
# ==========================================

lint: ## 代码检查 (ruff)
	@echo "🔍 检查代码质量..."
ifdef UV_AVAILABLE
	@uv run ruff check .
else
	@source .venv/bin/activate && ruff check .
endif

lint-fix: ## 自动修复代码问题
	@echo "🔧 自动修复代码问题..."
ifdef UV_AVAILABLE
	@uv run ruff check --fix .
else
	@source .venv/bin/activate && ruff check --fix .
endif

format: ## 格式化代码 (ruff format)
	@echo "✨ 格式化代码..."
ifdef UV_AVAILABLE
	@uv run ruff format .
else
	@source .venv/bin/activate && ruff format .
endif

type-check: ## 类型检查 (mypy)
	@echo "🔍 类型检查..."
ifdef UV_AVAILABLE
	@uv run mypy .
else
	@source .venv/bin/activate && mypy .
endif

# ==========================================
# 依赖管理
# ==========================================

install: ## 安装依赖
	@echo "📦 安装后端依赖..."
ifdef UV_AVAILABLE
	@echo "  使用 uv 安装..."
	@uv venv
	@uv sync
else
	@echo "  使用 pip 安装..."
	@python3 -m venv .venv
	@source .venv/bin/activate && pip install -r requirements.txt
endif
	@echo "✅ 依赖安装完成"

update: ## 更新依赖
	@echo "📦 更新依赖..."
ifdef UV_AVAILABLE
	@uv sync --upgrade
else
	@source .venv/bin/activate && pip install --upgrade -r requirements.txt
endif
	@echo "✅ 依赖已更新"

add: ## 添加新依赖 (使用: make add PKG=package-name)
	@if [ -z "$(PKG)" ]; then \
		echo "❌ 请指定包名称"; \
		echo "   示例: make add PKG=requests"; \
		exit 1; \
	fi
	@echo "📦 添加依赖: $(PKG)..."
ifdef UV_AVAILABLE
	@uv add $(PKG)
else
	@source .venv/bin/activate && pip install $(PKG) && pip freeze > requirements.txt
endif
	@echo "✅ 依赖已添加"

check-deps: ## 检查依赖完整性
	@echo "🔍 检查依赖..."
ifdef UV_AVAILABLE
	@uv pip list
else
	@source .venv/bin/activate && pip list
endif

# ==========================================
# 清理命令
# ==========================================

clean: ## 清理缓存和临时文件
	@echo "🧹 清理缓存..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@find . -type f -name ".coverage" -delete 2>/dev/null || true
	@rm -f backend.log 2>/dev/null || true
	@echo "✅ 清理完成"

clean-all: ## 清理所有文件 (包括虚拟环境)
	@echo "⚠️  警告: 这将删除虚拟环境!"
	@read -p "确认删除? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@$(MAKE) clean
	@rm -rf .venv uv.lock
	@echo "✅ 已清理所有文件"
	@echo "💡 重新安装依赖: make install"

# ==========================================
# 开发工具
# ==========================================

shell: ## 进入 Python REPL
	@echo "🐍 进入 Python REPL..."
ifdef UV_AVAILABLE
	@uv run python
else
	@source .venv/bin/activate && python
endif

logs: ## 查看开发日志
	@if [ -f "backend.log" ]; then \
		echo "🔍 查看后端日志 (Ctrl+C 退出)..."; \
		tail -f backend.log; \
	else \
		echo "❌ 日志文件不存在: backend.log"; \
		echo "💡 请先启动后台服务: make dev-bg"; \
	fi

# ==========================================
# 数据库工具
# ==========================================

db-migrate: ## 运行数据库迁移 (使用 Alembic)
	@echo "📋 运行数据库迁移..."
ifdef UV_AVAILABLE
	@uv run alembic upgrade head
else
	@source .venv/bin/activate && alembic upgrade head
endif
	@echo "✅ 迁移完成"

db-revision: ## 创建新的迁移文件 (使用: make db-revision MSG="message")
	@if [ -z "$(MSG)" ]; then \
		echo "❌ 请提供迁移说明"; \
		echo "   示例: make db-revision MSG=\"add user table\""; \
		exit 1; \
	fi
	@echo "📝 创建迁移文件..."
ifdef UV_AVAILABLE
	@uv run alembic revision --autogenerate -m "$(MSG)"
else
	@source .venv/bin/activate && alembic revision --autogenerate -m "$(MSG)"
endif
	@echo "✅ 迁移文件已创建"
