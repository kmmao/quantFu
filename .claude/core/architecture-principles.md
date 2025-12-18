# 架构设计原则

> 通用的软件架构设计原则,适用于任何编程语言和技术栈

## 📐 核心架构原则

### 1. 分层架构 (Layered Architecture)

应用应该分为清晰的层次,每层只依赖于其下层。

```
┌─────────────────────────────────────────────────┐
│              表现层 (Presentation Layer)         │
│  - 用户界面                                      │
│  - 用户交互处理                                   │
│  - 视图渲染                                      │
└──────────────────┬──────────────────────────────┘
                   │ 依赖
┌──────────────────▼──────────────────────────────┐
│           业务逻辑层 (Business Logic Layer)      │
│  - 核心业务规则                                   │
│  - 数据验证                                      │
│  - 权限控制                                      │
└──────────────────┬──────────────────────────────┘
                   │ 依赖
┌──────────────────▼──────────────────────────────┐
│           数据访问层 (Data Access Layer)         │
│  - 数据库操作                                     │
│  - 外部 API 调用                                 │
│  - 缓存管理                                      │
└─────────────────────────────────────────────────┘
```

**关键原则:**
- ✅ 上层可以调用下层,下层不能调用上层
- ✅ 每层有明确的职责边界
- ✅ 层之间通过接口通信
- ✅ 业务逻辑独立于框架和数据库

---

### 2. 单一职责原则 (Single Responsibility Principle)

每个模块/类/函数只负责一件事。

```
❌ 违反 SRP:
function processUser(userData) {
  // 1. 验证
  if (!userData.email) throw new Error('Invalid')
  // 2. 保存数据库
  database.save(userData)
  // 3. 发送邮件
  sendEmail(userData.email)
  // 4. 记录日志
  logger.log('User processed')
}

✅ 遵循 SRP:
function validateUser(userData) { ... }
function saveUser(userData) { ... }
function notifyUser(email) { ... }
function logUserCreation(userId) { ... }

function processUser(userData) {
  validateUser(userData)
  const user = saveUser(userData)
  notifyUser(user.email)
  logUserCreation(user.id)
}
```

---

### 3. 依赖注入 (Dependency Injection)

通过参数传递依赖,而不是在内部创建。

```
❌ 硬编码依赖:
class UserService {
  private db = new PostgreSQLDatabase()  // 硬编码!

  getUser(id) {
    return this.db.query('SELECT * FROM users WHERE id = ?', id)
  }
}

✅ 依赖注入:
class UserService {
  constructor(private database: Database) {}  // 通过构造函数注入

  getUser(id) {
    return this.database.query('SELECT * FROM users WHERE id = ?', id)
  }
}

// 使用
const db = new PostgreSQLDatabase()  // 或 MySQLDatabase, MongoDatabase
const userService = new UserService(db)
```

**优势:**
- 易于测试 (可以注入 Mock 对象)
- 易于替换实现
- 降低耦合度

---

### 4. 组合优于继承 (Composition over Inheritance)

使用组合构建功能,而不是复杂的继承树。

```
❌ 继承过度:
class Animal { eat() { } }
class Mammal extends Animal { breathe() { } }
class Dog extends Mammal { bark() { } }
class Cat extends Mammal { meow() { } }
// 问题:如果需要一个会飞的哺乳动物(蝙蝠)?继承树变复杂

✅ 组合:
class Animal {
  constructor(private abilities: Ability[]) {}

  perform(action: string) {
    const ability = this.abilities.find(a => a.name === action)
    ability?.execute()
  }
}

const dog = new Animal([new Bark(), new Run()])
const bat = new Animal([new Fly(), new EchoLocate()])
```

---

### 5. 关注点分离 (Separation of Concerns)

不同的功能应该在不同的模块中实现。

**示例: Web 应用**
```
✅ 清晰分离:
├── views/          # 仅负责渲染 UI
├── controllers/    # 仅负责处理请求和响应
├── services/       # 仅负责业务逻辑
├── repositories/   # 仅负责数据访问
└── models/         # 仅负责数据结构定义

❌ 混在一起:
├── pages/
    └── user.js     # 同时包含 UI、业务逻辑、数据库查询
```

---

## 🎯 设计模式

### Repository Pattern (仓储模式)

将数据访问逻辑封装在 Repository 中。

```typescript
// Repository 接口
interface UserRepository {
  findById(id: string): Promise<User | null>
  findAll(): Promise<User[]>
  save(user: User): Promise<User>
  delete(id: string): Promise<void>
}

// 具体实现 (可以替换为不同的数据库)
class PostgresUserRepository implements UserRepository {
  async findById(id: string) {
    // PostgreSQL 特定实现
  }
}

class MongoUserRepository implements UserRepository {
  async findById(id: string) {
    // MongoDB 特定实现
  }
}

// 业务逻辑层不关心具体数据库
class UserService {
  constructor(private userRepo: UserRepository) {}

  async getUser(id: string) {
    return await this.userRepo.findById(id)
  }
}
```

