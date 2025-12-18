# MCP 配置指南 - sfcommon 项目

> 为 sfcommon 通用规范框架配置 MCP 服务器

## 📋 推荐配置

sfcommon 作为一个通用规范框架,推荐配置以下 MCP 服务器:

### 1. **Memory MCP** (强烈推荐)

持久化记忆项目上下文,用于:
- 记住 sfcommon 的设计理念
- 记住用户的自定义配置
- 跨会话保持项目知识

---

## ⚙️ 配置步骤

### Step 1: 找到配置文件位置

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

### Step 2: 编辑配置文件

打开配置文件,添加 sfcommon 的 MCP 服务器配置:

```bash
# macOS
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 或使用任何文本编辑器
vim ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 3: 添加配置

#### 最小配置 (仅 Memory)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
```

#### 推荐配置 (Memory + GitHub)

如果你想用 MCP 管理 GitHub,可以添加:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your_github_token>"
      }
    }
  }
}
```

**获取 GitHub Token**: https://github.com/settings/tokens

---

## ✅ 验证配置

### Step 1: 重启 Claude Desktop

配置修改后,必须重启 Claude Desktop 才能生效:

```bash
# macOS: 完全退出再重新打开
# Cmd + Q 退出,然后重新启动
```

### Step 2: 检查连接状态

在 Claude Desktop 中,查看左下角:
- ✅ 看到 🔌 图标和数字 (如 🔌2) - MCP 已连接
- ❌ 看不到图标 - 检查配置是否正确

### Step 3: 测试功能

**测试 Memory MCP:**
```
请记住: sfcommon 是一个技术栈无关的通用开发规范框架
```

稍后再问:
```
sfcommon 是什么?
```

如果能正确回答,说明 Memory MCP 工作正常。

---

## 🔧 常见问题

### Q1: MCP 服务器未连接

**症状**: 左下角没有 🔌 图标

**解决方法:**
1. 检查 JSON 格式是否正确 (使用 JSON 验证器)
2. 检查路径是否正确 (绝对路径,不要用 `~`)
3. 完全退出 Claude Desktop (Cmd+Q),然后重新打开
4. 查看日志: `~/Library/Logs/Claude/mcp*.log`

### Q2: Memory MCP 记不住东西

**症状**: 跨会话丢失记忆

**解决方法:**
1. 确认 Memory MCP 已正确配置
2. 重启 Claude Desktop
3. 检查 Memory 数据存储位置:
   - macOS: `~/Library/Application Support/Claude/mcp-memory/`

### Q3: 配置文件不存在

**解决方法:**
手动创建配置文件:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {}
}
EOF
```

---

## 📁 Memory 数据位置

Memory MCP 的数据存储在:

**macOS:**
```
~/Library/Application Support/Claude/mcp-memory/
```

**数据格式**: JSON Lines (.jsonl)

你可以手动查看或编辑记忆数据:
```bash
cat ~/Library/Application\ Support/Claude/mcp-memory/*.jsonl
```

**本项目的 Memory 示例:**
- 保存在: `.claude/memory/memory.jsonl`
- 用于记录 sfcommon 的设计理念和重要信息

---

## 🎯 sfcommon 项目专用记忆

为了让 Claude 更好地理解 sfcommon,推荐添加以下记忆:

### 初始化记忆

首次配置后,向 Claude 说:

```
请记住以下关于 sfcommon 项目的信息:

1. sfcommon 是一个技术栈无关的软件开发通用规范框架
2. 核心理念: 通用原则 > 具体实现
3. 包含 3 个占位文件需要用户补充: testing-strategy.md, ai-collaboration.md, development-workflow.md
4. 适用于任何编程语言、框架和项目类型
5. 优先使用分层架构、SOLID 原则、OWASP Top 10 等业界标准
6. 所有规范文档位于 .claude/core/ 目录
7. 文档模板位于 .claude/templates/ 目录
8. MCP 集成指南位于 .claude/mcp/ 目录
```

### 验证记忆

稍后问:
```
sfcommon 的核心理念是什么?
需要补充哪些占位文件?
```

---

## 📝 配置模板文件

我已经为你创建了配置示例文件:

**文件位置**: `.claude/mcp/claude_desktop_config.example.json`

**使用方法:**
1. 复制示例文件内容
2. 修改路径为你的实际路径
3. 粘贴到 `claude_desktop_config.json`
4. 重启 Claude Desktop

---

## 🚀 快速配置命令

### macOS 一键配置

```bash
# 1. 备份现有配置 (如果存在)
[ -f ~/Library/Application\ Support/Claude/claude_desktop_config.json ] && \
  cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
     ~/Library/Application\ Support/Claude/claude_desktop_config.json.backup

# 2. 创建配置目录
mkdir -p ~/Library/Application\ Support/Claude

# 3. 生成配置文件
cat > ~/Library/Application\ Support/Claude/claude_desktop_config.json << 'EOF'
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}
EOF

# 4. 验证配置
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 5. 重启 Claude Desktop
killall Claude 2>/dev/null
open -a Claude
```

---

## 📊 配置对比

### 方案 A: 最小配置 (推荐新手)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**优点**: 配置简单,够用
**缺点**: 功能有限

### 方案 B: 完整配置 (推荐高级用户)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your_token>"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "<your_api_key>"
      }
    }
  }
}
```

**优点**: 功能完整,集成多个服务
**缺点**: 配置复杂,需要多个 API Key

---

## ✅ 完成检查清单

配置 MCP 后,确认:

- [ ] 已编辑 `claude_desktop_config.json`
- [ ] 已重启 Claude Desktop
- [ ] 左下角看到 🔌 图标
- [ ] Memory MCP 能记住信息
- [ ] 已初始化 sfcommon 项目记忆

---

**配置完成后,你就可以在 Claude Desktop 中高效使用 sfcommon 框架了!** 🎉

**测试命令:**
```
请读取 sfcommon/.claude/README.md 并总结核心内容
```
