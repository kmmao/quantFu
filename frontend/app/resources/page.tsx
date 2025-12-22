'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DollarSign,
  TrendingUp,
  PieChart,
  AlertTriangle,
  Activity,
  Target,
  AlertCircle
} from 'lucide-react'
import { supabase, ResourceUsage, StrategyGroup } from '@/lib/supabase'

export default function ResourcesPage() {
  const [groups, setGroups] = useState<StrategyGroup[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [resourceData, setResourceData] = useState<ResourceUsage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    if (selectedGroupId && selectedGroupId !== 'all') {
      fetchResourceUsage(selectedGroupId)
    }
  }, [selectedGroupId])

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
          setSelectedGroupId(data[0].id)
        }
      }
    } catch (error) {
      console.error('获取策略组失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResourceUsage = async (groupId: string) => {
    try {
      const response = await fetch(`/api/resource-usage/${groupId}`)
      const data = await response.json()
      if (data.success) {
        setResourceData(data.data)
      }
    } catch (error) {
      console.error('获取资源使用失败:', error)
    }
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const latestUsage = resourceData.length > 0 ? resourceData[0] : null

  // 计算利用率
  const capitalUtilization = selectedGroup?.total_capital && latestUsage?.total_capital_used
    ? (latestUsage.total_capital_used / selectedGroup.total_capital) * 100
    : 0

  const riskUtilization = latestUsage?.risk_utilization || 0

  // 从 strategy_breakdown 中提取策略分布
  const strategyBreakdown = latestUsage?.strategy_breakdown
    ? Object.entries(latestUsage.strategy_breakdown as Record<string, any>).map(([name, data]: [string, any]) => ({
        name,
        capital: data.capital || 0,
        position: data.position || 0,
        risk: data.risk || 0
      }))
    : []

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
          <h1 className="text-3xl font-bold">资源监控</h1>
          <p className="text-muted-foreground mt-1">
            监控策略组的资金和风险使用情况
          </p>
        </div>
        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="选择策略组" />
          </SelectTrigger>
          <SelectContent>
            {groups.map(group => (
              <SelectItem key={group.id} value={group.id}>
                {group.group_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!latestUsage ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4" />
            <p>暂无资源使用数据</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 总览卡片 */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  已用资金
                </CardDescription>
                <CardTitle className="text-2xl">
                  {(latestUsage.total_capital_used || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  / {selectedGroup?.total_capital?.toLocaleString() || '-'} 元
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <PieChart className="h-3 w-3" />
                  资金利用率
                </CardDescription>
                <CardTitle className={`text-2xl ${
                  capitalUtilization > 90 ? 'text-red-600' :
                  capitalUtilization > 70 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {capitalUtilization.toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  总持仓
                </CardDescription>
                <CardTitle className="text-2xl">
                  {latestUsage.total_position || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">手</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  保证金占用
                </CardDescription>
                <CardTitle className="text-2xl">
                  {(latestUsage.total_margin_used || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">元</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  风险利用率
                </CardDescription>
                <CardTitle className={`text-2xl ${
                  riskUtilization > 0.9 ? 'text-red-600' :
                  riskUtilization > 0.7 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {(riskUtilization * 100).toFixed(1)}%
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* 利用率进度条 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">资金使用进度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>已用资金</span>
                    <span className="font-semibold">
                      {(latestUsage.total_capital_used || 0).toLocaleString()} / {selectedGroup?.total_capital?.toLocaleString() || '-'} 元
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        capitalUtilization > 90 ? 'bg-red-500' :
                        capitalUtilization > 70 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(capitalUtilization, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    利用率: {capitalUtilization.toFixed(1)}%
                  </div>
                </div>

                {capitalUtilization > 90 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    资金使用率过高,请注意风险控制
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">风险使用进度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>风险利用率</span>
                    <span className="font-semibold">
                      {(riskUtilization * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        riskUtilization > 0.9 ? 'bg-red-500' :
                        riskUtilization > 0.7 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(riskUtilization * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    总风险: {(latestUsage.total_risk || 0).toLocaleString()} 元
                  </div>
                </div>

                {riskUtilization > 0.9 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    风险利用率过高,建议减少持仓
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 策略分布 */}
          {strategyBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>策略资源分布</CardTitle>
                <CardDescription>
                  各策略实例的资源使用明细
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategyBreakdown.map((strategy, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{strategy.name}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            资金: <span className="font-medium text-foreground">
                              {strategy.capital.toLocaleString()} 元
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            持仓: <span className="font-medium text-foreground">
                              {strategy.position} 手
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            风险: <span className="font-medium text-foreground">
                              {strategy.risk.toLocaleString()} 元
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{
                            width: `${selectedGroup?.total_capital
                              ? (strategy.capital / selectedGroup.total_capital) * 100
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 历史趋势 */}
          {resourceData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>资源使用趋势</CardTitle>
                <CardDescription>
                  最近 {resourceData.length} 条记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resourceData.slice(0, 10).map((usage, index) => (
                    <div key={usage.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-muted-foreground">
                        {new Date(usage.timestamp).toLocaleString('zh-CN')}
                      </span>
                      <div className="flex gap-6 text-sm">
                        <span>
                          资金: <span className="font-medium">
                            {(usage.total_capital_used || 0).toLocaleString()}
                          </span>
                        </span>
                        <span>
                          持仓: <span className="font-medium">
                            {usage.total_position || 0} 手
                          </span>
                        </span>
                        <span>
                          风险: <span className={`font-medium ${
                            (usage.risk_utilization || 0) > 0.9 ? 'text-red-600' :
                            (usage.risk_utilization || 0) > 0.7 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {((usage.risk_utilization || 0) * 100).toFixed(1)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
