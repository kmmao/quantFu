# QuantFu AI 开发规范

> ✅ **规范已启用** - 本规范适用于 QuantFu 项目的所有开发工作

---

## 🚨 会话启动协议 (Session Startup Protocol)

**CRITICAL: 本文件已自动加载到 AI 的 system prompt 中!**

每次收到用户的**第一个开发任务**时,AI 必须:

### Step 0: 自动执行 (无需用户提醒)

```
在响应用户第一个开发请求前,AI 必须先执行:
1. 读取 .claude/core/project-specific-rules.md
2. 在心里确认: 是否需要 guide.md? 是否需要记录新规则?
3. 然后再开始响应用户
```

### Step 1-5: 开发过程检查点

1. 🔴 **任务开始前** - 读取 project-specific-rules.md,确认规则
2. 🔴 **设计方案时** - 考虑多种实现,选择最优
3. 🔴 **编写代码时** - 使用 AI 代码标记,遵循非侵入式原则
4. 🔴 **代码完成后** - 创建/更新 guide.md (如需要)
5. 🔴 **任务完成前** - 检查质量关卡 (Linter、测试、文档)

**违反任何一步 = 严重违规!用户会立即指出!**

---

## 🎨 AI 助手通用行为准则

### 基本要求
- **语言**: 用中文回答
- **审视态度**: 每次都用审视的目光,仔细看我输入的潜在问题。要指出我的问题,并给出明显在我思考框架之外的建议
- **清醒反馈**: 如果你觉得我说的太离谱了,就骂回来,帮我瞬间清醒
- **真实数据**: 在开发代码的过程中,不要使用模拟数据,请实事求是。除非我要求你这样做

### 任务完成通知
当完成用户每次交代的任务时,必须使用以下命令发送通知:
```bash
ntfy send ntfy.zmddg.com/claude "任务完成:{任务描述} - {结果摘要}"
```

---

## 📋 项目概览

**项目名称**: QuantFu - 期货交易管理平台
**项目类型**: Web应用 (前端 + 后端 API)
**主要技术栈**:
- 前端: Next.js 15, React, TypeScript, Tailwind CSS
- 后端: Python, FastAPI, Supabase (PostgreSQL)
- 策略: Python (极星量化平台集成)

**团队规模**: 个人项目 (allen + AI)

---

## 📚 规范文档索引

本项目遵循 `.claude/` 目录下的通用开发规范:

### 核心规范

- **[架构设计](core/architecture-principles.md)** - 分层架构、SOLID、设计模式
- **[代码质量](core/code-quality.md)** - 命名规范、函数设计、重构策略
- **[安全原则](core/security-principles.md)** - OWASP Top 10、认证授权、数据保护
- **[测试策略](core/testing-strategy.md)** - 测试金字塔、TDD、覆盖率要求
- **[Git 工作流](core/git-workflow.md)** - 分支策略、Conventional Commits
- **[文档标准](core/documentation-standards.md)** - 模块文档、API 文档规范
- **[项目特定规则](core/project-specific-rules.md)** ⭐ - 动态规则系统
- **[开发流程](core/development-workflow.md)** - 需求→设计→开发→测试→部署

完整配置指南: [core/ai-collaboration.md](core/ai-collaboration.md)

---

## 🤖 AI 助手行为准则

### 1. 权限与职责

**✅ 允许的操作 (无需人工确认):**
- [ ] 直接修改代码
- [ ] 安装/更新依赖
- [ ] 创建 Git 提交
- [ ] 运行测试
- [ ] 执行构建

**⚠️ 需要说明的操作:**
- [ ] 删除文件或模块
- [ ] 修改核心架构
- [ ] 更改环境变量配置

**❌ 禁止的操作:**
- [ ] 提交包含敏感信息的代码
- [ ] 绕过测试直接部署
- [ ] 强制推送到主分支

### 2. 工作流程

#### 编写代码前
1. **理解需求** - 明确要解决的问题
2. **阅读规范** - 查阅相关规范文档
3. **探索代码** - 了解现有实现和模式
4. **读取规则** - 检查 `core/project-specific-rules.md` 中的项目规则
5. **设计方案** - 考虑多种实现方式,选择最优解

#### 编写代码时
1. **遵循规范** - 严格遵守所有核心规范
2. **安全第一** - 应用安全原则的所有要求
3. **类型安全** - 使用类型系统 (如适用)
4. **简洁优雅** - 避免过度工程,保持可读性
5. **遵守规则** - 应用项目特定规则

#### 编写代码后
1. **编写测试** - 按测试策略要求编写测试
2. **更新文档** - 更新相关模块的文档
3. **代码自查** - 检查安全性、性能、可维护性
4. **规范提交** - 按 Git 工作流规范提交

### 3. 质量关卡

提交代码前,必须通过:

- [ ] ✅ Linter 零警告
- [ ] ✅ 类型检查零错误
- [ ] ✅ 测试覆盖率达标
- [ ] ✅ 所有测试通过
- [ ] ✅ 文档已更新

