# QuantFu Memory MCP 集成指南

> 使用 Memory MCP 实现跨设备、跨会话的项目上下文持久化

---

## 🎯 为什么需要 Memory MCP?

### 痛点场景

1. **多设备开发**: 办公室电脑 → 家里 MacBook → iPad,需要快速同步开发进度
2. **会话中断**: Claude Code 会话清空后,上下文丢失
3. **团队协作**: 多人开发需要了解他人的决策和进度
4. **长期记忆**: 几周前的技术决策和踩坑经验需要回溯

### Memory MCP 解决方案

- ✅ **持久化存储**: 关键信息永久保存,不随会话结束而丢失
- ✅ **跨设备同步**: 所有设备共享同一份记忆图谱
- ✅ **结构化知识**: 实体-关系模型,便于检索和理解
- ✅ **自动触发**: 通过 Hooks 自动加载和保存

---

## 📋 Hooks 配置方案

### 已配置的事件

| Hook 事件 | 触发时机 | 功能 | 记录内容 |
|----------|---------|------|---------|
| **SessionStart** (startup) | 新会话启动 | 自动加载记忆图谱 | - 当前开发阶段<br>- 未完成任务<br>- 最近决策 |
| **SessionStart** (resume) | 恢复会话 | 同步最新进度 | - 新增进度<br>- 遗留任务 |
| **SessionEnd** | 会话结束 | 强制保存记忆 | - 关键决策<br>- 新规则<br>- 问题&方案<br>- 待办任务 |
| **PostToolUse** (Task) | 任务完成 | 自动记录里程碑 | - 完成的功能<br>- 技术要点<br>- 遇到的坑 |

---

## 🗂️ 实体类型设计

### 推荐的实体类型 (entityType)

#### 1. **milestone** - 开发里程碑

记录重大功能完成、版本发布等。

**示例**:
```json
{
  "name": "Phase3-多策略支持",
  "entityType": "milestone",
  "observations": [
    "完成时间: 2025-12-18",
    "实现了策略参数动态配置功能",
    "支持多个策略并行运行",
    "使用非侵入式集成模式",
    "状态: 已完成并测试"
  ]
}
```

#### 2. **decision** - 技术决策

记录重要的技术选型、架构设计决策。

**示例**:
```json
{
  "name": "使用非侵入式集成模式",
  "entityType": "decision",
  "observations": [
    "决策时间: 2025-12-18",
    "背景: 需要集成极星策略但不能修改原逻辑",
    "方案: 在成功后添加推送,用 try-except 保护",
    "优势: 不影响原策略,易回滚",
    "劣势: 无法拦截失败的交易",
    "结果: 已应用到 v12-fi 集成"
  ]
}
```

#### 3. **problem** - 遇到的问题

记录开发过程中的难点和解决方案。

**示例**:
```json
{
  "name": "极星平台参数传递限制",
  "entityType": "problem",
  "observations": [
    "问题描述: 极星平台无法直接传递复杂对象参数",
    "影响范围: 策略配置传递",
    "解决方案: 使用环境变量 + 代码默认值",
    "替代方案: 配置文件 (未采用,增加复杂度)",
    "状态: 已解决",
    "相关代码: strategies/v12-fi/strategy.py:15-25"
  ]
}
```

#### 4. **module** - 功能模块

记录项目的主要功能模块。

**示例**:
```json
{
  "name": "持仓计算引擎",
  "entityType": "module",
  "observations": [
    "路径: backend/engines/position_calculator.py",
    "职责: 根据成交记录计算持仓",
    "关键函数: calculate_position(), rebuild_position()",
    "依赖: trades 表, positions 表",
    "状态: 已完成",
    "测试覆盖率: 85%"
  ]
}
```

#### 5. **task** - 待办任务

记录未完成的任务和下一步计划。

**示例**:
```json
{
  "name": "实现换月自动提醒",
  "entityType": "task",
  "observations": [
    "优先级: P1",
    "预计工时: 2天",
    "依赖: K线数据模块已完成",
    "技术方案: 定时任务 + 合约到期计算",
    "通知渠道: ntfy + 邮件",
    "状态: 待开发",
    "负责人: allen"
  ]
}
```

#### 6. **bug** - 缺陷记录

记录发现的 Bug 和修复情况。

