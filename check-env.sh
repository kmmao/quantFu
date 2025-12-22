#!/bin/bash
# ========================================
# QuantFu 环境依赖检查脚本
# ========================================
# 在运行 make dev-full 前检查所有依赖是否就绪

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查结果计数
PASSED=0
FAILED=0
WARNINGS=0

# 打印函数
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_check() {
    echo -n "  ⏳ 检查 $1... "
}

print_pass() {
    echo -e "${GREEN}✓ 通过${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ 失败${NC}"
    if [ -n "$1" ]; then
        echo -e "     ${RED}→ $1${NC}"
    fi
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}⚠ 警告${NC}"
    if [ -n "$1" ]; then
        echo -e "     ${YELLOW}→ $1${NC}"
    fi
    ((WARNINGS++))
}

print_info() {
    echo -e "     ${BLUE}→ $1${NC}"
}

# ========================================
# 1. 检查系统工具
# ========================================
print_header "1. 系统工具检查"

# Docker
print_check "Docker"
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_pass
    print_info "版本: $DOCKER_VERSION"
else
    print_fail "未安装 Docker"
    echo -e "     ${YELLOW}安装: https://docs.docker.com/get-docker/${NC}"
fi

# Docker Compose
print_check "Docker Compose"
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $4}')
    print_pass
    print_info "版本: $COMPOSE_VERSION"
else
    print_fail "未安装 Docker Compose"
    echo -e "     ${YELLOW}安装: https://docs.docker.com/compose/install/${NC}"
fi

# Docker 是否运行
print_check "Docker 守护进程"
if docker ps &> /dev/null; then
    print_pass
else
    print_fail "Docker 未运行，请启动 Docker Desktop"
fi

# Node.js
print_check "Node.js"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_pass
    print_info "版本: $NODE_VERSION"
    # 检查版本是否 >= 18
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 18 ]; then
        print_warn "建议使用 Node.js 18 或更高版本"
    fi
else
    print_fail "未安装 Node.js"
    echo -e "     ${YELLOW}安装: https://nodejs.org/${NC}"
fi

# npm
print_check "npm"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_pass
    print_info "版本: $NPM_VERSION"
else
    print_fail "未安装 npm (通常随 Node.js 一起安装)"
fi

# Python
print_check "Python 3"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    print_pass
    print_info "版本: $PYTHON_VERSION"
    # 检查版本是否 >= 3.8
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    if [ "$PYTHON_MINOR" -lt 8 ]; then
        print_warn "建议使用 Python 3.8 或更高版本"
    fi
else
    print_fail "未安装 Python 3"
fi

# uv (Python 包管理器)
print_check "uv (推荐)"
if command -v uv &> /dev/null; then
    UV_VERSION=$(uv --version | awk '{print $2}')
    print_pass
    print_info "版本: $UV_VERSION"
else
    print_warn "未安装 uv，将使用传统 pip"
    print_info "安装 uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
fi

# pip (备用)
print_check "pip (备用)"
if command -v pip3 &> /dev/null || command -v pip &> /dev/null; then
    if command -v pip3 &> /dev/null; then
        PIP_VERSION=$(pip3 --version | awk '{print $2}')
    else
        PIP_VERSION=$(pip --version | awk '{print $2}')
    fi
    print_pass
    print_info "版本: $PIP_VERSION"
else
    print_warn "未安装 pip"
fi

# lsof (用于端口清理)
print_check "lsof (端口管理工具)"
if command -v lsof &> /dev/null; then
    print_pass
else
    print_warn "未安装 lsof，端口清理功能可能不可用"
fi

# psql (可选，用于数据库调试)
print_check "psql (PostgreSQL 客户端)"
if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    print_pass
    print_info "版本: $PSQL_VERSION"
else
    print_warn "未安装 psql，数据库调试可能不便"
    print_info "macOS 安装: brew install postgresql"
fi

# ========================================
# 2. 检查环境变量配置
# ========================================
print_header "2. 环境变量配置"

