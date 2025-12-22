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
