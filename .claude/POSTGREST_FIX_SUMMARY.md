# PostgREST Schema Cache 问题修复总结

## 📋 问题报告

**日期**: 2025-12-23
**报告人**: allen
**问题**: 前端无法连接数据库

### 错误信息

```
Database connection failed
Failed to fetch metrics: {
  'code': 'PGRST205',
  'details': None,
  'hint': "Perhaps you meant the table 'public.tenants'",
  'message': "Could not find the table 'public.accounts' in the schema cache"
}
```

### 困惑点

用户提出的合理质疑：
> "为什么环境检查显示所有9个表都存在，但前端还是报表不存在的错误？"

---

## 🔍 问题诊断

### 1. 检查表是否真的存在

```bash
docker exec quantfu_postgres psql -U postgres -d postgres -c "\dt"
```

**结果**: ✅ 所有9个核心表都存在于数据库中

### 2. 检查表权限

```bash
docker exec quantfu_postgres psql -U postgres -d postgres -c "\dp accounts"
```

**结果**: ✅ `anon` 和 `authenticated` 角色都有正确的权限

### 3. 检查 PostgREST 日志

```bash
docker logs quantfu_rest --tail 20
```

**发现关键问题**:
```
Schema cache loaded 3 Relations, 2 Relationships, 0 Functions...
```

🚨 **PostgREST 只加载了 3 个表，而不是 9 个！**

---

## 💡 根本原因

### PostgREST Schema Cache 机制

PostgREST 采用 **静态 schema cache** 机制：

1. **启动时加载**: PostgREST 启动时一次性查询数据库结构
2. **构建缓存**: 将可访问的表、视图、函数等构建为内存缓存
3. **不自动更新**: 即使数据库结构变化，cache 也不会自动刷新

### 问题发生时序

```
时间线:
  T1: docker-compose up -d  → PostgREST 启动
  T2: PostgREST 查询数据库  → 此时表很少或不存在
  T3: PostgREST 构建 cache  → cache 中只有 3 个表
  T4: 用户运行 make db-init  → 创建了所有 9 个表
  T5: 前端访问 API         → PostgREST 仍使用旧 cache
  T6: 报错"表不存在"        → cache 中确实没有这些表
```

### 为什么环境检查通过了？

环境检查脚本直接查询 PostgreSQL：
```bash
docker exec quantfu_postgres psql ... "SELECT EXISTS ..."
```

这个查询**绕过了 PostgREST**，直接访问数据库，所以能看到所有表。

但前端通过 **PostgREST REST API** 访问数据库，而 PostgREST 的 cache 中没有这些表。

---

## ✅ 解决方案

### 立即修复

```bash
docker restart quantfu_rest
```

**修复效果对比**:

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| Relations | 3 | 13 |
| Relationships | 2 | 10 |
| Functions | 0 | 10 |

### 验证修复

```bash
# 查看 PostgREST 加载的表
docker logs quantfu_rest --tail 5

# 测试 API
curl http://localhost:3333/accounts
# 返回: [] (空数组，表示表存在但无数据)

# 查看所有暴露的 API
curl http://localhost:3333/ | grep -o '"/[^"]*"' | head -20
```

**结果**: ✅ 所有9个核心表的 API 都已暴露

---

## 🛠️ 永久修复

### 1. 更新 Makefile

修改了 `db-init` 命令，使其在初始化后**自动重启 PostgREST**：

```makefile
db-init: ## 初始化数据库表结构
	@echo "📋 执行数据库迁移..."
	@echo "  1/2 创建 Supabase 角色和权限..."
	@docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/000_supabase_roles.sql
	@echo "  2/2 创建数据库表结构..."
	@docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/001_init_schema.sql
	@echo "🔄 重启 PostgREST 刷新 schema cache..."
	@docker restart quantfu_rest > /dev/null 2>&1
	@sleep 2
	@echo "✅ 数据库初始化完成"
	@echo "📊 PostgREST API: http://localhost:3333"
```

**改进点**:
1. ✅ 先执行 `000_supabase_roles.sql`（之前遗漏了）
2. ✅ 再执行 `001_init_schema.sql`
3. ✅ 自动重启 PostgREST
4. ✅ 等待2秒确保服务就绪

### 2. 更新文档

