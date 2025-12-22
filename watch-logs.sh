#!/bin/bash
# QuantFu 日志查看器 - 使用 tmux 分屏显示

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_LOG="$PROJECT_DIR/backend/backend.log"
FRONTEND_LOG="$PROJECT_DIR/frontend/frontend.log"

echo "🔍 QuantFu 日志查看器"
echo "================================"
echo ""

# 检查日志文件
if [ ! -f "$BACKEND_LOG" ]; then
    echo "⚠️  后端日志不存在: $BACKEND_LOG"
fi

if [ ! -f "$FRONTEND_LOG" ]; then
    echo "⚠️  前端日志不存在: $FRONTEND_LOG"
fi

# 检查是否安装 tmux
if ! command -v tmux &> /dev/null; then
    echo "❌ 未安装 tmux，使用基础模式"
    echo ""
    echo "📋 请在新终端运行："
    echo "   后端: tail -f $BACKEND_LOG"
    echo "   前端: tail -f $FRONTEND_LOG"
    echo ""
    echo "或安装 tmux: brew install tmux"
    exit 1
fi

# 创建 tmux 会话
SESSION="quantfu-logs"

# 如果会话已存在，先杀掉
tmux has-session -t $SESSION 2>/dev/null
if [ $? -eq 0 ]; then
    echo "⚠️  会话已存在，正在重启..."
    tmux kill-session -t $SESSION
fi

echo "🚀 启动日志查看器..."
echo ""
echo "💡 使用说明："
echo "   - Ctrl+B 然后按 ← 或 → : 切换窗格"
echo "   - Ctrl+B 然后按 D : 退出（后台运行）"
echo "   - Ctrl+C : 停止日志查看"
echo "   - 输入 'exit' : 完全退出"
echo ""
sleep 2

# 创建会话并分屏
tmux new-session -d -s $SESSION -n "logs"

# 上方窗格：后端日志
tmux send-keys -t $SESSION "echo '🔴 后端日志 (backend.log)' && echo '' && tail -f '$BACKEND_LOG'" C-m

# 分割窗口，下方窗格：前端日志  
tmux split-window -t $SESSION -v
tmux send-keys -t $SESSION "echo '🔵 前端日志 (frontend.log)' && echo '' && tail -f '$FRONTEND_LOG'" C-m

# 调整窗格大小，让上下各占一半
tmux select-layout -t $SESSION even-vertical

# 附加到会话
tmux attach-session -t $SESSION

