# QuantFu Hooks 配置指南

> Claude Code Hooks 自动化工作流 - 会话管理、任务提醒、完成通知

---

## 📋 配置概览

### 当前启用的 Hooks (6个官方事件)

| Hook 事件 | 配置位置 | 触发时机 | 功能 |
|----------|---------|---------|------|
| **SessionStart** (startup) | `.claude/settings.json` | 新会话启动 | 自动读取记忆体和项目规则 |
| **SessionStart** (resume) | `.claude/settings.json` | 恢复会话 | 快速同步最新进度 |
| **SessionEnd** | `.claude/settings.json` | 会话结束 | 强制保存记忆和规则 |
| **Stop** | `.claude/settings.json` | AI 完成响应 | 发送完成通知(音效+Ntfy) |
| **UserPromptSubmit** | `.claude/settings.json` | 用户输入前 | 检测开发任务并注入规范提醒 |
| **PostToolUse** (Write/Edit) | `.claude/settings.json` | 工具完成后 | 提醒添加 AI 标记和文档 |
| **PostToolUse** (Task) | `.claude/settings.json` | 任务完成后 | 自动记录里程碑到 Memory MCP |

**所有 Hooks 均使用 Claude Code 官方支持的事件类型!**

**🆕 集成 Memory MCP**: 实现跨设备、跨会话的上下文持久化。详见 [MEMORY_GUIDE.md](MEMORY_GUIDE.md)

---

## 🎯 Hook 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│ 会话开始 (新设备/新会话)                                      │
│   ↓                                                          │
│ [SessionStart:startup] 自动加载 Memory MCP 记忆图谱          │
│   ├─ 读取当前开发阶段 (Phase)                                │
│   ├─ 读取未完成任务                                          │
│   ├─ 读取最近技术决策                                        │
│   └─ 读取遇到的问题和解决方案                                │
│   ↓                                                          │
│ [SessionStart:startup] 加载项目规则文件                       │
│   ↓                                                          │
│ AI 已准备好,了解完整项目上下文!                              │
│   ↓                                                          │
│ 用户输入开发任务                                              │
│   ↓                                                          │
│ [UserPromptSubmit] 检测关键词 → 注入规范提醒                  │
│   ↓                                                          │
│ AI 处理任务并调用工具 (Write/Edit/Task...)                    │
│   ↓                                                          │
│ [PostToolUse:Write/Edit] 提醒添加 AI 标记                    │
│   ↓                                                          │
│ [PostToolUse:Task] 检测里程碑 → 提醒记录到 Memory MCP        │
│   ↓                                                          │
│ AI 完成响应 (包含 ✅ 或"完成"等关键词)                         │
│   ↓                                                          │
│ [Stop] 检测完成 → 播放提示音 + 发送 Ntfy 通知                 │
│   ↓                                                          │
│ 会话结束                                                      │
│   ↓                                                          │
│ [SessionEnd] 强制保存记忆体                                   │
│   ├─ 关键决策 → Memory MCP                                   │
│   ├─ 新规则 → project-specific-rules.md                      │
│   ├─ 问题&方案 → Memory MCP                                  │
│   └─ 待办任务 → Memory MCP                                   │
│                                                               │
│ 💡 记忆已保存! 下次在任何设备都能快速恢复上下文               │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ 详细配置

### 配置文件位置

```
.claude/
├── settings.json          # 项目级 Hooks 配置 (提交到 Git)
├── settings.local.json    # 本地覆盖配置 (不提交)
└── hooks/
    ├── README.md                    # 本文档
    ├── MEMORY_GUIDE.md              # Memory MCP 使用指南 🆕
    ├── user-prompt-submit           # 开发任务检测
    ├── post-tool-use                # AI 标记提醒
    ├── milestone-tracker            # 里程碑追踪 🆕
    └── task-complete-notify.sh      # 完成通知
```

**配置优先级**: `settings.local.json` > `settings.json` > `~/.claude/settings.json`

---

### 1. SessionStart - 会话启动自动化

**配置** (`.claude/settings.json`):
```json
{
  "SessionStart": [{
    "matcher": "startup",
    "hooks": [{
      "type": "prompt",
      "prompt": "✅ 会话启动 - QuantFu 项目规范:\n1. 使用 mcp__memory__read_graph 读取项目记忆\n2. 读取 .claude/core/project-specific-rules.md 了解项目规则\n3. 准备好协助开发"
    }]
  }]
}
```

**功能**:
- ✅ 新会话时自动读取 MCP Memory 项目记忆
- ✅ 自动加载项目特定规则文件
- ✅ 确保 AI 了解项目上下文

