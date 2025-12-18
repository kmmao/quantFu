# Git 工作流规范

> 本文档定义 ZP 项目的 Git 分支策略、提交规范和 PR 流程。

## 🌳 分支策略

### 主要分支

```
main (生产环境)
  ├── dev (开发环境)
  │   ├── feature/user-auth
  │   ├── feature/product-list
  │   └── fix/login-bug
  └── hotfix/critical-security-patch
```

| 分支类型 | 命名 | 用途 | 合并目标 |
|---------|------|------|----------|
| `main` | main | 生产环境代码,随时可部署 | - |
| `dev` | dev | 开发环境,所有功能开发的基础 | main |
| `feature/*` | feature/功能名 | 新功能开发 | dev |
| `fix/*` | fix/bug描述 | Bug 修复 | dev |
| `hotfix/*` | hotfix/问题描述 | 紧急生产修复 | main + dev |
| `refactor/*` | refactor/模块名 | 代码重构 | dev |
| `docs/*` | docs/文档名 | 文档更新 | dev |

---

## 📝 提交规范 (Conventional Commits)

### 提交消息格式

```
<类型>(<范围>): <简短描述>

<详细描述>

<页脚>
```

### 类型 (Type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加 OAuth 登录` |
| `fix` | Bug 修复 | `fix(api): 修复用户查询500错误` |
| `docs` | 文档更新 | `docs(readme): 更新安装说明` |
| `style` | 代码格式(不影响功能) | `style: 格式化代码` |
| `refactor` | 重构(不是 feat 也不是 fix) | `refactor(utils): 优化日期格式化` |
| `perf` | 性能优化 | `perf(db): 优化查询索引` |
| `test` | 测试相关 | `test(auth): 添加登录测试` |
| `chore` | 构建/工具变动 | `chore(deps): 升级 Next.js 到 14.1` |
| `ci` | CI 配置变动 | `ci: 添加自动部署` |
| `revert` | 回退提交 | `revert: 回退 feat(auth)` |

### 范围 (Scope)

常用范围：
- `auth` - 认证相关
- `api` - API 相关
- `db` - 数据库相关
- `ui` - UI 组件
- `utils` - 工具函数
- `deps` - 依赖更新

### 示例

```bash
# ✅ 好的提交消息
feat(auth): 添加 Google OAuth 登录

- 集成 Supabase Auth
- 添加登录按钮到登录页
- 更新用户表结构

Closes #123

# ✅ 简单提交
fix(ui): 修复按钮样式在移动端显示问题

# ✅ Breaking Change
feat(api)!: 重构用户 API 接口

BREAKING CHANGE: User API 从 /api/user 改为 /api/users

# ❌ 不好的提交消息
fix: bug
update
修复问题
```

---

## 🔀 工作流程

### 1. 功能开发流程

```bash
# 1. 从 dev 分支创建功能分支
git checkout dev
git pull origin dev
git checkout -b feature/user-profile

# 2. 开发功能,定期提交
git add .
git commit -m "feat(profile): 添加用户头像上传功能"

# 3. 保持与 dev 同步
git fetch origin
git rebase origin/dev

# 4. 推送到远程
git push origin feature/user-profile

# 5. 创建 PR (通过 GitHub 或 gh CLI)
gh pr create --base dev --title "feat: 用户个人资料功能" --body "实现用户头像上传和基本信息编辑"

# 6. PR 合并后删除分支
git checkout dev
git pull origin dev
git branch -d feature/user-profile
```

### 2. Bug 修复流程

```bash
# 1. 从 dev 创建修复分支
git checkout dev
git pull origin dev
git checkout -b fix/login-error

# 2. 修复 bug 并提交
git add .
git commit -m "fix(auth): 修复登录时的 session 过期问题"

# 3. 推送并创建 PR
git push origin fix/login-error
gh pr create --base dev --title "fix: 登录 session 过期问题"
```

### 3. 紧急修复流程 (Hotfix)

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/security-patch

# 2. 修复并提交
git add .
git commit -m "fix(security): 修复 XSS 漏洞"

# 3. 合并到 main
git checkout main
git merge --no-ff hotfix/security-patch
git push origin main
git tag -a v1.0.1 -m "安全补丁"
git push origin v1.0.1

# 4. 同步到 dev
git checkout dev
git merge --no-ff hotfix/security-patch
git push origin dev

# 5. 删除 hotfix 分支
git branch -d hotfix/security-patch
git push origin --delete hotfix/security-patch
```

---

## 🔍 Pull Request 规范

### PR 标题格式

```
<类型>: <简短描述>

示例:
feat: 用户认证功能
fix: 修复产品列表分页问题
refactor: 重构数据库查询层
```

### PR 描述模板

创建 `.github/pull_request_template.md`:

```markdown
## 📋 变更类型

- [ ] feat (新功能)
- [ ] fix (Bug 修复)
- [ ] docs (文档)
- [ ] refactor (重构)
- [ ] test (测试)
- [ ] chore (构建/工具)

## 🎯 变更说明

简要描述本次 PR 的目的和实现方式。

## 🔗 相关 Issue

Closes #[issue编号]

## 📝 变更详情

- 添加了 XXX 功能
- 修复了 YYY 问题
- 优化了 ZZZ 性能

## 🧪 测试

- [ ] 添加了单元测试
- [ ] 添加了集成测试
- [ ] 手动测试通过
- [ ] 所有测试通过

## 📸 截图 (如适用)

![screenshot](链接)

## ✅ 检查清单

- [ ] 代码遵循项目规范
- [ ] 通过所有测试
- [ ] 更新了相关文档
- [ ] 更新了模块 guide.md
- [ ] 无 console.log 或调试代码
- [ ] 通过 ESLint 和 TypeScript 检查

