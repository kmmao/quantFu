# Failed to Fetch 错误修复指南

## 🔍 问题诊断

### 错误信息
```
TypeError: Failed to fetch
```

这个错误通常有几个可能原因：

---

## ⚠️ 关键问题：端口冲突

### 问题
- **PostgREST**: 使用端口 3000
- **Next.js 前端**: 默认也使用端口 3000
- **冲突**: 两个服务不能同时使用 3000

### 当前端口分配
| 服务 | 端口 | 用途 |
|------|------|------|
| PostgreSQL | 5432 | 数据库 |
| PostgREST | 3000 | REST API |
| Supabase Studio | 3001 | 管理界面 |
| **前端 Next.js** | **3002** | **开发服务器（新）** |
| Realtime | 4000 | WebSocket |
| Kong Gateway | 8000, 8443 | API 网关 |
| Meta API | 8080 | 元数据 |

---

## ✅ 解决方案

### 步骤 1: 使用正确的端口启动前端

```bash
cd frontend

# 停止当前前端服务器（如果在运行）
# 按 Ctrl+C 停止

# 使用端口 3002 启动
PORT=3002 npm run dev

# 或者使用 package.json 中的脚本
npm run dev
```

### 步骤 2: 访问正确的 URL

**旧地址（会失败）:**
```
http://localhost:3000  ❌ 这是 PostgREST，不是前端
```

**新地址（正确）:**
```
http://localhost:3002  ✅ 前端开发服务器
```

**具体页面:**
- 首页: http://localhost:3002
- 测试页面: http://localhost:3002/test-supabase
- 合约管理: http://localhost:3002/contracts

---

## 🔧 已修复的配置

### 1. 创建 .env.development

已创建文件指定端口 3002：
```bash
PORT=3002
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 2. 改进 Kong CORS 配置

更新了 `database/kong.yml`:
```yaml
- name: cors
  config:
    origins:
      - "*"
    methods:
      - GET
      - POST
      - PUT
      - PATCH
      - DELETE
      - OPTIONS
      - HEAD
    headers:
      - Accept
      - Accept-Language
      - Authorization
      - Content-Type
      - apikey
      - x-client-info
      - prefer
    exposed_headers:
      - Content-Range
      - Content-Location
    credentials: true
    max_age: 3600
    preflight_continue: false
```

### 3. 重启 Kong

```bash
docker-compose restart kong
```

---

## 📋 完整启动流程

### 1. 启动后端服务
```bash
# 在项目根目录
docker-compose up -d

# 检查服务状态
docker ps --filter "name=quantfu"
```

### 2. 启动前端服务
```bash
cd frontend

# 使用正确的端口
PORT=3002 npm run dev
```

### 3. 验证服务
```bash
# 测试 Kong API
curl http://localhost:8000/rest/v1/accounts

# 测试 PostgREST 直连
curl http://localhost:3000/accounts

# 访问前端
open http://localhost:3002
```

---

## 🌐 访问地址总结

### 后端服务
- **Kong Gateway**: http://localhost:8000
- **PostgREST API**: http://localhost:3000
- **Supabase Studio**: http://localhost:3001
- **PostgreSQL**: localhost:5432
- **Realtime**: http://localhost:4000
- **Meta API**: http://localhost:8080

### 前端应用
- **主应用**: http://localhost:3002
- **测试页面**: http://localhost:3002/test-supabase
- **合约管理**: http://localhost:3002/contracts

---

## 🐛 故障排查

### 问题 1: 仍然显示 "Failed to fetch"

**检查步骤:**

1. **确认前端端口**
   ```bash
   lsof -i :3002
   ```
   应该看到 node 进程在运行

2. **检查浏览器地址栏**
   - ✅ 应该是 `http://localhost:3002`
   - ❌ 不是 `http://localhost:3000`

3. **清除浏览器缓存**
   - 打开开发者工具 (F12)
   - Network 标签
   - 勾选 "Disable cache"
   - 刷新页面 (Cmd+Shift+R 或 Ctrl+Shift+R)

4. **查看浏览器控制台**
   - 打开开发者工具
   - Console 标签
   - 查看详细错误信息

### 问题 2: CORS 错误

**症状:**
```
Access to fetch at 'http://localhost:8000/rest/v1/accounts' from origin 'http://localhost:3002'
has been blocked by CORS policy
```

**解决:**
```bash
# 重启 Kong 容器
docker-compose restart kong

# 等待 10 秒
sleep 10

# 测试 CORS
curl -v -X OPTIONS "http://localhost:8000/rest/v1/accounts" \
  -H "Origin: http://localhost:3002" \
  -H "Access-Control-Request-Method: GET"
```

### 问题 3: 端口被占用

**症状:**
```
Error: listen EADDRINUSE: address already in use :::3002
```

**解决:**
```bash
# 查找占用端口的进程
lsof -i :3002

# 杀死进程
kill -9 <PID>

# 或者使用其他端口
PORT=3003 npm run dev
```

### 问题 4: 环境变量未加载

**症状:**
- Supabase URL 显示为 undefined
- API 请求发送到错误的地址

**解决:**
```bash
# 停止前端服务器
# 按 Ctrl+C

# 重新启动
cd frontend
PORT=3002 npm run dev
```

---

## 📝 package.json 脚本建议

更新 `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002",
    "lint": "next lint"
  }
}
```

这样默认就使用 3002 端口，不会冲突。

---

## 🔍 验证清单

启动后检查以下各项:

- [ ] Kong Gateway 在运行 (docker ps)
- [ ] PostgREST 在端口 3000
- [ ] 前端在端口 3002
- [ ] 浏览器访问 http://localhost:3002
- [ ] 测试页面能加载
- [ ] 控制台没有 CORS 错误
- [ ] API 请求成功
- [ ] 能创建测试账户

---

## 💡 最佳实践

### 开发环境端口规划
为避免冲突，建议提前规划端口：

**30xx 范围 - 前端应用**
- 3002: Next.js 开发服务器
- 3003-3009: 其他前端服务

**40xx 范围 - 后端服务**
- 4000: Realtime
- 4001-4009: 其他 WebSocket 服务

**50xx 范围 - 数据库**
- 5432: PostgreSQL

**80xx 范围 - API 网关和工具**
- 8000: Kong Gateway
- 8080: Meta API
- 8443: Kong HTTPS

**专用端口**
- 3000: PostgREST (固定)
- 3001: Supabase Studio (固定)

---

**修复完成时间:** 2025-12-19
**关键改动:**
1. 前端端口从 3000 改为 3002
2. 改进 Kong CORS 配置
3. 创建 .env.development 文件

**现在执行:**
```bash
# 1. 停止当前前端（如果在运行）
# 按 Ctrl+C

# 2. 使用新端口启动
cd frontend
PORT=3002 npm run dev

# 3. 访问新地址
open http://localhost:3002/test-supabase
```
