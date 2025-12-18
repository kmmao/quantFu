# 模块文档规范

> 本文档定义 ZP 项目中每个模块 guide.md 的编写标准和要求。

## 🎯 核心原则

1. **及时更新**：代码变更时必须同步更新文档
2. **完整准确**：文档反映真实的代码状态
3. **易于理解**：新成员能快速上手
4. **结构统一**：所有模块文档格式一致

---

## 📁 文档位置

每个模块目录下都应有 `.claude/guide.md`:

```
src/
├── components/
│   └── .claude/guide.md      # 组件模块指南
├── lib/
│   ├── supabase/
│   │   └── .claude/guide.md  # Supabase 客户端指南
│   └── utils/
│       └── .claude/guide.md  # 工具函数指南
├── hooks/
│   └── .claude/guide.md      # Hooks 指南
└── app/
    ├── api/
    │   └── .claude/guide.md  # API Routes 指南
    └── actions/
        └── .claude/guide.md  # Server Actions 指南
```

---

## 📝 guide.md 标准模板

```markdown
# [模块名称] 模块指南

> 一句话描述本模块的职责和用途

## 📌 模块职责

清晰描述本模块负责什么,不负责什么。

**职责范围：**
- 职责1
- 职责2

**不在范围：**
- 非职责1
- 非职责2

---

## 📁 文件结构

模块/
├── file1.ts          # 文件说明
├── file2.ts          # 文件说明
└── subfolder/
    └── file3.ts      # 文件说明

### 文件说明

- **file1.ts**: 功能描述
- **file2.ts**: 功能描述

---

## ⚙️ 主要功能

### 功能1: 功能名称

**用途**: 描述这个功能做什么

**示例**:
```typescript
// 代码示例
```

**参数**:
- `param1`: 参数说明
- `param2`: 参数说明

**返回值**: 返回什么

---

## 🔗 依赖关系

### 依赖的模块
- `@/lib/utils` - 用于工具函数
- `next/image` - 用于图片优化

### 被依赖的地方
- `@/app/page.tsx` - 首页使用
- `@/components/Header` - 头部组件使用

---

## 🎯 使用示例

### 基础使用

```typescript
// 完整的使用示例
```

### 高级使用

```typescript
// 高级场景示例
```

---

## 📝 变更日志

| 日期 | 变更类型 | 描述 | 负责人 |
|------|---------|------|--------|
| 2025-01-17 | 新增 | 初始创建 | AI |
| 2025-01-18 | 优化 | 性能优化 | AI |

---

## 🎯 最佳实践

1. 实践1的描述
2. 实践2的描述

---

## ⚠️ 注意事项

- 注意事项1
- 注意事项2

---

## 🐛 常见问题

### Q: 问题1?
A: 解答1

### Q: 问题2?
A: 解答2
```

---

## 📋 各类模块的具体要求

### 组件模块 (components/)

```markdown
# 组件模块指南

## 📌 模块职责
负责所有可复用的 React 组件

## 📁 文件结构
- **ui/**: 基础 UI 组件(Button, Input等)
- **features/**: 功能组件(UserCard, ProductList等)
- **layouts/**: 布局组件(Header, Footer等)

## 组件规范
- 使用函数组件
- Props 必须有 TypeScript 类型
- 优先使用服务端组件
- 客户端组件明确标记 'use client'

## 命名规范
- 组件文件: PascalCase (UserCard.tsx)
- Props 类型: 组件名 + Props (UserCardProps)

## 示例
[组件使用示例]

## 变更日志
[记录组件的新增、修改、删除]
```

### Hooks 模块 (hooks/)

```markdown
# Hooks 模块指南

## 📌 模块职责
提供自定义 React Hooks 以复用状态逻辑

## 📁 文件结构
- use-auth.ts: 认证相关 Hook
- use-toast.ts: 提示消息 Hook

## Hook 规范
- 命名以 use 开头
- 返回对象而非数组(便于解构)
- 必须有类型定义
- 必须有测试

## 依赖关系
[Hook 之间的依赖]

## 变更日志
[记录 Hook 的变更]
```