# 根目录 .env
print_check "根目录 .env 文件"
if [ -f ".env" ]; then
    print_pass

    # 检查关键变量
    echo -e "\n  ${BLUE}检查关键环境变量:${NC}"

    check_env_var() {
        local var_name=$1
        local default_value=$2
        local is_critical=${3:-false}

        echo -n "    • $var_name: "
        if grep -q "^${var_name}=" .env; then
            VALUE=$(grep "^${var_name}=" .env | cut -d'=' -f2-)
            if [ "$VALUE" == "$default_value" ] || [ "$VALUE" == "your-"* ] || [ "$VALUE" == "change-me"* ]; then
                if [ "$is_critical" == "true" ]; then
                    echo -e "${RED}✗ 需要修改${NC}"
                    ((FAILED++))
                else
                    echo -e "${YELLOW}⚠ 使用默认值${NC}"
                    ((WARNINGS++))
                fi
            else
                echo -e "${GREEN}✓ 已配置${NC}"
                ((PASSED++))
            fi
        else
            if [ "$is_critical" == "true" ]; then
                echo -e "${RED}✗ 缺失${NC}"
                ((FAILED++))
            else
                echo -e "${YELLOW}⚠ 缺失${NC}"
                ((WARNINGS++))
            fi
        fi
    }

    # 关键变量检查
    check_env_var "POSTGRES_PASSWORD" "your-super-secret-password-change-me" true
    check_env_var "JWT_SECRET" "your-super-secret-jwt-token" true
    check_env_var "TQSDK_USER" "your-tq-username-change-me" true
    check_env_var "TQSDK_PASSWORD" "your-tq-password-change-me" true

    # 可选变量
    echo -e "\n  ${BLUE}可选环境变量:${NC}"
    check_env_var "POLAR_API_KEY" "your-polar-api-key-change-me"
    check_env_var "NTFY_URL" ""

    # 检查 docker-compose 需要的额外变量
    echo -e "\n  ${BLUE}Docker Compose 额外变量:${NC}"
    echo -n "    • AUTHENTICATOR_PASSWORD: "
    if grep -q "^AUTHENTICATOR_PASSWORD=" .env; then
        echo -e "${GREEN}✓ 已配置${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ 缺失 (建议添加)${NC}"
        print_info "添加: AUTHENTICATOR_PASSWORD=\$(openssl rand -base64 32)"
        ((WARNINGS++))
    fi

    echo -n "    • PG_META_CRYPTO_KEY: "
    if grep -q "^PG_META_CRYPTO_KEY=" .env; then
        echo -e "${GREEN}✓ 已配置${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ 缺失 (建议添加)${NC}"
        print_info "添加: PG_META_CRYPTO_KEY=\$(openssl rand -base64 32)"
        ((WARNINGS++))
    fi

    echo -n "    • SECRET_KEY_BASE: "
    if grep -q "^SECRET_KEY_BASE=" .env; then
        echo -e "${GREEN}✓ 已配置${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ 缺失 (建议添加)${NC}"
        print_info "添加: SECRET_KEY_BASE=\$(openssl rand -base64 64)"
        ((WARNINGS++))
    fi

else
    print_fail "请先复制 .env.example 到 .env"
    print_info "运行: cp .env.example .env"
fi

# backend/.env
print_check "backend/.env 文件"
if [ -f "backend/.env" ]; then
    print_pass
else
    print_warn "建议创建 backend/.env"
    print_info "运行: cp backend/.env.example backend/.env"
fi

# frontend/.env
print_check "frontend/.env 文件"
if [ -f "frontend/.env.local" ] || [ -f "frontend/.env" ]; then
    print_pass
else
    print_warn "建议创建 frontend/.env.local"
    print_info "运行: cp frontend/.env.example frontend/.env.local"
fi

# ========================================
# 3. 检查前端依赖
# ========================================
print_header "3. 前端依赖"

print_check "frontend/node_modules"
if [ -d "frontend/node_modules" ]; then
    # 检查关键包
    MISSING_PACKAGES=0
    CRITICAL_PACKAGES=(
        "next"
        "react"
        "react-dom"
        "@supabase/supabase-js"
        "typescript"
        "recharts"
        "lightweight-charts"
        "@tanstack/react-query"
        "lucide-react"
    )

    for pkg in "${CRITICAL_PACKAGES[@]}"; do
        if [ ! -d "frontend/node_modules/$pkg" ]; then
            ((MISSING_PACKAGES++))
        fi
    done

    if [ $MISSING_PACKAGES -eq 0 ]; then
        print_pass
        # 统计包数量
        PKG_COUNT=$(ls -1 frontend/node_modules | wc -l | xargs)
        print_info "已安装 $PKG_COUNT 个包"

        # 额外检查：验证 package.json 和实际安装是否一致
        echo -e "\n  ${BLUE}验证 package.json 依赖完整性:${NC}"
        if command -v node &> /dev/null; then
            cd frontend
            NPM_CHECK_OUTPUT=$(npm ls --depth=0 2>&1)
            if echo "$NPM_CHECK_OUTPUT" | grep -q "missing:"; then
                echo -e "    ${YELLOW}⚠ 发现缺失的包${NC}"
                echo "$NPM_CHECK_OUTPUT" | grep "missing:" | head -5 | sed 's/^/      /'
                echo -e "    ${BLUE}→ 运行: cd frontend && npm install${NC}"
                ((WARNINGS++))
            else
                echo -e "    ${GREEN}✓ 所有依赖完整${NC}"
                ((PASSED++))
            fi
            cd - > /dev/null
        fi
    else
        print_warn "缺少 $MISSING_PACKAGES 个关键包"
        print_info "运行: cd frontend && npm install"
    fi
