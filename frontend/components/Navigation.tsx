'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TrendingUp,
  Lock,
  Settings,
  FileText,
  BarChart3,
  Activity,
  Users,
  ArrowRightLeft,
  Zap,
  Trophy,
  DollarSign,
  AlertTriangle
} from 'lucide-react'

const navItems = [
  {
    title: '持仓监控',
    href: '/',
    icon: LayoutDashboard
  },
  {
    title: '锁仓管理',
    href: '/lock',
    icon: Lock
  },
  {
    title: '合约管理',
    href: '/contracts',
    icon: FileText
  },
  {
    title: '策略实例',
    href: '/strategies',
    icon: Activity
  },
  {
    title: '策略组',
    href: '/strategy-groups',
    icon: Users
  },
  {
    title: '信号监控',
    href: '/signals',
    icon: Zap
  },
  {
    title: '性能对比',
    href: '/performance',
    icon: Trophy
  },
  {
    title: '资源监控',
    href: '/resources',
    icon: DollarSign
  },
  {
    title: '冲突管理',
    href: '/conflicts',
    icon: AlertTriangle
  },
  {
    title: '换月任务',
    href: '/rollover-tasks',
    icon: ArrowRightLeft
  },
  {
    title: 'K线图表',
    href: '/chart',
    icon: BarChart3
  }
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">QuantFu</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
