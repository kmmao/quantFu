# 推荐的 MCP 服务器配置

针对 ZP 项目（Next.js + Supabase）推荐的 MCP 服务器列表及配置方法。

---

## 📦 当前已配置

✅ **Supabase MCP** - 已配置完成
- 访问 Supabase 项目结构
- 查看表、RLS 策略、索引
- 数据库设计建议

---

## 🌟 强烈推荐 (核心开发)

### 1. GitHub MCP - GitHub 集成

**作用:**
- 管理 Issues 和 Pull Requests
- 查看提交历史和分支
- 自动创建和更新 Issues

**前置要求:**
需要 GitHub Personal Access Token

**获取 Token:**
1. 访问 https://github.com/settings/tokens
2. Generate new token (classic)
3. 勾选权限: `repo`, `read:org`, `read:user`
4. 复制 token (格式: `ghp_xxx...`)

**配置:**

添加到 `.env.local`:
```env
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx
```

添加到 `.mcp.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

**使用场景:**
```
"创建一个 Issue: 实现用户登录功能"
"列出所有待处理的 PRs"
"查看最近 10 次提交"
```

---

### 2. Memory MCP - 持久化记忆

**作用:**
- Claude 记住项目的设计决策
- 记录重要的架构选择
- 跨会话保持上下文

**配置:**

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

**使用场景:**
```
"记住: 我们使用 shadcn/ui 而不是 Material-UI"
"记住: 所有 API 路由都需要验证用户身份"
"回顾之前的设计决策"
```

**优势:**
- 下次对话时 Claude 会记住你的偏好
- 避免重复解释项目规范
- 维护一致的开发风格

---

## 🔧 推荐 (增强功能)

### 3. Brave Search MCP - 网络搜索

**作用:**
- 搜索最新的文档和解决方案
- 查找 npm 包信息
- 获取技术问题答案

**前置要求:**
需要 Brave Search API Key (免费)

**获取 API Key:**
1. 访问 https://brave.com/search/api/
2. 注册账号并获取 API key
3. 免费额度: 2000 次/月

**配置:**

添加到 `.env.local`:
```env
BRAVE_API_KEY=BSAxxxxxxxxx
```

添加到 `.mcp.json`:
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

**使用场景:**
```
"搜索 Next.js 15 的最新特性"
"查找如何优化 Supabase 查询性能"
"@tanstack/react-query 最新版本是什么？"
```

---

### 4. Postgres MCP - 直接数据库访问

**作用:**
- 直接查询 PostgreSQL 数据库
- 执行复杂的 SQL 查询
- 分析数据库性能

**⚠️ 注意:** Supabase 本质上就是 PostgreSQL，可以使用此 MCP 进行更底层的访问

**配置:**

添加到 `.env.local`:
```env
# Supabase PostgreSQL 连接字符串
# 获取方式: Supabase Dashboard → Settings → Database → Connection string → URI
POSTGRES_CONNECTION_STRING=postgresql://postgres:[password]@db.niuxxqdaviqxztyhhoyr.supabase.co:5432/postgres
```

添加到 `.mcp.json`:
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres"
      ],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
      }
    }
  }
}
```

**使用场景:**
```
"执行 SQL: 查看表的大小和行数"
"分析慢查询日志"
"优化这个复杂的 JOIN 查询"
```

---

### 5. Puppeteer MCP - 浏览器自动化

**作用:**
- E2E 测试自动化
- 截图和性能测试
- 网页爬取

**配置:**

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    }
  }
}
```

**使用场景:**
```
"访问 localhost:3000 并截图"
"测试登录流程是否正常"
"检查页面的加载性能"
```

---

## 📋 完整配置示例

### 推荐的基础配置 (最小化)

适合刚开始的项目:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_MCP_TOKEN}"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**环境变量 (.env.local):**
```env
SUPABASE_MCP_TOKEN=sbp_cfe3b307379bd5f8fc014a7b010fd5042ce7db76
```

---

### 完整配置 (全功能)

适合成熟的项目:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_MCP_TOKEN}"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "${POSTGRES_CONNECTION_STRING}"
      }
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**环境变量 (.env.local):**
```env
# Supabase
SUPABASE_MCP_TOKEN=sbp_cfe3b307379bd5f8fc014a7b010fd5042ce7db76

# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxx

# Brave Search
BRAVE_API_KEY=BSAxxxxxxxxx

# PostgreSQL (Supabase 数据库直连)
POSTGRES_CONNECTION_STRING=postgresql://postgres:[password]@db.niuxxqdaviqxztyhhoyr.supabase.co:5432/postgres
```

---

## 🎯 按需求选择

### 场景 1: 纯开发 (推荐)

```
✅ Supabase MCP       - 数据库管理
✅ Memory MCP         - 记住决策
```

### 场景 2: 团队协作

```
✅ Supabase MCP       - 数据库管理
✅ GitHub MCP         - Issue/PR 管理
✅ Memory MCP         - 记住决策
```

### 场景 3: 全功能开发

```
✅ Supabase MCP       - 数据库管理
✅ GitHub MCP         - Issue/PR 管理
✅ Memory MCP         - 记住决策
✅ Brave Search MCP   - 搜索文档
✅ Postgres MCP       - 高级数据库操作
✅ Puppeteer MCP      - E2E 测试
```

---

## 🔒 安全提示

### 敏感 Token 管理

**✅ 正确做法:**

1. 所有 token 存储在 `.env.local`
2. `.env.local` 已被 `.gitignore` 忽略
3. `.mcp.json` 使用变量引用: `"${TOKEN_NAME}"`

```json
// ✅ .mcp.json (安全，可以提交)
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

```env
# ✅ .env.local (不提交)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx...
```

**❌ 错误做法:**

```json
// ❌ 不要在 .mcp.json 中硬编码 token
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx..."
  }
}
```

---

## 📊 MCP 对比表

| MCP | 必要性 | 复杂度 | 需要 Token | 推荐场景 |
|-----|--------|--------|-----------|---------|
| Supabase | ⭐⭐⭐⭐⭐ | 低 | ✅ | 所有项目 |
| Memory | ⭐⭐⭐⭐ | 低 | ❌ | 长期项目 |
| GitHub | ⭐⭐⭐ | 中 | ✅ | 团队协作 |
| Brave Search | ⭐⭐⭐ | 低 | ✅ | 需要搜索 |
| Postgres | ⭐⭐ | 中 | ✅ | 高级用户 |
| Puppeteer | ⭐⭐ | 高 | ❌ | E2E 测试 |

---

## 🚀 快速开始

### 推荐配置步骤

**阶段 1: 基础配置 (立即)**

```bash
# 已完成
✅ Supabase MCP
```

**阶段 2: 增强配置 (本周)**

1. 添加 Memory MCP

**阶段 3: 完整配置 (需要时)**

3. 添加 GitHub MCP (如果使用 GitHub)
4. 添加 Brave Search MCP (如果需要搜索)

---

## 📚 相关文档

- [MCP 配置指南](.claude/mcp-setup.md) - Supabase MCP 详细说明
- [官方 MCP 文档](https://modelcontextprotocol.io/introduction) - MCP 协议介绍
- [MCP Servers 仓库](https://github.com/modelcontextprotocol/servers) - 官方服务器列表

---

## 💡 使用技巧

### 组合使用 MCP

```
"使用 Brave Search 查找 Next.js 最佳实践，
然后在 GitHub 创建一个 Issue 记录这次更新"
```

Claude 会自动:
1. 通过 Brave Search MCP 搜索
2. 通过 GitHub MCP 创建 Issue

---

**我的建议:** 先从基础配置开始（Supabase + Memory），感受 MCP 的强大功能，然后根据需要逐步添加其他服务器。
