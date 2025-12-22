-- ============================================
-- 期货量化管理平台 - 数据库初始化脚本
-- ============================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 账户管理表
-- ============================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(100) NOT NULL,                -- 账户名称(自定义)
    polar_account_id VARCHAR(50) UNIQUE,               -- 极星账户ID
    broker VARCHAR(50),                                -- 期货公司
    user_id VARCHAR(50),                               -- 资金账号
    status VARCHAR(20) DEFAULT 'active',               -- active/inactive/suspended
    notes TEXT,                                        -- 备注
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE accounts IS '期货账户主数据表';
COMMENT ON COLUMN accounts.polar_account_id IS '极星平台账户ID,如85178443';

-- ============================================
-- 2. 合约映射表(核心!)
-- ============================================
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variety_code VARCHAR(10) NOT NULL,                 -- 品种代码 "TA"
    variety_name VARCHAR(50),                          -- 品种名称 "PTA"
    exchange VARCHAR(20) NOT NULL,                     -- 交易所 "ZCE"

    -- 极星格式
    polar_symbol VARCHAR(50) UNIQUE NOT NULL,          -- "ZCE|F|TA|2505"

    -- 天勤格式
    tqsdk_symbol VARCHAR(50) UNIQUE NOT NULL,          -- "CZCE.TA2505"

    -- 合约属性
    is_main BOOLEAN DEFAULT FALSE,                     -- 是否主力合约
    contract_month VARCHAR(10),                        -- 合约月份 "2505"
    expiry_date DATE,                                  -- 到期日

    -- 交易参数
    multiplier INTEGER,                                -- 合约乘数(1手=多少单位)
    price_tick DECIMAL(10,4),                          -- 最小变动价位
    margin_ratio DECIMAL(5,4),                         -- 保证金比例
    commission_ratio DECIMAL(8,6),                     -- 手续费率(按金额)
    commission_fixed DECIMAL(10,2),                    -- 固定手续费(按手)

    -- 元数据
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE contracts IS '合约映射表,维护极星与天勤格式的对应关系';

-- 合约索引
CREATE INDEX idx_contracts_variety ON contracts(variety_code);
CREATE INDEX idx_contracts_exchange ON contracts(exchange);
CREATE INDEX idx_contracts_main ON contracts(is_main) WHERE is_main = TRUE;
CREATE INDEX idx_contracts_polar ON contracts(polar_symbol);
CREATE INDEX idx_contracts_tqsdk ON contracts(tqsdk_symbol);

-- ============================================
-- 3. 成交记录表(极星推送)
-- ============================================
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,                       -- 合约代码(极星格式)
    direction VARCHAR(10) NOT NULL,                    -- buy/sell
    offset_flag VARCHAR(10) NOT NULL,                  -- open/close (改名避免保留字冲突)
    volume INTEGER NOT NULL,                           -- 成交手数
    price DECIMAL(12,2) NOT NULL,                      -- 成交价格
    order_id VARCHAR(50),                              -- 订单ID
    timestamp TIMESTAMP NOT NULL,                      -- 成交时间
    source VARCHAR(20) DEFAULT 'polar',                -- 数据来源: polar/manual
    notes TEXT,                                        -- 备注
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE trades IS '成交记录表,由极星策略实时推送';

-- 成交记录索引
CREATE INDEX idx_trades_account ON trades(account_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX idx_trades_account_symbol ON trades(account_id, symbol);

-- ============================================
-- 4. 持仓明细表(后端计算)
-- ============================================
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,                       -- 合约代码(极星格式)

    -- 多头持仓
    long_position INTEGER DEFAULT 0,                   -- 多仓手数
    long_avg_price DECIMAL(12,2),                      -- 多仓均价
    long_profit DECIMAL(12,2) DEFAULT 0,               -- 多仓浮盈

    -- 空头持仓
    short_position INTEGER DEFAULT 0,                  -- 空仓手数
    short_avg_price DECIMAL(12,2),                     -- 空仓均价
    short_profit DECIMAL(12,2) DEFAULT 0,              -- 空仓浮盈

    -- 锁仓信息(利润锁/保本锁)
    is_long_locked BOOLEAN DEFAULT FALSE,              -- 多仓是否锁定
    long_lock_price DECIMAL(12,2),                     -- 多仓锁定价格
    long_lock_profit DECIMAL(12,2),                    -- 多仓锁定盈利金额
    long_lock_type VARCHAR(20),                        -- 锁定类型: profit/breakeven

    is_short_locked BOOLEAN DEFAULT FALSE,             -- 空仓是否锁定
    short_lock_price DECIMAL(12,2),                    -- 空仓锁定价格
    short_lock_profit DECIMAL(12,2),                   -- 空仓锁定盈利金额
    short_lock_type VARCHAR(20),                       -- 锁定类型: profit/breakeven

    -- 换月锁仓(历史月份锁)
    legacy_long_position INTEGER DEFAULT 0,            -- 历史锁定多仓数量
    legacy_long_profit DECIMAL(12,2) DEFAULT 0,        -- 历史锁定多仓盈亏
    legacy_short_position INTEGER DEFAULT 0,           -- 历史锁定空仓数量
    legacy_short_profit DECIMAL(12,2) DEFAULT 0,       -- 历史锁定空仓盈亏

    -- 实时价格(天勤)
    last_price DECIMAL(12,2),                          -- 最新价格
    last_update_time TIMESTAMP,                        -- 价格更新时间

    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(account_id, symbol)
);