在 `.claude/LESSONS_LEARNED.md` 中新增专门章节，详细记录：
- 问题症状和诊断过程
- PostgREST schema cache 机制详解
- 正确的数据库初始化流程
- 故障排查步骤
- 最佳实践建议

---

## 📊 影响范围

### 受影响的操作

以下操作会导致数据库结构变化，**必须重启 PostgREST**：

1. ✅ 创建新表 (`CREATE TABLE`)
2. ✅ 删除表 (`DROP TABLE`)
3. ✅ 修改表结构 (`ALTER TABLE`)
4. ✅ 创建/修改视图 (`CREATE/ALTER VIEW`)
5. ✅ 创建/修改函数 (`CREATE/ALTER FUNCTION`)
6. ✅ 修改权限 (`GRANT/REVOKE`)

### 不受影响的操作

以下操作**不需要重启 PostgREST**：

- ⭕ 插入数据 (`INSERT`)
- ⭕ 更新数据 (`UPDATE`)
- ⭕ 删除数据 (`DELETE`)
- ⭕ 查询数据 (`SELECT`)

---

## 🎯 最佳实践

### 开发环境初始化

**推荐流程（首次安装）**:
```bash
# 方式 1: 一键初始化（推荐）
make init

# 方式 2: 分步初始化
make start          # 启动所有服务
sleep 10            # 等待数据库启动
make db-init        # 初始化表结构（会自动重启 PostgREST）
make check          # 检查环境
make dev-full       # 启动开发环境
```

### 日常开发流程

```bash
# 每天开始前
make check          # 检查环境是否正常

# 如果发现问题
make db-init        # 重新初始化（现在会自动重启 PostgREST）
```

### 执行数据库迁移

```bash
# 手动执行新迁移文件
docker exec -i quantfu_postgres psql -U postgres -d postgres < database/migrations/new_migration.sql

# 必须重启 PostgREST
docker restart quantfu_rest

# 或者直接使用 make db-init（推荐）
make db-init
```

---

## 📈 验证结果

### 修复前

```
✓ 通过: 37
⚠ 警告: 11
✗ 失败: 0

但前端报错: "Could not find the table 'public.accounts'"
```

### 修复后

```bash
# 1. 环境检查
make check
# ✓ 通过: 37
# ⚠ 警告: 11
# ✗ 失败: 0

# 2. PostgREST API 测试
curl http://localhost:3333/accounts
# 返回: []  ✓ 成功

# 3. PostgREST 日志
docker logs quantfu_rest --tail 5
# Schema cache loaded 13 Relations, 10 Relationships, 10 Functions
# ✓ 所有表已加载

# 4. 前端访问
# ✓ 前端可以正常连接数据库
```

---

## 📚 相关资源

- [PostgREST 官方文档 - Schema Cache](https://postgrest.org/en/stable/schema_cache.html)
- [经验教训文档](LESSONS_LEARNED.md#2025-12-23-postgrest-schema-cache-未更新导致表不存在错误)
- [数据库检查功能说明](DB_CHECK_SUMMARY.md)
- [Makefile 数据库命令](../Makefile)

---

## 💡 核心要点

### 问题本质

**环境检查和实际访问使用不同的路径**:

```
环境检查: check-env.sh → docker exec → PostgreSQL ✓
前端访问: Frontend → Supabase Client → PostgREST → PostgreSQL ✗
                                          ↑
                                    schema cache 过期
```

### 解决方案

**让 PostgREST 重新加载 schema**:
```bash
docker restart quantfu_rest
```

### 预防措施

**在 Makefile 中自动化这个步骤**:
```makefile
db-init:
    ... 执行迁移 ...
    docker restart quantfu_rest  # 关键步骤
```

---

## 🎉 总结

这个问题揭示了一个重要的架构理解盲点：

> **环境检查工具和应用程序可能使用不同的数据访问路径。**
>
> 检查工具显示"正常"≠ 应用程序能正常工作。

**学到的教训**:
1. ✅ 理解中间层（PostgREST）的缓存机制
2. ✅ 验证修复时要模拟实际访问路径
3. ✅ 自动化容易遗忘的关键步骤（重启 PostgREST）
4. ✅ 文档化非直观的系统行为

---

**修复完成时间**: 2025-12-23 18:56
**修复耗时**: 约15分钟
**影响**: 🟢 已完全解决，未来不会再发生
**严重程度**: 🔴 高（阻塞开发）→ 🟢 低（已自动化修复）