**示例**:
```json
{
  "name": "天勤行情断连后未重连",
  "entityType": "bug",
  "observations": [
    "发现时间: 2025-12-18",
    "严重程度: P0 (阻塞)",
    "复现步骤: 网络中断 > 5分钟后恢复",
    "根本原因: 缺少断线重连机制",
    "修复方案: 添加心跳检测和自动重连",
    "状态: 已修复",
    "修复提交: commit abc123"
  ]
}
```

---

## 🔗 关系类型设计

### 推荐的关系类型 (relationType)

| 关系类型 | 说明 | 示例 |
|---------|------|------|
| **implements** | A 实现了 B | "Phase3-多策略" implements "策略参数配置需求" |
| **depends_on** | A 依赖 B | "换月提醒" depends_on "K线数据模块" |
| **resolves** | A 解决了 B | "非侵入式集成" resolves "极星策略不能修改的问题" |
| **blocks** | A 阻塞了 B | "天勤断连 Bug" blocks "生产环境部署" |
| **relates_to** | A 关联 B | "v12-fi 集成" relates_to "非侵入式集成模式" |
| **supersedes** | A 取代 B | "新换月算法" supersedes "旧换月算法" |
| **contains** | A 包含 B | "QuantFu 项目" contains "持仓计算引擎" |

---

## 🎬 实战示例

### 场景 1: 新功能开发完成

**会话结束时,AI 会提醒保存:**

```javascript
// 1. 创建功能里程碑
mcp__memory__create_entities({
  "entities": [{
    "name": "Phase3-换月自动提醒",
    "entityType": "milestone",
    "observations": [
      "完成时间: 2025-12-20",
      "实现了合约到期自动计算",
      "集成了 ntfy 推送通知",
      "支持邮件备份通知",
      "遇到问题: 如何处理非交易日到期",
      "解决方案: 提前3个交易日提醒",
      "测试状态: 已通过单元测试和集成测试"
    ]
  }]
})

// 2. 建立依赖关系
mcp__memory__create_relations({
  "relations": [
    {
      "from": "Phase3-换月自动提醒",
      "to": "K线数据模块",
      "relationType": "depends_on"
    },
    {
      "from": "Phase3-换月自动提醒",
      "to": "通知系统",
      "relationType": "depends_on"
    }
  ]
})
```

### 场景 2: 遇到技术难题

**问题解决后记录:**

```javascript
// 1. 记录问题
mcp__memory__create_entities({
  "entities": [{
    "name": "极星策略不能直接修改代码",
    "entityType": "problem",
    "observations": [
      "问题: 用户上传的策略不能有外部依赖",
      "尝试方案1: 打包依赖 - 失败,平台不支持",
      "尝试方案2: 内联所有代码 - 失败,代码过长",
      "最终方案: 非侵入式集成,只在成功后添加推送",
      "优势: 不修改原逻辑,安全可靠",
      "已应用: v12-fi 策略集成"
    ]
  }]
})

// 2. 记录技术决策
mcp__memory__create_entities({
  "entities": [{
    "name": "采用非侵入式集成模式",
    "entityType": "decision",
    "observations": [
      "适用场景: 第三方策略集成",
      "核心原则: 不修改原有交易逻辑",
      "实现方式: try-except 包裹推送代码",
      "已记录规则: .claude/core/project-specific-rules.md #12"
    ]
  }]
})

// 3. 建立关系
mcp__memory__create_relations({
  "relations": [{
    "from": "采用非侵入式集成模式",
    "to": "极星策略不能直接修改代码",
    "relationType": "resolves"
  }]
})
```

### 场景 3: 下次启动快速同步

**新会话启动时,AI 自动读取:**

```javascript
// 自动执行 (通过 SessionStart Hook)
mcp__memory__read_graph()

// AI 会看到完整的项目记忆图谱,并总结:
// "欢迎回来! 根据记忆图谱:
// - 当前进度: Phase3 开发中
// - 最近完成: 多策略支持 (2025-12-18)
// - 待办任务: 换月自动提醒 (P1)
// - 关键决策: 使用非侵入式集成模式
// - 遇到的坑: 极星平台参数传递限制
//
// 准备好继续开发了!"
```

---

## 📝 最佳实践

### ✅ 应该记录的内容

