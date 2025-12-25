'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const themes = [
  {
    value: 'light',
    label: '亮色模式',
    icon: Sun,
  },
  {
    value: 'dark',
    label: '暗色模式',
    icon: Moon,
  },
  {
    value: 'system',
    label: '跟随系统',
    icon: Monitor,
  },
] as const

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // 避免水合不匹配，只在客户端渲染后显示真实图标
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // 根据当前主题确定显示的图标
  const CurrentIcon = React.useMemo(() => {
    if (!mounted) {
      // SSR 时返回一个占位符，避免水合不匹配
      return null
    }
    // 使用 resolvedTheme 来获取实际应用的主题（处理 system 情况）
    return resolvedTheme === 'dark' ? Moon : Sun
  }, [mounted, resolvedTheme])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {mounted && CurrentIcon ? (
            <CurrentIcon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
            {theme === value && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 也导出一个带文字的版本，用于侧边栏菜单
export function ThemeToggleItem() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = themes.find((t) => t.value === theme) || themes[2]
  const Icon = currentTheme.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
          {mounted ? (
            <Icon className="h-4 w-4" />
          ) : (
            <div className="h-4 w-4" />
          )}
          <span>主题</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {mounted ? currentTheme.label : '...'}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        {themes.map(({ value, label, icon: ThemeIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
          >
            <ThemeIcon className="mr-2 h-4 w-4" />
            <span>{label}</span>
            {theme === value && (
              <Check className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
