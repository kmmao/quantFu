'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Home
} from 'lucide-react'
import { useState } from 'react'

// 导航菜单分组结构
const navGroups = [
  {
    title: '总览',
    items: [
      {
        title: '首页',
        href: '/',
        icon: Home
      }
    ]
  },
  {
    title: '交易管理',
    items: [
      {
        title: '持仓监控',
        href: '/positions',
        icon: LayoutDashboard
      },
      {
        title: '仓位管理',
        href: '/lock',
        icon: Lock
      },
      {
        title: '合约管理',
        href: '/contracts',
        icon: FileText
      }
    ]
  },
  {
    title: '策略中心',
    items: [
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
        title: '换月任务',
        href: '/rollover-tasks',
        icon: ArrowRightLeft
      }
    ]
  },
  {
    title: '监控分析',
    items: [
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
      }
    ]
  },
  {
    title: '图表工具',
    items: [
      {
        title: 'K线图表',
        href: '/chart',
        icon: BarChart3
      }
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(title)) {
        next.delete(title)
      } else {
        next.add(title)
      }
      return next
    })
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">QuantFu</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.title)

          return (
            <div key={group.title} className="mb-4">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                <span>{group.title}</span>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {/* Group Items */}
              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={cn(
                          "flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            © 2025 QuantFu
          </div>
        </div>
      </aside>
    </>
  )
}
