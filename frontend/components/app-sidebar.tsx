'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  Lock,
  FileText,
  Activity,
  Users,
  ArrowRightLeft,
  Zap,
  Trophy,
  DollarSign,
  AlertTriangle,
  BarChart3,
  Home,
  ChevronRight,
  Settings,
  LogOut,
  User,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// 导航菜单项类型
type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

type NavGroup = {
  title: string
  items: NavItem[]
}

// 导航菜单数据
const navData: NavGroup[] = [
  {
    title: '总览',
    items: [
      {
        title: '首页',
        href: '/',
        icon: Home,
      },
    ],
  },
  {
    title: '交易管理',
    items: [
      {
        title: '持仓监控',
        href: '/positions',
        icon: LayoutDashboard,
      },
      {
        title: '仓位管理',
        href: '/lock',
        icon: Lock,
      },
      {
        title: '合约管理',
        href: '/contracts',
        icon: FileText,
      },
    ],
  },
  {
    title: '策略中心',
    items: [
      {
        title: '策略实例',
        href: '/strategies',
        icon: Activity,
      },
      {
        title: '策略组',
        href: '/strategy-groups',
        icon: Users,
      },
      {
        title: '换月任务',
        href: '/rollover-tasks',
        icon: ArrowRightLeft,
      },
    ],
  },
  {
    title: '监控分析',
    items: [
      {
        title: '信号监控',
        href: '/signals',
        icon: Zap,
      },
      {
        title: '性能对比',
        href: '/performance',
        icon: Trophy,
      },
      {
        title: '资源监控',
        href: '/resources',
        icon: DollarSign,
      },
      {
        title: '冲突管理',
        href: '/conflicts',
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: '图表工具',
    items: [
      {
        title: 'K线图表',
        href: '/chart',
        icon: BarChart3,
      },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(
    new Set(navData.map((group) => group.title))
  )

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  return (
    <div className="flex h-full w-64 flex-col gap-2 border-r bg-background">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-lg">QuantFu</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navData.map((group) => (
            <Collapsible
              key={group.title}
              open={openGroups.has(group.title)}
              onOpenChange={() => toggleGroup(group.title)}
            >
              <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                <span className="flex-1 text-left uppercase tracking-wider">
                  {group.title}
                </span>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform',
                    openGroups.has(group.title) && 'rotate-90'
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md p-2 text-sm hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  QF
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="font-medium">QuantFu 用户</span>
                <span className="text-xs text-muted-foreground">
                  admin@quantfu.com
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>我的账户</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>个人资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