---

### Factory Pattern (工厂模式)

使用工厂函数创建对象,隐藏创建逻辑。

```typescript
// 根据配置创建不同的数据库连接
function createDatabase(config: DatabaseConfig): Database {
  switch (config.type) {
    case 'postgres':
      return new PostgreSQLDatabase(config)
    case 'mysql':
      return new MySQLDatabase(config)
    case 'mongodb':
      return new MongoDatabase(config)
    default:
      throw new Error(`Unsupported database: ${config.type}`)
  }
}

// 使用
const db = createDatabase({ type: 'postgres', host: 'localhost' })
```

---

## 🚀 性能优化原则

### 1. 懒加载 (Lazy Loading)

只在需要时加载资源。

```
✅ 按需加载:
- 代码分割:只加载当前页面需要的代码
- 图片懒加载:滚动到可见区域才加载
- 组件懒加载:路由切换时才加载对应组件
```

### 2. 缓存策略

**多层缓存:**
```
浏览器缓存 (最快)
  → CDN 缓存
    → 应用缓存 (Redis/Memcached)
      → 数据库查询结果缓存
        → 数据库 (最慢)
```

**缓存失效策略:**
- TTL (Time To Live): 设置过期时间
- LRU (Least Recently Used): 淘汰最少使用的
- 主动失效: 数据变更时清除缓存

### 3. 数据库优化

```sql
-- ✅ 使用索引
CREATE INDEX idx_users_email ON users(email);

-- ✅ 避免 N+1 查询
-- 错误:循环中查询
users.forEach(user => {
  const posts = db.query('SELECT * FROM posts WHERE user_id = ?', user.id)
})

-- 正确:一次性获取
const posts = db.query('SELECT * FROM posts WHERE user_id IN (?)', userIds)

-- ✅ 使用分页
SELECT * FROM users LIMIT 20 OFFSET 0  -- 第一页
```

---

## 🔒 安全架构原则

### 1. 纵深防御

在多个层次实施安全措施:

```
用户输入
  → 前端验证 (提升用户体验)
    → 后端验证 (必须!不能信任前端)
      → 数据库约束 (最后防线)
        → 加密存储
```

### 2. 最小权限

```
❌ 应用使用 root/admin 数据库账户
✅ 应用使用仅有 SELECT/INSERT/UPDATE 权限的专用账户

❌ API 返回所有用户信息(包括密码哈希)
✅ API 只返回必要字段
```

### 3. 输入验证 + 输出编码

```
输入验证:验证所有用户输入的格式、类型、范围
输出编码:渲染到 HTML 前转义,防止 XSS
参数化查询:防止 SQL 注入
```

---

## 📊 可维护性原则

### 1. KISS (Keep It Simple, Stupid)

```
❌ 过度设计:
class UserFactoryBuilderSingletonProxyDecorator { }

✅ 简单直接:
class UserService { }
```

### 2. DRY (Don't Repeat Yourself)

```
❌ 重复代码:
function formatUserName(user) { return user.firstName + ' ' + user.lastName }
function formatAdminName(admin) { return admin.firstName + ' ' + admin.lastName }

✅ 提取公共函数:
function formatFullName(person) { return person.firstName + ' ' + person.lastName }
```

### 3. YAGNI (You Aren't Gonna Need It)

```
❌ 过早优化:
// 现在只有 100 个用户,但设计了分布式系统、消息队列、缓存集群

✅ 按需扩展:
// 先用简单的单体应用,等用户量增长再优化
```

---

## 🧪 可测试性架构

### 1. 依赖注入 (方便 Mock)

```typescript
// ✅ 可测试
class UserService {
  constructor(private db: Database, private mailer: Mailer) {}
}

// 测试时注入 Mock
const mockDb = { query: jest.fn() }
const mockMailer = { send: jest.fn() }
const service = new UserService(mockDb, mockMailer)
```

### 2. 纯函数优先

```typescript
// ✅ 纯函数:易于测试
function calculateDiscount(price: number, discountRate: number): number {
  return price * (1 - discountRate)
}

// ❌ 副作用:难以测试
function applyDiscount(product: Product) {
  product.price = product.price * 0.9  // 修改了输入参数
  database.save(product)                // 依赖外部状态
  logger.log('Discount applied')        // 副作用
}
```

---

## 📚 延伸阅读

- Clean Architecture (Robert C. Martin)
- Design Patterns (Gang of Four)
- Domain-Driven Design (Eric Evans)
- SOLID 原则详解
- 微服务架构模式

---

## 📝 总结

**核心要点:**
1. 分层架构 - 清晰的职责划分
2. 依赖注入 - 降低耦合,提高可测试性
3. 组合优于继承 - 灵活的功能组合
4. 关注点分离 - 不同功能在不同模块
5. 简单至上 - KISS, DRY, YAGNI

**记住:**
> 好的架构不是一开始就设计完美,而是随着需求演进逐步改进。
> 过度设计和设计不足都是问题,找到平衡点最重要。
