#!/bin/bash
################################################################################
# QuantFu 停止脚本
# 用途: 优雅停止所有服务
################################################################################

set -e

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
echo -e "${BLUE}   QuantFu 期货量化管理平台 - 停止    ${NC}"
echo -e "${BLUE}========================================${NC}\n"

# 停止前端
echo -e "${YELLOW}[1/3] 停止前端服务...${NC}"
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✓${NC} 前端服务已停止 (PID: $FRONTEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC} 前端服务未运行"
    fi
    rm -f logs/frontend.pid
else
    # 尝试通过端口查找
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:3000) 2>/dev/null
        echo -e "${GREEN}✓${NC} 前端服务已停止"
    else
        echo -e "${YELLOW}⚠${NC} 前端服务未运行"
    fi
fi

# 停止后端
echo -e "\n${YELLOW}[2/3] 停止后端服务...${NC}"
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}✓${NC} 后端服务已停止 (PID: $BACKEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC} 后端服务未运行"
    fi
    rm -f logs/backend.pid
else
    # 尝试通过端口查找
    if lsof -Pi :8888 -sTCP:LISTEN -t >/dev/null 2>&1; then
        kill -9 $(lsof -t -i:8888) 2>/dev/null
        echo -e "${GREEN}✓${NC} 后端服务已停止"
    else
        echo -e "${YELLOW}⚠${NC} 后端服务未运行"
    fi
fi

# 停止Supabase
echo -e "\n${YELLOW}[3/3] 停止Supabase服务...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose down
    echo -e "${GREEN}✓${NC} Supabase服务已停止"
else
    echo -e "${RED}❌ 未安装 docker-compose${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 所有服务已停止${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "重新启动服务:"
echo -e "  ./scripts/start.sh"
echo -e ""

exit 0
