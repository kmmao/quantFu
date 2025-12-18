# Claude Code Hooks 完整指南

> QuantFu 项目的 Hooks 配置 - 自动化工作流和通知系统

---

## 📋 当前配置概览

### 有效 Hooks: 5 个 (全部使用官方事件)

**全局配置** (在 `~/.claude/settings.json`):
- ✅ **SessionStart** (startup) - 新会话启动时读取记忆和规则
- ✅ **SessionStart** (resume) - 恢复会话时检查进度
- ✅ **SessionEnd** - 会话结束时保存记忆体
- ✅ **Stop** - AI 完成响应时触发通知

**项目 Shell Hooks** (在 `.claude/hooks/`):
- ✅ **user-prompt-submit** - 用户输入前检测开发任务 (→ UserPromptSubmit)
- ✅ **post-tool-use** - 工具完成后提醒后续步骤 (→ PostToolUse)

**工具脚本**:
- ✅ **task-complete-notify.sh** - 通知脚本 (被 Stop 调用)

---

## 🎯 Hook 工作原理

### 两种配置方式

#### 1. JSON 配置 (在 settings.json)

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [
        {"type": "prompt", "prompt": "提示文本"},
        {"type": "command", "command": "/path/to/script.sh"}
      ]
    }]
  }
}
```

**特点**:
- ✅ 支持 `matcher` 条件匹配
- ✅ 支持 `type: "prompt"` (直接注入) 或 `type: "command"` (执行脚本)
- ✅ 全局配置,所有项目共享
- ❌ 不在项目内,无法版本控制

#### 2. Shell 脚本 (在项目 .claude/hooks/)

**⚠️ 重要: Shell 脚本必须在 settings.json 中声明!**

Shell 脚本文件本身**不会自动触发**,需要在 `.claude/settings.json` 中配置:

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit"
      }]
    }]
  }
}
```

**特点**:
- ✅ 项目特定逻辑
- ✅ 可版本控制
- ✅ 灵活,可执行任意逻辑
- ⚠️ 必须在 settings.json 中声明
- ✅ 使用 `$CLAUDE_PROJECT_DIR` 变量引用路径

---

## 🔄 Hook 执行流程

```
会话开始
    ↓
[SessionStart] startup/resume (settings.json) ✅ 官方事件
    ↓
用户输入 Prompt
    ↓
[UserPromptSubmit] user-prompt-submit (Shell) ✅ 官方事件
    ↓
AI 接收输入并生成响应
    ↓
AI 调用工具 (Read/Write/Edit/Task...)
    ↓
[PostToolUse] post-tool-use (Shell) ✅ 官方事件
    ↓
AI 完成响应
    ↓
[Stop] 检测完成 → task-complete-notify.sh (settings.json) ✅ 官方事件
    ↓
(系统音 + Ntfy 通知)
    ↓
会话结束
    ↓
[SessionEnd] 保存记忆体 (settings.json) ✅ 官方事件
```

---

## 📋 官方支持的 Hook 事件

Claude Code 官方支持 **10 种事件类型**:

| 事件 | 触发时机 | 支持 Matcher | 本项目使用 |
|------|---------|-------------|-----------|
| **SessionStart** | 会话启动/恢复 | ✅ startup/resume/clear/compact | ✅ JSON配置 |
| **SessionEnd** | 会话结束 | ❌ | ✅ JSON配置 |
| **Stop** | AI 完成响应 | ❌ | ✅ JSON配置 |
| **UserPromptSubmit** | 用户提交前 | ❌ | ✅ Shell Hook |
| **PostToolUse** | 工具完成后 | ✅ 工具名 | ✅ Shell Hook |
| PreToolUse | 工具调用前 | ✅ 工具名 | ❌ |
| PermissionRequest | 权限请求时 | ✅ 工具名 | ❌ |
| Notification | 发送通知时 | ✅ 类型 | ❌ |
| SubagentStop | 子代理完成 | ❌ | ❌ |
| PreCompact | 紧凑操作前 | ✅ manual/auto | ❌ |