else
    print_fail "未安装前端依赖"
    print_info "运行: cd frontend && npm install"
fi

# 检查 Playwright (测试工具)
print_check "Playwright 浏览器"
if [ -d "frontend/node_modules/@playwright/test" ]; then
    # 检查 Playwright 浏览器是否安装
    if cd frontend && npx playwright --version &> /dev/null; then
        print_pass
    else
        print_warn "Playwright 已安装但浏览器未安装"
        print_info "运行: cd frontend && npx playwright install"
    fi
    cd - > /dev/null
else
    print_warn "Playwright 未安装 (仅影响测试)"
fi

# ========================================
# 4. 检查后端依赖
# ========================================
print_header "4. 后端依赖"

print_check "backend/.venv (虚拟环境)"
if [ -d "backend/.venv" ]; then
    print_pass

    # 检查虚拟环境中的关键包
    print_check "虚拟环境中的 Python 包"
    if [ -f "backend/.venv/bin/python" ]; then
        VENV_PYTHON="backend/.venv/bin/python"

        # 检查关键包
        MISSING_PKGS=0
        CRITICAL_PKGS=("fastapi" "uvicorn" "supabase" "tqsdk" "pytest")

        for pkg in "${CRITICAL_PKGS[@]}"; do
            if ! $VENV_PYTHON -c "import $pkg" &> /dev/null; then
                ((MISSING_PKGS++))
            fi
        done

        if [ $MISSING_PKGS -eq 0 ]; then
            print_pass
            # 统计包数量 (兼容 uv 和 pip)
            if command -v uv &> /dev/null && [ -f "backend/uv.lock" ]; then
                PKG_COUNT=$(cd backend && uv pip list 2>/dev/null | grep -v "^Package" | grep -v "^-" | grep -v "^$" | wc -l | xargs)
            else
                PKG_COUNT=$($VENV_PYTHON -m pip list 2>/dev/null | tail -n +3 | wc -l | xargs)
            fi
            print_info "已安装 $PKG_COUNT 个包"
        else
            print_warn "缺少 $MISSING_PKGS 个关键包"
            if command -v uv &> /dev/null; then
                print_info "运行: cd backend && uv sync"
            else
                print_info "运行: cd backend && source .venv/bin/activate && pip install -r requirements.txt"
            fi
        fi
    else
        print_fail "虚拟环境损坏"
    fi
else
    print_fail "未创建 Python 虚拟环境"
    if command -v uv &> /dev/null; then
        print_info "运行: cd backend && uv venv && uv sync"
    else
        print_info "运行: cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
    fi
fi

# ========================================
# 5. 检查 Docker 镜像
# ========================================
print_header "5. Docker 镜像"

print_check "必需的 Docker 镜像"
REQUIRED_IMAGES=(
    "supabase/postgres:15.8.1.085"
    "supabase/studio:2025.12.09-sha-434634f"
    "kong:2.8.1"
    "postgrest/postgrest:v14.1"
    "supabase/realtime:v2.68.0"
    "supabase/postgres-meta:v0.93.1"
)

MISSING_IMAGES=0
for image in "${REQUIRED_IMAGES[@]}"; do
    if ! docker images -q "$image" &> /dev/null | grep -q .; then
        ((MISSING_IMAGES++))
    fi
done

if [ $MISSING_IMAGES -eq 0 ]; then
    print_pass
    print_info "所有镜像已拉取"
else
    print_warn "$MISSING_IMAGES 个镜像未拉取"
    print_info "首次运行 make start 时会自动拉取"
fi

# ========================================
# 6. 检查端口占用
# ========================================
print_header "6. 端口占用检查"

