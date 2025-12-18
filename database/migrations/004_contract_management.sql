-- =====================================================
-- 合约管理功能数据库迁移
-- =====================================================

-- 1. 合约信息表
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange VARCHAR(20) NOT NULL,              -- 交易所代码 (CZCE, DCE, SHFE, INE, CFFEX, GFEX)
    variety_code VARCHAR(10) NOT NULL,          -- 品种代码 (TA, I, RB等)
    variety_name VARCHAR(50) NOT NULL,          -- 品种名称 (PTA, 铁矿石等)
    symbol VARCHAR(50) NOT NULL UNIQUE,         -- 合约代码 (CZCE.TA2505)

    -- 合约基本信息
    contract_month VARCHAR(10) NOT NULL,        -- 合约月份 (2505)
    expire_date DATE,                           -- 到期日
    first_notice_date DATE,                     -- 首次通知日
    last_trade_date DATE,                       -- 最后交易日

    -- 交易规格
    contract_multiplier INTEGER NOT NULL,       -- 合约乘数
    price_tick DECIMAL(12,4) NOT NULL,          -- 最小变动价位
    margin_ratio DECIMAL(8,4),                  -- 保证金比例

    -- 价格限制
    price_limit_up DECIMAL(12,2),               -- 涨停价
    price_limit_down DECIMAL(12,2),             -- 跌停价

    -- 市场数据
    last_price DECIMAL(12,2),                   -- 最新价
    settlement_price DECIMAL(12,2),             -- 结算价
    open_interest INTEGER,                      -- 持仓量
    volume INTEGER,                             -- 成交量

    -- 状态
    is_main_contract BOOLEAN DEFAULT false,     -- 是否主力合约
    is_active BOOLEAN DEFAULT true,             -- 是否活跃
    trading_status VARCHAR(20) DEFAULT 'normal', -- 交易状态 (normal, suspended, delisted)

    -- 元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT contracts_exchange_variety_month UNIQUE (exchange, variety_code, contract_month)
);

-- 2. 合约主力切换历史表
CREATE TABLE IF NOT EXISTS main_contract_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange VARCHAR(20) NOT NULL,
    variety_code VARCHAR(10) NOT NULL,
    variety_name VARCHAR(50) NOT NULL,

    -- 切换信息
    old_main_contract VARCHAR(50),              -- 旧主力合约
    new_main_contract VARCHAR(50) NOT NULL,     -- 新主力合约
    switch_date TIMESTAMPTZ DEFAULT NOW(),      -- 切换时间

    -- 切换指标
    old_open_interest INTEGER,                  -- 旧主力持仓量
    new_open_interest INTEGER,                  -- 新主力持仓量
    old_volume INTEGER,                         -- 旧主力成交量
    new_volume INTEGER,                         -- 新主力成交量
    rollover_index DECIMAL(8,4),                -- 换月指数

    -- 通知状态
    notification_sent BOOLEAN DEFAULT false,
    notification_time TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 合约到期提醒配置表
CREATE TABLE IF NOT EXISTS contract_expiry_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(50) NOT NULL,            -- 账户ID
    symbol VARCHAR(50) NOT NULL,                -- 合约代码

    -- 提醒配置
    alert_days_before INTEGER DEFAULT 7,        -- 提前几天提醒
    alert_enabled BOOLEAN DEFAULT true,         -- 是否启用提醒

    -- 提醒状态
    last_alert_time TIMESTAMPTZ,
    alert_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT expiry_alerts_account_symbol UNIQUE (account_id, symbol)
);

-- 4. 保证金计算历史表
CREATE TABLE IF NOT EXISTS margin_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(50) NOT NULL,

    -- 计算参数
    price DECIMAL(12,2) NOT NULL,               -- 价格
    volume INTEGER NOT NULL,                    -- 手数
    direction VARCHAR(10) NOT NULL,             -- 方向 (long/short)

    -- 计算结果
    contract_multiplier INTEGER NOT NULL,
    margin_ratio DECIMAL(8,4) NOT NULL,
    required_margin DECIMAL(15,2) NOT NULL,     -- 所需保证金
    contract_value DECIMAL(15,2) NOT NULL,      -- 合约价值

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 视图
-- =====================================================

-- 活跃合约视图
CREATE OR REPLACE VIEW v_active_contracts AS
SELECT
    c.*,
    CASE
        WHEN c.expire_date IS NOT NULL THEN
            EXTRACT(EPOCH FROM (c.expire_date - CURRENT_DATE)) / 86400
        ELSE NULL
    END as days_to_expiry
FROM contracts c
WHERE c.is_active = true
ORDER BY c.exchange, c.variety_code, c.contract_month;

-- 主力合约视图
CREATE OR REPLACE VIEW v_main_contracts AS
SELECT
    c.*,
    EXTRACT(EPOCH FROM (c.expire_date - CURRENT_DATE)) / 86400 as days_to_expiry
FROM contracts c
WHERE c.is_main_contract = true
  AND c.is_active = true
ORDER BY c.exchange, c.variety_code;

-- 即将到期合约视图
CREATE OR REPLACE VIEW v_expiring_contracts AS
SELECT
    c.*,
    EXTRACT(EPOCH FROM (c.expire_date - CURRENT_DATE)) / 86400 as days_to_expiry
FROM contracts c
WHERE c.is_active = true
  AND c.expire_date IS NOT NULL
  AND c.expire_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY c.expire_date;

-- 合约到期提醒视图
CREATE OR REPLACE VIEW v_contract_expiry_reminders AS
SELECT
    cea.*,
    c.variety_name,
    c.expire_date,
    c.last_trade_date,
    EXTRACT(EPOCH FROM (c.expire_date - CURRENT_DATE)) / 86400 as days_to_expiry,
    CASE
        WHEN c.expire_date <= CURRENT_DATE + (cea.alert_days_before || ' days')::INTERVAL
        THEN true
        ELSE false
    END as should_alert
FROM contract_expiry_alerts cea
JOIN contracts c ON cea.symbol = c.symbol
WHERE cea.alert_enabled = true
  AND c.is_active = true
  AND c.expire_date IS NOT NULL
ORDER BY c.expire_date;

-- =====================================================
-- 索引
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_contracts_exchange_variety ON contracts(exchange, variety_code);
CREATE INDEX IF NOT EXISTS idx_contracts_symbol ON contracts(symbol);
CREATE INDEX IF NOT EXISTS idx_contracts_expire_date ON contracts(expire_date);
CREATE INDEX IF NOT EXISTS idx_contracts_is_main ON contracts(is_main_contract);
CREATE INDEX IF NOT EXISTS idx_main_switches_variety ON main_contract_switches(exchange, variety_code);
CREATE INDEX IF NOT EXISTS idx_expiry_alerts_account ON contract_expiry_alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_margin_calc_account ON margin_calculations(account_id);

-- =====================================================
-- 触发器
-- =====================================================

-- 更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expiry_alerts_updated_at BEFORE UPDATE ON contract_expiry_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 注释
-- =====================================================

COMMENT ON TABLE contracts IS '合约基本信息表';
COMMENT ON TABLE main_contract_switches IS '主力合约切换历史表';
COMMENT ON TABLE contract_expiry_alerts IS '合约到期提醒配置表';
COMMENT ON TABLE margin_calculations IS '保证金计算历史表';