> **✅ 本项目所有 Hooks 均使用官方支持的事件!**

---

## ⚙️ 详细配置

### 1. SessionStart - 会话启动

**配置位置**: `~/.claude/settings.json`

```json
{
  "SessionStart": [
    {
      "matcher": "startup",
      "hooks": [{
        "type": "prompt",
        "prompt": "✅ 会话启动 - 请立即执行:\n1. 使用 mcp__memory__read_graph 读取项目记忆\n2. 读取 .claude/core/project-specific-rules.md 了解项目规则\n3. 准备好协助开发"
      }]
    },
    {
      "matcher": "resume",
      "hooks": [{
        "type": "prompt",
        "prompt": "✅ 会话恢复 - 请检查:\n1. 回顾上次会话的进度\n2. 确认项目规则是否有更新"
      }]
    }
  ]
}
```

**功能**:
- 新会话启动时自动读取 MCP Memory
- 自动读取项目规则文件
- 恢复会话时检查进度

---

### 2. SessionEnd - 会话结束

**配置位置**: `~/.claude/settings.json`

```json
{
  "SessionEnd": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "⚠️ 会话结束 - 请保存记忆体:\n1. 回顾本次会话的关键决策和规则\n2. 使用 mcp__memory__create_entities 或 mcp__memory__add_observations 保存\n3. 如有新规则,更新到 .claude/core/project-specific-rules.md\n4. 确认所有待办事项已处理"
    }]
  }]
}
```

**功能**:
- 提醒保存重要信息到 MCP Memory
- 提醒更新项目规则
- 确保知识不丢失

---

### 3. Stop - AI 完成响应

**配置位置**: `~/.claude/settings.json`

```json
{
  "Stop": [{
    "hooks": [{
      "type": "command",
      "command": "/Users/allen/Documents/GitHub/quantFu/.claude/hooks/task-complete-notify.sh"
    }]
  }]
}
```

**功能**:
- 调用通知脚本检测任务完成
- 播放系统提示音
- 发送 Ntfy 远程推送

---

### 4. user-prompt-submit - 用户输入处理

**Shell 脚本位置**: `.claude/hooks/user-prompt-submit`

**配置位置**: `.claude/settings.json`

```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit"
      }]
    }]
  }
}
```

**功能**:
- 检测用户输入是否包含开发任务关键词
- 自动注入规范提醒
- 提醒 AI 读取项目规则

---

### 5. post-tool-use - 工具完成后提醒

**Shell 脚本位置**: `.claude/hooks/post-tool-use`

**配置位置**: `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use"
      }]
    }]
  }
}
```

**对应官方事件**: `PostToolUse`

**功能**:
- Write/Edit 工具后提醒添加 AI 标记
- Task 工具完成后提醒检查文档
- 防止遗忘后续步骤

**Matcher**: 只在 `Write` 或 `Edit` 工具使用后触发

---

## 🔔 任务完成通知系统

### 通知脚本: task-complete-notify.sh

**工作原理**:
1. 读取 AI 的响应内容
2. 检测完成关键词
3. 触发通知渠道

### 触发条件

AI 响应包含以下关键词时触发:
- ✅ (对勾 emoji)
- "完成"、"已完成"、"任务完成"
- "done"、"finished"、"successfully completed"

### 通知渠道

#### 1. 系统提示音 🔊

```bash
osascript -e 'beep 2'
```

播放 macOS 系统 beep 音 2 次。

#### 2. Ntfy 远程推送 📱

```bash
curl -s -m 3 -d "任务完成: $TASK_DESC" https://ntfy.zmddg.com/claude
```

**要求**:
1. 手机安装 ntfy app (iOS/Android)
2. 订阅频道: `https://ntfy.zmddg.com/claude`
3. 确保网络可达

**通知格式**: `任务完成: {任务描述}`

