# 项目特定规则

> ⚠️ **待补充文件** - 本文件用于记录项目开发过程中制定的特定规则和约定

---

## 📋 文件说明

本文件用于记录**项目开发过程中**产生的特定规则、约定和决策,包括:

- ✅ **命名约定** - 项目特定的命名规则
- ✅ **目录结构规则** - 文件和目录的组织规范
- ✅ **API 设计规范** - 接口命名、参数格式等
- ✅ **数据模型约定** - 实体关系、字段命名等
- ✅ **业务逻辑规则** - 特定业务场景的处理规范
- ✅ **技术决策记录** - 技术选型和架构决策
- ✅ **代码组织规范** - 模块划分、依赖管理等

---

## 🎯 使用方式

### AI 助手行为准则

**当开发过程中出现以下情况时,AI 必须主动将规则记录到本文件:**

1. **用户明确提出规则** - "以后所有XX都要按XX格式"
2. **重复出现的模式** - 连续3次相同的处理方式
3. **技术决策** - "我们决定使用XX而不是YY"
4. **命名约定** - "所有XX都以XX开头/结尾"
5. **代码组织** - "XX类型的文件都放在XX目录"
6. **业务规则** - "当XX情况下必须XX处理"

**记录格式:**

```markdown
## [规则类别]

### [规则名称]

**制定时间**: YYYY-MM-DD
**适用范围**: [模块/功能/全局]
**规则内容**:
- [具体规则描述]

**示例**:
[代码示例或使用场景]

**原因**: [为什么制定这个规则]
```

---

## 📂 1. 目录结构规则

### 示例:模块目录标准结构

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 全局
**规则内容**:
- 每个功能模块必须包含 `index.ts`(入口)、`types.ts`(类型)、`utils.ts`(工具函数)
- 测试文件必须与源文件同目录,命名为 `*.test.ts`

**示例**:
```
src/
  features/
    auth/
      index.ts
      types.ts
      utils.ts
      auth.test.ts
```

**原因**: 保持模块结构一致性,便于查找和维护

---

## 🏷️ 2. 命名约定

### 示例:API 路由命名规范

**制定时间**: 2025-01-XX (待补充)
**适用范围**: API 层
**规则内容**:
- RESTful API 路由必须使用复数名词:`/api/users` 而非 `/api/user`
- 资源ID路由格式:`/api/users/:id`
- 操作性路由使用动词:`/api/users/:id/activate`

**示例**:
```
GET    /api/users          # 获取用户列表
POST   /api/users          # 创建用户
GET    /api/users/:id      # 获取单个用户
PUT    /api/users/:id      # 更新用户
DELETE /api/users/:id      # 删除用户
POST   /api/users/:id/reset-password  # 重置密码
```

**原因**: 遵循 RESTful 最佳实践,保持 API 一致性

---

## 🔧 3. 技术决策记录

### 示例:状态管理方案选择

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 前端全局状态
**决策内容**:
- 使用 Context API 而非 Redux
- 服务器状态使用 React Query

**原因**:
- 项目规模中小型,Context API 足够
- React Query 更适合处理异步数据
- 减少依赖和学习成本

**替代方案**:
- Redux Toolkit - 过于复杂,不适合当前项目规模
- Zustand - 考虑过,但团队更熟悉 Context API

---

## 📊 4. 数据模型约定

### 示例:时间戳字段命名

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 所有数据模型
**规则内容**:
- 创建时间字段统一命名为 `createdAt`
- 更新时间字段统一命名为 `updatedAt`
- 删除时间字段统一命名为 `deletedAt`
- 所有时间字段类型为 ISO 8601 字符串

**示例**:
```typescript
interface User {
  id: string
  email: string
  createdAt: string  // "2025-01-15T10:30:00Z"
  updatedAt: string
  deletedAt?: string // 软删除
}
```

**原因**: 与数据库 ORM 默认约定一致,便于序列化和国际化

---

## 🎨 5. 代码组织规范

### 示例:工具函数导出方式

**制定时间**: 2025-01-XX (待补充)
**适用范围**: lib/ 和 utils/ 目录
**规则内容**:
- 每个工具函数文件只导出一个主函数(默认导出)
- 辅助函数不导出(保持内部实现细节)
- 复杂工具集使用命名导出

**示例**:
```typescript
// lib/formatDate.ts (单一功能)
export default function formatDate(date: Date): string {
  // ...
}

// lib/validators.ts (工具集)
export { validateEmail }
export { validatePassword }
export { validatePhone }
```

**原因**: 提高代码可读性,明确主要功能

---

## 🔐 6. 安全规则

### 示例:敏感数据处理规范

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 全局
**规则内容**:
- 密码必须使用 bcrypt 加密,cost factor ≥ 12
- API Key 必须使用环境变量,不得硬编码
- 用户 PII 数据必须在日志中脱敏

**示例**:
```typescript
// ❌ 错误
const apiKey = "sk_live_abc123"

// ✅ 正确
const apiKey = process.env.API_KEY

// 日志脱敏
console.log({
  email: "us***@example.com",  // 而非完整邮箱
  userId: user.id
})
```

