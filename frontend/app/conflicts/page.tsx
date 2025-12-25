'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  TrendingUp,
  Shield,
  AlertCircle
} from 'lucide-react'
import { supabase, StrategyConflict, StrategyGroup } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

export default function ConflictsPage() {
  const { toast } = useToast()
  const [groups, setGroups] = useState<StrategyGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [conflicts, setConflicts] = useState<StrategyConflict[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState<StrategyConflict | null>(null)
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('v_strategy_group_summary')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('获取策略组失败:', error)
      } else {
        setGroups(data || [])
        if (data && data.length > 0) {
          setSelectedGroupId('all')
        }
      }
    } catch (error) {
      console.error('获取策略组失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConflicts = useCallback(async () => {
    try {
      let query = supabase
        .from('strategy_conflicts')
        .select('*')
        .order('created_at', { ascending: false })

      // 策略组筛选
      if (selectedGroupId !== 'all') {
        query = query.eq('group_id', selectedGroupId)
      }

      // 解决状态筛选
      if (filter === 'unresolved') {
        query = query.eq('resolved', false)
      } else if (filter === 'resolved') {
        query = query.eq('resolved', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('获取冲突记录失败:', error)
      } else {
        setConflicts(data || [])
      }
    } catch (error) {
      console.error('获取冲突记录失败:', error)
    }
  }, [selectedGroupId, filter])

  useEffect(() => {
    if (selectedGroupId) {
      fetchConflicts()
    }
  }, [selectedGroupId, fetchConflicts])

  const handleResolve = async () => {
    if (!selectedConflict || !resolution.trim()) {
      toast({
        title: '表单验证失败',
        description: '请填写解决方案',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/conflicts/${selectedConflict.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: '解决成功',
          description: '冲突已成功标记为已解决'
        })
        fetchConflicts()
        setResolveDialogOpen(false)
        setSelectedConflict(null)
        setResolution('')
      } else {
        toast({
          title: '解决失败',
          description: data.message || '未知错误',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('解决冲突失败:', error)
      toast({
        title: '解决失败',
        description: '网络请求错误，请稍后重试',
        variant: 'destructive'
      })
    }
  }

  const getConflictTypeBadge = (type: string) => {
    const config = {
      opposite_direction: { label: '对冲冲突', icon: ArrowRightLeft, variant: 'destructive' as const },
      exceed_limit: { label: '超限冲突', icon: AlertTriangle, variant: 'default' as const },
      same_symbol: { label: '同合约冲突', icon: TrendingUp, variant: 'secondary' as const }
    }
    const { label, icon: Icon, variant } = config[type as keyof typeof config] || config.same_symbol
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const filteredConflicts = conflicts

  // 统计
  const stats = {
    total: conflicts.length,
    unresolved: conflicts.filter(c => !c.resolved).length,
    resolved: conflicts.filter(c => c.resolved).length,
    byType: {
      opposite_direction: conflicts.filter(c => c.conflict_type === 'opposite_direction').length,
      exceed_limit: conflicts.filter(c => c.conflict_type === 'exceed_limit').length,
      same_symbol: conflicts.filter(c => c.conflict_type === 'same_symbol').length
    }
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

  if (groups.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p>暂无策略组,请先创建策略组</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">策略冲突管理</h1>
          <p className="text-muted-foreground mt-1">
            监控和解决多策略之间的冲突
          </p>
        </div>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="选择策略组" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部策略组</SelectItem>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.group_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              总冲突数
            </CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              待解决
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.unresolved}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              已解决
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.resolved}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>对冲冲突</CardDescription>
            <CardTitle className="text-3xl">{stats.byType.opposite_direction}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>超限冲突</CardDescription>
            <CardTitle className="text-3xl">{stats.byType.exceed_limit}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 筛选按钮 */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: '全部' },
          { key: 'unresolved', label: '待解决' },
          { key: 'resolved', label: '已解决' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter(key as any)
              fetchConflicts()
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 冲突列表 */}
      <Card>
        <CardHeader>
          <CardTitle>冲突记录</CardTitle>
          <CardDescription>
            显示 {filteredConflicts.length} 条冲突记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredConflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mb-4 text-green-600" />
              <p>暂无冲突记录</p>
              <p className="text-sm mt-2">所有策略运行正常</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>冲突类型</TableHead>
                  <TableHead>策略1</TableHead>
                  <TableHead>策略2</TableHead>
                  <TableHead>合约</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>发生时间</TableHead>
                  <TableHead>解决时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConflicts.map((conflict) => (
                  <TableRow key={conflict.id}>
                    <TableCell>
                      {conflict.resolved ? (
                        <Badge variant="default" className="bg-green-500 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          已解决
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          待解决
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{getConflictTypeBadge(conflict.conflict_type)}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {conflict.instance_id_1.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {conflict.instance_id_2.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-medium">{conflict.symbol}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conflict.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(conflict.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(conflict.resolved_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!conflict.resolved ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedConflict(conflict)
                            setResolveDialogOpen(true)
                          }}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          解决
                        </Button>
                      ) : conflict.resolution ? (
                        <div className="max-w-xs text-xs text-green-600 truncate" title={conflict.resolution}>
                          {conflict.resolution}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 未解决冲突警告 */}
      {stats.unresolved > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                有 {stats.unresolved} 个策略冲突待解决
              </p>
              <p className="text-sm text-red-700">
                请及时处理策略冲突,避免影响交易执行
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 解决冲突对话框 */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>解决冲突</DialogTitle>
            <DialogDescription>
              记录冲突的解决方案
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedConflict && (
              <div className="p-4 bg-gray-50 rounded space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">冲突类型:</span>
                  {getConflictTypeBadge(selectedConflict.conflict_type)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">合约:</span>
                  <span className="font-medium">{selectedConflict.symbol}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">描述:</span>
                  <p className="mt-1">{selectedConflict.description}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">解决方案 *</label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="请描述如何解决这个冲突..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleResolve}>
              确认解决
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