#### 3. 终端确认 📝

输出到 stderr: `[系统通知] 🔔 已触发完成提示音 | 已发送 ntfy 通知`

---

## 📁 文件结构

```
~/.claude/
└── settings.json          # 全局配置 (SessionStart/SessionEnd/Stop)

项目/.claude/
├── settings.json          # 项目配置 (UserPromptSubmit/PostToolUse) 🆕
├── settings.local.json    # 本地配置 (不提交 Git)
└── hooks/
    ├── README.md              # 本文档
    ├── user-prompt-submit     # Shell Hook 脚本
    ├── post-tool-use          # Shell Hook 脚本
    └── task-complete-notify.sh # 通知脚本
```

**配置层级** (优先级从高到低):
1. `.claude/settings.local.json` - 本地覆盖,不提交 Git
2. `.claude/settings.json` - 项目配置,提交 Git ✅
3. `~/.claude/settings.json` - 全局配置,所有项目

---

## 🧪 测试和验证

### 1. 验证 settings.json 配置

```bash
# 检查 JSON 格式
cat ~/.claude/settings.json | jq .

# 查看 hooks 配置
cat ~/.claude/settings.json | jq '.hooks'
```

应该看到 `SessionStart`, `SessionEnd`, `Stop` 三个事件。

### 2. 验证 Shell hooks 权限

```bash
ls -l .claude/hooks/*-submit *-start *-result *.sh
```

所有文件应该有 `x` (可执行) 权限。

### 3. 测试会话启动

**操作**: 重启 Claude Code

**预期**: AI 自动提示:
```
✅ 会话启动 - 请立即执行:
1. 使用 mcp__memory__read_graph 读取项目记忆
2. 读取 .claude/core/project-specific-rules.md 了解项目规则
```

### 4. 测试完成通知

**方法 1: 手动测试脚本**
```bash
echo "✅ 任务完成 - 测试功能" | .claude/hooks/task-complete-notify.sh
```

**预期**:
- 🔊 听到系统 beep 音
- 📝 看到终端输出确认信息

**方法 2: 测试 ntfy**
```bash
curl -d "测试消息" https://ntfy.zmddg.com/claude
```

**预期**: 手机收到推送通知

### 5. 测试系统提示音

```bash
osascript -e 'beep 2'
```

应该听到 2 次 beep 音。

---

## 🐛 故障排查

### Hooks 不触发?

#### 1. 检查 settings.json 语法

```bash
cat ~/.claude/settings.json | jq .
```

如果报错,说明 JSON 格式有问题。

#### 2. 检查事件名拼写

- ✅ 正确: `SessionStart`, `SessionEnd`, `Stop`
- ❌ 错误: `session-start`, `sessionStart`, `session_start`

#### 3. 检查 Shell hooks 权限

```bash
chmod +x .claude/hooks/*-submit *-start *-result *.sh
```

#### 4. 重启 Claude Code

配置更改后必须重启才能生效。

#### 5. 查看日志

```bash
tail -f ~/.claude/logs/claude.log
```

### 通知不工作?

#### 1. 系统音不播放

```bash
# 测试系统音
osascript -e 'beep'

# 检查系统音量设置
```

#### 2. Ntfy 通知不发送

```bash
# 测试网络连接
curl -I https://ntfy.zmddg.com

# 手动发送测试
curl -d "测试" https://ntfy.zmddg.com/claude

# 检查防火墙设置
```

#### 3. 脚本执行失败

```bash
# 检查脚本语法
bash -n .claude/hooks/task-complete-notify.sh

# 手动执行调试
bash -x .claude/hooks/task-complete-notify.sh <<< "✅ 测试完成"
```

### SessionStart 不触发?

1. **确认 matcher 拼写**: `startup` (不是 `start`)
2. **检查 hooks 数组结构**: 确保在 `hooks: [...]` 内
3. **重启 Claude Code**: 全新会话测试

---

## 🎨 自定义配置

