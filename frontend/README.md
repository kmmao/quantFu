# 期货量化管理平台 - 前端

基于 Next.js 15 + shadcn/ui 构建的期货持仓监控与管理系统前端应用。

## 🚀 快速启动

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm run start
```

## 📱 PWA 支持

本应用支持 Progressive Web App,可以安装到移动设备主屏幕。

### iOS 安装步骤:
1. Safari 打开应用地址
2. 点击底部"分享"按钮
3. 选择"添加到主屏幕"
4. 点击"添加"

### Android 安装步骤:
1. Chrome 打开应用地址
2. 点击菜单(三个点)
3. 选择"安装应用"或"添加到主屏幕"

### 生成 PWA 图标

目前使用的是占位符图标(`icon.svg`)。要生成真实的 PNG 图标:

```bash
# 使用 ImageMagick 或在线工具将 SVG 转换为 PNG
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
```

或者使用在线工具:
- [Favicon Generator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/)

## 🔧 环境变量

复制 `.env.example` 为 `.env.local`:

```bash
cp .env.example .env.local
```

配置变量:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase API URL (默认: http://localhost:8000)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key
- `NEXT_PUBLIC_BACKEND_URL`: 后端 API 地址 (默认: http://localhost:8888)

## 📦 技术栈

- **框架**: Next.js 15 (App Router)
- **UI 库**: shadcn/ui (Radix UI + Tailwind CSS)
- **状态管理**: Zustand
- **数据获取**: Supabase Client + React Query
- **实时更新**: Supabase Realtime
- **图标**: Lucide React
- **日期处理**: date-fns
- **PWA**: next-pwa

## 📁 项目结构

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页(持仓监控)
│   └── globals.css        # 全局样式
├── components/
│   └── ui/                # shadcn/ui 组件
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── table.tsx
├── lib/
│   ├── supabase.ts        # Supabase 客户端配置
│   └── utils.ts           # 工具函数
├── public/
│   ├── manifest.json      # PWA manifest
│   └── icon.svg           # 应用图标
├── .env.local             # 环境变量(不提交)
├── .env.example           # 环境变量示例
├── next.config.ts         # Next.js 配置
├── tailwind.config.ts     # Tailwind 配置
└── tsconfig.json          # TypeScript 配置
```

## 🎨 功能特性

### 已完成
- ✅ 持仓实时监控
- ✅ 多账户支持
- ✅ 盈亏统计展示
- ✅ Supabase Realtime 实时更新
- ✅ PWA 离线支持
- ✅ 响应式设计

### 待开发(阶段3)
- [ ] 合约管理页面
- [ ] 换月监控页面
- [ ] 锁仓管理功能
- [ ] K线图展示
- [ ] 策略参数配置

## 🔗 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Supabase 文档](https://supabase.com/docs)
- [项目总体 README](../README.md)
- [阶段2指南](../PHASE2_GUIDE.md)