**原因**: 防止敏感数据泄露,符合安全最佳实践

---

## 🧪 7. 测试规则

### 示例:测试文件组织规范

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 所有测试代码
**规则内容**:
- 单元测试文件命名:`*.test.ts`
- 集成测试文件命名:`*.integration.test.ts`
- E2E 测试文件命名:`*.e2e.test.ts`
- 测试文件与源文件同目录

**示例**:
```
src/
  lib/
    formatDate.ts
    formatDate.test.ts              # 单元测试
    formatDate.integration.test.ts  # 集成测试
```

**原因**: 便于查找对应测试,保持测试与源码同步

---

## 📝 8. 文档规则

### 示例:函数文档注释规范

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 公共 API 和工具函数
**规则内容**:
- 导出的函数必须有 JSDoc 注释
- 必须包含:`@param`、`@returns`、`@throws`(如适用)
- 复杂逻辑必须有使用示例 `@example`

**示例**:
```typescript
/**
 * 格式化日期为本地化字符串
 * @param date - 要格式化的日期
 * @param locale - 语言区域设置 (默认: 'zh-CN')
 * @returns 格式化后的日期字符串
 * @throws {TypeError} 当 date 不是有效日期时
 * @example
 * formatDate(new Date('2025-01-15'))
 * // => "2025年1月15日"
 */
export function formatDate(date: Date, locale = 'zh-CN'): string {
  // ...
}
```

**原因**: 提高代码可维护性,便于 IDE 智能提示

---

## 🚀 9. 性能优化规则

### 示例:图片资源处理规范

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 静态资源
**规则内容**:
- 所有图片必须使用 WebP 格式(提供 fallback)
- 图片大小不得超过 500KB
- 必须提供多尺寸版本(响应式)

**示例**:
```html
<picture>
  <source srcset="image-800w.webp" media="(min-width: 800px)">
  <source srcset="image-400w.webp" media="(min-width: 400px)">
  <img src="image-400w.jpg" alt="Fallback">
</picture>
```

**原因**: 提升加载速度,改善用户体验

---

## 🔄 10. 业务逻辑规则

### 示例:用户权限检查规范

**制定时间**: 2025-01-XX (待补充)
**适用范围**: 所有需要权限控制的功能
**规则内容**:
- 所有 API 路由必须先进行权限检查
- 使用统一的权限中间件 `requireAuth()`
- 权限不足返回 403 而非 404

**示例**:
```typescript
// API 路由
app.post('/api/admin/users',
  requireAuth(),      // 认证检查
  requireRole('admin'), // 权限检查
  createUserHandler
)
```

**原因**: 统一权限控制逻辑,防止安全漏洞

---

---

## 🎯 QuantFu 项目实际规则

> 以下是 QuantFu 项目开发过程中实际制定的规则

---

## 📝 11. AI 代码标记规范

### AI 新增代码必须用标记包裹

**制定时间**: 2025-12-18
**适用范围**: 所有 AI 新增或修改的代码
**规则内容**:
- 所有 AI 新增的代码块必须用 `--- ai start ---` 和 `--- ai end ---` 标记
- 标记应放在注释行中
- 标记之间应包含功能说明和日期

**示例**:
```python
# --- ai start ---
# ========== QuantFu 数据推送模块 (2025-12-18 新增) ==========
class QuantFuPusher:
    def push_trade(self, ...):
        # 实现...
# ========================================================
# --- ai end ---
```

**原因**:
- 方便代码审查和追溯
- 清晰标识 AI 修改范围
- 便于未来维护和回滚

---

## 🔧 12. 非侵入式集成模式

### 第三方策略集成必须保持原逻辑不变

**制定时间**: 2025-12-18
**适用范围**: strategies/ 目录下所有策略集成
**规则内容**:
- 集成第三方策略时,**绝对禁止**修改原有交易逻辑
- 只能在成功后添加推送/记录代码
- 所有新增代码必须用 try-except 包裹
- 推送失败不能影响原策略执行

**示例**:
```python
# ✅ 正确做法
if ret_enter == 0 or ret_enter == -2:
    order_trade_count += order_num  # 原有逻辑不变
    PlotText(...)                   # 原有逻辑不变

    # --- ai start ---
    try:
        quantfu_pusher.push_trade(...)  # 新增推送
    except:
        pass  # 失败不影响交易
    # --- ai end ---

# ❌ 错误做法
if ret_enter == 0 or ret_enter == -2:
    result = quantfu_pusher.push_trade(...)  # 错误! 改变了逻辑
    if result:  # 错误! 推送结果影响了交易
        order_trade_count += order_num
```

**原因**:
- 保证交易安全,原策略已经过充分验证
- 推送功能不应成为交易的阻塞点
- 便于回滚和维护

---

## 📊 13. 数据推送格式规范

### 成交和持仓数据的标准格式

**制定时间**: 2025-12-18
**适用范围**: 所有策略推送到 QuantFu 后端的数据
**规则内容**:

