# Memory MCP 存储目录

此目录用于存储 Memory MCP 的持久化数据。

## 📂 目录用途

Memory MCP 会在此目录中存储你让 Claude 记住的信息，包括：
- 项目规范和约定
- 技术决策
- 常用命令
- 个人偏好

## 🔒 安全性

- ✅ 此目录已被 `.gitignore` 忽略
- ✅ 不会被提交到版本控制
- ✅ 仅保存在本地项目中
- ✅ 团队成员各自维护自己的记忆

## 📝 存储内容示例

Memory MCP 可以记住：

```
"记住: ZP 项目使用 Next.js + Supabase"
"记住: 所有数据库表必须启用 RLS"
"记住: 使用 shadcn/ui 而不是 Material-UI"
"记住: 测试覆盖率要求 >= 80%"
```

## 🗂️ 文件结构

Memory MCP 会自动创建和管理此目录中的文件，通常包括：

```
.claude/memory/
├── entities.json       # 实体存储
├── relations.json      # 关系存储
└── observations.json   # 观察记录
```

## 🔄 数据持久化

- **跨会话保持**: 关闭 Claude Code 后数据仍然保留
- **项目特定**: 每个项目有独立的记忆存储
- **自动同步**: Memory MCP 自动读写此目录

## 🧹 清除记忆

如果需要重置记忆：

```bash
# 删除所有记忆
rm -rf .claude/memory/*

# 重启 Claude Code
```

## 💡 使用建议

### ✅ 适合记住

- 项目规范和编码标准
- 架构决策和设计模式
- 常用的技术栈和工具
- 团队约定和最佳实践

### ❌ 不适合记住

- 大量代码片段（应该用文档）
- 临时数据（会持久化）
- 敏感信息（如密码、token）

## 📚 相关文档

- [filesystem-memory-mcp-guide.md](../filesystem-memory-mcp-guide.md) - 使用指南
- [mcp-recommended.md](../mcp-recommended.md) - MCP 配置说明

---

**此目录由 Memory MCP 自动管理，请勿手动编辑文件内容。**
