'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Strategy } from '@/lib/supabase'

interface CreateInstanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInstanceCreated?: () => void
}

export default function CreateInstanceDialog({
  open,
  onOpenChange,
  onInstanceCreated
}: CreateInstanceDialogProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    strategy_id: '',
    account_id: '',
    instance_name: '',
    symbols: [] as string[],
    symbolInput: ''
  })

  useEffect(() => {
    if (open) {
      fetchStrategies()
    }
  }, [open])

  const fetchStrategies = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/strategies')
      const data = await response.json()

      if (data.success) {
        setStrategies(data.data.filter((s: Strategy) => s.is_active))
      }
    } catch (error) {
      console.error('获取策略列表失败:', error)
      setError('获取策略列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSymbol = () => {
    const symbol = formData.symbolInput.trim().toUpperCase()
    if (!symbol) return

    if (formData.symbols.includes(symbol)) {
      setError('合约已存在')
      return
    }

    setFormData({
      ...formData,
      symbols: [...formData.symbols, symbol],
      symbolInput: ''
    })
    setError(null)
  }

  const handleRemoveSymbol = (symbol: string) => {
    setFormData({
      ...formData,
      symbols: formData.symbols.filter(s => s !== symbol)
    })
  }

  const handleCreate = async () => {
    setError(null)
    setSuccess(null)

    // 验证
    if (!formData.strategy_id) {
      setError('请选择策略')
      return
    }
    if (!formData.account_id.trim()) {
      setError('请输入账户ID')
      return
    }
    if (!formData.instance_name.trim()) {
      setError('请输入实例名称')
      return
    }
    if (formData.symbols.length === 0) {
      setError('请至少添加一个合约')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/strategy-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: formData.strategy_id,
          account_id: formData.account_id,
          instance_name: formData.instance_name,
          symbols: formData.symbols
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('实例创建成功!')

        // 重置表单
        setFormData({
          strategy_id: '',
          account_id: '',
          instance_name: '',
          symbols: [],
          symbolInput: ''
        })

        onInstanceCreated?.()

        // 3秒后关闭对话框
        setTimeout(() => {
          onOpenChange(false)
        }, 3000)
      } else {
        setError(data.message || '创建失败')
      }
    } catch (error) {
      console.error('创建实例失败:', error)
      setError('创建实例失败')
    } finally {
      setCreating(false)
    }
  }

  const selectedStrategy = strategies.find(s => s.id === formData.strategy_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建策略实例</DialogTitle>
          <DialogDescription>
            配置新的策略实例,系统将自动使用策略的默认参数
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="strategy">选择策略 *</Label>
              <Select
                value={formData.strategy_id}
                onValueChange={(value) => setFormData({ ...formData, strategy_id: value })}
              >
                <SelectTrigger id="strategy">
                  <SelectValue placeholder="请选择策略" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map(strategy => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      <div className="flex items-center gap-2">
                        <span>{strategy.display_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {strategy.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          v{strategy.version}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedStrategy?.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedStrategy.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-id">账户ID *</Label>
              <Input
                id="account-id"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                placeholder="例如: 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instance-name">实例名称 *</Label>
              <Input
                id="instance-name"
                value={formData.instance_name}
                onChange={(e) => setFormData({ ...formData, instance_name: e.target.value })}
                placeholder="例如: 网格策略-IF主力合约"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbols">交易合约 *</Label>
              <div className="flex gap-2">
                <Input
                  id="symbols"
                  value={formData.symbolInput}
                  onChange={(e) => setFormData({ ...formData, symbolInput: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                  placeholder="例如: IF2501 (按Enter添加)"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSymbol}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  添加
                </Button>
              </div>
              {formData.symbols.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.symbols.map(symbol => (
                    <Badge key={symbol} variant="secondary" className="gap-1">
                      {symbol}
                      <button
                        type="button"
                        onClick={() => handleRemoveSymbol(symbol)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {selectedStrategy && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded space-y-2">
                <h4 className="font-semibold text-sm">策略信息</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">策略名称:</span>
                    <span className="ml-2">{selectedStrategy.display_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">版本:</span>
                    <span className="ml-2">v{selectedStrategy.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">分类:</span>
                    <span className="ml-2">{selectedStrategy.category}</span>
                  </div>
                  {selectedStrategy.author && (
                    <div>
                      <span className="text-muted-foreground">作者:</span>
                      <span className="ml-2">{selectedStrategy.author}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={creating || loading}>
            {creating ? '创建中...' : '创建实例'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