### 添加新的 Hook 事件

#### 示例: 添加 PreToolUse Hook

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "prompt",
        "prompt": "⚠️ 注意: 即将执行 Bash 命令,请确保安全!"
      }]
    }]
  }
}
```

### 修改通知触发条件

编辑 `task-complete-notify.sh`:

```bash
# 添加更多关键词
if echo "$RESPONSE" | grep -qiE "(✅|完成|success|部署成功|测试通过)"; then
    # 触发通知
fi
```

### 添加更多通知渠道

#### Slack Webhook

```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"任务完成: '"$TASK_DESC"'"}' \
  YOUR_SLACK_WEBHOOK_URL
```

#### Telegram Bot

```bash
curl -s "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
  -d "chat_id=$CHAT_ID&text=任务完成: $TASK_DESC"
```

#### macOS 通知中心

```bash
osascript -e 'display notification "'"$TASK_DESC"'" with title "QuantFu 任务完成"'
```

---

## 📱 Ntfy 设置指南

### 手机端配置

1. **安装 ntfy app**
   - iOS: App Store 搜索 "ntfy"
   - Android: Google Play 或 [F-Droid](https://f-droid.org/)

2. **添加订阅**
   - 打开 ntfy app
   - 点击 "+" 添加订阅
   - 服务器: `https://ntfy.zmddg.com`
   - 主题/频道: `claude`
   - 保存

3. **测试推送**
   ```bash
   curl -d "测试消息" https://ntfy.zmddg.com/claude
   ```

4. **自定义通知样式** (可选)
   ```bash
   curl -H "Title: QuantFu" \
        -H "Priority: high" \
        -H "Tags: tada,check" \
        -d "任务完成: $TASK_DESC" \
        https://ntfy.zmddg.com/claude
   ```

---

## 🔗 相关资源

- **官方文档**: https://code.claude.com/docs/en/hooks
- **项目规范**: [../.claude/CLAUDE.md](../CLAUDE.md)
- **项目特定规则**: [../core/project-specific-rules.md](../core/project-specific-rules.md)
- **Ntfy 官网**: https://ntfy.sh/

---

## 📝 常见问题

### Q: Shell hooks 和 JSON 配置有什么区别?

**Shell hooks**:
- 项目特定,可版本控制
- 不支持 `matcher` 条件匹配
- 适合复杂逻辑

**JSON 配置**:
- 全局配置,所有项目共享
- 支持 `matcher` 和 `type: prompt/command`
- 适合简单提示和条件匹配

### Q: 为什么删除了 session-start 等文件?

这些文件与 `settings.json` 中的配置**功能重复**:
- `session-start` → `SessionStart`
- `session-end` → `SessionEnd`
- `assistant-response-complete` → `Stop`

JSON 配置更强大 (支持 matcher),保留一个即可。

### Q: 如何暂时禁用某个 Hook?

**方法 1: 重命名文件**
```bash
mv user-prompt-submit user-prompt-submit.disabled
```

**方法 2: 移除执行权限**
```bash
chmod -x user-prompt-submit
```

**方法 3: 编辑 settings.json**
```json
{
  "hooks": {
    "SessionStart": []  // 清空数组即禁用
  }
}
```

### Q: Hook 会影响性能吗?

**影响很小** (< 100ms):
- Shell hooks: 执行快速脚本
- JSON prompt: 直接注入文本
- JSON command: 执行外部脚本 (稍慢)

建议:
- 保持 hook 逻辑简单
- 避免耗时操作 (如大文件读取)
- 使用后台执行 `&` (如 ntfy 通知)

---

**最后更新**: 2025-12-18
**配置状态**: ✅ 已完成并使用官方事件
**有效 Hooks**: 5 个官方事件 (3 JSON + 2 Shell)
**通知渠道**: 系统音 + Ntfy 推送
**修正记录**: 删除 assistant-response-start (非官方),重命名 tool-result → post-tool-use (官方)
