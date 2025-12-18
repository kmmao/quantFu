# QuantFu Hooks 配置

> 精简版 Hooks - 核心功能 + 全自动 Memory

---

## 📋 当前启用的 Hooks

### 1. SessionStart - 会话启动自动化

**触发时机**: 新会话启动时

**功能**:
- 自动读取 Memory MCP 项目记忆图谱
- 分析记忆中的关键实体,了解项目现状
- 读取项目规则文件

**配置**:
```json
{
  "SessionStart": [{
    "matcher": "startup",
    "hooks": [{
      "type": "prompt",
      "prompt": "✅ QuantFu 会话启动 - 自动读取记忆图谱并分析项目现状"
    }]
  }]
}
```

---

### 2. SessionEnd - 会话结束自动保存

**触发时机**: 会话结束时

**功能**:
- 自动回顾本次会话重要内容
- 自动判断并批量记录到 Memory
- 智能整合到已有实体
- 同步更新项目规则文件

**配置**:
```json
{
  "SessionEnd": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "⚠️ 会话结束 - 自动保存记忆 (回顾、判断、批量记录、整合)"
    }]
  }]
}
```

**自动记录内容**:
- 关键技术决策
- 遇到的问题和解决方案
- 完成的功能里程碑
- 新制定的项目规则

---

### 3. PostToolUse:Task - 自动记录里程碑

**触发时机**: Task 工具完成后

**功能**:
- 自动检测重要任务 (关键词匹配)
- 自动分析任务类型 (decision/milestone/problem/refactor)
- 自动记录到 Memory 并智能整合
- 建立实体关联关系

**脚本**: `auto-memory-tracker`

**配置**:
```json
{
  "PostToolUse": [{
    "matcher": "Task",
    "hooks": [{
      "type": "command",
      "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/auto-memory-tracker"
    }]
  }]
}
```

**自动检测关键词**:
- 中文: 实现、完成、集成、修复、优化、重构
- 英文: implement、complete、integrate、fix、refactor

---

### 4. Stop - 任务完成通知

**触发时机**: AI 完成响应时

**功能**:
- 检测完成关键词 (`✅`, `完成`, `done`)
- 播放系统提示音
- 发送 Ntfy 推送通知

**脚本**: `task-complete-notify.sh`

---

## 🧠 Memory 自动化工作流程

```
会话启动
  ↓
[自动] 读取 Memory 记忆图谱
  ↓
[自动] 分析项目现状和关键实体
  ↓
开发任务...
  ↓
使用 Task 工具完成任务
  ↓
[自动] 检测关键词 → 分析类型 → 记录到 Memory
  ↓
[自动] 智能整合,建立关联
  ↓
会话结束
  ↓
[自动] 回顾会话 → 批量记录 → 整合实体
```

---

## 📱 Ntfy 通知设置

### 手机端配置

1. 安装 Ntfy App (iOS/Android)
2. 订阅主题:
   - 服务器: `https://ntfy.zmddg.com`
   - 主题: `claude`

### 测试通知

```bash
# 发送测试消息
curl -d "测试消息" https://ntfy.zmddg.com/claude

# 测试系统音
osascript -e 'beep 2'
```

---

## 🐛 故障排查

### Hooks 不触发?

```bash
# 1. 验证 JSON 格式
cat .claude/settings.json | jq .

# 2. 检查脚本权限
chmod +x .claude/hooks/*.sh
chmod +x .claude/hooks/auto-memory-tracker

# 3. 重启 Claude Code
```

### Memory 不自动记录?

```bash
# 检查 MCP 连接
claude mcp list | grep memory

# 查看 Memory 存储
ls -la ~/.claude/mcp_storage/memory/

# 测试手动记录
# (在 Claude Code 中执行)
mcp__memory__read_graph()
```

---

## 🧠 Memory MCP 集成

本项目已启用 **全自动 Memory 系统**,AI 会智能判断并记录重要内容。

### 自动记录的内容

**✅ 会自动记录**:
- 技术决策 (为什么选择 X)
- 踩坑经验 (问题 + 解决方案)
- 功能里程碑 (核心功能完成)
- 代码重构 (架构优化)

**❌ 不会记录**:
- 日常小改动
- 临时测试代码
- 格式调整

### AI 的智能整合策略

1. **检查已有实体**: 是否已有相关内容?
2. **补充 vs 创建**: 补充已有实体 or 创建新实体
3. **建立关联**: 自动建立实体间的关系
4. **去重**: 避免重复记录相同内容

### 详细指南

参考: [MEMORY.md](MEMORY.md)

---

## 📖 相关文档

- **官方文档**: https://code.claude.com/docs/en/hooks
- **Memory 使用**: [MEMORY.md](MEMORY.md)
- **项目规范**: [../.claude/CLAUDE.md](../.claude/CLAUDE.md)
- **项目规则**: [../core/project-specific-rules.md](../core/project-specific-rules.md)

---

**最后更新**: 2025-12-18
**有效 Hooks**: 4 个 (SessionStart + SessionEnd + PostToolUse:Task + Stop)
**通知渠道**: 系统音 + Ntfy 推送
**Memory MCP**: ✅ 已启用 (全自动记录 + 智能整合)
