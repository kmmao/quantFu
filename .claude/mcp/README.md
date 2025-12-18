# MCP (Model Context Protocol) 集成指南

> MCP 允许 AI 助手访问外部工具和数据源,如文件系统、数据库、API 等

## 🎯 什么是 MCP?

**Model Context Protocol (MCP)** 是一个开放协议,允许 AI 应用连接到各种数据源和工具。

### 核心概念

- **MCP Server**: 提供特定功能的服务器 (如文件系统访问、数据库查询)
- **MCP Client**: AI 应用 (如 Claude Code、Claude Desktop)
- **Resources**: 服务器提供的资源 (文件、数据库表等)
- **Tools**: 服务器提供的工具 (读取文件、执行查询等)

---

## 📚 文档索引

| 文档 | 内容 |
|------|------|
| **[MCP_SETUP.md](MCP_SETUP.md)** ⭐ | **sfcommon 项目专用配置指南 (推荐)** |
| [设置指南](setup-guide.md) | 通用 MCP 服务器配置方法 |
| [推荐服务器](recommended-servers.md) | 常用 MCP 服务器列表 |
| [记忆指南](filesystem-memory-guide.md) | Memory MCP 使用 |
| [故障排查](troubleshooting.md) | 常见问题解决 |

**💡 快速开始**: 直接查看 **[MCP_SETUP.md](MCP_SETUP.md)** 获取 sfcommon 项目的完整配置指南!

---

## 🚀 快速开始

### 1. 安装 Claude Desktop (或 Claude Code)

MCP 需要支持的客户端:
- **Claude Desktop** (推荐新手)
- **Claude Code** (VS Code 扩展)

### 2. 配置 MCP 服务器

编辑配置文件:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 3. 添加第一个 MCP 服务器

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

### 4. 重启 Claude Desktop

MCP 服务器会在下次启动时自动连接。

---

## 🛠️ 常用 MCP 服务器

### 持久化记忆
```json
"memory": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

### 数据库访问 (PostgreSQL)
```json
"postgres": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://user:pass@localhost/dbname"]
}
```

更多服务器见: [recommended-servers.md](recommended-servers.md)

---

## 💡 使用场景

### ✅ 何时使用 MCP?

- **访问本地文件** - 读写项目文件
- **连接数据库** - 查询和修改数据库
- **持久化记忆** - AI 记住项目上下文
- **调用 API** - 集成外部服务
- **浏览器自动化** - Puppeteer/Playwright

### ❌ 何时不需要 MCP?

- **简单对话** - 不涉及外部数据源
- **代码编写** - Claude Code 内置工具已足够
- **一次性任务** - 不需要持久化

---

## 🔒 安全注意事项

### ⚠️  MCP 服务器权限很高

- **数据库 MCP** 可以执行 SQL 查询和修改数据
- **命令执行 MCP** 可以运行系统命令

### ✅ 安全最佳实践

1. **最小权限原则** - 只授予必要的权限
2. **数据库使用专用账户** - 不要使用 admin/root 账户
3. **定期审查配置** - 检查 MCP 服务器配置
4. **敏感数据隔离** - 注意保护含敏感信息的数据

---

## 📊 MCP 服务器对比

| 服务器 | 用途 | 权限级别 | 推荐度 |
|--------|------|---------|--------|
| **memory** | 持久化记忆 | 中 | ⭐⭐⭐⭐⭐ |
| **postgres** | PostgreSQL 数据库 | 高 | ⭐⭐⭐⭐ |
| **github** | GitHub 集成 | 中 | ⭐⭐⭐⭐ |
| **brave-search** | 网络搜索 | 低 | ⭐⭐⭐ |
| **puppeteer** | 浏览器自动化 | 高 | ⭐⭐⭐ |

---

## 🔧 配置示例

### 最小配置 (仅记忆)

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

### 推荐配置 (记忆 + GitHub)

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

### 完整配置 (所有常用服务器)

见: [recommended-servers.md](recommended-servers.md)

---

## 🐛 故障排查

### MCP 服务器未连接?

1. 检查配置文件语法 (JSON 格式)
2. 重启 Claude Desktop
3. 查看日志文件

详见: [troubleshooting.md](troubleshooting.md)

---

## 📚 延伸阅读

- **MCP 官方文档**: https://modelcontextprotocol.io/
- **MCP 服务器列表**: https://github.com/modelcontextprotocol/servers
- **自定义 MCP 服务器**: https://modelcontextprotocol.io/quickstart

---

## 📝 总结

**MCP 核心价值:**
- 🔌 连接 AI 与外部数据源
- 🛠️ 扩展 AI 的能力边界
- 🔒 在安全边界内授予权限
- 🚀 提升 AI 辅助开发效率

**开始使用**: 阅读 [setup-guide.md](setup-guide.md) 配置第一个 MCP 服务器