### API Routes 模块 (app/api/)

```markdown
# API Routes 模块指南

## 📌 模块职责
处理 RESTful API 请求

## API 列表

### GET /api/users
- 用途: 获取用户列表
- 参数: page, limit
- 返回: { data: User[], total: number }
- 权限: 需要认证

### POST /api/users
- 用途: 创建用户
- Body: { email, name }
- 返回: { data: User }
- 权限: 管理员

## 通用规范
- 使用 HTTP 状态码
- 统一错误响应格式
- 所有敏感操作需认证
- 输入必须验证

## 变更日志
[记录 API 的新增、修改、废弃]
```

### Server Actions 模块 (app/actions/)

```markdown
# Server Actions 模块指南

## 📌 模块职责
处理表单提交和数据变更操作

## Actions 列表

### createUser(formData)
- 用途: 创建新用户
- 参数: FormData { email, name }
- 返回: { success: boolean, data?: User, error?: string }
- 验证: Zod schema
- 权限: 公开

## 规范
- 使用 'use server' 指令
- 输入验证(Zod)
- 错误处理
- revalidate 缓存

## 变更日志
[记录 Actions 的变更]
```

### 工具函数模块 (lib/utils/)

```markdown
# 工具函数模块指南

## 📌 模块职责
提供纯函数工具

## 函数列表

### formatDate(date, format)
- 用途: 格式化日期
- 参数: date (Date), format (string)
- 返回: string
- 示例: formatDate(new Date(), 'YYYY-MM-DD')

## 规范
- 纯函数,无副作用
- 必须有单元测试
- 100% 测试覆盖率

## 变更日志
[记录函数的变更]
```

---

## 🔄 文档更新流程

### 何时更新

- ✅ 新增文件或功能
- ✅ 修改接口或参数
- ✅ 删除功能
- ✅ 重构代码结构
- ✅ 修复重要 bug

### 如何更新

1. **代码变更时同步更新**
   - 修改代码后立即更新 guide.md
   - 更新变更日志

2. **变更日志格式**
   ```markdown
   | 2025-01-17 | 新增 | 添加 createUser 函数 | AI |
   | 2025-01-18 | 修改 | updateUser 支持头像上传 | AI |
   | 2025-01-19 | 删除 | 移除废弃的 oldFunction | AI |
   | 2025-01-20 | 优化 | 重构认证逻辑,提升性能 | AI |
   ```

3. **文档审查**
   - PR 时检查文档是否更新
   - 定期审查文档准确性

---

## 📊 文档质量标准

### ✅ 好的文档

- 结构清晰,易于导航
- 代码示例完整可运行
- 变更日志及时更新
- 依赖关系明确
- 注意事项完整

### ❌ 糟糕的文档

- 结构混乱,难以查找
- 没有代码示例
- 变更日志过时
- 缺少关键信息
- 与实际代码不符

---

## 🎯 文档检查清单

提交代码前检查：

- [ ] guide.md 已创建(新模块)
- [ ] 文档内容与代码一致
- [ ] 新增功能已记录
- [ ] 变更日志已更新
- [ ] 代码示例可运行
- [ ] 依赖关系已更新

---

## 💡 最佳实践

1. **边写代码边写文档**
   - 不要等到代码完成后再写
   - 文档可以帮助理清思路

2. **使用代码示例**
   - 示例胜过千言万语
   - 确保示例可运行

3. **记录决策原因**
   - 解释为什么这样设计
   - 帮助未来的维护者

4. **保持简洁**
   - 抓住重点
   - 避免冗余信息

5. **定期审查**
   - 每月审查一次
   - 删除过时内容

---

## 🔗 相关文档

- [主规范](./CLAUDE.md)
- [架构设计](./architecture.md)
- [代码风格](./code-style.md)

---

**📌 记住：**
- 文档是代码的一部分
- 过时的文档比没有文档更糟
- 文档的受众是未来的自己和团队成员
- 好的文档节省大量时间
