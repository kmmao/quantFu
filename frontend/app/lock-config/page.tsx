'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Settings, Edit, Trash2, RefreshCw } from 'lucide-react'
import LockConfigDialog from '@/components/LockConfigDialog'
import type { LockConfig } from '@/lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

export default function LockConfigPage() {
  const [configs, setConfigs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LockConfig | null>(null)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/lock/configs`)
      const data = await response.json()
      setConfigs(data.configs || [])
    } catch (error) {
      console.error('获取配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingConfig(null)
    setDialogOpen(true)
  }

  const handleEdit = (config: LockConfig) => {
    setEditingConfig(config)
    setDialogOpen(true)
  }

  const handleDelete = async (configId: string) => {
    if (!confirm('确定要删除此配置吗?')) return

    try {
      const response = await fetch(`${BACKEND_URL}/api/lock/configs/${configId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.code === 200) {
        alert('配置删除成功!')
        fetchConfigs()
      } else {
        alert(`删除失败: ${result.message}`)
      }
    } catch (error) {
      console.error('删除配置失败:', error)
      alert('删除失败,请稍后重试')
    }
  }

  const getTriggerTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: any }> = {
      profit: { label: '利润', variant: 'default' },
      price: { label: '价格', variant: 'secondary' },
      time: { label: '时间', variant: 'outline' },
    }
    const config = typeMap[type] || typeMap.profit
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">锁仓配置管理</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-1" />
          创建配置
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              配置总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{configs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              自动执行
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {configs.filter((c) => c.auto_execute).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              手动确认
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {configs.filter((c) => !c.auto_execute).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 配置列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>配置列表</CardTitle>
            <Button size="sm" variant="outline" onClick={fetchConfigs}>
              <RefreshCw className="w-4 h-4 mr-1" />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>暂无配置</p>
              <Button className="mt-4" onClick={handleCreate}>
                创建第一个配置
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>账户</TableHead>
                    <TableHead>品种</TableHead>
                    <TableHead>合约</TableHead>
                    <TableHead>方向</TableHead>
                    <TableHead>触发类型</TableHead>
                    <TableHead className="text-right">阈值/价格</TableHead>
                    <TableHead className="text-right">锁定比例</TableHead>
                    <TableHead>自动执行</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        {config.account_name || config.account_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{config.variety_name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {config.symbol}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            config.direction === 'long' ? 'default' : 'destructive'
                          }
                        >
                          {config.direction === 'long' ? '多仓' : '空仓'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getTriggerTypeBadge(config.trigger_type)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {config.trigger_type === 'profit'
                          ? `${config.profit_lock_threshold.toFixed(0)}元`
                          : config.trigger_price
                          ? config.trigger_price.toFixed(2)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(config.profit_lock_ratio * 100).toFixed(0)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.auto_execute ? 'default' : 'outline'}>
                          {config.auto_execute ? '是' : '否'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置对话框 */}
      <LockConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        onSuccess={fetchConfigs}
      />
    </main>
  )
}
