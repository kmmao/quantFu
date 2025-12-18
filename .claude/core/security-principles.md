# 安全原则

> 通用的软件安全最佳实践,适用于任何技术栈

## 🛡️ 核心安全原则

1. **纵深防御 (Defense in Depth)** - 多层安全措施,不依赖单一防护
2. **最小权限 (Least Privilege)** - 只授予完成任务所需的最小权限
3. **安全默认 (Secure by Default)** - 默认配置必须是安全的
4. **零信任 (Zero Trust)** - 不信任任何输入和用户

---

## 🔐 OWASP Top 10 防护

### 1. 注入攻击防护 (SQL/Command/LDAP Injection)

**原则:** 永远不要拼接用户输入到查询或命令中

```python
# ❌ 危险:SQL 拼接
query = f"SELECT * FROM users WHERE email = '{user_input}'"
db.execute(query)

# ✅ 安全:参数化查询
query = "SELECT * FROM users WHERE email = ?"
db.execute(query, (user_input,))

# ✅ 使用 ORM
users = User.objects.filter(email=user_input)
```

```javascript
# ❌ 危险:命令注入
const cmd = `rm -rf ${userPath}`
exec(cmd)

# ✅ 安全:使用数组参数
execFile('rm', ['-rf', userPath])
```

---

### 2. 跨站脚本 (XSS) 防护

**原则:** 对所有输出进行编码,使用框架的自动转义

```javascript
// ❌ 危险:直接渲染 HTML
element.innerHTML = userInput

// ✅ 安全:使用 textContent
element.textContent = userInput

// ✅ React 自动转义
return <div>{userInput}</div>

// ❌ 危险:绕过转义
return <div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 如果必须渲染 HTML,使用 DOMPurify 清理
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
return <div dangerouslySetInnerHTML={{ __html: clean }} />
```

**CSP (Content Security Policy) 配置:**

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
```

---

### 3. 认证与会话管理

**密码处理:**

```python
import bcrypt

# ✅ 注册时哈希密码
password = "user_password"
salt = bcrypt.gensalt(rounds=12)  # 12 轮,平衡安全和性能
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
# 存储 hashed 到数据库

# ✅ 登录时验证
is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash)

# ❌ 永远不要
# - 明文存储密码
# - 使用 MD5/SHA1 哈希(已被破解)
# - 使用简单哈希(如 SHA256 without salt)
```

**会话安全:**

```http
Set-Cookie: sessionid=xxx;
  HttpOnly;           # 防止 JavaScript 访问
  Secure;             # 仅 HTTPS 传输
  SameSite=Strict;    # 防止 CSRF
  Max-Age=3600;       # 1小时过期
  Path=/;             # Cookie 路径
```

**密码策略:**
```
✅ 最小长度:8-12 字符
✅ 复杂度:大小写+数字+特殊字符
✅ 禁止常见密码 (password, 123456, etc.)
✅ 密码历史:禁止重复最近 5 个密码
⚠️  避免过于复杂的规则 (反而降低安全性)
```

---

### 4. 访问控制

**最小权限原则:**

```sql
-- ❌ 应用使用 root 账户
GRANT ALL PRIVILEGES ON *.* TO 'app'@'%';

-- ✅ 最小必要权限
GRANT SELECT, INSERT, UPDATE ON app_db.* TO 'app_user'@'%';
-- 不给 DELETE, DROP, CREATE 等权限
```

**行级安全 (Row Level Security):**

```sql
-- 用户只能查看自己的数据
CREATE POLICY user_isolation ON users
  FOR SELECT
  USING (id = current_user_id());

-- 管理员可以查看所有数据
CREATE POLICY admin_access ON users
  FOR ALL
  USING (is_admin(current_user_id()));
```

**前后端双重检查:**

```typescript
// ❌ 仅前端检查
function DeleteButton({ user }) {
  if (currentUser.role !== 'admin') {
    return null  // 前端隐藏按钮
  }
  return <button onClick={() => deleteUser(user.id)}>删除</button>
}

// ✅ 前端 + 后端检查
// 后端 API
async function deleteUser(req, res) {
  // 后端必须验证权限!
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  await db.users.delete({ id: req.params.id })
  res.json({ success: true })
}
```

---

### 5. 敏感数据保护

**加密存储:**

```python
from cryptography.fernet import Fernet

# 生成密钥 (妥善保管!)
key = Fernet.generate_key()
cipher = Fernet(key)

# 加密
sensitive_data = "credit_card_number"
encrypted = cipher.encrypt(sensitive_data.encode())

# 解密
decrypted = cipher.decrypt(encrypted).decode()
```

**环境变量分离:**

```bash
# .env.local (不提交到 Git)
DATABASE_PASSWORD=secret123
API_KEY=sk_live_xxx

# .env.example (提交到 Git,作为模板)
DATABASE_PASSWORD=your_password_here
API_KEY=your_api_key_here
```

**数据脱敏:**

```javascript
// ❌ 返回完整信息
GET /api/users/123
{
  "name": "张三",
  "email": "zhang@example.com",
  "phone": "13800138000",
  "id_card": "110101199001011234"
}

// ✅ 脱敏敏感信息
GET /api/users/123
{
  "name": "张三",
  "email": "z***@example.com",
  "phone": "138****8000",
  "id_card": "1101**********1234"
}
```

---

### 6. 安全配置

**HTTP 安全头:**

```http
# 防止 MIME 类型嗅探
X-Content-Type-Options: nosniff

