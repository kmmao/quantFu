#!/bin/bash
################################################################################
# QuantFu 快速启动脚本
# 用途: 一键启动所有服务并验证
################################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   QuantFu 期货量化管理平台 - 启动    ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: 检查环境
echo -e "${YELLOW}[1/6] 检查环境...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ 未找到 .env 文件${NC}"
    echo -e "${YELLOW}正在创建配置文件...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓${NC} 已创建 .env 文件"
    echo -e "${YELLOW}⚠️  请编辑 .env 文件,填写必要配置后重新运行${NC}"
    echo -e "   必须修改项:"
    echo -e "   - POSTGRES_PASSWORD"
    echo -e "   - JWT_SECRET"
    echo -e "   - TQSDK_USER"
    echo -e "   - TQSDK_PASSWORD"
    exit 1
fi

# 检查必要配置
missing_configs=()
required_configs=("POSTGRES_PASSWORD" "JWT_SECRET" "TQSDK_USER" "TQSDK_PASSWORD")

for config in "${required_configs[@]}"; do
    value=$(grep "^${config}=" .env | cut -d'=' -f2)
    if [ -z "$value" ] || [[ "$value" == *"change-me"* ]]; then
        missing_configs+=("$config")
    fi
done

if [ ${#missing_configs[@]} -gt 0 ]; then
    echo -e "${RED}❌ 以下配置项未设置或使用默认值:${NC}"
    for config in "${missing_configs[@]}"; do
        echo -e "   - $config"
    done
    echo -e "${YELLOW}请编辑 .env 文件后重新运行${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} 环境配置检查通过\n"

# Step 2: 启动Supabase服务
echo -e "${YELLOW}[2/6] 启动Supabase服务...${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ 未安装 docker-compose${NC}"
    exit 1
fi

docker-compose up -d

echo -e "${GREEN}✓${NC} Supabase服务已启动"
echo -e "   等待服务就绪...\n"

# 等待PostgreSQL就绪
max_wait=60
wait_time=0
while ! docker exec quantfu_postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 2
    wait_time=$((wait_time + 2))
    if [ $wait_time -ge $max_wait ]; then
        echo -e "\n${RED}❌ PostgreSQL启动超时${NC}"
        exit 1
    fi
done
echo -e "\n${GREEN}✓${NC} PostgreSQL就绪\n"

# Step 3: 初始化数据库
echo -e "${YELLOW}[3/6] 检查数据库...${NC}"

# 检查是否已初始化
table_count=$(docker exec quantfu_postgres psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | xargs)

if [ "$table_count" -eq "0" ] || [ -z "$table_count" ]; then
    echo -e "${YELLOW}数据库未初始化,正在执行迁移...${NC}"

    # 执行迁移
    if [ -f "database/migrations/001_initial_schema.sql" ]; then
        docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_initial_schema.sql
        echo -e "${GREEN}✓${NC} 数据库结构已创建"
    fi

    # 导入合约数据
    if [ -f "database/seed/001_contracts_seed.sql" ]; then
        docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/001_contracts_seed.sql
        echo -e "${GREEN}✓${NC} 合约数据已导入"
    fi

    # 导入初始数据
    if [ -f "database/seed/002_seed_data.sql" ]; then
        echo -e "${YELLOW}⚠️  请先编辑 database/seed/002_seed_data.sql 填写账户和持仓数据${NC}"
        read -p "是否已编辑完成? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker exec -i quantfu_postgres psql -U postgres -d postgres < database/seed/002_seed_data.sql
            echo -e "${GREEN}✓${NC} 初始数据已导入"
        else
            echo -e "${YELLOW}跳过初始数据导入,稍后可手动执行${NC}"
        fi
    fi
else
    echo -e "${GREEN}✓${NC} 数据库已初始化 (${table_count} 个表)\n"
fi

# Step 4: 测试天勤连接
echo -e "${YELLOW}[4/6] 测试天勤连接...${NC}"

cd backend

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}创建Python虚拟环境...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
if ! pip show tqsdk > /dev/null 2>&1; then
    echo -e "${YELLOW}安装Python依赖...${NC}"
    pip install -q -r requirements.txt
fi

# 测试连接
if python test_tqsdk.py; then
    echo -e "${GREEN}✓${NC} 天勤连接测试通过\n"
else
    echo -e "${RED}❌ 天勤连接测试失败${NC}"
    echo -e "${YELLOW}请检查 .env 中的 TQSDK_USER 和 TQSDK_PASSWORD${NC}\n"
fi

cd ..

# Step 5: 启动后端服务
echo -e "${YELLOW}[5/6] 启动后端服务...${NC}"

cd backend

# 检查端口是否被占用
if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口 8888 已被占用,尝试停止...${NC}"
    kill -9 $(lsof -t -i:8888) 2>/dev/null || true
    sleep 2
fi

# 后台启动
nohup venv/bin/uvicorn main:app --host 0.0.0.0 --port 8888 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}✓${NC} 后端服务已启动 (PID: $BACKEND_PID)"
echo "$BACKEND_PID" > ../logs/backend.pid

# 等待后端就绪
sleep 3
if curl -s http://localhost:8888/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 后端API就绪\n"
else
    echo -e "${RED}❌ 后端启动失败,请查看日志: logs/backend.log${NC}\n"
fi

cd ..

# Step 6: 启动前端服务
echo -e "${YELLOW}[6/6] 启动前端服务...${NC}"

cd frontend

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装前端依赖...${NC}"
    npm install
fi

# 检查端口
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  端口 3000 已被占用,尝试停止...${NC}"
    kill -9 $(lsof -t -i:3000) 2>/dev/null || true
    sleep 2
fi

# 后台启动
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}✓${NC} 前端服务已启动 (PID: $FRONTEND_PID)"
echo "$FRONTEND_PID" > ../logs/frontend.pid

cd ..

# 创建日志目录
mkdir -p logs

# 完成
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ QuantFu 启动完成!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "访问地址:"
echo -e "  ${GREEN}前端界面:${NC}       http://localhost:3000"
echo -e "  ${GREEN}后端API文档:${NC}    http://localhost:8888/docs"
echo -e "  ${GREEN}Supabase Studio:${NC} http://localhost:3001"
echo -e ""
echo -e "查看日志:"
echo -e "  后端: tail -f logs/backend.log"
echo -e "  前端: tail -f logs/frontend.log"
echo -e ""
echo -e "停止服务:"
echo -e "  ./scripts/stop.sh"
echo -e ""
echo -e "系统监控:"
echo -e "  ./scripts/monitor.sh"
echo -e ""

# 健康检查
echo -e "${YELLOW}正在进行健康检查...${NC}"
sleep 5

health_response=$(curl -s http://localhost:8888/health/detailed)
if [ -n "$health_response" ]; then
    status=$(echo "$health_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    accounts=$(echo "$health_response" | grep -o '"accounts":[0-9]*' | cut -d':' -f2)
    positions=$(echo "$health_response" | grep -o '"positions":[0-9]*' | cut -d':' -f2)

    echo -e "系统状态: ${GREEN}$status${NC}"
    echo -e "账户数量: $accounts"
    echo -e "持仓数量: $positions"
fi

echo -e "\n${GREEN}🎉 准备就绪,开始交易!${NC}\n"

exit 0
