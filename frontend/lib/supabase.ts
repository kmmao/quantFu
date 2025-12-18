import { createClient } from '@supabase/supabase-js'

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,  // 阶段1不需要认证
  },
  realtime: {
    params: {
      eventsPerSecond: 10,  // 实时更新频率
    },
  },
})

// 数据库类型定义
export interface Account {
  id: string
  account_name: string
  polar_account_id: string
  broker: string
  initial_balance: number
  status: string
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  variety_code: string
  variety_name: string
  polar_symbol: string
  tqsdk_symbol: string
  exchange: string
  is_main: boolean
  multiplier: number
  price_tick: number
  margin_ratio: number
  expire_date: string | null
  created_at: string
  updated_at: string
}

export interface Position {
  id: string
  account_id: string
  symbol: string
  long_position: number
  long_avg_price: number
  long_profit: number
  short_position: number
  short_avg_price: number
  short_profit: number
  is_long_locked: boolean
  long_lock_price: number | null
  is_short_locked: boolean
  short_lock_price: number | null
  legacy_long_position: number
  legacy_long_profit: number
  legacy_short_position: number
  legacy_short_profit: number
  last_price: number
  updated_at: string
}

export interface PositionSummary {
  symbol: string
  variety_name: string
  account_name: string
  long_position: number
  long_avg_price: number
  long_profit: number
  short_position: number
  short_avg_price: number
  short_profit: number
  total_profit: number
  net_position: number
  last_price: number
  updated_at: string
}

export interface Trade {
  id: string
  account_id: string
  symbol: string
  direction: 'buy' | 'sell'
  offset: 'open' | 'close'
  volume: number
  price: number
  commission: number
  source: string
  polar_order_id: string | null
  timestamp: string
  created_at: string
}

export interface LockConfig {
  id: string
  account_id: string
  symbol: string
  direction: 'long' | 'short'
  trigger_type: 'profit' | 'price' | 'time'
  auto_execute: boolean
  profit_lock_enabled: boolean
  profit_lock_threshold: number
  profit_lock_ratio: number
  trigger_price: number | null
  stop_loss_price: number | null
  trailing_stop: boolean
  trailing_distance: number | null
  created_at: string
  updated_at: string
}

export interface LockTrigger {
  id: string
  config_id: string
  account_id: string
  symbol: string
  variety_name: string
  account_name: string
  direction: 'long' | 'short'
  trigger_type: string
  trigger_price: number
  trigger_profit: number
  lock_volume: number
  execution_status: 'pending' | 'executed' | 'failed' | 'cancelled' | 'waiting_confirm'
  triggered_at: string
  execution_time: string | null
  execution_duration_ms: number | null
  error_message: string | null
}

export interface LockExecution {
  id: string
  trigger_id: string | null
  account_id: string
  symbol: string
  direction: 'long' | 'short'
  before_position: number
  before_avg_price: number
  before_profit: number
  lock_volume: number
  lock_direction: string
  lock_price: number
  commission: number
  after_locked_position: number
  after_open_position: number
  locked_profit: number
  polar_order_id: string | null
  execution_method: 'auto' | 'manual'
  executed_at: string
}

export interface Contract {
  id: string
  exchange: string
  variety_code: string
  variety_name: string
  symbol: string
  contract_month: string
  expire_date: string | null
  first_notice_date: string | null
  last_trade_date: string | null
  contract_multiplier: number
  price_tick: number
  margin_ratio: number
  price_limit_up: number | null
  price_limit_down: number | null
  last_price: number | null
  settlement_price: number | null
  open_interest: number
  volume: number
  is_main_contract: boolean
  is_active: boolean
  trading_status: string
  created_at: string
  updated_at: string
  days_to_expiry?: number
}

export interface MainContractSwitch {
  id: string
  exchange: string
  variety_code: string
  variety_name: string
  old_main_contract: string
  new_main_contract: string
  switch_date: string
  old_open_interest: number
  new_open_interest: number
  old_volume: number
  new_volume: number
  rollover_index: number
  notification_sent: boolean
  notification_time: string | null
  created_at: string
}

export interface ContractExpiryAlert {
  id: string
  account_id: string
  symbol: string
  alert_days_before: number
  alert_enabled: boolean
  last_alert_time: string | null
  alert_count: number
  created_at: string
  updated_at: string
  variety_name?: string
  expire_date?: string
  last_trade_date?: string
  days_to_expiry?: number
  should_alert?: boolean
}

export interface MarginCalculation {
  id: string
  account_id: string
  symbol: string
  price: number
  volume: number
  direction: 'long' | 'short'
  contract_multiplier: number
  margin_ratio: number
  required_margin: number
  contract_value: number
  created_at: string
}

