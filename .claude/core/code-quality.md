# 代码质量规范

> 通用的代码质量原则,适用于任何编程语言

## 🎯 核心原则

1. **一致性优于个人偏好** - 团队统一的风格比个人喜好更重要
2. **可读性优于简洁性** - 明确的代码胜过简洁但难懂的代码
3. **明确优于隐式** - 显式声明胜过隐式推断
4. **工具自动化优于手工检查** - 使用 Linter/Formatter 自动化检查

---

## 📝 命名规范

### 通用命名原则

| 类型 | 规则 | 示例 |
|------|------|------|
| **变量** | 描述性名称,避免缩写 | `userCount` (✅) vs `uc` (❌) |
| **函数** | 动词开头 | `getUser`, `createProduct`, `validateEmail` |
| **布尔值** | 疑问前缀 | `isValid`, `hasPermission`, `canEdit`, `shouldUpdate` |
| **常量** | 全大写蛇形 | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| **类/接口** | 名词,PascalCase | `User`, `ProductService`, `DatabaseConnection` |

### 不同语言的命名约定

| 语言 | 变量/函数 | 类/接口 | 常量 | 文件名 |
|------|----------|---------|------|--------|
| JavaScript/TypeScript | camelCase | PascalCase | UPPER_SNAKE | camelCase.ts |
| Python | snake_case | PascalCase | UPPER_SNAKE | snake_case.py |
| Go | camelCase / PascalCase | PascalCase | camelCase | snake_case.go |
| Rust | snake_case | PascalCase | SCREAMING_SNAKE | snake_case.rs |
| Java/C# | camelCase | PascalCase | UPPER_SNAKE | PascalCase.java |

---

## 💻 函数设计原则

### 1. 单一职责

```python
# ❌ 函数做了太多事
def process_user(user_data):
    validate_email(user_data['email'])
    save_to_database(user_data)
    send_welcome_email(user_data['email'])
    log_user_creation(user_data['id'])
    update_analytics()

# ✅ 拆分为多个单一职责函数
def create_user(user_data):
    validate_user(user_data)
    user = save_user(user_data)
    notify_user(user.email)
    log_creation(user.id)
    return user
```

### 2. 函数参数限制

```
✅ 推荐:0-3 个参数
⚠️  警告:4-5 个参数
❌ 避免:6+ 个参数
```

```typescript
// ❌ 参数过多
function createUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  age: number,
  country: string
) { }

// ✅ 使用对象参数
interface UserData {
  firstName: string
  lastName: string
  email: string
  password: string
  age: number
  country: string
}

function createUser(userData: UserData) { }
```

### 3. 提前返回 (Guard Clauses)

```javascript
// ❌ 嵌套条件
function calculateDiscount(user, amount) {
  if (user) {
    if (user.isVip) {
      if (amount > 100) {
        return amount * 0.8
      } else {
        return amount * 0.9
      }
    } else {
      return amount
    }
  }
  return 0
}

// ✅ 提前返回
function calculateDiscount(user, amount) {
  if (!user) return 0
  if (!user.isVip) return amount

  return amount > 100 ? amount * 0.8 : amount * 0.9
}
```

---

## 🧹 代码整洁原则

### 1. 避免魔法数字

```python
# ❌ 魔法数字
if user.age > 18:
    grant_access()

# ✅ 使用常量
LEGAL_AGE = 18
if user.age > LEGAL_AGE:
    grant_access()
```

### 2. 避免过深嵌套

```
✅ 推荐:最多 2-3 层嵌套
❌ 避免:4+ 层嵌套
```

```javascript
// ❌ 嵌套过深
function processOrders(orders) {
  for (const order of orders) {
    if (order.status === 'pending') {
      for (const item of order.items) {
        if (item.stock > 0) {
          if (item.price > 0) {
            // ... 业务逻辑
          }
        }
      }
    }
  }
}

// ✅ 提前返回减少嵌套
function processOrders(orders) {
  const pendingOrders = orders.filter(o => o.status === 'pending')

  for (const order of pendingOrders) {
    processValidItems(order.items)
  }
}

function processValidItems(items) {
  const validItems = items.filter(i => i.stock > 0 && i.price > 0)
  validItems.forEach(item => {
    // ... 业务逻辑
  })
}
```

### 3. DRY (Don't Repeat Yourself)

```go
// ❌ 重复代码
func FormatUserName(user User) string {
    return user.FirstName + " " + user.LastName
}

func FormatAdminName(admin Admin) string {
    return admin.FirstName + " " + admin.LastName
}

// ✅ 提取公共逻辑
type Person interface {
    GetFirstName() string
    GetLastName() string
}

func FormatFullName(p Person) string {
    return p.GetFirstName() + " " + p.GetLastName()
}
```

---

## 📄 注释规范

### 何时写注释

✅ **应该写注释的场景:**
- 复杂的业务逻辑
- 非显而易见的算法
- 临时解决方案 (TODO/FIXME/HACK)
- 公开 API 文档
- 正则表达式的含义
- 性能优化的权衡说明

