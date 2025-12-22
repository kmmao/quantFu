# 项目开发经验教训

本文档记录在 QuantFu 项目开发过程中遇到的问题和解决方案，帮助避免类似问题。

---

## 2025-12-23: 环境检查脚本的盲点 - npm 依赖检查不完整

### 🐛 问题描述

**症状**:
- 环境检查脚本显示"✓ 通过: 前端依赖已安装"
- 但启动前端时报错: `Module not found: Can't resolve 'recharts'`

**根本原因**:
检查脚本只验证了：
1. `node_modules` 目录是否存在
2. 少数几个关键包（next, react, react-dom, @supabase/supabase-js, typescript）是否存在

**但没有验证** `package.json` 中声明的所有依赖是否都已正确安装。

### 🔍 为什么会发生？

可能的场景：
1. `package.json` 更新了，但没有运行 `npm install`
2. 部分依赖安装失败（网络问题、版本冲突等）
3. `node_modules` 被部分删除或损坏
4. 不同团队成员使用不同的 npm 版本，导致依赖树不一致

### ✅ 解决方案

#### 立即修复：
```bash
cd frontend && npm install
```

#### 长期改进：
**改进了检查脚本** ([check-env.sh](../check-env.sh))，新增：

1. **扩展关键包检查列表**：
```bash
CRITICAL_PACKAGES=(
    "next"
    "react"
    "react-dom"
    "@supabase/supabase-js"
    "typescript"
    "recharts"              # 新增
    "lightweight-charts"     # 新增
    "@tanstack/react-query"  # 新增
    "lucide-react"          # 新增
)
```

2. **使用 npm ls 验证依赖完整性**：
```bash
npm ls --depth=0 2>&1
```
这个命令会：
- 检查 `package.json` 中的所有依赖
- 报告缺失的包（`missing:`）
- 检测版本冲突

### 📋 检查脚本改进对比

**改进前**:
```bash
✓ frontend/node_modules 存在
✓ 5个关键包存在
→ 已安装 473 个包
```

**改进后**:
```bash
✓ frontend/node_modules 存在
✓ 9个关键包存在
→ 已安装 497 个包

验证 package.json 依赖完整性:
  ✓ 所有依赖完整
  # 或者如果有问题会显示：
  ⚠ 发现缺失的包
  npm ERR! missing: recharts@^2.15.4
  → 运行: cd frontend && npm install
```

### 🎯 最佳实践

#### 1. 定期验证依赖
```bash
# 在开发环境启动前
make check

# 或手动验证
cd frontend && npm ls --depth=0
cd backend && uv pip list  # 或 pip list
```

#### 2. 清理并重新安装
如果遇到奇怪的依赖问题：
```bash
# 前端
cd frontend
rm -rf node_modules package-lock.json
npm install

# 后端（使用 uv）
cd backend
rm -rf .venv uv.lock
uv venv && uv sync

# 后端（使用 pip）
cd backend
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### 3. 提交前检查
```bash
# 确保所有依赖都已提交
git status

# 检查 package.json/pyproject.toml 的变更
git diff package.json
git diff backend/pyproject.toml
```

#### 4. CI/CD 集成
在 CI 流程中添加依赖验证：
```yaml
# .github/workflows/ci.yml
- name: Verify dependencies
  run: |
    npm ls --depth=0
    cd backend && uv sync --check
```

### 📚 相关文档

- [npm ls 文档](https://docs.npmjs.com/cli/v10/commands/npm-ls)
- [uv sync 文档](https://docs.astral.sh/uv/reference/cli/#uv-sync)

### 💡 团队协作建议

1. **PR 审查时检查依赖变更**
   - 如果 `package.json` 或 `pyproject.toml` 有变更
   - 确认对应的 lock 文件也已更新

2. **更新依赖后通知团队**
   ```bash
   # 在团队群里提醒
   "刚更新了前端依赖，请运行: cd frontend && npm install"
   ```

3. **文档化依赖变更原因**
   ```bash
   git commit -m "feat: 添加 recharts 用于数据可视化

   - 添加 recharts@^2.15.4
   - 用于持仓分析图表组件
   - 参考：https://recharts.org/"
   ```

---

## 2025-12-23: 添加数据库表完整性检查

### ✅ 改进内容

**需求**:
- 在环境检查中追加 Supabase 数据库表的完整性检查

**实现**:
在 `check-env.sh` 中添加了第 8 项检查：**Supabase 数据库表**

**检查内容**:
1. Docker 容器运行状态
2. 检查 9 个核心表是否存在：
   - `accounts` - 账户管理
   - `contracts` - 合约映射
   - `trades` - 成交记录
   - `positions` - 持仓明细
   - `position_snapshots` - 持仓快照
   - `lock_configs` - 锁仓配置
   - `rollover_records` - 换月记录
   - `market_data` - 行情缓存
   - `notifications` - 系统通知

**检查逻辑**:
```bash
# 使用 docker exec 查询表是否存在
docker exec quantfu_postgres psql -U postgres -d postgres -tAc \
    "SELECT EXISTS (SELECT FROM information_schema.tables ...)"
