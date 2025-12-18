# Hooks 测试指南

> 验证 Claude hooks 是否正常工作

---

## 🧪 快速测试

### 测试 1: user-prompt-submit Hook

**输入以下消息给 Claude**:
```
开发一个测试功能
```

**预期 AI 行为**:
- AI 会先说"我先读取 project-specific-rules.md"
- 然后才开始设计方案
- 而不是直接开始写代码

**如果没有这个行为** → Hook 未生效,需要排查

---

### 测试 2: assistant-response-start Hook

**输入任何开发请求**:
```
实现 XXX
```

**预期效果**:
- AI 响应中会包含规范检查步骤
- AI 会主动提到"我需要先..."

---

### 测试 3: tool-result Hook

**让 AI 写一些代码**:
```
写一个简单的 Python 函数
```

**预期效果**:
- AI 使用 Write 工具后
- 会自动想起添加 AI 代码标记
- 或者直接就加上标记了

---

## 🔍 调试 Hooks

### 如果 Hooks 不生效

1. **检查 Claude 版本**
   ```bash
   claude --version
   ```
   Hooks 需要 Claude Code >= 0.8.0

2. **检查项目是否识别**
   ```bash
   # 在项目目录运行
   claude chat
   ```
   确保 Claude 识别了 `.claude/` 目录

3. **测试 Hook 脚本**
   ```bash
   echo "开发功能" | .claude/hooks/user-prompt-submit
   ```
   应该输出包含提醒的内容

4. **查看 Claude 配置**
   ```bash
   cat ~/.claude/config.json
   ```
   确认 hooks 是否启用

---

## ✅ 成功标志

Hooks 正常工作时,你会观察到:

1. **AI 主动读取规范** - 不用你提醒
2. **AI 自动添加标记** - --- ai start/end ---
3. **AI 主动创建文档** - guide.md
4. **AI 主动记录规则** - project-specific-rules.md

---

## 🎯 下一步

如果测试通过:
1. ✅ Hooks 系统已就绪
2. ✅ 开始正常开发
3. ✅ AI 会自动遵守规范

如果测试失败:
1. 检查 Claude 版本和配置
2. 查看错误日志
3. 向我反馈问题

---

**准备好测试了吗?试试给我发送一个开发任务吧!**