❌ **不应该写注释的场景:**
- 代码本身已经足够清晰
- 重复代码的意思
- 已过时但未删除的注释
- 注释掉的代码 (应该删除)

### 好的注释 vs 坏的注释

```python
# ❌ 无意义的注释
# 获取用户
user = get_user(user_id)

# ✅ 解释"为什么"
# 使用 bcrypt 12 轮加盐,平衡安全性和性能
# 低于 12 轮不够安全,高于 14 轮性能下降明显
hashed_password = bcrypt.hashpw(password, bcrypt.gensalt(12))

# ❌ 注释掉的代码
# old_method()
# legacy_function()
new_method()

# ✅ 使用 TODO 标记待办
# TODO(张三 2025-12-20): 迁移到新的支付网关
process_payment_legacy(order)
```

### 文档注释格式

```typescript
/**
 * 计算订单总价,包含税费和折扣
 *
 * @param items - 订单商品列表
 * @param discountCode - 可选的折扣码
 * @returns 计算后的总价
 * @throws {InvalidDiscountError} 当折扣码无效时
 *
 * @example
 * const total = calculateTotal([{ price: 100, quantity: 2 }], 'SAVE10')
 * // returns 180 (200 - 10% discount)
 */
function calculateTotal(
  items: OrderItem[],
  discountCode?: string
): number {
  // 实现
}
```

---

## 🎨 代码格式化

### 使用自动化工具

| 语言 | 推荐工具 |
|------|---------|
| JavaScript/TypeScript | Prettier, ESLint |
| Python | Black, isort, Flake8 |
| Go | gofmt, goimports |
| Rust | rustfmt |
| Java | Google Java Format |
| C# | dotnet format |

### 通用格式规则

```
✅ 使用空格缩进 (2 或 4 空格,团队统一)
✅ 行宽限制 (80-120 字符)
✅ 文件末尾留空行
✅ 移除尾随空格
✅ 统一的换行风格 (LF vs CRLF)
```

---

## 🔍 代码审查清单

### 功能性
- [ ] 代码是否实现了需求?
- [ ] 边界情况是否处理?
- [ ] 错误处理是否完善?

### 可读性
- [ ] 命名是否清晰描述性?
- [ ] 函数是否足够小 (<50 行)?
- [ ] 嵌套是否过深?
- [ ] 注释是否必要且准确?

### 可维护性
- [ ] 是否有重复代码?
- [ ] 是否违反 SOLID 原则?
- [ ] 依赖是否合理?
- [ ] 是否有硬编码的值?

### 性能
- [ ] 是否有明显的性能问题?
- [ ] 循环中是否有不必要的操作?
- [ ] 数据库查询是否优化?

### 安全性
- [ ] 用户输入是否验证?
- [ ] 敏感信息是否暴露?
- [ ] SQL 注入风险是否防范?
- [ ] XSS 攻击是否防范?

### 测试
- [ ] 是否有单元测试?
- [ ] 测试覆盖率是否足够?
- [ ] 边界情况是否测试?

---

## 📊 代码质量指标

### 圈复杂度 (Cyclomatic Complexity)

衡量代码路径复杂度的指标。

```
✅ 1-10:  简单,易于测试
⚠️  11-20: 复杂,建议重构
❌ 21+:   非常复杂,必须重构
```

### 认知复杂度 (Cognitive Complexity)

衡量代码理解难度。

```
✅ 1-5:   简单易懂
⚠️  6-15:  中等,需要仔细阅读
❌ 16+:   难以理解,需要重构
```

---

## 🛠️ 持续改进

### 技术债管理

```markdown
# 记录技术债
## 问题
UserService 中混合了业务逻辑和数据访问

## 影响
- 难以测试
- 难以替换数据库

## 解决方案
提取 Repository 模式

## 优先级
中 - 下次迭代处理
```

### 重构时机

重构的"红灯信号":
- ❌ 重复代码出现 3 次以上
- ❌ 函数超过 50 行
- ❌ 类超过 300 行
- ❌ 参数超过 4 个
- ❌ 嵌套超过 4 层
- ❌ 圈复杂度超过 15

---

## 📚 推荐阅读

- **Clean Code** (Robert C. Martin) - 代码整洁之道
- **Refactoring** (Martin Fowler) - 重构改善既有代码设计
- **Code Complete** (Steve McConnell) - 代码大全
- **The Pragmatic Programmer** - 程序员修炼之道

---

## 📝 总结

**核心要点:**
1. 命名清晰 - 让代码自解释
2. 函数简短 - 单一职责,易于测试
3. 减少嵌套 - 提前返回,降低复杂度
4. 避免重复 - DRY 原则
5. 有意义的注释 - 解释"为什么",而不是"是什么"
6. 自动化工具 - Linter + Formatter

**记住:**
> 代码是写给人看的,顺便让机器执行。
> 今天写的代码,六个月后就像别人写的一样陌生。