```

**修复建议**:
如果发现表缺失，脚本会提示：
```bash
修复方法:
  1. 运行数据库初始化:
     make db-init

  2. 或手动执行迁移:
     docker exec -i quantfu_postgres psql ...
```

**检查结果**:
- ✅ 所有表存在：显示绿色 ✓
- ❌ 缺少表：显示红色 ✗ 并计入失败数
- ⚠️  容器未运行：显示警告并跳过检查

**效果**:
- 初次运行发现 9 个表全部缺失
- 运行 `make db-init` 后再次检查
- 显示所有 9 个表 ✓ 存在
- 检查通过项：28 → 37 (+9)

### 💡 经验总结

**核心教训**:
> 数据库检查不能只检查配置文件，还要验证实际表结构。

**改进价值**:
1. ✅ 提前发现数据库未初始化的问题
2. ✅ 提供清晰的修复指引
3. ✅ 避免运行时报错 "table does not exist"
4. ✅ 确保开发环境完整性

---

## 2025-12-23: PostgREST Schema Cache 未更新导致"表不存在"错误

### 🐛 问题描述

**症状**:
- 环境检查脚本显示所有9个核心表都存在 ✓
- 数据库中可以直接查询到所有表
- 但前端报错: `Database connection failed: Could not find the table 'public.accounts' in the schema cache`

**PostgREST 日志显示**:
```
Schema cache loaded 3 Relations, 2 Relationships, 0 Functions...
```

只加载了3个表，而实际有9个核心表！

### 🔍 根本原因

**PostgREST 的 schema cache 机制**:
1. PostgREST 启动时会查询数据库，构建 schema cache
2. 只有在 cache 中的表才会被暴露为 REST API
3. **Schema cache 不会自动更新**，即使数据库中新增了表

**问题发生的场景**:
1. 首次运行 `docker-compose up` 时，PostgREST 启动
2. 此时数据库可能还没有初始化表（或只有部分表）
3. PostgREST 读取到的表很少，构建了一个不完整的 cache
4. 后续运行 `make db-init` 创建了所有表
5. **但 PostgREST 仍然使用旧的 cache**，不知道新表的存在

### ✅ 解决方案

#### 立即修复：重启 PostgREST
```bash
docker restart quantfu_rest
```

**重启后的日志对比**:

**修复前**:
```
Schema cache loaded 3 Relations, 2 Relationships, 0 Functions...
```

**修复后**:
```
Schema cache loaded 13 Relations, 10 Relationships, 10 Functions...
```

从 3 个表增加到 **13 个表**（9个核心表 + 1个视图 + 其他系统表）

#### 验证修复
```bash
# 查看 PostgREST API
curl "http://localhost:3333/" | grep -E "(accounts|contracts|positions)"

# 结果显示所有表都已暴露:
# /accounts, /contracts, /positions, /trades,
# /position_snapshots, /lock_configs, /rollover_records,
# /market_data, /notifications
```

### 📋 正确的数据库初始化流程

#### 推荐流程（避免此问题）

**方式 1: 一次性启动（推荐）**
```bash
# 1. 确保数据库卷不存在（首次安装）
docker-compose down -v  # 删除卷

# 2. 启动所有服务（migrations 会自动执行）
make start

# 3. 等待数据库初始化完成（约10秒）
sleep 10