check_port() {
    local port=$1
    local service=$2

    echo -n "  • 端口 $port ($service): "
    if command -v lsof &> /dev/null; then
        if lsof -i:$port -sTCP:LISTEN -t &> /dev/null; then
            echo -e "${YELLOW}⚠ 已占用${NC}"
            PID=$(lsof -i:$port -sTCP:LISTEN -t | head -n 1)
            PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "未知进程")
            print_info "进程: $PROCESS (PID: $PID)"
            print_info "运行 'make dev-clean-ports' 清理"
            ((WARNINGS++))
        else
            echo -e "${GREEN}✓ 空闲${NC}"
            ((PASSED++))
        fi
    else
        echo -e "${YELLOW}⚠ 无法检查 (lsof 未安装)${NC}"
        ((WARNINGS++))
    fi
}

check_port 3000 "前端 Next.js"
check_port 8888 "后端 FastAPI"
check_port 5432 "PostgreSQL"
check_port 8000 "Supabase Kong"
check_port 3001 "Supabase Studio"
check_port 3333 "PostgREST"
check_port 4000 "Realtime"
check_port 8080 "Meta"

# ========================================
# 7. 检查数据库文件
# ========================================
print_header "7. 数据库配置文件"

print_check "database/migrations 目录"
if [ -d "database/migrations" ]; then
    print_pass
    SQL_COUNT=$(ls -1 database/migrations/*.sql 2>/dev/null | wc -l | xargs)
    print_info "找到 $SQL_COUNT 个迁移文件"
else
    print_fail "缺少数据库迁移目录"
fi

print_check "database/kong.yml"
if [ -f "database/kong.yml" ]; then
    print_pass
else
    print_fail "缺少 Kong 配置文件"
fi

# ========================================
# 8. 检查 Supabase 数据库表
# ========================================
print_header "8. Supabase 数据库表"

# 必需的核心表
REQUIRED_TABLES=(
    "accounts"
    "contracts"
    "trades"
    "positions"
    "position_snapshots"
    "lock_configs"
    "rollover_records"
    "market_data"
    "notifications"
)

print_check "Docker 容器运行状态"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "quantfu_postgres"; then
    print_pass
    print_info "PostgreSQL 容器运行中"

    # 检查数据库表
    echo -e "\n  ${BLUE}检查数据库表完整性:${NC}\n"

    MISSING_TABLES=0
    EXISTING_TABLES=0

    for table in "${REQUIRED_TABLES[@]}"; do
        # 使用 docker exec 查询表是否存在
        TABLE_EXISTS=$(docker exec quantfu_postgres psql -U postgres -d postgres -tAc \
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" \
            2>/dev/null)

        echo -n "    • $table: "
        if [ "$TABLE_EXISTS" = "t" ]; then
            echo -e "${GREEN}✓ 存在${NC}"
            ((EXISTING_TABLES++))
            ((PASSED++))
        else
            echo -e "${RED}✗ 缺失${NC}"
            ((MISSING_TABLES++))
            ((FAILED++))
        fi
    done

    echo ""
    if [ $MISSING_TABLES -eq 0 ]; then
        echo -e "\n  ${GREEN}✓ 所有 $EXISTING_TABLES 个核心表已创建"
    else
        print_fail "缺少 $MISSING_TABLES 个表"
        echo ""
        print_info "修复方法:"
        echo -e "    ${CYAN}1. 运行数据库初始化:${NC}"
        echo -e "       make db-init"
        echo ""
        echo -e "    ${CYAN}2. 或手动执行迁移:${NC}"
        echo -e "       docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_init_schema.sql"
    fi

else
    print_warn "PostgreSQL 容器未运行"
    print_info "启动数据库: make start"
    print_info "数据库启动后再运行此检查"
fi

# ========================================
# 8. 最终总结
# ========================================
print_header "检查总结"

echo -e "  ${GREEN}✓ 通过: $PASSED${NC}"
echo -e "  ${YELLOW}⚠ 警告: $WARNINGS${NC}"
echo -e "  ${RED}✗ 失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ 环境检查通过！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${BLUE}下一步:${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo -e "    1. ${YELLOW}建议处理上述警告项${NC}"
        echo -e "    2. ${GREEN}运行: make dev-full${NC}"
    else
        echo -e "    • ${GREEN}运行: make dev-full${NC}"
    fi
    echo ""
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ 环境检查失败！${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  ${YELLOW}请先修复上述错误，然后重新运行检查:${NC}"
    echo -e "    ${BLUE}./check-env.sh${NC}"
    echo ""
    exit 1
fi
