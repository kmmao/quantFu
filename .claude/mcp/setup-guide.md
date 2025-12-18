# Supabase MCP 配置指南

## 📋 什么是 MCP?

MCP (Model Context Protocol) 是一个协议,允许 Claude Code 连接到外部工具和服务。通过配置 Supabase MCP 服务器,Claude 可以直接:
- 查看你的 Supabase 项目结构
- 读取表结构和 RLS 策略
- 获取实时数据库信息
- 提供更准确的 Supabase 相关建议

## ✅ 已完成配置

你的项目已经配置好 Supabase MCP! 配置文件位于:

### 1. MCP 配置文件

**文件**: `.mcp.json`

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-supabase"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_MCP_TOKEN}"
      }
    }
  }
}
```

### 2. 环境变量

**文件**: `.env.local`

```bash
# Supabase MCP Token
SUPABASE_MCP_TOKEN=sbp_cfe3b307379bd5f8fc014a7b010fd5042ce7db76
```

**重要**:
- ✅ `.env.local` 已被加入 `.gitignore`,不会被提交到 git
- ✅ Token 通过环境变量引用,保证安全性
- ✅ `.env.local.example` 作为模板,可以安全提交

## 🚀 如何使用

### 启动 Claude Code 时自动连接

当你使用 Claude Code 时,MCP 服务器会自动启动并连接到你的 Supabase 项目。你可以直接询问:

```
"我的 Supabase 项目有哪些表?"
"users 表的 RLS 策略是什么?"
"帮我优化 posts 表的索引"
```

Claude 会直接读取你的 Supabase 项目信息并提供准确答案。

### 验证 MCP 连接

在 Claude Code 中询问:

```
"显示我的 Supabase 项目结构"
```

如果配置正确,Claude 会列出你的表、函数、RLS 策略等信息。

## 🔑 获取 Supabase Access Token

如果你需要更换 token 或为其他项目配置:

1. **登录 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard

2. **进入项目设置**
   - 选择你的项目
   - 点击左侧 "Settings" → "Access Tokens"

3. **生成 Access Token**
   - 点击 "Generate New Token"
   - 名称: `Claude Code MCP`
   - 权限: 选择需要的权限(建议至少 `read` 权限)
   - 复制生成的 token (格式: `sbp_xxx...`)

4. **更新环境变量**
   ```bash
   # .env.local
   SUPABASE_MCP_TOKEN=你的新token
   ```

5. **重启 Claude Code**
   ```bash
   # 重启 Claude Code 使配置生效
   ```

## 🔒 安全最佳实践

### ✅ 正确做法

```bash
# .env.local (不提交到 git)
SUPABASE_MCP_TOKEN=sbp_xxx...

# .mcp.json (可以提交)
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "${SUPABASE_MCP_TOKEN}"
  }
}
```

### ❌ 错误做法

```json
// ❌ 不要在 .mcp.json 中硬编码 token
{
  "env": {
    "SUPABASE_ACCESS_TOKEN": "sbp_xxx..."
  }
}
```

## 🛠️ 故障排查

### 问题 1: MCP 无法连接

**症状**: Claude Code 启动时提示 MCP 连接失败

**解决方案**:
1. 检查 `.env.local` 中的 `SUPABASE_MCP_TOKEN` 是否正确
2. 验证 token 是否有效(可能已过期)
3. 确保 Node.js 版本 >= 18

```bash
# 检查 Node.js 版本
node --version

# 手动测试 MCP 服务器
npx -y @modelcontextprotocol/server-supabase
```

### 问题 2: Token 权限不足

**症状**: Claude 无法读取某些表或 RLS 策略

**解决方案**:
1. 在 Supabase Dashboard 重新生成 token
2. 确保勾选足够的权限
3. 更新 `.env.local` 中的 token

### 问题 3: 环境变量未加载

**症状**: MCP 提示找不到 token

**解决方案**:
1. 确认 `.env.local` 文件存在于项目根目录
2. 重启 Claude Code
3. 检查环境变量格式:
   ```bash
   # ✅ 正确
   SUPABASE_MCP_TOKEN=sbp_xxx...

   # ❌ 错误 (不要加引号)
   SUPABASE_MCP_TOKEN="sbp_xxx..."
   ```

## 📚 MCP 服务器功能

Supabase MCP 服务器提供以下功能:

### 1. 项目结构查询
- 列出所有数据库表
- 查看表结构和列定义
- 查看索引和约束

### 2. RLS 策略查询
- 查看所有 RLS 策略
- 检查策略的条件和作用范围
- 验证策略是否正确配置

### 3. 函数和触发器
- 列出数据库函数
- 查看触发器配置
- 检查 Edge Functions

### 4. 实时诊断
- 检查表的性能问题
- 识别缺失的索引
- 建议优化方案

## 🔗 相关资源

- [Supabase 规范](.claude/supabase.md) - Supabase 使用规范
- [Claude Code MCP 文档](https://docs.anthropic.com/claude/docs/mcp) - MCP 官方文档
- [Supabase MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase) - 源代码

## 💡 使用技巧

### 技巧 1: 快速检查表结构

```
"显示 users 表的完整结构,包括索引和 RLS 策略"
```

### 技巧 2: 诊断性能问题

```
"检查 posts 表是否有性能问题,特别是查询效率"
```

### 技巧 3: 验证安全配置

```
"验证所有表的 RLS 策略是否正确配置"
```

### 技巧 4: 对比最佳实践

```
"我的 comments 表结构是否符合 Supabase 最佳实践?"
```

## ✅ 验证清单

配置完成后,确认以下项目:

- [ ] `.mcp.json` 文件存在
- [ ] `.env.local` 包含 `SUPABASE_MCP_TOKEN`
- [ ] `.gitignore` 包含 `.env*.local`
- [ ] `.env.local.example` 作为模板存在
- [ ] Claude Code 可以读取 Supabase 项目信息
- [ ] 询问 Supabase 相关问题时 Claude 能提供准确答案

---

**配置完成!** 现在 Claude Code 可以直接访问你的 Supabase 项目,提供更智能的开发建议! 🎉