**Matcher**: `startup` (新会话) / `resume` (恢复会话) / `clear` (清空上下文)

---

### 2. SessionEnd - 会话结束提醒

**配置** (`.claude/settings.json`):
```json
{
  "SessionEnd": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "⚠️ 会话结束 - QuantFu 项目保存:\n1. 回顾本次会话的关键决策和规则\n2. 使用 mcp__memory__create_entities 或 mcp__memory__add_observations 保存\n3. 如有新规则,更新到 .claude/core/project-specific-rules.md\n4. 确认所有待办事项已处理"
    }]
  }]
}
```

**功能**:
- ✅ 提醒将重要信息保存到 MCP Memory
- ✅ 提醒更新项目规则文件
- ✅ 防止知识和上下文丢失

---

### 3. Stop - 任务完成通知

**配置** (`.claude/settings.json`):
```json
{
  "Stop": [{
    "hooks": [{
      "type": "command",
      "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/task-complete-notify.sh"
    }]
  }]
}
```

**脚本**: [task-complete-notify.sh](task-complete-notify.sh)

**功能**:
- 🔍 检测 AI 响应中的完成关键词: `✅`, `完成`, `done`, `finished`
- 🔊 播放系统提示音 (macOS beep × 2)
- 📱 发送 Ntfy 远程推送通知
- 📝 输出确认信息到终端

**触发条件**:
```bash
# AI 响应包含以下任意关键词:
✅ | 完成 | 已完成 | 任务完成 | done | finished | successfully completed
```

**通知渠道**:
1. **系统提示音**: `osascript -e 'beep 2'`
2. **Ntfy 推送**: `curl -d "任务完成: $TASK_DESC" https://ntfy.zmddg.com/claude`
3. **终端输出**: `[系统通知] 🔔 已触发完成提示音 | 已发送 ntfy 通知`

---

### 4. UserPromptSubmit - 用户输入预处理

**配置** (`.claude/settings.json`):
```json
{
  "UserPromptSubmit": [{
    "hooks": [{
      "type": "command",
      "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit"
    }]
  }]
}
```

**脚本**: [user-prompt-submit](user-prompt-submit)

**功能**:
- 🔍 检测用户输入是否包含开发任务关键词
- 📝 自动注入规范提醒 (读取规则、使用 AI 标记等)
- ✅ 非开发任务直接透传,不干扰

**触发关键词**:
```bash
开发 | 实现 | 修改 | 添加 | 创建 | 集成 | 功能 | bug | 问题
develop | implement | add | create | fix
```

**注入内容**:
```
⚠️ [自动提醒] 在开始此开发任务前,请先:
1. 读取 .claude/core/project-specific-rules.md
2. 确认是否需要创建/更新 guide.md
3. 使用 AI 代码标记 (--- ai start/end ---)
```

---

### 5. PostToolUse - 工具完成后提醒

**配置** (`.claude/settings.json`):
```json
{
  "PostToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "command",
      "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use"
    }]
  }]
}
```

**脚本**: [post-tool-use](post-tool-use)

**功能**:
- ✅ **Write/Edit 后**: 提醒添加 AI 代码标记
- ✅ **Task 完成后**: 提醒检查文档和规则
- ✅ 其他工具直接透传

**Matcher**: 仅在 `Write` 或 `Edit` 工具后触发

---

## 📱 Ntfy 通知设置

### 手机端配置

#### 1. 安装 Ntfy App

