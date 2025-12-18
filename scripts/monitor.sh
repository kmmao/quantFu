#!/bin/bash
################################################################################
# QuantFu 系统监控脚本
# 用途: 定期检查系统健康状态,发送告警通知
# 使用: crontab -e 添加 */5 * * * * /opt/quantfu/scripts/monitor.sh
################################################################################

# 配置
API_URL="${BACKEND_URL:-http://localhost:8888}"
NTFY_URL="${NTFY_URL:-https://ntfy.zmddg.com/claude}"
LOG_FILE="/var/log/quantfu/monitor.log"
ALERT_FILE="/tmp/quantfu_alert_sent"
ALERT_COOLDOWN=3600  # 1小时内不重复告警

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 发送通知
send_alert() {
    local title="$1"
    local message="$2"
    local priority="${3:-default}"

    # 检查冷却时间
    if [ -f "$ALERT_FILE" ]; then
        last_alert=$(stat -f %m "$ALERT_FILE" 2>/dev/null || stat -c %Y "$ALERT_FILE")
        now=$(date +%s)
        elapsed=$((now - last_alert))

        if [ $elapsed -lt $ALERT_COOLDOWN ]; then
            log "⏳ 告警冷却中 (${elapsed}s/${ALERT_COOLDOWN}s),跳过发送"
            return
        fi
    fi

    # 发送Ntfy通知
    if [ -n "$NTFY_URL" ]; then
        curl -s \
            -H "Title: $title" \
            -H "Priority: $priority" \
            -H "Tags: warning" \
            -d "$message" \
            "$NTFY_URL" > /dev/null 2>&1

        if [ $? -eq 0 ]; then
            log "📨 告警已发送: $title"
            touch "$ALERT_FILE"
        else
            log "❌ 告警发送失败"
        fi
    fi
}

# 检查服务状态
check_service() {
    local service_name="$1"
    local check_command="$2"

    if eval "$check_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $service_name"
        return 0
    else
        echo -e "${RED}✗${NC} $service_name"
        return 1
    fi
}

# 主检查流程
main() {
    log "========================================"
    log "开始系统健康检查"

    # 1. 检查Docker容器
    echo -e "\n${YELLOW}1. Docker容器状态${NC}"
    containers=(
        "quantfu_postgres"
        "quantfu_kong"
        "quantfu_rest"
        "quantfu_realtime"
        "quantfu_studio"
    )

    container_failed=0
    for container in "${containers[@]}"; do
        if ! check_service "$container" "docker ps | grep -q $container"; then
            container_failed=1
            send_alert "⚠️ QuantFu容器异常" "$container 未运行" "high"
        fi
    done

    # 2. 检查后端API
    echo -e "\n${YELLOW}2. 后端API健康检查${NC}"
    health_response=$(curl -s -w "\n%{http_code}" "$API_URL/health" 2>/dev/null)
    http_code=$(echo "$health_response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓${NC} 后端API (HTTP 200)"

        # 获取详细健康状态
        detailed_health=$(curl -s "$API_URL/health/detailed" 2>/dev/null)

        if [ -n "$detailed_health" ]; then
            status=$(echo "$detailed_health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
            warnings=$(echo "$detailed_health" | grep -o '"warnings":\[.*\]' | wc -l)

            if [ "$status" != "healthy" ]; then
                echo -e "${YELLOW}⚠${NC} 系统状态: $status"
                send_alert "⚠️ QuantFu状态降级" "当前状态: $status\n详情: $API_URL/health/detailed" "default"
            fi

            # 提取指标
            accounts=$(echo "$detailed_health" | grep -o '"accounts":[0-9]*' | cut -d':' -f2)
            positions=$(echo "$detailed_health" | grep -o '"positions":[0-9]*' | cut -d':' -f2)
            cpu=$(echo "$detailed_health" | grep -o '"cpu_percent":[0-9.]*' | cut -d':' -f2)
            memory=$(echo "$detailed_health" | grep -o '"memory_percent":[0-9.]*' | cut -d':' -f2)

            echo "  账户: $accounts | 持仓: $positions | CPU: ${cpu}% | 内存: ${memory}%"

            # 资源告警
            if [ -n "$cpu" ] && [ "$(echo "$cpu > 80" | bc)" = "1" ]; then
                send_alert "🔥 CPU使用率过高" "当前CPU: ${cpu}%" "high"
            fi

            if [ -n "$memory" ] && [ "$(echo "$memory > 80" | bc)" = "1" ]; then
                send_alert "🔥 内存使用率过高" "当前内存: ${memory}%" "high"
            fi
        fi
    else
        echo -e "${RED}✗${NC} 后端API (HTTP $http_code)"
        send_alert "🚨 QuantFu后端异常" "API无响应 (HTTP $http_code)" "urgent"
    fi

    # 3. 检查数据库连接
    echo -e "\n${YELLOW}3. 数据库连接${NC}"
    if docker exec quantfu_postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} PostgreSQL"

        # 检查数据库大小
        db_size=$(docker exec quantfu_postgres psql -U postgres -d postgres -t -c "SELECT pg_size_pretty(pg_database_size('postgres'));" 2>/dev/null | xargs)
        echo "  数据库大小: $db_size"
    else
        echo -e "${RED}✗${NC} PostgreSQL"
        send_alert "🚨 数据库连接失败" "PostgreSQL无响应" "urgent"
    fi

    # 4. 检查磁盘空间
    echo -e "\n${YELLOW}4. 磁盘空间${NC}"
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    disk_avail=$(df -h / | awk 'NR==2 {print $4}')

    if [ "$disk_usage" -lt 80 ]; then
        echo -e "${GREEN}✓${NC} 磁盘使用率: ${disk_usage}% (可用: $disk_avail)"
    elif [ "$disk_usage" -lt 90 ]; then
        echo -e "${YELLOW}⚠${NC} 磁盘使用率: ${disk_usage}% (可用: $disk_avail)"
        send_alert "⚠️ 磁盘空间不足" "当前使用率: ${disk_usage}%\n可用空间: $disk_avail" "default"
    else
        echo -e "${RED}✗${NC} 磁盘使用率: ${disk_usage}% (可用: $disk_avail)"
        send_alert "🚨 磁盘空间严重不足" "当前使用率: ${disk_usage}%\n可用空间: $disk_avail" "urgent"
    fi

    # 5. 检查最近错误日志
    echo -e "\n${YELLOW}5. 最近错误日志${NC}"
    if [ -f "/var/log/quantfu/backend.log" ]; then
        error_count=$(grep -i "error\|exception\|failed" /var/log/quantfu/backend.log 2>/dev/null | tail -n 100 | wc -l)
        if [ "$error_count" -gt 10 ]; then
            echo -e "${YELLOW}⚠${NC} 最近100行有 $error_count 条错误"
            send_alert "⚠️ 后端错误频繁" "最近100行日志有 $error_count 条错误\n请检查日志: /var/log/quantfu/backend.log" "default"
        else
            echo -e "${GREEN}✓${NC} 最近100行有 $error_count 条错误"
        fi
    fi

    log "健康检查完成"
    log "========================================"

    # 如果没有任何失败,清除告警冷却
    if [ $container_failed -eq 0 ] && [ "$http_code" = "200" ]; then
        rm -f "$ALERT_FILE"
    fi
}

# 执行检查
mkdir -p "$(dirname "$LOG_FILE")"
main

exit 0
