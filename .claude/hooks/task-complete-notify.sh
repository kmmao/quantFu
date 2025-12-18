#!/bin/bash

# ====================================================================
# Claude Hook: Stop (任务完成通知)
# 触发时机: AI 完成响应后
# 作用: 发送系统通知和远程推送
# ====================================================================

# 读取 AI 的响应内容(从 stdin)
RESPONSE=$(cat)

# 检测是否是任务完成的响应
if echo "$RESPONSE" | grep -qiE "(✅|完成|已完成|任务完成|done|finished|successfully completed)"; then
    # 提取任务描述
    TASK_DESC=$(echo "$RESPONSE" | grep -oE "(开发|实现|修改|添加|创建|fix|add|implement)[^。\n]{0,30}" | head -1)

    if [ -z "$TASK_DESC" ]; then
        TASK_DESC="开发任务"
    fi

    # 发送系统提示音
    osascript -e 'beep 2' 2>/dev/null || true

    # 发送 ntfy 通知(后台执行,不阻塞)
    (curl -s -m 3 -d "任务完成: $TASK_DESC" https://ntfy.zmddg.com/claude 2>/dev/null || true) &

    # 输出确认信息到 stderr(不干扰响应内容)
    echo "[系统通知] 🔔 已触发完成提示音 | 已发送 ntfy 通知" >&2
fi

# 透传原始响应
echo "$RESPONSE"