1. **关键决策**: 为什么选择 A 而不是 B
2. **技术方案**: 核心实现思路和关键代码位置
3. **遇到的坑**: 问题描述、排查过程、解决方案
4. **未完成任务**: 待办事项、优先级、依赖关系
5. **架构变更**: 模块划分、接口设计的重大调整
6. **性能优化**: 优化点、效果对比、注意事项

### ❌ 不应该记录的内容

1. ❌ 琐碎的代码细节 (应该在代码注释中)
2. ❌ 临时的调试信息
3. ❌ 敏感信息 (密码、API 密钥等)
4. ❌ 重复的信息 (已在文档中详细说明的)

### 📊 记录粒度建议

| 内容类型 | 记录频率 | 详细程度 |
|---------|---------|---------|
| 里程碑 | 每个大功能完成 | 中等 (200字) |
| 技术决策 | 重要选型时 | 详细 (300字) |
| 问题记录 | 每次遇到难题 | 详细 (包含排查过程) |
| 模块信息 | 新模块创建时 | 简要 (100字) |
| 待办任务 | 会话结束前 | 简要 (50字) |

---

## 🔍 检索和查询

### 常用查询操作

```javascript
// 1. 查看完整记忆图谱
mcp__memory__read_graph()

// 2. 搜索特定内容
mcp__memory__search_nodes({
  "query": "换月"  // 搜索所有与换月相关的实体
})

// 3. 查看特定实体详情
mcp__memory__open_nodes({
  "names": ["Phase3-多策略支持", "非侵入式集成模式"]
})
```

### 搜索技巧

- 🔍 **关键词搜索**: 直接搜索功能名、技术术语
- 📅 **时间筛选**: 搜索 "2025-12" 找最近的记录
- 🏷️ **类型筛选**: 搜索 "entityType: milestone" (需要在 observations 中标注)
- 🔗 **关系追踪**: 查看一个实体相关的所有实体

---

## 🔄 维护和更新

### 定期清理

**每月建议操作**:
1. 删除已过期的待办任务
2. 更新已解决问题的状态
3. 补充遗漏的关键信息

```javascript
// 删除过期任务
mcp__memory__delete_entities({
  "entityNames": ["已完成的旧任务1", "已取消的任务2"]
})

// 更新实体信息
mcp__memory__add_observations({
  "observations": [{
    "entityName": "Phase3-换月提醒",
    "contents": [
      "更新: 已部署到生产环境 (2025-12-25)",
      "监控数据: 日均触发3次提醒,准确率100%"
    ]
  }]
})
```

---

## 🎯 与其他工具的配合

### Memory MCP + project-specific-rules.md

- **Memory MCP**: 记录动态的开发过程、决策背景、踩坑经验
- **rules.md**: 记录稳定的规则、规范、最佳实践

**分工示例**:
```
Memory MCP:
  "2025-12-18 决定使用非侵入式集成,因为极星平台限制..."
  "遇到参数传递问题,尝试了3种方案,最终选择环境变量..."

rules.md:
  ## 非侵入式集成模式
  - 所有第三方策略集成必须遵守此模式
  - 不得修改原有交易逻辑
  - 推送代码必须用 try-except 包裹
```

### Memory MCP + 文档

- **Memory MCP**: "为什么" 和 "怎么做到的"
- **文档**: "是什么" 和 "怎么用"

---

## 🐛 故障排查

### Memory MCP 不可用?

1. 检查 MCP 服务器是否启动:
   ```bash
   # 查看 Claude 配置
   cat ~/.claude/config.json | grep memory
   ```

2. 测试 Memory 工具:
   ```javascript
   // 在 Claude Code 中执行
   mcp__memory__read_graph()
   ```

3. 如果报错,重启 Claude Code

---

## 📖 参考资源

- **Memory MCP 官方文档**: https://github.com/modelcontextprotocol/servers/tree/main/src/memory
- **项目规则文件**: [../.claude/core/project-specific-rules.md](../core/project-specific-rules.md)
- **Hooks 配置**: [../.claude/settings.json](../settings.json)

---

**最后更新**: 2025-12-18
**配置状态**: ✅ 已集成到 Hooks
**推荐使用**: ⭐⭐⭐⭐⭐ (强烈推荐多设备开发场景)
