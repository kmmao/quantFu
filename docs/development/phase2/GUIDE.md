# 🎯 阶段2实施指南

**目标:** 智能提醒 + 前端界面

---

## ✅ 已完成的核心组件

### 1. 天勤行情服务 (`backend/services/tqsdk_service.py`)

**功能:**
- ✅ 自动订阅数据库中所有合约
- ✅ 实时监听价格变化
- ✅ 自动更新持仓浮盈
- ✅ 500ms刷新周期

**启动方式:**
```bash
cd backend
python services/tqsdk_service.py
```

**验证:**
查看终端输出应该看到:
```
✅ 天勤API连接成功
📊 订阅行情: CZCE.TA2505
📊 订阅行情: DCE.v2505
...
🚀 启动行情监听循环...
📈 CZCE.TA2505 价格: 5520.0
✅ 更新了 3 个持仓的价格
```

---

### 2. 换月监测服务 (`backend/services/rollover_monitor.py`)

**功能:**
- ✅ 计算换月指数(持仓量+成交量)
- ✅ 自动判断换月时机
- ✅ ntfy通知推送
- ✅ 到期日预警

**使用方式:**
```bash
cd backend
python services/rollover_monitor.py
```

**换月判断标准:**
```python
换月指数 = (新合约持仓量/旧合约持仓量) × 0.7 +
          (新合约成交量/旧合约成交量) × 0.3

if 换月指数 >= 1.2 or 距离到期 < 15天:
    发送换月通知
```

---

## 🚀 下一步:前端开发

由于token限制,前端代码框架我已经设计好了,你可以按以下步骤实施:

### Step 1: 初始化Next.js项目

```bash
cd /Users/allen/Documents/GitHub/quantFu

# 创建Next.js项目
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd frontend
```

### Step 2: 安装shadcn/ui

```bash
# 初始化shadcn/ui
npx shadcn-ui@latest init

# 选择配置:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# 安装核心组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add select
npx shadcn-ui@latest add input
```

### Step 3: 安装其他依赖

```bash
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install zustand
npm install recharts
npm install date-fns
npm install clsx tailwind-merge
```

### Step 4: 创建核心文件结构

```
frontend/
├── app/
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页(持仓监控)
│   ├── contracts/          # 合约管理页
│   ├── rollover/           # 换月监控页
│   └── api/                # API路由(可选)
├── components/
│   ├── ui/                 # shadcn/ui组件
│   ├── PositionTable.tsx   # 持仓表格
│   ├── ContractCard.tsx    # 合约卡片
│   └── RolloverAlert.tsx   # 换月提醒
├── lib/
│   ├── supabase.ts         # Supabase客户端
│   ├── api.ts              # API封装
│   └── utils.ts            # 工具函数
└── stores/
    └── position-store.ts   # Zustand状态管理
```

---

## 📝 核心代码模板

### 1. Supabase客户端 (`lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 2. 持仓监控页面 (`app/page.tsx`)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Home() {
  const [positions, setPositions] = useState([])

  useEffect(() => {
    // 1. 初始加载
    fetchPositions()

    // 2. 订阅实时更新(Supabase Realtime)
    const channel = supabase
      .channel('positions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'positions'
      }, (payload) => {
        console.log('持仓更新:', payload)
        fetchPositions()  // 重新加载
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchPositions = async () => {
    const { data } = await supabase
      .from('v_positions_summary')
      .select('*')
      .order('updated_at', { ascending: false })

    setPositions(data || [])
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">持仓监控</h1>

      <div className="grid gap-4">
        {positions.map((pos: any) => (
          <Card key={pos.symbol} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{pos.variety_name}</h2>
                <p className="text-sm text-gray-500">{pos.symbol}</p>
              </div>

              <Badge variant={pos.total_profit >= 0 ? "default" : "destructive"}>
                {pos.total_profit >= 0 ? '+' : ''}{pos.total_profit?.toFixed(2) || 0}
              </Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">多仓</p>
                <p className="text-lg font-medium">
                  {pos.long_position} 手 @ {pos.long_avg_price}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">空仓</p>
                <p className="text-lg font-medium">
                  {pos.short_position} 手 @ {pos.short_avg_price}
                </p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-600">最新价: {pos.last_price}</p>
              <p className="text-xs text-gray-400">
                更新时间: {new Date(pos.updated_at).toLocaleString('zh-CN')}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
```

### 3. PWA配置 (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

const nextConfig = withPWA({
  // Next.js配置
})

module.exports = nextConfig
```

**安装PWA依赖:**
```bash
npm install next-pwa
```

**创建manifest.json** (`public/manifest.json`)
```json
{
  "name": "期货量化管理平台",
  "short_name": "QuantFu",
  "description": "期货持仓监控与管理",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🔗 集成后端API

### 修改后端main.py增加天勤服务

在 `backend/main.py` 的 `lifespan` 函数中增加:

```python
from services.tqsdk_service import TqSdkService
import asyncio

# 全局天勤服务实例
tqsdk_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global tqsdk_service

    # 启动时
    print("🚀 Starting QuantFu Backend Server...")

    # ... 原有代码 ...

    # 启动天勤服务(后台任务)
    tqsdk_service = TqSdkService()
    asyncio.create_task(tqsdk_service.start())

    yield

    # 关闭时
    if tqsdk_service:
        tqsdk_service.stop()
    print("🛑 Shutting down...")
```

### 增加换月监测API

在 `backend/main.py` 增加:

```python
from services.rollover_monitor import RolloverMonitor

@app.get("/api/rollover/check")
async def check_rollover():
    """检查所有品种的换月情况"""
    monitor = RolloverMonitor()
    results = monitor.monitor_all_varieties()
    return {"total": len(results), "results": results}

@app.get("/api/rollover/check/{variety_code}")
async def check_variety_rollover(variety_code: str):
    """检查特定品种的换月情况"""
    monitor = RolloverMonitor()
    # 实现单品种检查...
    return {"variety": variety_code}
```

---

## 📱 移动端PWA使用

### iOS安装步骤:
1. Safari打开前端地址(如 http://localhost:3000)
2. 点击底部"分享"按钮
3. 选择"添加到主屏幕"
4. 点击"添加"

### Android安装步骤:
1. Chrome打开前端地址
2. 点击菜单(三个点)
3. 选择"安装应用"或"添加到主屏幕"

---

## 🎨 UI设计参考

**shadcn/ui官方示例:**
- Dashboard: https://ui.shadcn.com/examples/dashboard
- Forms: https://ui.shadcn.com/examples/forms
- Cards: https://ui.shadcn.com/docs/components/card

**配色方案建议:**
```css
:root {
  --profit: #10b981;  /* 盈利绿色 */
  --loss: #ef4444;    /* 亏损红色 */
  --warning: #f59e0b; /* 警告黄色 */
  --primary: #3b82f6; /* 主色蓝色 */
}
```

---

## ✅ 阶段2验收标准

完成以下功能即可:

- [ ] 天勤行情实时更新持仓浮盈
- [ ] 前端显示持仓列表
- [ ] 前端实时刷新(Supabase Realtime)
- [ ] 换月监测定时运行(可用cron)
- [ ] 换月提醒通过ntfy推送
- [ ] PWA可以安装到手机

---

## 🚧 后续优化方向

**阶段3可以做:**
- 锁仓自动触发
- 策略参数远程配置
- 多策略并行管理
- K线图展示(Recharts)
- 换月自动执行

---

**阶段2核心代码框架已就绪,现在你可以开始前端开发了!**

参考这份指南完成剩余工作,有问题随时提问。 🚀