COMMENT ON TABLE positions IS '持仓明细表,由后端根据trades表自动计算';

-- 持仓索引
CREATE INDEX idx_positions_account ON positions(account_id);
CREATE INDEX idx_positions_symbol ON positions(symbol);
CREATE INDEX idx_positions_account_symbol ON positions(account_id, symbol);

-- ============================================
-- 5. 持仓快照表(对账用)
-- ============================================
CREATE TABLE position_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,                       -- 合约代码

    -- 极星实际持仓(策略推送)
    polar_long_position INTEGER,                       -- 极星多仓
    polar_short_position INTEGER,                      -- 极星空仓
    polar_long_avg_price DECIMAL(12,2),                -- 极星多仓均价
    polar_short_avg_price DECIMAL(12,2),               -- 极星空仓均价
    polar_long_profit DECIMAL(12,2),                   -- 极星多仓浮盈
    polar_short_profit DECIMAL(12,2),                  -- 极星空仓浮盈

    -- 计算持仓(后端计算)
    calculated_long_position INTEGER,                  -- 计算多仓
    calculated_short_position INTEGER,                 -- 计算空仓

    -- 对账结果
    is_matched BOOLEAN,                                -- 是否一致
    diff_long INTEGER,                                 -- 多仓差异
    diff_short INTEGER,                                -- 空仓差异

    timestamp TIMESTAMP NOT NULL,                      -- 快照时间
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE position_snapshots IS '持仓快照表,用于对账和历史查询';

-- 快照索引
CREATE INDEX idx_snapshots_account ON position_snapshots(account_id);
CREATE INDEX idx_snapshots_timestamp ON position_snapshots(timestamp DESC);

-- ============================================
-- 6. 锁仓配置表
-- ============================================
CREATE TABLE lock_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,                       -- 合约代码
    direction VARCHAR(10) NOT NULL,                    -- long/short

    -- 利润锁配置
    profit_lock_enabled BOOLEAN DEFAULT TRUE,          -- 是否启用利润锁
    profit_lock_threshold DECIMAL(12,2) DEFAULT 10000, -- 触发阈值(元)
    profit_lock_ratio DECIMAL(3,2) DEFAULT 0.80,       -- 锁定比例(80%)

    -- 保本锁配置
    breakeven_lock_enabled BOOLEAN DEFAULT TRUE,       -- 是否启用保本锁
    breakeven_lock_threshold DECIMAL(12,2) DEFAULT 5000, -- 触发阈值
    breakeven_lock_ratio DECIMAL(3,2) DEFAULT 0.80,    -- 锁定比例

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(account_id, symbol, direction)
);

COMMENT ON TABLE lock_configs IS '锁仓配置表,管理利润锁和保本锁参数';

