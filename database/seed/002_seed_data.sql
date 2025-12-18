-- ============================================
-- 初始数据种子文件
-- ============================================

-- ============================================
-- 1. 插入3个期货账户
-- ============================================
-- 请根据实际情况修改账户信息
INSERT INTO accounts (account_name, polar_account_id, broker, user_id, status) VALUES
('主账户-Allen', '85178443', '期货公司名称', '资金账号1', 'active'),
('账户2', '665510100015', '期货公司名称', '资金账号2', 'active'),
('账户3-Jin', '30307210', '期货公司名称', '资金账号3', 'active')
ON CONFLICT (polar_account_id) DO NOTHING;

-- ============================================
-- 2. 插入常用合约映射(示例)
-- ============================================
-- 请根据实际交易的品种添加映射

-- PTA合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month, expiry_date,
    multiplier, price_tick, margin_ratio
) VALUES
('TA', 'PTA', 'ZCE',
 'ZCE|F|TA|2505', 'CZCE.TA2505',
 TRUE, '2505', '2025-05-15',
 5, 2.0, 0.09),  -- 5吨/手, 2元最小变动, 9%保证金

('TA', 'PTA', 'ZCE',
 'ZCE|F|TA|2509', 'CZCE.TA2509',
 FALSE, '2509', '2025-09-15',
 5, 2.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- PVC合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('V', 'PVC', 'DCE',
 'DCE|Z|V|2505', 'DCE.v2505',
 TRUE, '2505',
 5, 5.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- 螺纹钢合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('RB', '螺纹钢', 'SHFE',
 'SHFE|F|RB|2505', 'SHFE.rb2505',
 TRUE, '2505',
 10, 1.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- 甲醇合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('MA', '甲醇', 'ZCE',
 'ZCE|Z|MA|2505', 'CZCE.MA2505',
 TRUE, '2505',
 50, 1.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- 豆粕合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('M', '豆粕', 'DCE',
 'DCE|Z|M|2505', 'DCE.m2505',
 TRUE, '2505',
 10, 1.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- 玉米合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('C', '玉米', 'DCE',
 'DCE|Z|C|2505', 'DCE.c2505',
 TRUE, '2505',
 10, 1.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- 铁矿石合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('I', '铁矿石', 'DCE',
 'DCE|Z|I|2505', 'DCE.i2505',
 TRUE, '2505',
 100, 0.5, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- 玻璃合约
INSERT INTO contracts (
    variety_code, variety_name, exchange,
    polar_symbol, tqsdk_symbol,
    is_main, contract_month,
    multiplier, price_tick, margin_ratio
) VALUES
('FG', '玻璃', 'ZCE',
 'ZCE|Z|FG|2505', 'CZCE.FG2505',
 TRUE, '2505',
 20, 1.0, 0.09)
ON CONFLICT (polar_symbol) DO NOTHING;

-- ============================================
-- 3. 插入锁仓配置(默认配置)
-- ============================================
-- 为每个账户和品种创建默认锁仓配置
-- 这里以PTA为例,请根据实际需要添加其他品种

DO $$
DECLARE
    acc_id UUID;
BEGIN
    -- 为每个账户的PTA合约创建锁仓配置
    FOR acc_id IN SELECT id FROM accounts LOOP
        -- 多头锁仓配置
        INSERT INTO lock_configs (
            account_id, symbol, direction,
            profit_lock_enabled, profit_lock_threshold, profit_lock_ratio,
            breakeven_lock_enabled, breakeven_lock_threshold, breakeven_lock_ratio
        ) VALUES
        (acc_id, 'ZCE|F|TA|2505', 'long',
         TRUE, 10000, 0.80,
         TRUE, 5000, 0.80)
        ON CONFLICT (account_id, symbol, direction) DO NOTHING;

        -- 空头锁仓配置
        INSERT INTO lock_configs (
            account_id, symbol, direction,
            profit_lock_enabled, profit_lock_threshold, profit_lock_ratio,
            breakeven_lock_enabled, breakeven_lock_threshold, breakeven_lock_ratio
        ) VALUES
        (acc_id, 'ZCE|F|TA|2505', 'short',
         TRUE, 10000, 0.80,
         TRUE, 5000, 0.80)
        ON CONFLICT (account_id, symbol, direction) DO NOTHING;
    END LOOP;
END $$;

-- ============================================
-- 4. 手动录入初始持仓(重要!)
-- ============================================
-- ⚠️ 请根据极星平台的实际持仓修改以下数据

-- 示例:主账户的PTA持仓
-- 假设: 多仓2手@5500, 空仓1手@5600
/*
INSERT INTO positions (
    account_id,
    symbol,
    long_position,
    long_avg_price,
    short_position,
    short_avg_price,
    last_price
) VALUES
(
    (SELECT id FROM accounts WHERE polar_account_id = '85178443'),
    'ZCE|F|TA|2505',
    2,      -- 多仓2手
    5500,   -- 均价5500
    1,      -- 空仓1手
    5600,   -- 均价5600
    5550    -- 当前价5550(需要后续天勤实时更新)
)
ON CONFLICT (account_id, symbol) DO NOTHING;
*/

-- ⚠️ 请为每个账户的每个有持仓的品种执行类似的INSERT语句

-- ============================================
-- 5. 插入历史换月锁仓数据(如果有)
-- ============================================
-- 根据v12.py中的lock_trade_info手动录入

-- 示例:PTA上月锁仓
/*
UPDATE positions
SET
    legacy_long_position = 2,        -- 上月锁定多仓2手
    legacy_long_profit = -810        -- 上月锁定盈亏-810元
WHERE
    account_id = (SELECT id FROM accounts WHERE polar_account_id = '85178443')
    AND symbol = 'ZCE|F|TA|2505';
*/

-- ============================================
-- 完成提示
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '初始数据种子文件执行完成!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '下一步操作:';
    RAISE NOTICE '1. 检查accounts表,确认3个账户已创建';
    RAISE NOTICE '2. 根据实际持仓,修改本文件第95行开始的持仓数据';
    RAISE NOTICE '3. 如有历史锁仓,修改第117行的legacy_*字段';
    RAISE NOTICE '4. 启动后端服务后,天勤会自动更新实时价格';
    RAISE NOTICE '========================================';
END $$;
