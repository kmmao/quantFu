# 🚀 前端快速启动

## Step 1: 确保依赖已安装

```bash
npm install
```

如果之前安装过,这个命令会非常快(< 1秒)。

## Step 2: 启动开发服务器

```bash
npm run dev
```

**预期输出:**
```
   ▲ Next.js 15.5.9
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 1.8s
```

## Step 3: 访问应用

打开浏览器访问: [http://localhost:3000](http://localhost:3000)

### 预期界面

**如果数据库有数据:**
- 显示3个统计卡片(总盈亏、持仓品种、净持仓)
- 显示持仓明细表格

**如果数据库无数据:**
- 显示"暂无持仓数据"

## 📊 测试实时更新

### 方法1: 手动插入测试数据

在Supabase Studio (http://localhost:3001) 中执行:

```sql
-- 插入测试持仓
INSERT INTO positions (
    account_id,
    symbol,
    long_position,
    long_avg_price,
    long_profit,
    short_position,
    short_avg_price,
    short_profit,
    last_price
) VALUES (
    (SELECT id FROM accounts LIMIT 1),  -- 使用第一个账户
    'CZCE.TA2505',
    10,
    5500.0,
    1000.0,
    0,
    0,
    0,
    5600.0
);
```

**预期结果:**
- 前端页面**自动刷新**(无需手动刷新)
- 新持仓出现在列表中
- 统计数据自动更新

### 方法2: 使用后端API

```bash
# 在新终端中执行
curl -X POST http://localhost:8888/api/trades \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "your_account_id",
    "symbol": "CZCE.TA2505",
    "direction": "buy",
    "offset": "open",
    "volume": 5,
    "price": 5550.0,
    "timestamp": "2025-12-18T10:00:00Z",
    "source": "test"
  }'
```

## 🛠️ 开发工具

### 打开React DevTools

在浏览器中按 `F12` 打开开发者工具,切换到 React 标签页。

### 查看Supabase连接

打开浏览器控制台(Console),应该看到:
```
持仓数据变化: {...}  // 当数据更新时
```

### 测试刷新按钮

点击右上角的"刷新"按钮,应该:
- 按钮图标旋转
- 重新加载数据
- 更新"最后更新"时间

## 📱 测试PWA

### 本地测试(需要生产构建)

```bash
npm run build
npm run start
```

然后访问 [http://localhost:3000](http://localhost:3000)

在Chrome DevTools中:
1. 打开 Application 标签页
2. 查看 Manifest 部分
3. 查看 Service Workers 部分

### 移动设备测试

1. 获取本机IP地址:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

2. 确保前端监听所有地址:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```

3. 在手机浏览器访问: `http://your_ip:3000`

4. 按照PWA安装指南安装

## 🚨 常见问题

### Q1: 页面显示"暂无持仓数据"

**原因:** 数据库中没有持仓数据

**解决:**
1. 确认Supabase已启动: `docker ps`
2. 确认数据库已初始化: 访问 http://localhost:3001
3. 执行seed数据: `make db-seed`

### Q2: 页面一直显示"加载中..."

**原因:** Supabase连接失败

**解决:**
1. 检查 `.env.local` 文件是否存在
2. 确认环境变量正确:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. 检查Supabase是否运行: `curl http://localhost:8000/rest/v1/`

### Q3: 实时更新不工作

**原因:** Realtime订阅失败

**解决:**
1. 打开浏览器控制台查看错误
2. 确认Supabase Realtime服务运行正常
3. 检查防火墙是否阻止WebSocket连接

### Q4: 构建报错

**原因:** 依赖未安装或版本冲突

**解决:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📚 更多信息

- [前端README](README.md)
- [阶段2完成报告](../PHASE2_COMPLETE.md)
- [Next.js文档](https://nextjs.org/docs)
- [shadcn/ui文档](https://ui.shadcn.com)
