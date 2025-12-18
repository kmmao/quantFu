# Supabase Realtime WebSocket 连接修复（进行中）

## 🔍 问题描述
前端显示 "数据加载失败 TypeError: Failed to fetch" 错误，原因是 Realtime WebSocket 连接失败。

## ✅ 已完成的修复步骤

### 1. 诊断问题根源
- **初始错误**: `403 Forbidden` + `TenantNotFound: Tenant not found: realtime`
- **根本原因**: Realtime 服务查找 "realtime" tenant，但数据库中只有 "realtime-dev"

### 2. 配置 Realtime Tenant
- 修改 `docker-compose.yml`: `APP_NAME: realtime` → `APP_NAME: realtime-dev`
- 删除旧 tenant，让服务自动重新初始化
- 新 tenant "realtime-dev" 已创建（2025-12-18 18:05:49）

### 3. 生成正确的 JWT Tokens
使用项目 JWT_SECRET 生成新的 tokens：
```
JWT_SECRET=vm_Hx1CRp_r3Mr5NanvZJQ82lIu3fkAMl-tinZdnyQ05hMBk6AUai99K828JZ-Lf

ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTgzODEyOTk2fQ.PkHFChAetX7x5ikM0bhAw9nHwsF-o1nW0EQNH6EQ7bA

SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJleHAiOjE5ODM4MTI5OTZ9.3rgGpSnxAIA2ZiCefUoESiusE3lSHmMZH-R9CMdXME0
```

**JWT 签名验证**: ✅ 通过

### 4. 更新所有环境变量
- ✅ `.env`: 更新 `SUPABASE_ANON_KEY` 和 `SUPABASE_SERVICE_KEY`
- ✅ `frontend/.env.development`: 更新 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `docker-compose.yml`: Studio 服务使用环境变量引用

### 5. 配置 Kong API Gateway
添加 `request-transformer` 插件自动设置 Host header：
```yaml
plugins:
  - name: request-transformer
    config:
      replace:
        headers:
          - Host:realtime-dev.supabase.co
```

## ⚠️ 当前阻塞问题

### JWT Signature Error
**错误**: `ErrorConnectingToWebsocket: {:error, :signature_error}`
**进展**: 从 `403 TenantNotFound` 进步到 `400 Bad Request + signature_error`

**验证结果**:
- ✅ JWT token 签名正确（Node.js 验证通过）
- ✅ API_JWT_SECRET 环境变量正确
- ✅ Tenant "realtime-dev" 已找到
- ❌ JWT 验证失败

**问题分析**:
Realtime 服务使用两套密钥系统：
1. `API_JWT_SECRET` (环境变量) - 用于全局 JWT 验证
2. `tenant.jwt_secret` (数据库) - 加密存储，用于 tenant 级别验证

当前问题：自动创建的 tenant 的加密 jwt_secret 与 API_JWT_SECRET 可能不匹配。

## 📋 下一步尝试方案

### 方案 A: 查阅 Supabase 官方文档 ⭐ 推荐
1. 查看 Supabase self-hosted 完整配置示例
2. 检查是否有初始化脚本或迁移文件
3. 了解 tenant jwt_secret 的正确配置方法

### 方案 B: 手动配置 Tenant
1. 研究如何使用 `DB_ENC_KEY` 正确加密 jwt_secret
2. 直接在数据库中更新 tenant 的 jwt_secret 字段
3. 确保加密后的值与 API_JWT_SECRET 匹配

### 方案 C: 简化配置
1. 尝试单租户模式（如果支持）
2. 或使用更简单的 Realtime 配置选项

## 📊 技术细节

### Realtime 环境变量
```bash
DB_ENC_KEY=supabaserealtime
API_JWT_SECRET=vm_Hx1CRp_r3Mr5NanvZJQ82lIu3fkAMl-tinZdnyQ05hMBk6AUai99K828JZ-Lf
APP_NAME=realtime-dev
SEED_SELF_HOST=true
```

### Tenant 表
```sql
SELECT name, external_id, inserted_at
FROM _realtime.tenants;

     name     | external_id  |     inserted_at
--------------+--------------+---------------------
 realtime-dev | realtime-dev | 2025-12-18 18:05:49
```

### 错误日志
```
18:08:58.633 project=realtime-dev external_id=realtime-dev 
error_code=ErrorConnectingToWebsocket 
[error] ErrorConnectingToWebsocket: {:error, :signature_error}
```

## 🔗 参考资源
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Realtime GitHub Repo](https://github.com/supabase/realtime)
- [Kong Request Transformer Plugin](https://docs.konghq.com/hub/kong-inc/request-transformer/)

---
**更新时间**: 2025-12-19 02:10
**状态**: 🟡 进行中 - 需要解决 JWT signature_error
