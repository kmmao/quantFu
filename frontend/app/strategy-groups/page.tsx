'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users,
  Play,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Settings,
  UserPlus,
  AlertCircle
} from 'lucide-react'
import { StrategyGroup } from '@/lib/supabase'
import CreateGroupDialog from '@/components/CreateGroupDialog'
import GroupMembersDialog from '@/components/GroupMembersDialog'
import GroupSettingsDialog from '@/components/GroupSettingsDialog'

export default function StrategyGroupsPage() {
  const [groups, setGroups] = useState<StrategyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<StrategyGroup | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)

  useEffect(() => {
    fetchGroups()
    // 每30秒刷新一次
    const interval = setInterval(fetchGroups, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/strategy-groups')
      const data = await response.json()
      if (data.success) {
        setGroups(data.data)
      }
    } catch (error) {
      console.error('获取策略组失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConflictModeBadge = (mode: string) => {
    const config = {
      allow: { label: '允许', variant: 'default' as const, className: 'bg-green-500' },
      reject: { label: '拒绝', variant: 'destructive' as const },
      merge: { label: '合并', variant: 'secondary' as const }
    }
    const { label, variant, className } = config[mode as keyof typeof config] || config.allow
    return <Badge variant={variant} className={className}>{label}</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      </div>
    )
  }

  // 统计
  const stats = {
    total: groups.length,
    active: groups.filter(g => g.is_active).length,
    totalMembers: groups.reduce((sum, g) => sum + (g.member_count || 0), 0),
    runningMembers: groups.reduce((sum, g) => sum + (g.running_count || 0), 0),
    totalCapital: groups.reduce((sum, g) => sum + (g.allocated_capital || 0), 0),
    totalProfit: groups.reduce((sum, g) => sum + (g.total_profit || 0), 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">策略组管理</h1>
          <p className="text-muted-foreground mt-1">
            管理多策略并行组合,协调资源分配和冲突处理
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          创建策略组
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>策略组数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              活跃 {stats.active}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              成员总数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalMembers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              运行中
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.runningMembers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              分配资金
            </CardDescription>
            <CardTitle className="text-2xl">
              {stats.totalCapital.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">元</div>
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              总盈亏
            </CardDescription>
            <CardTitle className={`text-3xl flex items-center gap-2 ${
              stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalProfit >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">今日汇总</div>
          </CardContent>
        </Card>
      </div>

      {/* 策略组列表 */}
      <div className="grid gap-4">
        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p>暂无策略组</p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="mt-4 gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                创建第一个策略组
              </Button>
            </CardContent>
          </Card>
        ) : (
          groups.map(group => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{group.group_name}</CardTitle>
                      {!group.is_active && (
                        <Badge variant="outline">已停用</Badge>
                      )}
                      {getConflictModeBadge(group.position_conflict_mode)}
                    </div>
                    <CardDescription>
                      {group.description || '暂无描述'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedGroup(group)
                        setMembersDialogOpen(true)
                      }}
                      className="gap-1"
                    >
                      <UserPlus className="h-4 w-4" />
                      成员管理
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedGroup(group)
                        setSettingsDialogOpen(true)
                      }}
                      className="gap-1"
                    >
                      <Settings className="h-4 w-4" />
                      设置
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">账户</div>
                    <div className="font-medium">{group.account_id}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">成员数</div>
                    <div className="font-medium flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {group.member_count || 0}
                      <span className="text-xs text-muted-foreground">
                        ({group.running_count || 0} 运行)
                      </span>
                    </div>
                  </div>
                  {group.total_capital && (
                    <div>
                      <div className="text-muted-foreground">总资金</div>
                      <div className="font-medium">{group.total_capital.toLocaleString()} 元</div>
                    </div>
                  )}
                  {group.allocated_capital !== null && (
                    <div>
                      <div className="text-muted-foreground">已分配</div>
                      <div className="font-medium">{group.allocated_capital.toLocaleString()} 元</div>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">持仓限制</div>
                    <div className="font-medium">{(group.max_position_ratio * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">单策略风险</div>
                    <div className="font-medium">{(group.max_risk_per_strategy * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">对冲持仓:</span>
                    <Badge variant={group.allow_opposite_positions ? 'default' : 'secondary'}>
                      {group.allow_opposite_positions ? '允许' : '禁止'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">今日盈亏:</span>
                    <span className={`font-semibold ${
                      (group.total_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(group.total_profit || 0) >= 0 ? '+' : ''}{(group.total_profit || 0).toFixed(2)} 元
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 对话框 */}
      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGroupCreated={fetchGroups}
      />

      {selectedGroup && (
        <>
          <GroupMembersDialog
            open={membersDialogOpen}
            onOpenChange={setMembersDialogOpen}
            group={selectedGroup}
            onMembersUpdated={fetchGroups}
          />
          <GroupSettingsDialog
            open={settingsDialogOpen}
            onOpenChange={setSettingsDialogOpen}
            group={selectedGroup}
            onSettingsUpdated={fetchGroups}
          />
        </>
      )}
    </div>
  )
}