// 策略参数相关类型
export interface Strategy {
  id: string
  name: string
  display_name: string
  version: string
  category: string
  description: string | null
  author: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StrategyParamDefinition {
  id: string
  strategy_id: string
  param_key: string
  param_name: string
  param_type: 'int' | 'float' | 'bool' | 'string' | 'list' | 'dict'
  default_value: string
  min_value: number | null
  max_value: number | null
  allowed_values: string[] | null
  description: string | null
  unit: string | null
  category: string | null
  is_required: boolean
  created_at: string
}

export interface StrategyInstance {
  id: string
  strategy_id: string
  account_id: string
  instance_name: string
  symbols: string[]
  status: 'stopped' | 'running' | 'paused' | 'error'
  error_message: string | null
  last_heartbeat: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  strategy_name?: string
  strategy_display_name?: string
  strategy_category?: string
  group_id?: string
  group_name?: string
  capital_allocation?: number
  position_limit?: number
  priority?: number
  win_rate?: number
  today_profit?: number
  today_trades?: number
}

export interface StrategyParamConfig {
  id: string
  instance_id: string
  param_key: string
  param_value: string
  version: number
  changed_by: string
  change_reason: string | null
  is_active: boolean
  created_at: string
  param_name?: string
  param_type?: string
  description?: string
}

export interface StrategyParamHistory {
  id: string
  instance_id: string
  param_key: string
  old_value: string | null
  new_value: string
  version: number
  changed_by: string
  change_reason: string | null
  created_at: string
}

export interface StrategyParamTemplate {
  id: string
  strategy_id: string
  template_name: string
  template_params: Record<string, any>
  description: string | null
  created_by: string
  is_public: boolean
  created_at: string
  updated_at: string
}

// 换月执行相关类型
export interface RolloverConfig {
  id: string
  account_id: string
  exchange: string
  variety_code: string
  auto_rollover_enabled: boolean
  days_before_expiry: number
  main_switch_trigger: boolean
  close_old_position: boolean
  open_new_position: boolean
  max_price_diff_percent: number
  created_at: string
  updated_at: string
}

export interface RolloverTask {
  id: string
  config_id: string
  account_id: string
  old_symbol: string
  new_symbol: string
  trigger_type: 'main_switch' | 'expiry'
  old_position: number
  target_position: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  error_message: string | null
  total_cost: number | null
  executed_volume: number | null
  remaining_volume: number | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface RolloverExecution {
  id: string
  task_id: string
  step_type: 'close_old' | 'open_new'
  symbol: string
  direction: 'long' | 'short'
  volume: number
  price: number | null
  status: 'pending' | 'executed' | 'failed'
  execution_time: string | null
  cost: number | null
  error_message: string | null
  created_at: string
}

export interface RolloverStatistics {
  id: string
  account_id: string
  exchange: string
  variety_code: string
  date: string
  total_tasks: number
  success_tasks: number
  failed_tasks: number
  total_volume: number
  total_cost: number
  avg_cost_per_lot: number
  created_at: string
  updated_at: string
}

// 多策略管理相关类型
export interface StrategyGroup {
  id: string
  account_id: string
  group_name: string
  description: string | null
  total_capital: number | null
  max_position_ratio: number
  max_risk_per_strategy: number
  allow_opposite_positions: boolean
  position_conflict_mode: 'allow' | 'reject' | 'merge'
  is_active: boolean
  created_at: string
  updated_at: string
  member_count?: number
  running_count?: number
  allocated_capital?: number
  total_profit?: number
}

export interface StrategyGroupMember {
  id: string
  group_id: string
  instance_id: string
  capital_allocation: number | null
  position_limit: number | null
  priority: number
  is_active: boolean
  joined_at: string
  updated_at: string
}

export interface StrategyPerformance {
  id: string
  instance_id: string
  date: string
  total_trades: number
  winning_trades: number
  losing_trades: number
  gross_profit: number
  gross_loss: number
  net_profit: number
  commission: number
  win_rate: number | null
  profit_factor: number | null
  sharpe_ratio: number | null
  max_drawdown: number | null
  avg_position_size: number | null
  max_position_size: number | null
  position_holding_time_avg: number | null
  created_at: string
  updated_at: string
}

export interface StrategySignal {
  id: string
  instance_id: string
  symbol: string
  signal_type: 'open' | 'close' | 'reverse'
  direction: 'long' | 'short'
  volume: number
  price: number | null
  confidence: number
  strength: 'weak' | 'medium' | 'strong'
  status: 'pending' | 'executed' | 'rejected' | 'expired'
  rejection_reason: string | null
  executed_at: string | null
  execution_price: number | null
  execution_volume: number | null
  expires_at: string | null
  created_at: string
  instance_name?: string
  account_id?: string
  strategy_name?: string
  age_seconds?: number
}

export interface StrategyConflict {
  id: string
  group_id: string
  instance_id_1: string
  instance_id_2: string
  conflict_type: 'opposite_direction' | 'exceed_limit' | 'same_symbol'
  symbol: string
  description: string | null
  resolution: 'allow' | 'reject' | 'merge' | 'priority' | null
  resolved: boolean
  created_at: string
  resolved_at: string | null
}

export interface ResourceUsage {
  id: string
  group_id: string
  timestamp: string
  total_capital_used: number | null
  total_position: number | null
  total_margin_used: number | null
  total_risk: number | null
  risk_utilization: number | null
  strategy_breakdown: Record<string, any> | null
}