## 📌 额外说明

其他需要 reviewer 注意的事项。
```

### PR 审查清单

审查者应检查：

- [ ] **功能完整性**：PR 解决了声明的问题
- [ ] **代码质量**：遵循代码规范,无明显问题
- [ ] **测试覆盖**：有足够的测试,且通过
- [ ] **安全性**：无安全漏洞
- [ ] **性能**：无明显性能问题
- [ ] **文档**：相关文档已更新
- [ ] **向后兼容**：不破坏现有功能

---

## 🏷️ 版本管理

### 语义化版本 (SemVer)

```
主版本号.次版本号.修订号  (Major.Minor.Patch)

示例: v1.2.3
```

| 类型 | 何时递增 | 示例 |
|------|---------|------|
| **Major** | 不兼容的 API 变更 | 1.0.0 → 2.0.0 |
| **Minor** | 向后兼容的新功能 | 1.0.0 → 1.1.0 |
| **Patch** | 向后兼容的 bug 修复 | 1.0.0 → 1.0.1 |

### 创建版本标签

```bash
# 查看当前版本
git describe --tags --abbrev=0

# 创建新版本
git tag -a v1.2.0 -m "Release v1.2.0: 添加用户认证功能"
git push origin v1.2.0

# 列出所有标签
git tag -l

# 删除标签
git tag -d v1.2.0
git push origin --delete v1.2.0
```

---

## 🚫 禁止操作

### ❌ 绝不执行以下操作

```bash
# ❌ 强制推送到 main/dev
git push --force origin main

# ❌ 直接在 main 上提交
git checkout main
git commit -m "quick fix"  # 禁止!

# ❌ 提交后修改公开的历史
git push --force  # 除非明确允许

# ❌ 提交敏感信息
git add .env
git commit -m "add env"  # 危险!

# ❌ 提交大文件
git add large-file.zip  # 使用 Git LFS

# ❌ 合并未经审查的代码
git merge feature/untested  # 必须通过 PR
```

---

## 🔧 Git 配置

### 全局配置

```bash
# 设置用户信息
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# 设置默认编辑器
git config --global core.editor "code --wait"

# 启用颜色
git config --global color.ui auto

# 设置默认分支名
git config --global init.defaultBranch main

# 自动转换换行符
git config --global core.autocrlf input  # macOS/Linux
git config --global core.autocrlf true   # Windows
```

### 项目配置

在项目根目录创建 `.gitattributes`:

```
# 自动标准化换行符
* text=auto eol=lf

# 二进制文件
*.png binary
*.jpg binary
*.pdf binary
*.woff binary
*.woff2 binary
```

在项目根目录创建 `.gitignore`:

```
# 依赖
node_modules/
.pnp
.pnp.js

# 测试
coverage/
.nyc_output

# Next.js
.next/
out/
build/
dist/

# 环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 调试
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*.swn
.DS_Store

# Vercel
.vercel

# Supabase
supabase/.branches
supabase/.temp
```

---

## 💡 常用 Git 命令

### 日常操作

```bash
# 查看状态
git status

# 查看差异
git diff
git diff --staged

# 暂存文件
git add <file>
git add .

# 提交
git commit -m "message"
git commit --amend  # 修改最后一次提交

# 推送
git push origin <branch>
git push -u origin <branch>  # 设置上游

# 拉取
git pull origin <branch>
git fetch origin
```

### 分支操作

```bash
# 查看分支
git branch
git branch -a  # 包括远程分支

# 创建分支
git checkout -b feature/new

# 切换分支
git checkout main
git switch main  # 新语法

# 删除分支
git branch -d feature/old
git push origin --delete feature/old

# 重命名分支
git branch -m old-name new-name
```

### 历史查看

```bash
# 查看提交历史
git log
git log --oneline
git log --graph --oneline --all

# 查看文件历史
git log -p <file>

# 查看某次提交
git show <commit-hash>

# 搜索提交
git log --grep="关键词"
git log --author="作者名"
```

### 撤销操作

```bash
# 撤销工作区更改
git checkout -- <file>
git restore <file>  # 新语法

# 撤销暂存
git reset HEAD <file>
git restore --staged <file>  # 新语法

# 撤销提交 (保留更改)
git reset --soft HEAD~1

# 撤销提交 (丢弃更改)
git reset --hard HEAD~1

# 回退到某个提交
git revert <commit-hash>
```

### 储藏 (Stash)

```bash
# 储藏当前更改
git stash
git stash save "work in progress"

# 查看储藏列表
git stash list

# 应用储藏
git stash apply
git stash apply stash@{0}

# 应用并删除
git stash pop

# 删除储藏
git stash drop stash@{0}
git stash clear  # 清空所有
```

---

## 📋 Git 检查清单

### 提交前

- [ ] 查看 `git status`,确认更改正确
- [ ] 查看 `git diff`,确认差异符合预期
- [ ] 运行测试,确保通过
- [ ] 运行 lint,确保无错误
- [ ] 提交消息遵循规范
- [ ] 未包含敏感信息

### 推送前

- [ ] 本地测试通过
- [ ] 已拉取最新代码并解决冲突
- [ ] 提交历史清晰
- [ ] 分支名符合规范

### 合并前

- [ ] PR 已通过所有检查
- [ ] 至少一人审查通过
- [ ] 无冲突
- [ ] 文档已更新

---

## 🔗 相关资源

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Pro Git Book](https://git-scm.com/book/zh/v2)

---

**📌 记住：**
- Git 历史是项目的宝贵资产
- 清晰的提交历史便于 debug 和回溯
- 永远不要强推到主分支
- 遇到问题先备份,再操作
- 不确定的操作,先查文档或询问团队