-- ============================================
-- 7. 换月记录表
-- ============================================
CREATE TABLE rollover_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    variety_code VARCHAR(10) NOT NULL,                 -- "TA"
    from_symbol VARCHAR(50) NOT NULL,                  -- "ZCE|F|TA|405"
    to_symbol VARCHAR(50) NOT NULL,                    -- "ZCE|F|TA|409"
    direction VARCHAR(10) NOT NULL,                    -- long/short
    volume INTEGER NOT NULL,                           -- 换月手数

    -- 旧合约信息
    close_price DECIMAL(12,2),                         -- 平仓价格
    close_time TIMESTAMP,                              -- 平仓时间
    old_profit DECIMAL(12,2),                          -- 旧仓盈亏

    -- 新合约信息
    open_price DECIMAL(12,2),                          -- 开仓价格
    open_time TIMESTAMP,                               -- 开仓时间

    -- 成本信息
    price_spread DECIMAL(12,2),                        -- 价差(开仓价-平仓价)
    commission DECIMAL(12,2),                          -- 手续费
    total_cost DECIMAL(12,2),                          -- 总换月成本

    -- 继承信息
    inherited_profit DECIMAL(12,2),                    -- 继承的浮盈
    locked_position INTEGER,                           -- 锁定仓位数
    locked_profit DECIMAL(12,2),                       -- 锁定盈亏

    status VARCHAR(20) DEFAULT 'pending',              -- pending/completed/failed
    notes TEXT,                                        -- 换月备注
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE rollover_records IS '换月记录表,记录合约展期历史';

-- 换月索引
CREATE INDEX idx_rollover_account ON rollover_records(account_id);
CREATE INDEX idx_rollover_variety ON rollover_records(variety_code);
CREATE INDEX idx_rollover_status ON rollover_records(status);

-- ============================================
-- 8. 行情缓存表(可选)
-- ============================================
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL,                       -- 合约代码(天勤格式)
    last_price DECIMAL(12,2),                          -- 最新价
    bid_price DECIMAL(12,2),                           -- 买一价
    ask_price DECIMAL(12,2),                           -- 卖一价
    volume BIGINT,                                     -- 成交量
    open_interest BIGINT,                              -- 持仓量
    high_price DECIMAL(12,2),                          -- 最高价
    low_price DECIMAL(12,2),                           -- 最低价
    open_price DECIMAL(12,2),                          -- 开盘价
    pre_settle DECIMAL(12,2),                          -- 昨结算价
    timestamp TIMESTAMP NOT NULL,                      -- 行情时间
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE market_data IS '行情缓存表,存储天勤行情快照';

-- 行情索引
CREATE INDEX idx_market_symbol ON market_data(symbol);
CREATE INDEX idx_market_timestamp ON market_data(timestamp DESC);
CREATE INDEX idx_market_symbol_time ON market_data(symbol, timestamp DESC);

-- ============================================
-- 9. 系统通知表
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,                         -- 通知类型: trade/position/rollover/alert
    title VARCHAR(200) NOT NULL,                       -- 通知标题
    content TEXT NOT NULL,                             -- 通知内容
    level VARCHAR(20) DEFAULT 'info',                  -- info/warning/error
    is_read BOOLEAN DEFAULT FALSE,                     -- 是否已读
    created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE notifications IS '系统通知表,记录各类提醒消息';

CREATE INDEX idx_notifications_account ON notifications(account_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;

-- ============================================
-- 视图:持仓汇总(方便查询)
-- ============================================
CREATE OR REPLACE VIEW v_positions_summary AS
SELECT
    a.id AS account_id,
    a.account_name,
    a.polar_account_id,
    c.variety_code,
    c.variety_name,
    c.exchange,
    p.symbol,
    p.long_position,
    p.short_position,
    p.long_avg_price,
    p.short_avg_price,
    p.long_profit,
    p.short_profit,
    p.is_long_locked,
    p.is_short_locked,
    p.last_price,
    p.updated_at,
    -- 计算总保证金(假设保证金率9%)
    ROUND((p.long_position + p.short_position) * p.last_price * COALESCE(c.multiplier, 10) * 0.09, 2) AS margin_used,
    -- 计算总浮盈
    p.long_profit + p.short_profit AS total_profit
FROM positions p
JOIN accounts a ON p.account_id = a.id
LEFT JOIN contracts c ON p.symbol = c.polar_symbol
WHERE p.long_position > 0 OR p.short_position > 0 OR p.legacy_long_position > 0 OR p.legacy_short_position > 0;

COMMENT ON VIEW v_positions_summary IS '持仓汇总视图,包含账户、品种、盈亏等关键信息';

-- ============================================
-- 触发器:自动更新updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lock_configs_updated_at BEFORE UPDATE ON lock_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) - 后续启用
-- ============================================
-- 暂不启用RLS,开发阶段方便测试
-- ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
-- 等等...

-- ============================================
-- 初始化完成
-- ============================================
COMMENT ON DATABASE postgres IS '期货量化管理平台数据库';
