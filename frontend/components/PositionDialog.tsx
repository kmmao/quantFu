'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Account {
  id: string
  account_name: string
  polar_account_id: string
}

interface Contract {
  id: string
  polar_symbol: string
  tqsdk_symbol: string
  variety_name: string
  variety_code: string
  exchange: string
}

interface PositionData {
  id?: string
  account_id: string
  symbol: string
  long_position: number
  long_avg_price: number | null
  short_position: number
  short_avg_price: number | null
  last_price: number | null
}

interface PositionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  position?: PositionData | null
  onSuccess: () => void
}

export function PositionDialog({
  open,
  onOpenChange,
  position,
  onSuccess,
}: PositionDialogProps) {
  const [loading, setLoading] = React.useState(false)
  const [accounts, setAccounts] = React.useState<Account[]>([])
  const [contracts, setContracts] = React.useState<Contract[]>([])
  const [searchOpen, setSearchOpen] = React.useState(false)

  const [formData, setFormData] = React.useState<PositionData>({
    account_id: '',
    symbol: '',
    long_position: 0,
    long_avg_price: null,
    short_position: 0,
    short_avg_price: null,
    last_price: null,
  })

  // 加载账户列表
  React.useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('accounts')
        .select('id, account_name, polar_account_id')
        .eq('status', 'active')
        .order('account_name')

      if (data) setAccounts(data)
    }
    fetchAccounts()
  }, [])

  // 加载合约列表
  React.useEffect(() => {
    const fetchContracts = async () => {
      const { data } = await supabase
        .from('contracts')
        .select('id, polar_symbol, tqsdk_symbol, variety_name, variety_code, exchange')
        .order('variety_code')
        .order('polar_symbol')

      if (data) setContracts(data)
    }
    fetchContracts()
  }, [])

  // 编辑模式下加载现有数据
  React.useEffect(() => {
    if (position) {
      setFormData({
        id: position.id,
        account_id: position.account_id,
        symbol: position.symbol,
        long_position: position.long_position,
        long_avg_price: position.long_avg_price,
        short_position: position.short_position,
        short_avg_price: position.short_avg_price,
        last_price: position.last_price,
      })
    } else {
      setFormData({
        account_id: '',
        symbol: '',
        long_position: 0,
        long_avg_price: null,
        short_position: 0,
        short_avg_price: null,
        last_price: null,
      })
    }
  }, [position, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 准备数据
      const submitData = {
        account_id: formData.account_id,
        symbol: formData.symbol,
        long_position: formData.long_position || 0,
        long_avg_price: formData.long_avg_price,
        short_position: formData.short_position || 0,
        short_avg_price: formData.short_avg_price,
        last_price: formData.last_price,
        updated_at: new Date().toISOString(),
      }

      if (position?.id) {
        // 更新现有持仓
        const { error } = await supabase
          .from('positions')
          .update(submitData)
          .eq('id', position.id)

        if (error) throw error
      } else {
        // 新增持仓
        const { error } = await supabase.from('positions').insert(submitData)

        if (error) {
          // 如果是唯一约束冲突,尝试更新
          if (error.code === '23505') {
            const { error: updateError } = await supabase
              .from('positions')
              .update(submitData)
              .eq('account_id', formData.account_id)
              .eq('symbol', formData.symbol)

            if (updateError) throw updateError
          } else {
            throw error
          }
        }
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('保存失败:', error)
      alert(`保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  const selectedContract = contracts.find((c) => c.polar_symbol === formData.symbol)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{position ? '编辑持仓' : '添加持仓'}</DialogTitle>
          <DialogDescription>
            {position ? '修改现有持仓数据' : '手动添加新的持仓记录'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 账户选择 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account" className="text-right">
                账户 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_id: value })
                }
                disabled={!!position}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择账户" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} ({account.polar_account_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 合约选择 - 使用搜索下拉框 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                合约 <span className="text-red-500">*</span>
              </Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className="col-span-3 justify-between"
                    disabled={!!position}
                  >
                    {selectedContract
                      ? `${selectedContract.variety_name} ${selectedContract.polar_symbol}`
                      : '搜索并选择合约...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0">
                  <Command>
                    <CommandInput placeholder="搜索合约代码或品种名称..." />
                    <CommandList>
                      <CommandEmpty>未找到合约</CommandEmpty>
                      <CommandGroup>
                        {contracts.map((contract) => (
                          <CommandItem
                            key={contract.id}
                            value={`${contract.variety_name} ${contract.polar_symbol} ${contract.variety_code}`}
                            onSelect={() => {
                              setFormData({ ...formData, symbol: contract.polar_symbol })
                              setSearchOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.symbol === contract.polar_symbol
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{contract.variety_name}</span>
                              <span className="text-sm text-muted-foreground">
                                {contract.polar_symbol}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({contract.exchange})
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="my-2 border-t" />

            {/* 多头持仓 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="long_position" className="text-right">
                多仓手数
              </Label>
              <Input
                id="long_position"
                type="number"
                min="0"
                value={formData.long_position}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    long_position: parseInt(e.target.value) || 0,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="long_avg_price" className="text-right">
                多仓均价
              </Label>
              <Input
                id="long_avg_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.long_avg_price ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    long_avg_price: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="col-span-3"
                placeholder="多仓均价"
              />
            </div>

            <div className="my-2 border-t" />

            {/* 空头持仓 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="short_position" className="text-right">
                空仓手数
              </Label>
              <Input
                id="short_position"
                type="number"
                min="0"
                value={formData.short_position}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    short_position: parseInt(e.target.value) || 0,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="short_avg_price" className="text-right">
                空仓均价
              </Label>
              <Input
                id="short_avg_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.short_avg_price ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    short_avg_price: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="col-span-3"
                placeholder="空仓均价"
              />
            </div>

            <div className="my-2 border-t" />

            {/* 最新价 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_price" className="text-right">
                最新价
              </Label>
              <Input
                id="last_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.last_price ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    last_price: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="col-span-3"
                placeholder="当前市场价格(用于计算盈亏)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.account_id || !formData.symbol}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {position ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
