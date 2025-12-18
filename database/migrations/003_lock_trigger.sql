-- ============================================
-- 阶段3: 锁仓自动触发功能
-- 创建时间: 2025-12-18
-- ============================================

-- 扩展 lock_configs 表,增加触发类型和自动执行
ALTER TABLE lock_configs ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(20) DEFAULT 'profit';
ALTER TABLE lock_configs ADD COLUMN IF NOT EXISTS auto_execute BOOLEAN DEFAULT false;
ALTER TABLE lock_configs ADD COLUMN IF NOT EXISTS trigger_price DECIMAL(12,2);
ALTER TABLE lock_configs ADD COLUMN IF NOT EXISTS stop_loss_price DECIMAL(12,2);
ALTER TABLE lock_configs ADD COLUMN IF NOT EXISTS trailing_stop BOOLEAN DEFAULT false;
ALTER TABLE lock_configs ADD COLUMN IF NOT EXISTS trailing_distance DECIMAL(12,2);

COMMENT ON COLUMN lock_configs.trigger_type IS '触发类型: profit(利润), price(价格), time(时间)';
COMMENT ON COLUMN lock_configs.auto_execute IS '是否自动执行锁仓';
COMMENT ON COLUMN lock_configs.trigger_price IS '目标价格(用于价格触发)';
COMMENT ON COLUMN lock_configs.stop_loss_price IS '止损价格';
COMMENT ON COLUMN lock_configs.trailing_stop IS '是否启用移动止损';
COMMENT ON COLUMN lock_configs.trailing_distance IS '移动止损距离(点数)';

-- ============================================
-- 锁仓触发记录表
-- ============================================
CREATE TABLE IF NOT EXISTS lock_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID NOT NULL REFERENCES lock_configs(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id),
    symbol VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,                -- long/short

    -- 触发条件
    trigger_type VARCHAR(20) NOT NULL,             -- profit/price/stop_loss/trailing
    trigger_price DECIMAL(12,2),                   -- 触发时的价格
    trigger_profit DECIMAL(12,2),                  -- 触发时的利润
    trigger_condition TEXT,                        -- 触发条件描述

    -- 执行信息
    lock_volume INTEGER NOT NULL,                  -- 锁定手数
    lock_price DECIMAL(12,2),                      -- 锁定价格
    execution_status VARCHAR(20) DEFAULT 'pending', -- pending/executed/failed/cancelled
    execution_time TIMESTAMP,                      -- 执行时间
    execution_result TEXT,                         -- 执行结果
    error_message TEXT,                            -- 错误信息

    -- 审计
    triggered_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lock_triggers_config ON lock_triggers(config_id);
CREATE INDEX idx_lock_triggers_status ON lock_triggers(execution_status);
CREATE INDEX idx_lock_triggers_time ON lock_triggers(triggered_at DESC);

COMMENT ON TABLE lock_triggers IS '锁仓触发记录表,记录所有触发事件和执行结果';

-- ============================================
-- 锁仓执行历史表
-- ============================================
CREATE TABLE IF NOT EXISTS lock_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trigger_id UUID REFERENCES lock_triggers(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    symbol VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,

    -- 执行前状态
    before_position INTEGER,                       -- 执行前持仓
    before_avg_price DECIMAL(12,2),               -- 执行前均价
    before_profit DECIMAL(12,2),                  -- 执行前利润

    -- 执行操作
    lock_volume INTEGER NOT NULL,                  -- 锁定手数
    lock_direction VARCHAR(10) NOT NULL,          -- 锁仓方向(反向)
    lock_price DECIMAL(12,2) NOT NULL,            -- 成交价格
    commission DECIMAL(12,2) DEFAULT 0,           -- 手续费

    -- 执行后状态
    after_locked_position INTEGER,                 -- 锁定后持仓
    after_open_position INTEGER,                   -- 剩余开仓
    locked_profit DECIMAL(12,2),                  -- 锁定利润

    -- 极星订单信息
    polar_order_id VARCHAR(50),
    execution_method VARCHAR(20),                  -- auto/manual

    executed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lock_executions_trigger ON lock_executions(trigger_id);
CREATE INDEX idx_lock_executions_account ON lock_executions(account_id);
CREATE INDEX idx_lock_executions_time ON lock_executions(executed_at DESC);

COMMENT ON TABLE lock_executions IS '锁仓执行历史,记录每次锁仓操作的详细信息';

-- ============================================
-- 触发器:自动更新时间戳
-- ============================================
CREATE TRIGGER update_lock_triggers_updated_at
    BEFORE UPDATE ON lock_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 视图:锁仓触发汇总
-- ============================================
CREATE OR REPLACE VIEW v_lock_trigger_summary AS
SELECT
    lt.id,
    lt.symbol,
    c.variety_name,
    a.account_name,
    lt.direction,
    lt.trigger_type,
    lt.trigger_price,
    lt.trigger_profit,
    lt.lock_volume,
    lt.execution_status,
    lt.triggered_at,
    lt.execution_time,
    -- 执行耗时(毫秒)
    CASE
        WHEN lt.execution_time IS NOT NULL
        THEN EXTRACT(EPOCH FROM (lt.execution_time - lt.triggered_at)) * 1000
        ELSE NULL
    END AS execution_duration_ms,
    lt.error_message
FROM lock_triggers lt
JOIN accounts a ON lt.account_id = a.id
LEFT JOIN contracts c ON lt.symbol = c.polar_symbol
ORDER BY lt.triggered_at DESC;

COMMENT ON VIEW v_lock_trigger_summary IS '锁仓触发汇总视图,便于前端展示';

-- ============================================
-- 视图:活跃锁仓配置
-- ============================================
CREATE OR REPLACE VIEW v_active_lock_configs AS
SELECT
    lc.id,
    lc.account_id,
    a.account_name,
    a.polar_account_id,
    lc.symbol,
    c.variety_name,
    c.tqsdk_symbol,
    lc.direction,
    lc.trigger_type,
    lc.auto_execute,
    lc.profit_lock_enabled,
    lc.profit_lock_threshold,
    lc.profit_lock_ratio,
    lc.trigger_price,
    lc.stop_loss_price,
    lc.trailing_stop,
    lc.trailing_distance,
    -- 当前持仓信息
    CASE
        WHEN lc.direction = 'long' THEN p.long_position
        WHEN lc.direction = 'short' THEN p.short_position
        ELSE 0
    END AS current_position,
    CASE
        WHEN lc.direction = 'long' THEN p.long_avg_price
        WHEN lc.direction = 'short' THEN p.short_avg_price
        ELSE 0
    END AS current_avg_price,
    CASE
        WHEN lc.direction = 'long' THEN p.long_profit
        WHEN lc.direction = 'short' THEN p.short_profit
        ELSE 0
    END AS current_profit,
    p.last_price,
    lc.updated_at
FROM lock_configs lc
JOIN accounts a ON lc.account_id = a.id
LEFT JOIN contracts c ON lc.symbol = c.polar_symbol
LEFT JOIN positions p ON lc.account_id = p.account_id AND lc.symbol = p.symbol
WHERE a.status = 'active'
ORDER BY lc.updated_at DESC;

COMMENT ON VIEW v_active_lock_configs IS '活跃锁仓配置视图,包含当前持仓和盈亏信息';
