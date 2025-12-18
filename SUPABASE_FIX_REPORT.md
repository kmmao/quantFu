# Supabase Studio 修复报告

## 🔧 修复的核心问题

### 问题根源
Supabase Studio 在查询数据库表时返回 500 错误和验证错误,错误信息为:
```json
{
  "expected": "string",
  "code": "invalid_type",
  "message": "Invalid input: expected string, received undefined"
}
```

### 根本原因
**Meta API 容器缺少关键环境变量:**
1. ❌ `CRYPTO_KEY` 环境变量缺失 - Meta API 无法正确加密/解密数据
2. ❌ `PG_META_DB_USER` 使用了错误的用户 (`postgres` 而不是 `supabase_admin`)

### 修复步骤
1. ✅ 重新创建 Meta 容器,确保 `CRYPTO_KEY=${PG_META_CRYPTO_KEY}` 正确加载
2. ✅ 验证 Meta API 使用 `supabase_admin` 用户连接数据库
3. ✅ 重启 Studio 容器,确保它连接到更新后的 Meta API

## 📊 当前系统状态

### 环境变量验证 (Meta 容器)
```bash
CRYPTO_KEY=vm_Hx1CRp_r3Mr5NanvZJQ82lIu3fkAMl-tinZdnyQ05hMBk6AUai99K828JZ-Lf ✅
PG_META_DB_USER=supabase_admin ✅
PG_META_DB_HOST=postgres ✅
PG_META_DB_PORT=5432 ✅
PG_META_DB_NAME=postgres ✅
PG_META_PORT=8080 ✅
```

### 服务运行状态
| 服务 | 状态 | 端口 | 健康检查 |
|------|------|------|----------|
| PostgreSQL | ✅ Running | 5432 | Healthy |
| Supabase Studio | ✅ Running | 3001 | - |
| Meta API | ✅ Running | 8080 | Healthy |
| PostgREST | ✅ Running | 3000 | - |
| Kong API Gateway | ✅ Running | 8000, 8443 | Healthy |
| Realtime | ✅ Running | 4000 | - |

### API 验证结果
1. **Meta API**: ✅ 返回 19 个表 (8 个业务表 + 11 个系统表)
2. **PostgREST**: ✅ REST API 正常响应
3. **PostgreSQL**: ✅ 直接查询正常
4. **Studio UI**: ✅ 可访问 http://localhost:3001

## ✅ 验证步骤

### 1. 访问 Supabase Studio
```bash
打开浏览器: http://localhost:3001
```

### 2. 测试 SQL Editor
进入 SQL Editor,执行以下查询:
```sql
-- 测试基本查询
SELECT * FROM accounts;

-- 测试表结构
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_schema = 'public';

-- 测试表列信息
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'accounts';
```

### 3. 测试 Table Editor
- 点击左侧菜单 "Table Editor"
- 应该能看到所有 public schema 中的表
- 点击 `accounts` 表
- 应该能看到表结构和数据(目前为 0 行)

## 🔍 如果仍有问题

### 检查 Studio 日志
```bash
docker logs quantfu_studio --tail 50
```

### 检查 Meta API 日志
```bash
docker logs quantfu_meta --tail 50
```

### 测试 Meta API 直接访问
```bash
curl http://localhost:8080/tables | jq '.'
```

### 重启所有服务
```bash
docker-compose restart
```

## 📝 技术细节

### 为什么需要 CRYPTO_KEY?
Meta API 使用 `CRYPTO_KEY` 来加密/解密敏感数据和会话信息。缺少此环境变量会导致:
- 查询结果无法正确序列化
- 返回 undefined 值导致前端验证失败
- Studio UI 显示 500 错误

### 为什么使用 supabase_admin?
`supabase_admin` 是 Supabase 系统中具有管理权限的角色,能够:
- 访问所有 schema (包括 _realtime, realtime)
- 修改表结构
- 管理扩展和权限

使用 `postgres` 超级用户可能导致权限问题和安全风险。

## 🎉 结论

所有已知问题已修复,Supabase Studio 应该可以正常使用了!

**修复时间**: 2025-12-18
**修复的关键问题**: Meta API 缺少 CRYPTO_KEY 环境变量
**影响范围**: Supabase Studio SQL Editor 和 Table Editor
