# Scripts 目录

本目录包含项目的自动化脚本和工具。

---

## 📁 文件列表

### Git 提交工具

- **[git-commit.sh](git-commit.sh)** ⭐
  - 交互式 Git 提交向导
  - 完整的 Conventional Commits 支持
  - 自动添加 AI 标识
  - 使用: `make commit`

- **[quick-commit.sh](quick-commit.sh)** ⚡
  - 快速 Git 提交脚本
  - 简化的提交流程
  - 支持命令行参数
  - 使用: `make quick-commit`

- **[GIT_COMMIT_GUIDE.md](GIT_COMMIT_GUIDE.md)** 📖
  - Git 提交完整指南
  - 包含示例和最佳实践

---

## 🚀 快速使用

### 交互式提交（推荐新手）

```bash
make commit
```

**流程**:
1. 选择提交类型（feat/fix/docs等）
2. 选择变更范围（可选）
3. 输入描述
4. 添加详细说明（可选）
5. 预览确认
6. 选择文件
7. 执行提交
8. 可选推送

### 快速提交（推荐熟手）

```bash
make quick-commit
```

**流程**:
1. 快速选择类型
2. 输入描述
3. 确认提交

### 命令行参数

```bash
# 方式 1: 短参数
./scripts/quick-commit.sh -t feat -s ui -m "添加按钮组件"

# 方式 2: 长参数
./scripts/quick-commit.sh --type fix --scope api --message "修复查询错误"

# 方式 3: 只提供消息（默认 type=chore）
./scripts/quick-commit.sh "更新配置文件"
```

---

## 📋 提交类型

| 类型 | 说明 | 使用场景 |
|------|------|----------|
| `feat` | 新功能 | 添加新组件、新页面、新功能 |
| `fix` | Bug修复 | 修复错误、问题 |
| `docs` | 文档 | 更新 README、注释、文档 |
| `style` | 格式 | 代码格式化、缩进调整（不影响功能） |
| `refactor` | 重构 | 代码重构、优化结构 |
| `perf` | 性能 | 性能优化 |
| `test` | 测试 | 添加或修改测试 |
| `chore` | 杂项 | 更新依赖、配置、构建工具 |
| `ci` | CI/CD | 修改 CI 配置 |
| `revert` | 回退 | 回退之前的提交 |

---

## 🎯 使用示例

### 场景 1: 完成新功能

```bash
# 交互式
make commit
# 选择: 1 (feat)
# 范围: chart
# 描述: 添加 K线图组件
```

### 场景 2: 修复 Bug

```bash
# 快速提交
make quick-commit
# 选择: 2 (fix)
# 描述: 修复登录超时问题
```

### 场景 3: 更新文档

```bash
# 命令行
./scripts/quick-commit.sh -t docs -m "更新部署文档"
```

### 场景 4: 更新依赖

```bash
./scripts/quick-commit.sh -t chore -s deps -m "升级 Next.js 到 15.1.6"
```

---

## 🤖 AI 自动化集成

### 任务完成后自动提交

AI 助手会在完成任务后自动执行：

```bash
# 1. 检查环境
make check

# 2. 运行测试
cd frontend && npm test
cd backend && uv run pytest

# 3. 提交代码
make quick-commit
# 或
./scripts/quick-commit.sh -t feat -m "完成 XXX 功能"

# 4. 发送通知
ntfy send ntfy.zmddg.com/claude "任务完成: ..."
```

---

## 🛠️ 脚本维护

### 添加新脚本

1. 创建脚本文件: `scripts/new-script.sh`
2. 添加执行权限: `chmod +x scripts/new-script.sh`
3. 在 Makefile 中添加命令
4. 更新本 README

### 修改提交格式

编辑脚本中的 AI_FOOTER 部分：

```bash
# git-commit.sh 或 quick-commit.sh
AI_FOOTER="\n🤖 Generated with Claude Code\n\nCo-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## 📚 相关文档

- [Git 提交指南](GIT_COMMIT_GUIDE.md)
- [Git 工作流规范](../.claude/core/git-workflow.md)
- [项目开发规范](../.claude/CLAUDE.md)
- [快速启动指南](../QUICK_START.md)

---

## 💡 最佳实践

1. **小步提交**
   - 每完成一个功能点就提交
   - 避免一次提交太多更改

2. **清晰的描述**
   - 用一句话说明做了什么
   - 描述"做了什么"而不是"怎么做"

3. **提交前检查**
   - 运行 `git status` 查看更改
   - 运行 `make check` 检查环境
   - 确保测试通过

4. **使用正确的类型**
   - 根据实际改动选择合适的类型
   - 有疑问时查看 [提交指南](GIT_COMMIT_GUIDE.md)

---

**最后更新**: 2025-12-23
**维护者**: allen + AI
