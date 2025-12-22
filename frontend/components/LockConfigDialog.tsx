'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import type { LockConfig } from '@/lib/supabase'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

interface LockConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: LockConfig | null
  onSuccess: () => void
}

export default function LockConfigDialog({
  open,
  onOpenChange,
  config,
  onSuccess,
}: LockConfigDialogProps) {
  const [formData, setFormData] = useState({
    account_id: '',
    symbol: '',
    direction: 'long' as 'long' | 'short',
    trigger_type: 'profit' as 'profit' | 'price' | 'time',
    auto_execute: false,
    profit_lock_enabled: true,
    profit_lock_threshold: 10000,
    profit_lock_ratio: 0.8,
    trigger_price: null as number | null,
    stop_loss_price: null as number | null,
    trailing_stop: false,
    trailing_distance: null as number | null,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData({
        account_id: config.account_id,
        symbol: config.symbol,
        direction: config.direction,
        trigger_type: config.trigger_type,
        auto_execute: config.auto_execute,
        profit_lock_enabled: config.profit_lock_enabled,
        profit_lock_threshold: config.profit_lock_threshold,
        profit_lock_ratio: config.profit_lock_ratio,
        trigger_price: config.trigger_price,
        stop_loss_price: config.stop_loss_price,
        trailing_stop: config.trailing_stop,
        trailing_distance: config.trailing_distance,
      })
    } else {
      // 重置表单
      setFormData({
        account_id: '',
        symbol: '',
        direction: 'long',
        trigger_type: 'profit',
        auto_execute: false,
        profit_lock_enabled: true,
        profit_lock_threshold: 10000,
        profit_lock_ratio: 0.8,
        trigger_price: null,
        stop_loss_price: null,
        trailing_stop: false,
        trailing_distance: null,
      })
    }
  }, [config, open])

  const handleSubmit = async () => {
    try {
      setLoading(true)

      const url = config
        ? `${BACKEND_URL}/api/lock/configs/${config.id}`
        : `${BACKEND_URL}/api/lock/configs`

      const method = config ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.code === 200) {
        alert(config ? '配置更新成功!' : '配置创建成功!')
        onSuccess()
        onOpenChange(false)
      } else {
        alert(`操作失败: ${result.message}`)
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存失败,请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config ? '编辑锁仓配置' : '创建锁仓配置'}</DialogTitle>
          <DialogDescription>
            配置锁仓触发条件,系统将自动监控并执行锁仓操作
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_id">账户ID</Label>
              <Input
                id="account_id"
                value={formData.account_id}
                onChange={(e) =>
                  setFormData({ ...formData, account_id: e.target.value })
                }
                placeholder="输入账户ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol">合约代码</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) =>
                  setFormData({ ...formData, symbol: e.target.value })
                }
                placeholder="如: CZCE.TA2505"
              />
            </div>
          </div>

          {/* 方向选择 */}
          <div className="space-y-2">
            <Label>持仓方向</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.direction === 'long' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, direction: 'long' })}
              >
                多仓
              </Button>
              <Button
                type="button"
                variant={formData.direction === 'short' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, direction: 'short' })}
              >
                空仓
              </Button>
            </div>
          </div>

          {/* 触发类型 */}
          <div className="space-y-2">
            <Label>触发类型</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.trigger_type === 'profit' ? 'default' : 'outline'}
                onClick={() =>
                  setFormData({ ...formData, trigger_type: 'profit' })
                }
              >
                利润触发
              </Button>
              <Button
                type="button"
                variant={formData.trigger_type === 'price' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, trigger_type: 'price' })}
              >
                价格触发
              </Button>
            </div>
          </div>

          {/* 利润触发设置 */}
          {formData.trigger_type === 'profit' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center justify-between">
                <Label htmlFor="profit_lock_enabled">启用利润锁</Label>
                <Switch
                  id="profit_lock_enabled"
                  checked={formData.profit_lock_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, profit_lock_enabled: checked })
                  }
                />
              </div>

              {formData.profit_lock_enabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="profit_threshold">触发阈值(元)</Label>
                    <Input
                      id="profit_threshold"
                      type="number"
                      value={formData.profit_lock_threshold}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profit_lock_threshold: parseFloat(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      浮盈达到此金额时触发锁仓
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profit_ratio">锁定比例</Label>
                    <Input
                      id="profit_ratio"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={formData.profit_lock_ratio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          profit_lock_ratio: parseFloat(e.target.value),
                        })
                      }
                    />
                    <p className="text-xs text-gray-500">
                      锁定持仓的比例 (0-1,如0.8表示锁定80%)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 价格触发设置 */}
          {formData.trigger_type === 'price' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="trigger_price">目标价格</Label>
                <Input
                  id="trigger_price"
                  type="number"
                  value={formData.trigger_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      trigger_price: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="价格到达此值时触发"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stop_loss_price">止损价格</Label>
                <Input
                  id="stop_loss_price"
                  type="number"
                  value={formData.stop_loss_price || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stop_loss_price: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="价格触及此值时止损"
                />
              </div>
            </div>
          )}

          {/* 自动执行 */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="auto_execute">自动执行</Label>
              <p className="text-xs text-gray-500">
                触发条件满足时自动执行锁仓,无需手动确认
              </p>
            </div>
            <Switch
              id="auto_execute"
              checked={formData.auto_execute}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, auto_execute: checked })
              }
            />
          </div>

          {/* 风险提示 */}
          {formData.auto_execute && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ 自动执行模式下,系统将在触发条件满足时立即执行锁仓,请确保配置正确!
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '保存中...' : config ? '更新配置' : '创建配置'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
