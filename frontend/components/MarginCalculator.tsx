'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calculator } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8888'

interface MarginCalculatorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MarginCalculator({
  open,
  onOpenChange,
}: MarginCalculatorProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    account_id: '',
    symbol: '',
    price: '',
    volume: '',
    direction: 'long' as 'long' | 'short',
  })

  const [result, setResult] = useState<{
    contract_value: number
    required_margin: number
    margin_ratio: number
    contract_multiplier: number
  } | null>(null)

  const [loading, setLoading] = useState(false)

  const handleCalculate = async () => {
    if (
      !formData.account_id ||
      !formData.symbol ||
      !formData.price ||
      !formData.volume
    ) {
      toast({
        title: '表单验证失败',
        description: '请填写所有必填字段',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${BACKEND_URL}/api/contracts/calculate-margin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.code === 200) {
        setResult(data.data)
      } else {
        toast({
          title: '计算失败',
          description: data.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('计算保证金失败:', error)
      toast({
        title: '计算失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      account_id: '',
      symbol: '',
      price: '',
      volume: '',
      direction: 'long',
    })
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            保证金计算器
          </DialogTitle>
          <DialogDescription>计算开仓所需保证金</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 基本信息 */}
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
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              placeholder="如: CZCE.TA2505"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">价格</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="开仓价格"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="volume">手数</Label>
              <Input
                id="volume"
                type="number"
                value={formData.volume}
                onChange={(e) =>
                  setFormData({ ...formData, volume: e.target.value })
                }
                placeholder="开仓手数"
              />
            </div>
          </div>

          {/* 方向选择 */}
          <div className="space-y-2">
            <Label>方向</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.direction === 'long' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, direction: 'long' })}
                className="flex-1"
              >
                做多
              </Button>
              <Button
                type="button"
                variant={formData.direction === 'short' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, direction: 'short' })}
                className="flex-1"
              >
                做空
              </Button>
            </div>
          </div>

          {/* 计算按钮 */}
          <div className="flex gap-2">
            <Button onClick={handleCalculate} disabled={loading} className="flex-1">
              {loading ? '计算中...' : '计算'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>

          {/* 计算结果 */}
          {result && (
            <div className="p-4 border rounded-lg bg-blue-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">合约价值</span>
                <span className="text-lg font-bold text-gray-900">
                  ¥{result.contract_value.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">所需保证金</span>
                <span className="text-2xl font-bold text-blue-600">
                  ¥{result.required_margin.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">合约乘数</span>
                  <span className="font-medium">
                    {result.contract_multiplier}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">保证金比例</span>
                  <span className="font-medium">
                    {(result.margin_ratio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="pt-3 text-xs text-gray-500 bg-white p-2 rounded">
                <p>
                  计算公式: 保证金 = 价格 × 手数 × 合约乘数 × 保证金比例
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