- **iOS**: App Store 搜索 "ntfy"
- **Android**: Google Play / [F-Droid](https://f-droid.org/)

#### 2. 订阅主题

1. 打开 ntfy app
2. 点击 "+" 添加订阅
3. 输入:
   - 服务器: `https://ntfy.zmddg.com`
   - 主题: `claude`
4. 保存

#### 3. 测试通知

```bash
# 发送测试消息
curl -d "测试消息" https://ntfy.zmddg.com/claude

# 高级通知(带标题和优先级)
curl -H "Title: QuantFu" \
     -H "Priority: high" \
     -H "Tags: tada,check" \
     -d "任务完成测试" \
     https://ntfy.zmddg.com/claude
```

### 自定义通知渠道

编辑 [task-complete-notify.sh](task-complete-notify.sh) 添加更多通知方式:

#### macOS 通知中心

```bash
osascript -e 'display notification "'"$TASK_DESC"'" with title "QuantFu 任务完成"'
```

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

---

## 🧪 测试验证

### 1. 验证配置文件

```bash
# 检查 JSON 格式
cat .claude/settings.json | jq .

# 查看 hooks 配置
cat .claude/settings.json | jq '.hooks'
```

### 2. 验证脚本权限

```bash
# 检查执行权限
ls -l .claude/hooks/

# 应该看到 -rwx--x--x (可执行)
# 如果没有,添加权限:
chmod +x .claude/hooks/*
```

### 3. 测试 SessionStart

```bash
# 操作: 在 Claude Code 中输入 /clear 清空会话

# 预期: AI 自动提示
# ✅ 会话启动 - QuantFu 项目规范:
# 1. 使用 mcp__memory__read_graph 读取项目记忆
# ...
```

### 4. 测试完成通知

```bash
# 方法1: 手动测试脚本
echo "✅ 任务完成 - 测试功能" | .claude/hooks/task-complete-notify.sh

# 方法2: 测试 ntfy
curl -d "测试消息" https://ntfy.zmddg.com/claude

# 方法3: 测试系统音
osascript -e 'beep 2'
```

**预期结果**:
- 🔊 听到 2 次 beep 提示音
- 📱 手机收到 ntfy 推送
- 📝 终端显示确认信息

### 5. 测试用户输入检测

```bash
# 在 Claude Code 中输入: "帮我开发一个新功能"

# 预期: AI 看到的是
# ⚠️ [自动提醒] 在开始此开发任务前,请先:
# 1. 读取 .claude/core/project-specific-rules.md
# ...
```

---

## 🐛 故障排查

### Hooks 不触发?

#### 1. 检查配置文件语法

```bash
# 验证 JSON 格式
cat .claude/settings.json | jq .

# 如果报错,说明 JSON 语法有问题
```

#### 2. 检查事件名拼写

✅ **正确**: `SessionStart`, `SessionEnd`, `Stop`, `UserPromptSubmit`, `PostToolUse`
❌ **错误**: `session-start`, `sessionStart`, `session_start`

#### 3. 检查脚本权限

```bash
# 添加执行权限
chmod +x .claude/hooks/user-prompt-submit
chmod +x .claude/hooks/post-tool-use
chmod +x .claude/hooks/task-complete-notify.sh
```

#### 4. 检查路径变量

确保使用 `$CLAUDE_PROJECT_DIR` 而不是硬编码路径:

```json
{
  "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/user-prompt-submit"
}
```

#### 5. 重启 Claude Code

配置更改后必须重启才能生效。

### 通知不工作?

#### 系统音无声

```bash
# 测试系统音
osascript -e 'beep'

# 检查系统音量设置
# System Settings → Sound → Alert volume
```

#### Ntfy 不发送

```bash
# 测试网络连接
curl -I https://ntfy.zmddg.com

# 手动测试推送
curl -d "测试" https://ntfy.zmddg.com/claude

# 检查手机是否订阅了正确的主题
```

#### 脚本执行失败

```bash
# 检查脚本语法
bash -n .claude/hooks/task-complete-notify.sh

# 调试模式运行
bash -x .claude/hooks/task-complete-notify.sh <<< "✅ 测试完成"
```

---

## 📚 官方事件类型参考

Claude Code 官方支持的所有 Hook 事件:

| 事件 | 触发时机 | 支持 Matcher | 本项目使用 |
|------|---------|-------------|-----------|
| **SessionStart** | 会话启动/恢复 | ✅ startup/resume/clear/compact | ✅ |
| **SessionEnd** | 会话结束 | ❌ | ✅ |
| **Stop** | AI 完成响应 | ❌ | ✅ |
| **UserPromptSubmit** | 用户提交前 | ❌ | ✅ |
| **PostToolUse** | 工具完成后 | ✅ 工具名 | ✅ |
| PreToolUse | 工具调用前 | ✅ 工具名 | ❌ |
| PermissionRequest | 权限请求时 | ✅ 工具名 | ❌ |
| Notification | 发送通知时 | ✅ 类型 | ❌ |
| SubagentStop | 子代理完成 | ❌ | ❌ |
| PreCompact | 紧凑操作前 | ✅ manual/auto | ❌ |

---

## 🎨 自定义扩展

### 示例: 添加 PreToolUse Hook

在 `.claude/settings.json` 中添加:

```json
{
  "PreToolUse": [{
    "matcher": "Bash",
    "hooks": [{
      "type": "prompt",
      "prompt": "⚠️ 注意: 即将执行 Bash 命令,请确保安全!"
    }]
  }]
}
```

### 示例: 修改完成检测关键词

编辑 [task-complete-notify.sh](task-complete-notify.sh):

```bash
# 添加更多关键词
if echo "$RESPONSE" | grep -qiE "(✅|完成|success|部署成功|测试通过|迁移完成)"; then
    # 触发通知
fi
```

### 示例: 禁用某个 Hook

**方法 1**: 重命名文件

```bash
mv user-prompt-submit user-prompt-submit.disabled
```

**方法 2**: 移除执行权限

```bash
chmod -x user-prompt-submit
```

**方法 3**: 修改配置

```json
{
  "UserPromptSubmit": []  // 清空数组
}
```

---

## 📖 相关文档

- **官方文档**: https://code.claude.com/docs/en/hooks
- **项目规范**: [../.claude/CLAUDE.md](../.claude/CLAUDE.md)
- **项目规则**: [../core/project-specific-rules.md](../core/project-specific-rules.md)
- **Ntfy 官网**: https://ntfy.sh/

---

## 📝 FAQ

### Q: 为什么所有 Hooks 都配置在 settings.json 中?

**A**: 为了项目可移植性和版本控制。所有配置都在项目内,方便团队共享和 Git 管理。

### Q: Shell 脚本必须声明在 settings.json 吗?

**A**: 是的! Shell 脚本文件本身不会自动触发,必须在 `settings.json` 中使用 `type: "command"` 声明。

### Q: 为什么使用 $CLAUDE_PROJECT_DIR 变量?

**A**: 这是 Claude Code 提供的环境变量,指向当前项目根目录,避免硬编码路径。

### Q: Hooks 会影响性能吗?

**A**: 影响极小 (< 100ms)。脚本执行很快,且 ntfy 通知使用后台执行 `&` 不阻塞。

### Q: 如何暂时禁用完成通知?

**A**: 最简单的方法是注释掉 `Stop` 配置:

```json
{
  "Stop": []
}
```

或者在脚本中添加开关变量:

```bash
# 在 task-complete-notify.sh 顶部添加
ENABLE_NOTIFY=false  # 改为 false 禁用

if [ "$ENABLE_NOTIFY" = "false" ]; then
    echo "$RESPONSE"
    exit 0
fi
```

---

## 🧠 Memory MCP 集成

### 为什么需要 Memory MCP?

**痛点场景**:
- 🖥️ **多设备开发**: 办公室 → 家里 → iPad,需要快速同步进度
- 🔄 **会话中断**: Claude Code 重启后上下文丢失
- 📅 **长期记忆**: 几周前的技术决策需要回溯

**Memory MCP 解决方案**:
- ✅ 持久化存储关键信息
- ✅ 跨设备自动同步
- ✅ 结构化知识图谱
- ✅ Hooks 自动加载和保存

### 配置的 Memory 相关 Hooks

| Hook | 功能 | 记录内容 |
|------|------|---------|
| **SessionStart** | 自动加载记忆图谱 | 开发阶段、任务、决策、问题 |
| **SessionEnd** | 强制保存记忆 | 关键决策、新规则、待办任务 |
| **PostToolUse:Task** | 自动记录里程碑 | 完成的功能、技术要点、踩坑经验 |

### 推荐的实体类型

- **milestone**: 开发里程碑 (功能完成、版本发布)
- **decision**: 技术决策 (架构选型、方案对比)
- **problem**: 遇到的问题 (难点、解决方案)
- **module**: 功能模块 (核心组件)
- **task**: 待办任务 (下一步计划)
- **bug**: 缺陷记录 (Bug 和修复)

### 快速开始

**1. 会话启动时自动加载:**
```javascript
// AI 自动执行 (无需手动)
mcp__memory__read_graph()
```

**2. 功能完成后记录:**
```javascript
mcp__memory__create_entities({
  "entities": [{
    "name": "Phase3-换月提醒",
    "entityType": "milestone",
    "observations": [
      "完成时间: 2025-12-20",
      "实现了自动换月提醒",
      "遇到问题: 非交易日到期处理",
      "解决方案: 提前3个交易日提醒"
    ]
  }]
})
```

**3. 建立关系:**
```javascript
mcp__memory__create_relations({
  "relations": [{
    "from": "Phase3-换月提醒",
    "to": "K线数据模块",
    "relationType": "depends_on"
  }]
})
```

### 详细指南

完整的 Memory MCP 使用指南,包括:
- 实体类型设计
- 关系类型设计
- 最佳实践
- 实战示例

请查看: **[MEMORY_GUIDE.md](MEMORY_GUIDE.md)**

---

**最后更新**: 2025-12-18
**配置状态**: ✅ 已完成并验证
**有效 Hooks**: 6个官方事件 (🆕 新增 Memory MCP 集成)
**通知渠道**: 系统音 + Ntfy 推送
**项目**: QuantFu 期货量化管理平台
