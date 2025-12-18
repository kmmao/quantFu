# MCP 连接测试指南

## 🧪 测试 Supabase MCP 连接

### 方法 1: 在 Claude Code 中直接询问 (推荐)

**重启 Claude Code** 后，在对话中直接询问：

```
显示我的 Supabase 项目结构
```

或者：

```
列出我的 Supabase 项目中所有的表
```

或者：

```
检查我的 Supabase 数据库配置
```

**如果连接成功**，Claude 会返回你的 Supabase 项目的实际信息，例如：
```
你的 Supabase 项目 (niuxxqdaviqxztyhhoyr) 包含以下表:
- users
- posts
- comments
...
```

**如果连接失败**，Claude 会提示：
```
无法连接到 Supabase MCP 服务器...
```

---

### 方法 2: 检查 MCP 服务器状态

在 Claude Code 的输出面板中查看 MCP 连接状态：

1. 重启 Claude Code
2. 观察启动日志
3. 查找类似输出:
   ```
   ✓ Connected to Supabase MCP server
   ✓ Connected to Memory MCP server
   ```

---

### 方法 3: 手动测试 MCP 服务器 (高级)

在终端中手动启动 MCP 服务器测试：

```bash
# 设置环境变量
export SUPABASE_ACCESS_TOKEN="sbp_cfe3b307379bd5f8fc014a7b010fd5042ce7db76"

# 测试运行 (按 Ctrl+C 停止)
npx -y @modelcontextprotocol/server-supabase
```

**预期输出**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "0.1.0",
    "serverInfo": {
      "name": "supabase",
      "version": "0.5.0"
    }
  }
}
```

如果出现错误，说明配置有问题。

---

## 🧪 测试其他 MCP 服务器

### Memory MCP

测试记忆功能：
```
记住: ZP 项目使用 Next.js + Supabase 技术栈
```

然后在新对话中询问：
```
ZP 项目使用什么技术栈？
```

如果 Memory MCP 工作正常，Claude 会回忆起之前记住的信息。

---

## ⚠️ 常见问题排查

### 问题 1: "MCP server not found"

**原因**: Claude Code 无法找到 MCP 配置文件

**解决方案**:
1. 确认 `.mcp.json` 在项目根目录
2. 检查文件格式是否正确 (JSON 格式)
3. 重启 Claude Code

---

### 问题 2: "Invalid token" 或 "Authentication failed"

**原因**: Supabase Access Token 无效或过期

**解决方案**:
1. 访问 https://supabase.com/dashboard/account/tokens
2. 重新生成 token
3. 更新 `.env.local` 中的 `SUPABASE_MCP_TOKEN`
4. 重启 Claude Code

验证 token 格式：
```bash
# Token 应该以 sbp_ 开头
grep SUPABASE_MCP_TOKEN .env.local
```

---

### 问题 3: "Environment variable not found"

**原因**: `.env.local` 文件不存在或环境变量未加载

**解决方案**:
1. 确认 `.env.local` 存在:
   ```bash
   ls -la .env.local
   ```

2. 检查内容:
   ```bash
   cat .env.local | grep SUPABASE_MCP_TOKEN
   ```

3. 确认 `.mcp.json` 使用了变量引用:
   ```json
   "env": {
     "SUPABASE_ACCESS_TOKEN": "${SUPABASE_MCP_TOKEN}"
   }
   ```

---

### 问题 4: MCP 服务器启动失败

**检查日志**:
1. 打开 Claude Code
2. 查看开发者工具/控制台
3. 搜索 "MCP" 或 "supabase" 相关错误

**常见错误**:
- `ENOENT: no such file or directory` → 路径问题
- `Unexpected token` → JSON 格式错误
- `Permission denied` → 权限问题

---

## ✅ 验证清单

测试所有 MCP 连接是否正常:

- [ ] Supabase MCP 可以返回项目信息
- [ ] Memory MCP 可以记住和回忆信息
- [ ] Claude Code 启动时显示 MCP 连接成功
- [ ] 无错误日志

---

## 📋 快速测试脚本

创建测试文件 `test-mcp.sh`:

```bash
#!/bin/bash

echo "🧪 测试 MCP 配置..."
echo ""

# 1. 检查配置文件
echo "1️⃣ 检查 .mcp.json"
if [ -f ".mcp.json" ]; then
  echo "✅ .mcp.json 存在"
  cat .mcp.json | python3 -m json.tool > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ JSON 格式正确"
  else
    echo "❌ JSON 格式错误"
  fi
else
  echo "❌ .mcp.json 不存在"
fi
echo ""

# 2. 检查环境变量
echo "2️⃣ 检查环境变量"
if [ -f ".env.local" ]; then
  echo "✅ .env.local 存在"

  if grep -q "SUPABASE_MCP_TOKEN=" .env.local; then
    TOKEN=$(grep "SUPABASE_MCP_TOKEN=" .env.local | cut -d'=' -f2)
    if [[ $TOKEN == sbp_* ]]; then
      echo "✅ SUPABASE_MCP_TOKEN 格式正确"
    else
      echo "❌ SUPABASE_MCP_TOKEN 格式错误 (应该以 sbp_ 开头)"
    fi
  else
    echo "❌ SUPABASE_MCP_TOKEN 未配置"
  fi
else
  echo "❌ .env.local 不存在"
fi
echo ""

# 3. 测试 npx 可用性
echo "3️⃣ 检查 npx"
if command -v npx &> /dev/null; then
  echo "✅ npx 可用"
else
  echo "❌ npx 不可用 (请安装 Node.js)"
fi
echo ""

echo "✅ 配置检查完成!"
echo ""
echo "下一步: 重启 Claude Code 并询问 '显示我的 Supabase 项目结构'"
```

运行测试:
```bash
chmod +x test-mcp.sh
./test-mcp.sh
```

---

## 🎯 成功标志

当所有 MCP 正常工作时，你应该能够：

1. **询问 Supabase 信息**:
   ```
   "我的 Supabase 项目有哪些表？"
   → 返回实际的表列表
   ```

2. **记住信息**:
   ```
   "记住: 使用 shadcn/ui"
   "我应该使用什么 UI 库？"
   → 回答: shadcn/ui
   ```

---

**如果以上都能正常工作，说明 MCP 配置成功! 🎉**