---

## 📋 项目特定规则系统 ⭐

### 重要:动态规则记录

本项目使用 **[core/project-specific-rules.md](core/project-specific-rules.md)** 动态记录开发过程中的规则和约定。

**AI 助手必须遵守以下行为准则:**

### 触发记录的情况

当出现以下情况时,你必须主动将规则记录到 `core/project-specific-rules.md`:

1. **用户明确提出规则** - "以后所有XX都要按XX格式"
2. **重复出现的模式** - 连续3次相同的处理方式
3. **技术决策** - "我们决定使用XX而不是YY"
4. **命名约定** - "所有XX都以XX开头/结尾"
5. **代码组织** - "XX类型的文件都放在XX目录"
6. **业务规则** - "当XX情况下必须XX处理"

### 记录格式

使用标准格式记录到 `project-specific-rules.md`:
```markdown
## [规则类别]

### [规则名称]

**制定时间**: YYYY-MM-DD
**适用范围**: [模块/功能/全局]
**规则内容**: [具体规则描述]
**示例**: [代码示例]
**原因**: [为什么制定这个规则]
```

### 开发流程集成

**每次执行任务时:**
1. **开始前** - 读取 `core/project-specific-rules.md`,了解已有规则
2. **进行中** - 发现新规则或重复模式时,主动询问用户是否记录
3. **完成后** - 如果制定了新规则,立即更新文件

详细说明: [core/project-specific-rules.md](core/project-specific-rules.md)

---

## 🎯 项目特定要求

**请在此处填写项目特定的技术要求和规范:**

```markdown
## 技术栈特定要求

- [填写] 例如: 所有组件必须使用函数式风格
- [填写] 例如: 数据库查询必须使用 ORM
- [填写] 例如: API 必须有 OpenAPI 文档

## 代码风格

- [填写] 例如: 使用 Prettier 格式化
- [填写] 例如: 使用 ESLint 规则集 XYZ
- [填写] 例如: 函数命名使用动词开头

## 测试要求

- [填写] 例如: 覆盖率 ≥ 80%
- [填写] 例如: 关键路径必须有集成测试
- [填写] 例如: 使用 AAA 模式编写测试

## 部署和环境

- [填写] 例如: 使用 Docker 容器化
- [填写] 例如: CI/CD 使用 GitHub Actions
- [填写] 例如: 生产环境使用 AWS
```

---

## 🔗 MCP 集成 (可选)

如果使用 Model Context Protocol:

**已配置的 MCP 服务器:**
- [ ] **Memory MCP** - 持久化记忆项目上下文
- [ ] **Filesystem MCP** - 访问项目文件 (Claude Desktop)
- [ ] **Database MCP** - 数据库访问
- [ ] **GitHub MCP** - GitHub 集成

配置方法见: [mcp/README.md](mcp/README.md)

---

## 🚨 错误处理策略

遇到问题时:

1. **不要猜测** - 不确定时,明确询问用户
2. **不要隐藏** - 发现潜在问题,立即告知
3. **不要跳过** - 测试失败必须修复,不能忽略
4. **不要妥协** - 安全性问题零容忍

---

## 📝 快速初始化指南

### Step 1: 补充本文件

删除本提示部分,填写:
- 项目信息 (名称、类型、技术栈)
- AI 权限配置
- 项目特定要求

### Step 2: 补充占位文件

按照 [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) 完成:
1. `core/testing-strategy.md` - 测试策略
2. `core/ai-collaboration.md` - AI 协作详细规范
3. `core/development-workflow.md` - 开发流程
4. `core/project-specific-rules.md` - 删除示例规则

### Step 3: 启用规则系统

向 AI 助手说明:
```
在本项目开发过程中,当我提出规则或你发现重复模式时,
请主动将规则记录到 .claude/core/project-specific-rules.md 文件中。

每次开始任务前,请先读取该文件了解已有规则。
```

### Step 4: 验证配置

```bash
# 检查占位文件
grep -r "⚠️ **待补充文件**" .claude/core/

# 确认测试能运行
npm test  # 或 pytest / go test

# 确认 Linter 能运行
npm run lint
```

---

## ✅ 配置完成检查清单

- [ ] 已填写项目基本信息
- [ ] 已配置 AI 权限
- [ ] 已填写项目特定要求
- [ ] 已补充所有占位文件
- [ ] 已启用项目特定规则系统
- [ ] 测试框架已配置并能运行
- [ ] Linter/Formatter 已配置
- [ ] Git 工作流已就绪
- [ ] MCP 服务器已配置 (如需要)

---

## 📖 延伸阅读

- **完整初始化指南**: [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)
- **AI 协作详细配置**: [core/ai-collaboration.md](core/ai-collaboration.md)
- **项目特定规则系统**: [core/project-specific-rules.md](core/project-specific-rules.md)
- **MCP 配置指南**: [mcp/README.md](mcp/README.md)

---

**最后更新**: 2025-12-18
**配置状态**: ✅ 已完成并启用