**成交数据格式**:
```python
{
    "account_id": str,        # 账户ID (必需)
    "symbol": str,            # 合约代码 (必需)
    "direction": str,         # buy/sell (必需)
    "offset": str,            # open/close (必需)
    "volume": int,            # 手数 (必需)
    "price": float,           # 成交价格 (必需)
    "timestamp": str,         # ISO格式时间 (必需)
    "source": str,            # 数据源标识 (必需)
    "order_id": str,          # 订单号 (可选)
    "commission": float       # 手续费 (可选)
}
```

**持仓快照格式**:
```python
{
    "account_id": str,
    "snapshot_time": str,     # ISO格式时间
    "positions": [
        {
            "symbol": str,
            "long_position": int,
            "long_avg_price": float,
            "short_position": int,
            "short_avg_price": float,
            "long_profit": float,
            "short_profit": float
        }
    ],
    "source": str
}
```

**原因**:
- 统一数据格式,便于后端解析
- 必需字段保证数据完整性
- 可选字段提供扩展性

---

## 📁 14. 策略目录结构规范

### 策略模块的标准目录结构

**制定时间**: 2025-12-18
**适用范围**: strategies/ 目录下所有策略
**规则内容**:

```
strategies/
└── strategy_name/
    ├── strategy.py          # 主策略文件 (必需)
    ├── .env.example         # 配置模板 (必需)
    ├── README.md            # 用户使用手册 (必需)
    ├── QUICKSTART.md        # 快速入门指南 (推荐)
    ├── CHANGELOG.md         # 详细修改日志 (推荐)
    ├── SUMMARY.md           # 项目总结报告 (可选)
    ├── DELIVERY.md          # 交付文档 (可选)
    └── .claude/
        └── guide.md         # 开发者指南 (必需)
```

**文档要求**:
- **README.md**: 300行左右,包含配置说明、使用方法、故障排查
- **QUICKSTART.md**: 150行左右,5分钟快速上手
- **CHANGELOG.md**: 250行左右,详细代码对比
- **guide.md**: 开发者文档,包含模块职责、函数说明、依赖关系

**原因**:
- 保持策略模块结构一致
- 提供完整的用户和开发者文档
- 便于新策略接入和维护

---

## 🔐 15. 配置管理规范

### 策略配置的优先级和安全性

**制定时间**: 2025-12-18
**适用范围**: 所有策略配置
**规则内容**:

**配置优先级** (从高到低):
1. 显式传参
2. 环境变量
3. 代码默认值

**示例**:
```python
api_url = (
    explicit_param                      # 1. 显式传参
    or os.getenv('QUANTFU_API_URL')     # 2. 环境变量
    or 'http://localhost:8888'          # 3. 默认值
)
```

**安全规范**:
- ❌ 禁止硬编码 API 密钥
- ✅ 必须通过环境变量或外部配置传入
- ✅ 上传到第三方平台的代码中不能包含敏感信息

**原因**:
- 灵活配置,适应不同环境
- 保护敏感信息安全
- 便于部署和运维

---

## 🧪 16. 推送保护机制规范

### 推送失败保护的标准实现

**制定时间**: 2025-12-18
**适用范围**: 所有数据推送功能
**规则内容**:

**必需的保护机制**:
1. ✅ try-except 包裹所有推送调用
2. ✅ 设置超时时间 (推荐 3秒)
3. ✅ 失败静默处理,不打印敏感日志
4. ✅ 失败不影响主流程

**标准实现**:
```python
# 调用方
try:
    quantfu_pusher.push_trade(...)
except:
    pass  # 静默失败,不影响交易

# 推送类内部
def push_trade(self, ...):
    try:
        response = requests.post(
            ...,
            timeout=3  # 3秒超时
        )
        if response.status_code == 200:
            self.success_count += 1
            return True
        else:
            self.fail_count += 1
            return False
    except:
        self.fail_count += 1
        return False
```

**禁止的做法**:
- ❌ 不包裹 try-except
- ❌ 无超时保护
- ❌ 推送失败抛出异常
- ❌ 在异常日志中打印敏感信息

**原因**:
- 交易安全第一,推送功能不能成为单点故障
- 防止网络问题导致策略阻塞
- 保护敏感信息不泄露

---

## 📌 规则变更记录

| 日期 | 规则 | 变更类型 | 说明 |
|------|------|---------|------|
| 2025-12-18 | AI 代码标记规范 | 新增 | 用户要求标记 AI 代码 |
| 2025-12-18 | 非侵入式集成模式 | 新增 | v12-fi 集成经验总结 |
| 2025-12-18 | 数据推送格式规范 | 新增 | 统一推送数据格式 |
| 2025-12-18 | 策略目录结构规范 | 新增 | strategies/ 目录规范 |
| 2025-12-18 | 配置管理规范 | 新增 | 配置优先级和安全性 |
| 2025-12-18 | 推送保护机制规范 | 新增 | 推送失败保护标准 |

---

## ✅ 初始化检查清单

- [x] 已删除所有示例规则
- [x] 已根据项目实际情况添加初始规则
- [x] 已向 AI 助手说明必须主动记录规则到本文件
- [ ] 需要在每次开发前检查本文件

---

**最后更新**: 2025-12-18
**规则总数**: 6 条实际规则 + 10 条示例规则
**状态**: ✅ 已启用