# 防止点击劫持
X-Frame-Options: DENY
# 或
Content-Security-Policy: frame-ancestors 'none'

# 启用浏览器 XSS 保护
X-XSS-Protection: 1; mode=block

# HSTS:强制 HTTPS
Strict-Transport-Security: max-age=31536000; includeSubDomains

# 推荐人策略
Referrer-Policy: strict-origin-when-cross-origin

# 权限策略
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**CORS 配置:**

```javascript
// ❌ 危险:允许所有来源
res.setHeader('Access-Control-Allow-Origin', '*')

// ✅ 安全:只允许特定来源
const allowedOrigins = ['https://app.example.com']
const origin = req.headers.origin
if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin)
}
```

---

### 7. 输入验证

**验证清单:**
- [ ] 类型验证 (字符串/整数/邮箱等)
- [ ] 长度限制
- [ ] 格式验证 (正则表达式)
- [ ] 范围验证 (min/max)
- [ ] 白名单验证 (允许的值)
- [ ] 文件类型验证 (上传场景)
- [ ] 文件大小限制

```typescript
// ✅ 使用验证库
import { z } from 'zod'

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18).max(120),
  role: z.enum(['user', 'admin']),
  avatar: z.string().url().optional(),
})

// 验证用户输入
try {
  const user = UserSchema.parse(req.body)
  // 继续处理
} catch (error) {
  return res.status(400).json({ error: error.errors })
}
```

**文件上传安全:**

```javascript
// 文件类型白名单
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type')
}

// 文件大小限制 (5MB)
const maxSize = 5 * 1024 * 1024
if (file.size > maxSize) {
  throw new Error('File too large')
}

// 重命名文件,防止路径遍历
const safeFilename = crypto.randomUUID() + path.extname(file.originalname)
```

---

### 8. 日志与监控

**应该记录什么:**
- ✅ 登录尝试 (成功和失败)
- ✅ 权限变更
- ✅ 敏感操作 (删除数据,导出数据)
- ✅ 异常错误
- ✅ 安全事件 (多次登录失败,SQL 注入尝试)

**不应该记录什么:**
- ❌ 密码 (明文或哈希)
- ❌ 信用卡号
- ❌ API 密钥
- ❌ 个人敏感信息

```python
# ❌ 危险
logger.info(f"User {email} login with password {password}")

# ✅ 安全
logger.info(f"Login attempt", extra={
    'email': mask_email(email),
    'ip': request.ip,
    'user_agent': request.user_agent,
    'success': True
})

def mask_email(email):
    local, domain = email.split('@')
    return f"{local[0]}***{local[-1]}@{domain}"
```

---

### 9. 依赖管理

**定期更新依赖:**

```bash
# 检查已知漏洞
npm audit
pip-audit
cargo audit

# 自动修复
npm audit fix
```

**锁定依赖版本:**

```json
// package.json
{
  "dependencies": {
    "express": "4.18.2"  // ✅ 精确版本
    // "express": "^4.18.2"  // ⚠️  允许小版本更新
  }
}
```

---

### 10. 错误处理

```javascript
// ❌ 泄露敏感信息
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,  // 暴露代码结构!
    sql: err.query      // 暴露数据库查询!
  })
})

// ✅ 安全的错误响应
app.use((err, req, res, next) => {
  // 记录详细错误到日志
  logger.error(err, {
    url: req.url,
    method: req.method,
    user: req.user?.id
  })

  // 返回通用错误给用户
  res.status(500).json({
    error: 'Internal server error',
    requestId: req.id  // 用于追踪
  })
})
```

---

## 🚨 速率限制

防止暴力破解和 DoS 攻击:

```javascript
import rateLimit from 'express-rate-limit'

// 登录接口限流
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 5,                     // 最多 5 次请求
  message: 'Too many login attempts, try again later'
})

app.post('/login', loginLimiter, loginHandler)

// API 全局限流
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 分钟
  max: 100                   // 最多 100 次请求
})

app.use('/api/', apiLimiter)
```

---

## ✅ 安全检查清单

### 开发阶段
- [ ] 所有用户输入都经过验证
- [ ] 使用参数化查询,防止注入
- [ ] 密码已哈希 (bcrypt/argon2)
- [ ] 敏感数据已加密
- [ ] 环境变量分离 (.env 不提交)
- [ ] 依赖包无已知漏洞

### 部署前
- [ ] HTTPS 已启用
- [ ] 安全响应头已配置
- [ ] CSP 策略已设置
- [ ] 速率限制已实现
- [ ] 错误处理不泄露信息
- [ ] 日志记录已启用
- [ ] 文件上传限制已设置

### 生产环境
- [ ] 定期更新依赖
- [ ] 定期审查日志
- [ ] 备份数据库
- [ ] 监控异常流量
- [ ] 安全审计 (渗透测试)

---

## 📚 延伸阅读

- **OWASP Top 10** - https://owasp.org/Top10/
- **OWASP Cheat Sheet Series** - 各类安全问题的最佳实践
- **CWE Top 25** - 最危险的软件缺陷
- **NIST Cybersecurity Framework** - 网络安全框架

---

## 📝 总结

**核心要点:**
1. **永远不信任用户输入** - 验证所有输入
2. **最小权限** - 只授予必要权限
3. **纵深防御** - 多层安全措施
4. **安全默认** - 默认配置必须安全
5. **定期更新** - 及时修复已知漏洞

**记住:**
> 安全不是一次性工作,而是持续的过程。
> 不要等到被攻击才开始重视安全。