# 4. PostgREST 会自动加载完整的 schema
docker logs quantfu_rest --tail 5
```

**方式 2: 分步启动（当前情况）**
```bash
# 1. 先启动数据库
docker-compose up -d postgres

# 2. 等待数据库健康
docker-compose ps postgres  # 等待 (healthy)

# 3. 初始化表结构
make db-init

# 4. 重启 PostgREST（关键！）
docker restart quantfu_rest

# 5. 启动其他服务
make start
```

### 🎯 最佳实践

#### 1. 开发环境初始化
```bash
# 完整的环境初始化流程
make clean          # 清理旧环境
make start          # 启动所有服务
sleep 10            # 等待初始化
make check          # 检查环境
make dev-full       # 启动开发环境
```

#### 2. 修改数据库结构后
```bash
# 执行新的迁移后，必须重启 PostgREST
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/new_migration.sql

# 重启 PostgREST 刷新 schema cache
docker restart quantfu_rest
```

#### 3. CI/CD 流程
```yaml
# .github/workflows/ci.yml
- name: Initialize database
  run: |
    docker-compose up -d postgres
    sleep 10  # 等待数据库启动
    make db-init
    docker restart quantfu_rest  # 刷新 schema cache
    sleep 5
    make check
```

### 🔍 故障排查

#### 问题 1: 表存在但 PostgREST 404
**症状**:
```bash
curl http://localhost:3333/accounts
# {"code":"PGRST205","message":"Could not find the table..."}
```

**原因**: PostgREST schema cache 未更新

**解决**:
```bash
docker restart quantfu_rest
```

#### 问题 2: 重启后仍然只有3个表
**症状**: 重启后 schema cache 仍显示很少的表

**可能原因**:
1. 表确实没有创建成功
2. 权限问题（anon/authenticated 角色没有权限）

**诊断**:
```bash
# 1. 检查表是否存在
docker exec quantfu_postgres psql -U postgres -d postgres -c "\dt"

# 2. 检查权限
docker exec quantfu_postgres psql -U postgres -d postgres -c "\dp accounts"

# 3. 查看 PostgREST 日志
docker logs quantfu_rest --tail 50
```

#### 问题 3: PostgREST 连接失败
**症状**:
```
FATAL: password authentication failed for user "authenticator"
```

**解决**:
```bash
# 检查 .env 中的密码
cat .env | grep AUTHENTICATOR_PASSWORD

# 确保密码与 000_supabase_roles.sql 中一致
# 或重新初始化数据库
make db-reset
```

### 💡 经验总结

**核心教训**:
> PostgREST 的 schema cache 是静态的，数据库结构变更后必须手动刷新。

**关键点**:
1. ✅ 数据库初始化完成后，**必须重启 PostgREST**
2. ✅ 执行数据库迁移后，**必须重启 PostgREST**
3. ✅ 环境检查不仅要检查表是否存在，还要检查 PostgREST 是否加载了这些表
4. ✅ 推荐在 Makefile 中添加 `db-init` 后自动重启 PostgREST

**改进建议**:

更新 `Makefile` 的 `db-init` 命令:
```makefile
db-init: ## 初始化数据库表结构
	@echo "执行数据库迁移..."
	docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/000_supabase_roles.sql
	docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_init_schema.sql
	@echo "重启 PostgREST 刷新 schema cache..."
	docker restart quantfu_rest
	@echo "✓ 数据库初始化完成"
```

**预防措施**:
- 在 `make check` 中添加 PostgREST schema cache 验证
- 在 `make start` 后自动等待并重启 PostgREST
- 文档化所有需要重启 PostgREST 的场景

---

## 总结

**核心教训**:
> 环境检查不能只检查"存在性"，还要检查"完整性"。

**改进措施**:
1. ✅ 扩展关键包检查列表
2. ✅ 使用 `npm ls` 验证依赖完整性
3. ✅ 在检查脚本中提供清晰的修复指引
4. ✅ 文档化常见问题和解决方案

**预防措施**:
- 开发前先运行 `make check`
- 更新依赖后通知团队
- 定期清理并重建环境（每周/每月）

---

**最后更新**: 2025-12-23
**记录人**: AI Assistant
**影响范围**: 前端环境检查
**严重程度**: 中等（影响开发体验，但易于修复）
