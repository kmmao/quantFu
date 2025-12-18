import talib
from datetime import datetime
import math
import os
import json
import re
import threading
import requests
import numpy as np
from scipy.stats import linregress

# 当前版本: v12.20250728
# 增加利润锁
# 使用对手价进行交易，保证成交
# 增加保本锁
# 有仓位的时候，是可以买卖的，以及每日通知
# 处理交易异常的情况
# 更新了平仓后的各锁状态
# 更新了bd平盈时的默认最小仓数
# 20250114 去掉多盈，增加了下单失败图形显示，改变过滤小波动的值从0.005变成0.0008，
# 增加对 one_sided_take_list , one_sided_loss_list 的量能判断,以及十字星判断，去掉了对bbi的判断，收盘价可以相等
# is_price_limit 添加价格限制，当前价格限制以profit_point个基准点为准
# 20250115 增加对当前行情状态的判断,如果当前是稳K,则需要进行处理
# 处理趋势时,反向平仓的前提利润判断
# 20250121 增加量能进场，不受趋势影响
# 优化了反转的判断
# 20250122 对下单增加判断上下影线
# 20250206
# 增加旧月份的锁值
# 更新界面的一些显示内容
# 增加对持仓率的的计算与显示,但还没有用到交易当中
# 20250210
# 优化显示
# 20250217
# 追加交易连接离线时的提示
# 关闭反转信息的通知
# 20250226
# 对正常3次推进量化进场增加持仓率正向判断
# 20250311
# 优化锁与平仓的逻辑
# 20250313
# 增加撤单的通知
# 优化显示内容
# 修正保本锁的逻辑
# 20250411
# 推送改为ntfy
# 20250513
# 增加交易状态的判断
# 20250702
# 之前在保本锁与利润锁的判断中，没有考虑到仓位数，导致锁定的金额不准确，当仓位数一变大时,就会很容易触发释放锁，现在进行修正
# 20250728
# 增加价格限制的判断
# 待解决的问题：
# 进场后是否要跟进持仓变化进行平仓处理？？
# 接下去要解决的是怎么样可以让止损的空间可以变得更小
# ---------------------------基础参数----------------------------------
# 是否回测,True: 回测, (当实盘的时候需要关闭掉回测) False
is_backtesting = False
# is capital_limit
is_capital_limit = True
# 价格限制
is_price_limit = True
# 是否过滤小波动
is_bvtd = True
# 是否追加过滤大周期值
is_bvt = False
# 是否过滤仓价差
is_postion = False
# 是否反向平损
is_reverse_offset = False
# 日成交量通知
is_day_vol_notice = True
# 回测天数
day_count = 30
# 是否买进, 当有成交量块出现后才可交易, 可以用于主力合约同时进行时的过渡切换；追加如果有仓位的话，也可以买卖
is_market = False
# 是否平仓, 当有成交量块出现后才可交易, 可以用于主力合约同时进行时的过渡切换；追加如果有仓位的话，也可以买卖
is_close_postion = False
# 是否买进多仓
is_market_buy = True
# 是否买进空仓
is_market_sell = True
# 是否平全多仓
is_close_all_postion_buy = True
# 是否平全空仓
is_close_all_postion_sell = True
# 是否平bd多仓
is_close_bd_postion_buy = True
# 是否平bd空仓
is_close_bd_postion_sell = True
# 是否平vol多仓
is_close_vol_postion_buy = True
# 是否平bol空仓
is_close_vol_postion_sell = True
# 是否趋势
is_trending = False
# 当趋势平后要下趋势单时,防止仓数不够的情况存在 (True默认为下单成功)
is_trending_order_result = True
# 趋势成交量倍数
trending_vol_coefficients = 4
# 执行对象, 默认为me  其他有 jin
trade_object = 'metwo'
# 是否追加执行放超大量的次数执行内容,趋势
is_trending_vol = True
# 趋势做多价位
trending_buy_price = 0
# 趋势做空价位
trending_sell_price = 0
# 放大量的次数
big_vol_count = 0
# 放量次数, 每次开盘的时候重置
vol_increases_count = 0
# 放量bar列
vol_increases_bar_list = []
# 下单次数
order_trade_count = 0
# 止盈次数
profit_count = 0
# 止损次数
stop_count = 0
vol_stop_count = 0
bvt_stop_count = 0
all_stop_count = 0
trending_stop_count = 0
trending_invert_stop_count = 0
trending_stop_vol_count = 0
trending_stop_bd_count = 0
# 交易状态, 默认是连续交易
trade_state = '3'
# 反转多数
buy_invert_count_display = 0
# 反转空数
sell_invert_count_display = 0
# 默认下单数, 如果保证金单手小于 margin_unit,则变为2手
default_order_num = 1
# 单手保证金的比例
margin_unit = 5000
# 高阶时间周期值
high_period_min = 240
# 一天的交易次数
order_count_day = 0
# 初始化资金
init_capital = 250000
# 资金单品种最大使用率,默认10%
capital_max_ratio = 0.1
# 资金留底
capital_balance = 700000
# 开盘持仓量
start_postion = 0
# 开盘价
start_postion_price = 0
# 多仓保本价
buy_break_even_price = 0
# 空仓保本价
sell_break_even_price = 0
# 以往留月锁住的额度差(多头)
lock_buy_profitLoss = 0
# 以往留月锁住的额度差(空头)
lock_sell_profitLoss = 0
# 以往留月锁住的仓位数(多头)
lock_buy_postion = 0
# 以往留月锁住的仓位数(空头)
lock_sell_postion = 0
# bbi周期
periods = [4, 9, 14, 29]
# 默认为一天一分钟的360根K线
k_count = 300
# 交易的开始根数,一般与k_count一致,保证最新的交易开始K线;
trade_begin_k_count = 300
# 实际产生数据的bar值数
start_bar_count = 35
# 持仓斜率值
postion_gradient = 0
# bbi斜率值
bbi_gradient = 0
# 前bbi斜率值
pre_bbi_gradient = 0
# bbi关键值
bbi_gradient_point = 3
# bd_bbi关键值
bbi_gradient_bd_point = 2
# 当前bbi值
bbi_value = 0
# 当前高阶bbi值
bbi_value_two = 0
# 全平盈数量
all_profit_count = 0
# bd平盈数量
bd_profit_count = 0
# lock数量
lock_profit_count = 0
# 成交量平盈数量
vol_profit_count = 0
# 趋势平盈数量
trending_profit_count = 0
trending_profit_vol_count = 0
trending_profit_bd_count = 0
# bvtd不成交数量
bvtd_no_trade_count = 0
# bvt不成交数量
bvt_no_trade_count = 0
# 仓价差不做空
postion_no_trade_count = 0
# 做多锁利润, 默认不加锁
is_lock_profit_buy = False
lock_profit_price_buy = 0
# 做多锁保本, 默认不保本
is_protect_buy = False
# 做空锁利润, 默认不加锁
is_lock_profit_sell = False
lock_profit_price_sell = 0
is_protect_sell = False
# 锁定比例
lock_ratio = 0.8
# 锁定保本比例
lock_ratio_protect = 0.8
# 做多列
buy_list = []
# 做空列
sell_list = []
# 大量vol_bar列
big_vol_bar_list = []
# 做多止盈all_bar列
all_stop_profit_buy_bar_list = []
# 做空止盈all_bar列
all_stop_profit_sell_bar_list = []
# 做多止盈bd_bar列
bd_stop_profit_buy_bar_list = []
# 做空止盈bd_bar列
bd_stop_profit_sell_bar_list = []
# 做多止盈bar列
stop_profit_buy_bar_list = []
# 做空止盈bar列
stop_profit_sell_bar_list = []
# 反转bar列
invert_bar_list = []
# 反转次数
invert_count = 0
# 当前高阶bbi值差值
bbi_value_two_dif = 0
# 大周期的小波动比较值，原本0.005
bbi_value_two_dif_min_key_value = 0.0008
# 止盈金额
profit_amount = 10000
# 前bbi值
pre_bbi_value = 0
# Bar列
bar_list = []
# 下单Bar列
market_order_bar_list = []
# 开始交易时间
start_trade_time = [0.0901, 0.2101]
# 不交易时间段
no_trade_time = [0.0901, 0.2101, 0.23, 0.15]
# -----------------------------基础参数--------------------------------
# 单边列表
one_sided_take_list = []
one_sided_loss_list = []
# tick列表
tick_list = []
# 回测时初始化
is_backtest_init = True
# 反转启动指标, False不可动
is_invert = False
# ----------------------------订单相关参数------------------------------
# 默认止盈25基点
profit_point = 25
# 基准价
profit_price = 0
# 保证金比例,帐号在原有的交易所基础上加2%,默认9%
margin_ratio = 0.09
# 开仓订单ID
enter_order_id = -1
# 平仓订单ID
exit_order_id = -1
# 开仓返回值
ret_enter = -1
# 平仓返回值
ret_exit = -1
# --------------------------动态成交量参数-------------------------------
# 动态成交量变量系数(按1分钟一天的情况来说,100的变量系数相当于3.6倍的成交量放量-360根K线) - 很关键的变量系数
vol_variable_coefficients = 100
# 动态成交量
vol_coefficients = 10000
# --------------------------合约信息参数---------------------------------
# DCE: 大商所  SHFE: 上期所 ZCE: 郑商所
trade_contractNo = "ZCE|F|TA|409"
main_contractNo = "ZCE|Z|TA|INDEX"
# 玻璃、纯碱、螺纹、豆粕、PTA、PVC、甲醇、热卷、乙二醇
lock_trade_info = [
    {
        "contact_name": "PTA",
        "contact_no": "ZCE|F|TA",
        "lock_postion": 5,
        "direction": "buy",
        "lock_profitLoss": -3200,
        "is_protect_buy": False,
    },
    {
        "contact_name": "PTA",
        "contact_no": "ZCE|F|TA",
        "lock_postion": 5,
        "direction": "sell",
        "lock_profitLoss": -4000,
        "is_protect_sell": False,
    },
    {
        "contact_name": "PVC",
        "contact_no": "DCE|F|V",
        "lock_postion": 30,
        "direction": "buy",
        "lock_profitLoss": -36125,
        "is_protect_buy": False,
    },
    {
        "contact_name": "PVC",
        "contact_no": "DCE|F|V",
        "lock_postion": 5,
        "direction": "sell",
        "lock_profitLoss": -525,
        "is_protect_sell": False,
    },
    {
        "contact_name": "乙二醇",
        "contact_no": "DCE|F|EG",
        "lock_postion": 0,
        "direction": "buy",
        "lock_profitLoss": 0,
        "is_protect_buy": False,
    },
    {
        "contact_name": "乙二醇",
        "contact_no": "DCE|F|EG",
        "lock_postion": 0,
        "direction": "sell",
        "lock_profitLoss": 0,
        "is_protect_sell": False,
    },
    {
        "contact_name": "热卷",
        "contact_no": "SHFE|F|HC",
        "lock_postion": 10,
        "direction": "buy",
        "lock_profitLoss": -3150,
        "is_protect_buy": False,
    },
    {
        "contact_name": "热卷",
        "contact_no": "SHFE|F|HC",
        "lock_postion": 0,
        "direction": "sell",
        "lock_profitLoss": 0,
        "is_protect_sell": False,
    },
    {
        "contact_name": "甲醇",
        "contact_no": "ZCE|F|MA",
        "lock_postion": 20,
        "direction": "buy",
        "lock_profitLoss": -16000,
        "is_protect_buy": False,
    },
    {
        "contact_name": "甲醇",
        "contact_no": "ZCE|F|MA",
        "lock_postion": 0,
        "direction": "sell",
        "lock_profitLoss": 0,
        "is_protect_sell": False,
    },
    {
        "contact_name": "纯碱",
        "contact_no": "ZCE|F|SA",
        "lock_postion": 10,
        "direction": "buy",
        "lock_profitLoss": -3500,
        "is_protect_buy": False,
    },
    {
        "contact_name": "纯碱",
        "contact_no": "ZCE|F|SA",
        "lock_postion": 5,
        "direction": "sell",
        "lock_profitLoss": -2600,
        "is_protect_sell": False,
    },
    {
        "contact_name": "螺纹",
        "contact_no": "SHFE|F|RB",
        "lock_postion": 5,
        "direction": "buy",
        "lock_profitLoss": -35000,
        "is_protect_buy": False,
    },
    {
        "contact_name": "螺纹",
        "contact_no": "SHFE|F|RB",
        "lock_postion": 5,
        "direction": "sell",
        "lock_profitLoss": -2600,
        "is_protect_sell": False,
    },
    {
        "contact_name": "豆粕",
        "contact_no": "DCE|F|M",
        "lock_postion": 5,
        "direction": "buy",
        "lock_profitLoss": 350,
        "is_protect_buy": False,
    },
    {
        "contact_name": "豆粕",
        "contact_no": "DCE|F|M",
        "lock_postion": 10,
        "direction": "sell",
        "lock_profitLoss": -11500,
        "is_protect_sell": False,
    }
]

# 策略开始运行时执行该函数一次
def initialize(context):
    global trade_begin_k_count, k_count, main_contractNo, trade_contractNo, day_count, capital_max_ratio
    global lock_buy_profitLoss, lock_buy_postion
    global lock_sell_profitLoss, lock_sell_postion
    global is_protect_sell, is_protect_buy

    if not is_backtesting:
        day_count = 3

    # 360为一天一分钟的K线数,默认回测近2天的数据
    # 实盘的话,trade_begin_k_count与k_count的值相等 
    k_count = 360 * day_count + 120 + start_bar_count
    if is_backtesting:
        trade_begin_k_count = start_bar_count
    else:
        trade_begin_k_count = k_count
        # 当前我的帐号
        if trade_object == 'me':
            SetUserNo('85178443')
        elif trade_object == 'metwo':
            SetUserNo('665510100015')
        elif trade_object == 'jin':
            SetUserNo('30307210')
            # 最大值
            # capital_max_ratio = 1
        elif trade_object == 'test':
            SetUserNo('Q181367458')

    # 订阅夜盘120根,早盘240根如果在这里进行配置的话,就会过滤掉界面上面的配置,以这里的为主
    # 当界面上面配置了合约,那就以界面配置的合约来进行流程,否则以代码合约为主
    # k_count 默认为300,以是实盘的默认值
    trade_contractNo = context.contractNo()
    # 得到 DCE|F|V
    contact_no_str = trade_contractNo.rsplit('|', 1)[0]
    # 得到需要处理的锁的内容
    # 使用列表解析分别获取 direction 为 buy 和 sell 的对象
    buy_result = [item for item in lock_trade_info if item["contact_no"] == contact_no_str and item["direction"] == "buy"]
    sell_result = [item for item in lock_trade_info if item["contact_no"] == contact_no_str and item["direction"] == "sell"]

    if buy_result and is_backtesting is False:
        lock_buy_postion = buy_result[0]['lock_postion']
        lock_buy_profitLoss = buy_result[0]['lock_profitLoss']
        is_protect_buy = buy_result[0]['is_protect_buy']

    if sell_result and is_backtesting is False:
        lock_sell_postion = sell_result[0]['lock_postion']
        lock_sell_profitLoss = sell_result[0]['lock_profitLoss']
        is_protect_sell = sell_result[0]['is_protect_sell']

    main_contractNo = re.sub(r'\|F\||\d+', lambda x: '|Z|' if x.group() == '|F|' else 'MAIN', trade_contractNo)
    # 下单合约(主力合约)
    SetBarInterval(trade_contractNo, Enum_Period_Min(), 1, k_count)
    # 高阶周期分钟(主力合约)
    SetBarInterval(trade_contractNo, Enum_Period_Min(), high_period_min, k_count)
    # 日数据(MAIN)
    SetBarInterval(main_contractNo, Enum_Period_Day(), 1, k_count)

    # 配置成界面配置
    # 设置触发方式
    SetTriggerType(1)  # 即时行情触发(1s6次)
    SetTriggerType(2)  # 交易数据触发
    SetTriggerType(3, 1000 * 60 * 10)   # 10分钟执行一次
    SetTriggerType(4, ['090002', '210002'])  # 指定时刻触发
    SetTriggerType(5)  # K线触发
    SetTriggerType(6)  # 连接状态触发
    SetTriggerType(8)   # 设置主力合约换月触发
    # 设置发单方式 仅对当SetTriggerType 为5（K线触发）时才有意义
    SetOrderWay(2)  # K线稳定后发单(K线结束时执行一次),可以用来做一些当K线稳定后的触发信息,触发的数据为当前K的结束参数数据
    # 资金由界面配置
    # 手续费由界面配置
    SetInitCapital(init_capital)
    SetAFunUseForHis()  # 设置账户函数可以在历史阶段使用
    SetTradeDirection(0) # 双向交易
    SetActual()  # 设置实盘运行

# 策略触发事件每次触发时都会执行该函数
def handle_data(context):
    if order_count_day >= 1000:
        # 当一天的交易次数大于1000次时,停止交易
        return
    # -----------------------------------数据初始化,第一层---------------------------------
    if data_init(context):
        return
    # -----------------------------------指标计算,第二层-----------------------------------
    bbi_handle(context)
    # -----------------------------------图形显示,第三层-----------------------------------
    # 初始化bar柱
    plot_vol_bar(0)
    # 反转配置初始化
    invert_the_message()
    # 在副图标记参数
    values_show()
    # ----------------------激活的数据处理(无数的算法内容所在地),第四层------------------------
    trigger_data_handle(context)
    # ----------------------止盈优先,有可能开盘的时候就直接成交,第五层-------------------------
    if trade_state == '3':
        stop_profit_handle(context)
    

# 反转配置初始化
def invert_the_message():
    global invert_bar_list, is_invert

    if abs(bbi_gradient) > bbi_gradient_point and CurrentBar() not in invert_bar_list and CurrentBar() > trade_begin_k_count:
        invert_bar_list.append(CurrentBar())
        # 在这里启用反转信息,在四层处理false
        # 为了确认在一次的反转中只会处理一次
        if abs(pre_bbi_gradient) < bbi_gradient_point and is_invert is False:
            is_invert = True
        PlotVertLine(RGB_Red(),main=True, axis = True)
        # 是否要在反转信息出现的时候,看反向利润情况,并出一部分???
        # 一直在多次提示反转的时候,如果价格并没有很大限度的单边运行,则出部分利润,当前观察
        send_msg_thread("反转信息",f"bbi_gradient:{bbi_gradient}",is_all_notice=False)

# 止盈操作
def stop_profit_handle(context):
    global bd_stop_profit_buy_bar_list, bd_stop_profit_sell_bar_list
    global all_stop_profit_buy_bar_list, all_stop_profit_sell_bar_list
    global stop_profit_buy_bar_list, stop_profit_sell_bar_list
    global is_close_all_postion_buy, is_close_all_postion_sell
    global is_close_bd_postion_buy, is_close_bd_postion_sell
    global is_close_vol_postion_buy, is_close_vol_postion_sell
    global buy_break_even_price, sell_break_even_price
    global is_lock_profit_buy, is_lock_profit_sell
    global lock_profit_price_buy, lock_profit_price_sell
    global is_protect_buy, is_protect_sell
    global lock_buy_profitLoss, lock_sell_profitLoss
    global lock_buy_postion, lock_sell_postion

    # 处理当前的盈值
    current_buy_profitLoss = A_BuyProfitLoss() + lock_buy_profitLoss
    current_sell_profitLoss = A_SellProfitLoss() + lock_sell_profitLoss
    # -------------------------- 保利润锁 -----------------------------------
    # 这里要加上这些状态，不然其他的状态就会进来进行判断，导致交易异常
    if context.triggerType() == 'K' or context.triggerType() == 'H' or context.triggerType() == 'S':
        # -------------------------- 利润锁 -----------------------------------
        if A_BuyPositionCanCover() == 0:
            is_lock_profit_buy = False
            is_protect_buy = False
            lock_profit_price_buy = 0

        if A_SellPositionCanCover() == 0:
            is_lock_profit_sell = False
            is_protect_sell = False
            lock_profit_price_sell = 0

        # 判断是否启用利润锁
        if is_lock_profit_buy and A_BuyPositionCanCover() > 0 and current_buy_profitLoss > 0 and current_buy_profitLoss <= lock_profit_price_buy * lock_ratio:
            is_lock_profit_buy = False
            close_postion(context,f"做多利润锁释放",Enum_Sell(),A_BuyPositionCanCover(),'lock_profit')
        if A_BuyPositionCanCover() > 0 and current_buy_profitLoss >= profit_price * A_BuyPositionCanCover() and is_lock_profit_buy is False:
            # 当做多时，并且做多利润大于目标利润，发动锁
            is_lock_profit_buy = True
            lock_profit_price_buy = profit_price * A_BuyPositionCanCover()
            # 同步开启保本锁
            is_protect_buy = True
            PlotText(Low()[-1], f"启动多利润锁", color=RGB_Purple(), main=True)
            send_msg_thread("启动多利润锁",f"锁定额:{round(lock_profit_price_buy * lock_ratio,2)}")
        if A_BuyPositionCanCover() > 0 and is_lock_profit_buy and current_buy_profitLoss >= lock_profit_price_buy + profit_price * A_BuyPositionCanCover():
            lock_profit_price_buy = lock_profit_price_buy + profit_price * A_BuyPositionCanCover()
            PlotText(Low()[-1], f"更新做多锁额", color=RGB_Purple(), main=True)
            send_msg_thread("更新做多锁额",f"最新锁定额:{round(lock_profit_price_buy * lock_ratio,2)}")
        
        
        if is_lock_profit_sell and A_SellPositionCanCover() > 0 and current_sell_profitLoss > 0 and current_sell_profitLoss <= lock_profit_price_sell * lock_ratio:
            is_lock_profit_sell = False
            close_postion(context,f"做空利润锁释放",Enum_Buy(),A_SellPositionCanCover(),'lock_profit')
        if A_SellPositionCanCover() > 0 and current_sell_profitLoss >= profit_price * A_SellPositionCanCover() and is_lock_profit_sell is False:
            is_lock_profit_sell = True
            lock_profit_price_sell = profit_price * A_SellPositionCanCover()
            # 同步开启保本锁
            is_protect_sell = True
            PlotText(Low()[-1], f"启动空利润锁", color=RGB_Purple(), main=True)
            send_msg_thread("启动空利润锁",f"锁定额:{round(lock_profit_price_sell * lock_ratio,2)}")
        if A_SellPositionCanCover() > 0 and is_lock_profit_sell and current_sell_profitLoss >= lock_profit_price_sell + profit_price * A_SellPositionCanCover():
            lock_profit_price_sell = lock_profit_price_sell + profit_price * A_SellPositionCanCover()
            PlotText(Low()[-1], f"更新做空锁额", color=RGB_Purple(), main=True)
            send_msg_thread("更新做空锁额",f"最新锁定额:{round(lock_profit_price_sell * lock_ratio,2)}")
        

        # 当趋势的时候不进行更小的保本锁区间
        if not is_trending:
            # -------------------------- 保本锁 -----------------------------------
            # 保存是在大于0利润的前提下平仓,保锁的定义改成
            if is_protect_buy and A_BuyPositionCanCover() > 0 and current_buy_profitLoss > 0 and current_buy_profitLoss <= profit_price * A_BuyPositionCanCover() * 0.5 * lock_ratio_protect:
                is_protect_buy = False
                close_postion(context,f"做多保本锁释放",Enum_Sell(),A_BuyPositionCanCover(),'lock_profit')
            # 有一种假设是bbi判断与probbi的值，如果转向就进行判断，而且锁定定额要以当前的利润为基准，观察
            if A_BuyPositionCanCover() > 0 and current_buy_profitLoss >= profit_price * A_BuyPositionCanCover() * 0.5 and is_protect_buy is False and bbi_gradient < 0:
                # 当做多时，bbi小于0并且做多亏损大于目标利润，发动锁
                is_protect_buy = True
                PlotText(Low()[-1], f"启动多保本锁", color=RGB_Purple(), main=True)
                send_msg_thread("启动多保本锁",f"{is_protect_buy}")
            
            if is_protect_sell and A_SellPositionCanCover() > 0 and current_sell_profitLoss > 0 and current_sell_profitLoss <= profit_price * A_SellPositionCanCover() * 0.5 * lock_ratio_protect:
                is_protect_sell = False
                close_postion(context,f"做空保本锁释放",Enum_Buy(),A_SellPositionCanCover(),'lock_profit')
            if A_SellPositionCanCover() > 0 and current_sell_profitLoss >= profit_price * A_SellPositionCanCover() * 0.5 and is_protect_sell is False and bbi_gradient > 0:
                is_protect_sell = True
                PlotText(Low()[-1], f"启动空保本锁", color=RGB_Purple(), main=True)
                send_msg_thread("启动空保本锁",f"{is_protect_sell}")
        

    # 超高bbi值的时候,进行止盈
    # 12的来源是关键值的4倍,并在趋势中时
    if abs(bbi_gradient) >= 12 and is_trending:
        if A_BuyPositionCanCover() > 0 and current_buy_profitLoss > 0 and bbi_gradient > 0 and CurrentBar() not in bd_stop_profit_buy_bar_list:
            # 在这里对锁定数据进行区分并平出
            send_msg_thread("趋势多平盈",f"前记录,bbi_gradient:{bbi_gradient},平仓数:{math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion}",is_all_notice=False)
            bd_stop_profit_buy_bar_list.append(CurrentBar())
            close_postion(context,f"趋势多平盈",Enum_Sell(),math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion,'bd_profit')

        if A_SellPositionCanCover() > 0 and current_sell_profitLoss > 0 and bbi_gradient < 0 and CurrentBar() not in bd_stop_profit_sell_bar_list:
            send_msg_thread("趋势空平盈",f"前记录,bbi_gradient:{bbi_gradient},平仓数:{math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion}",is_all_notice=False)
            bd_stop_profit_sell_bar_list.append(CurrentBar())
            close_postion(context,f"趋势空平盈",Enum_Buy(),math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion,'bd_profit')


    # 这里增加平仓方式,bbi_gradient 大于2的时候,无条件进行平仓(当前配置大于1是与默认数值一致)
    if abs(bbi_gradient) >= bbi_gradient_bd_point and Vol()[-1] > vol_coefficients:
        if A_BuyPositionCanCover() > 1 and current_buy_profitLoss > 0 and bbi_gradient > 0 and CurrentBar() not in bd_stop_profit_buy_bar_list:
            if is_close_bd_postion_buy:
                send_msg_thread("bd多平盈",f"前记录,bbi_gradient:{bbi_gradient},平仓数:{math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion}",is_all_notice=False)
                bd_stop_profit_buy_bar_list.append(CurrentBar())
                if math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion > 0:
                    close_postion(context,f"bd多平盈",Enum_Sell(),math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion,'bd_profit')
            else:
                # 就算是趋势的话，也需要反向的值是正值才进行平仓操作
                if is_trending_vol and trending_buy_price != 0 and math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion > 0 and current_sell_profitLoss > 0:
                    send_msg_thread("做多趋势",f"趋势bd空平损,平仓数:{math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion}",is_all_notice=False)
                    bd_stop_profit_buy_bar_list.append(CurrentBar())
                    if math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion > 0:
                        close_postion(context,f"tbd空平损",Enum_Buy(),math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion,'trending_bd_stop')
                else:
                    bd_stop_profit_buy_bar_list.append(CurrentBar())
                    send_msg_thread("bd多平x",f"bd多平x",is_all_notice=False)

        if A_SellPositionCanCover() > 1 and current_sell_profitLoss > 0 and bbi_gradient < 0 and CurrentBar() not in bd_stop_profit_sell_bar_list:
            if is_close_bd_postion_sell:
                send_msg_thread("bd空平盈",f"前记录,bbi_gradient:{bbi_gradient},平仓数:{math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion}",is_all_notice=False)
                bd_stop_profit_sell_bar_list.append(CurrentBar())
                if math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion > 0:
                    close_postion(context,f"bd空平盈",Enum_Buy(),math.ceil((A_SellPositionCanCover() - lock_sell_postion) / 2) + lock_sell_postion,'bd_profit')
            else:
                if is_trending_vol and trending_sell_price != 0 and math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion > 0 and current_buy_profitLoss > 0:
                    send_msg_thread("做空趋势",f"趋势bd多平损,平仓数:{math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion}",is_all_notice=False)
                    bd_stop_profit_sell_bar_list.append(CurrentBar())
                    if math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion > 0:
                        close_postion(context,f"tbd多平损",Enum_Sell(),math.ceil((A_BuyPositionCanCover() - lock_buy_postion) / 2) + lock_buy_postion,'trending_bd_stop')
                else:
                    bd_stop_profit_sell_bar_list.append(CurrentBar())
                    send_msg_thread("bd空平x",f"bd空平x",is_all_notice=False)

# 平仓前判断平仓数量
def get_order_num(market_order_type):
    # Enum_Buy进来其实拿是空仓的仓数
    if market_order_type == Enum_Buy():
        return default_order_num if A_SellPositionCanCover() - lock_sell_postion >= default_order_num else A_SellPositionCanCover() - lock_sell_postion
    elif market_order_type == Enum_Sell():
        return default_order_num if A_BuyPositionCanCover() - lock_buy_postion >= default_order_num else A_BuyPositionCanCover() - lock_buy_postion
    else:
        return default_order_num
        

# 统一下单
def market_order(context,content, market_order_type,order_num = 0):
    global ret_enter, enter_order_id, market_order_bar_list, order_count_day, buy_list, sell_list, order_trade_count

    if order_num == 0:
        order_num = default_order_num

    # 20250122 对下单增加判断上下影线
    if market_order_type == Enum_Sell():
        if (Open()[-1] - Close()[-1]) * 3 < Close()[-1] - Low()[-1] and Open()[-1] != Close()[-1]:
            PlotText(Low()[-1], f"下影线不进场", color=RGB_Purple(), main=True)
            market_order_bar_list.append(CurrentBar())
            return False
    elif market_order_type == Enum_Buy():
        if (Close()[-1] - Open()[-1]) * 3 < High()[-1] - Close()[-1] and Open()[-1] != Close()[-1]:
            PlotText(Low()[-1], f"上影线不进场", color=RGB_Purple(), main=True)
            market_order_bar_list.append(CurrentBar())
            return False

    if CurrentBar() in market_order_bar_list:
        send_msg_thread("本次Bar柱已下单",f"{content},过滤所有可下单交易",is_all_notice=False)
    if CurrentBar() not in market_order_bar_list and CurrentBar() > trade_begin_k_count and is_market:
        market_order_bar_list.append(CurrentBar())
        # 得到保证金
        margin_value = round(Close()[-1] * ContractUnit() * margin_ratio * order_num, 2)

        # 当前进场价格判断，不限制是否趋势场景，当前价格限制以profit_point个基准点为准
        if is_price_limit:
            if market_order_type == Enum_Buy() and A_BuyPositionCanCover() > 0:
                if round(Close()[-1],2) > round(A_BuyAvgPrice(),2) - profit_point * PriceTick() * A_BuyPositionCanCover():
                    # PriceTick 最小变动量 
                    PlotText(Low()[-1], f"多价格限制", color=RGB_Purple(), main=True)
                    send_msg_thread("多价格限制",f"{content},当前价格:{round(Close()[-1],2)},限制价格:{round(A_BuyAvgPrice(),2) - profit_point * PriceTick() * A_BuyPositionCanCover()}")
                    return False
            elif market_order_type == Enum_Sell() and A_SellPositionCanCover() > 0:
                if round(Close()[-1],2) < round(A_SellAvgPrice(),2) + profit_point * PriceTick() * A_SellPositionCanCover():
                    PlotText(Low()[-1], f"空价格限制", color=RGB_Purple(), main=True)
                    send_msg_thread("空价格限制",f"{content},当前价格:{round(Close()[-1],2)},限制价格:{round(A_SellAvgPrice(),2) + profit_point * PriceTick() * A_SellPositionCanCover()}")
                    return False

        # 判断是否超过最大资金使用率
        # 得到当前的保证金
        # --------------------------------add 20240928----------------------------------------------------
        if not is_trending and is_capital_limit:
            if market_order_type == Enum_Buy():
                if round((A_Assets() - capital_balance) * capital_max_ratio, 2) < round(margin_value + Close()[-1] * ContractUnit() * margin_ratio * A_BuyPosition(), 2):
                    # send_msg_thread("无法做多,已达最大资金使用率",f"可用资金:{round((A_Assets() - capital_balance) * capital_max_ratio, 2)},当前已用资金:{round(margin_value + Close()[-1] * ContractUnit() * margin_ratio * A_BuyPosition(), 2)}")
                    send_msg_thread("无法做多",f"{content},已达最大资金使用率")
                    PlotText(Low()[-1], f"已达多使用率", color=RGB_Purple(), main=True)
                    return False
            elif market_order_type == Enum_Sell():
                if round((A_Assets() - capital_balance) * capital_max_ratio, 2) < round(margin_value + Close()[-1] * ContractUnit() * margin_ratio * A_SellPosition(), 2):
                    # send_msg_thread("无法做空,已达最大资金使用率",f"可用资金:{round((A_Assets() - capital_balance) * capital_max_ratio, 2)},当前已用资金:{round(margin_value + Close()[-1] * ContractUnit() * margin_ratio * A_SellPosition(), 2)}")
                    send_msg_thread("无法做空",f"{content},已达最大资金使用率")
                    PlotText(Low()[-1], f"已达空使用率", color=RGB_Purple(), main=True)
                    return False

        if is_backtesting:
            available = Available()
        else:
            available = A_Available()
        if margin_value < available:
            # 这里下单用的都是正整数
            ret_enter, enter_order_id = A_SendOrder(market_order_type, Enum_Entry(), order_num, round(Close()[-1],0))
            if ret_enter == 0 or ret_enter == -2:
                order_trade_count += order_num
                PlotText(Low()[-1], f"{content}", color=RGB_Purple(), main=True)
                send_msg_thread(f"{content}",f"单号:{enter_order_id}")
            else:
                send_msg_thread(f"{content}error",f"单号:{enter_order_id}")
            order_count_day += 1
        else:
            PlotText(Low()[-1], f"{content}error", color=RGB_Brown(), main=True)
            # 如果保金不够的话,就改变状态,不再下单
            send_msg_thread(f"{content}error",f"需保金:{margin_value}")


# 统一平仓
def close_postion(context,content,market_order_type,order_num,loss_profit_type):
    global ret_exit, exit_order_id, order_count_day, buy_list, sell_list, is_trending_order_result
    global profit_count, all_profit_count, bd_profit_count, lock_profit_count, vol_profit_count, trending_profit_count, trending_profit_vol_count, trending_profit_bd_count
    global stop_count, vol_stop_count, bvt_stop_count, all_stop_count, trending_stop_count, trending_stop_vol_count, trending_stop_bd_count, trending_invert_stop_count

    if CurrentBar() > trade_begin_k_count and is_close_postion:
        if market_order_type == Enum_Buy():
            # 平空仓,排队价需要用 Q_BidPrice(),今空仓要用 A_TodaySellPosition()
            if context.triggerType() == "H":
                # 对手价
                order_price = round(Close()[-1] + 2 * PriceTick(),0)
            else:
                # Q_AskPrice() 对手价
                order_price = Q_AskPrice()
                # order_price = Q_BidPrice()
                # if Time() in start_trade_time:
                #     # 在这里处理开盘时候的没卖出情况,所以这里用 发日涨停价,会立马成交
                #     order_price = Q_AskPrice()
            yesterday_position = A_SellPositionCanCover() - A_TodaySellPosition()
        elif market_order_type == Enum_Sell():
            # 平多仓
            if context.triggerType() == "H":
                order_price = round(Close()[-1] - 2 * PriceTick(),0)
            else:
                # Q_BidPrice() 对手价
                order_price = Q_BidPrice()
                # order_price = Q_AskPrice()
                # if Time() in start_trade_time:
                #     # 在这里处理开盘时候的没平掉的情况, 用
                #     order_price = Q_BidPrice()
            yesterday_position = A_BuyPositionCanCover() - A_TodayBuyPosition()
        if "SHFE" in trade_contractNo:
            # 先平昨
            if order_num - yesterday_position > 0:
                if yesterday_position > 0:
                    ret_exit, exit_order_id = A_SendOrder(market_order_type, Enum_Exit(), yesterday_position, order_price) 
                ret_exit, exit_order_id = A_SendOrder(market_order_type, Enum_ExitToday(), order_num - yesterday_position, order_price) 
            else:
                ret_exit, exit_order_id = A_SendOrder(market_order_type, Enum_Exit(), order_num, order_price)
        else:
            ret_exit, exit_order_id = A_SendOrder(market_order_type, Enum_Exit(), order_num, order_price)
        if ret_exit == 0 or ret_exit == -2:    
            if loss_profit_type in ['vol_profit','all_profit','bd_profit','trending_invert_profit','trending_vol_profit','trending_bd_profit']:
                profit_count += order_num
                if loss_profit_type == 'vol_profit':
                    vol_profit_count += order_num
                elif loss_profit_type == 'all_profit':
                    all_profit_count += order_num
                elif loss_profit_type == 'bd_profit':
                    bd_profit_count += order_num
                elif loss_profit_type == 'lock_profit':
                    lock_profit_count += order_num
                elif loss_profit_type == 'trending_invert_profit':
                    trending_profit_count += order_num
                elif loss_profit_type == 'trending_vol_profit':
                    trending_profit_vol_count += order_num
                elif loss_profit_type == 'trending_bd_profit':
                    trending_profit_bd_count += order_num
            elif loss_profit_type in ['vol_stop','trending_stop','bvt_stop','all_stop','trending_invert_stop','trending_vol_stop','trending_bd_stop']:
                stop_count += order_num
                if loss_profit_type == 'vol_stop':
                    vol_stop_count += order_num
                elif loss_profit_type == 'bvt_stop':
                    bvt_stop_count += order_num
                elif loss_profit_type == 'all_stop':
                    all_stop_count += order_num
                    # 当全平后,再进行趋势单下单
                    is_trending_order_result = False
                elif loss_profit_type == 'trending_stop':
                    trending_stop_count += order_num
                elif loss_profit_type == 'trending_invert_stop':
                    trending_invert_stop_count += order_num
                elif loss_profit_type == 'trending_vol_stop':
                    trending_stop_vol_count += order_num
                elif loss_profit_type == 'trending_bd_stop':
                    trending_stop_bd_count += order_num
            order_count_day += 1
            PlotText(Low()[-1], f"{content}", color=RGB_Purple(), main=True)
            # send_msg_thread(f"{content}",f"单号:{exit_order_id},平仓价:{order_price},数量:{order_num}")
            send_msg_thread(f"{content}",f"单号:{exit_order_id},平仓价:{order_price}")
        else:
            # send_msg_thread(f"{content}error", f"单号:{exit_order_id},平仓价:{order_price},数量:{order_num}")
            send_msg_thread(f"{content}error", f"单号:{exit_order_id},平仓价:{order_price}")


# 数据初始化
def data_init(context):
    global is_backtest_init

    if CurrentBar() <= 11:
        return True
    # 晚上9点与早上9点的时候就是新的一天开始,在这一时刻进行目标成交量的计算
    # 这里要注意的是处理的周期时间都是开盘的第一分钟,有些品种可能还有其他的开盘时间
    if (Time() in start_trade_time or is_backtest_init) and CurrentBar() not in bar_list:
        is_backtest_init = False
        initialize_values(context)  
    return False

# 初始化值
def initialize_values(context):
    global bar_list, order_count_day, default_order_num, profit_price
    global market_order_bar_list, start_postion, start_postion_price
    global bd_stop_profit_buy_bar_list, bd_stop_profit_sell_bar_list
    global all_stop_profit_buy_bar_list, all_stop_profit_sell_bar_list
    global stop_profit_buy_bar_list, stop_profit_sell_bar_list
    global big_vol_bar_list, vol_increases_count, vol_increases_bar_list
    global is_day_vol_notice
    global is_market, is_close_postion

    # 当有仓位的时候，都可以进行买卖
    if A_BuyPositionCanCover() > 0 or A_SellPositionCanCover() > 0:
        is_market = True
        is_close_postion = True

    is_day_vol_notice = True
    vol_increases_count = 0
    vol_increases_bar_list = []
    # 初始化大量成交bar列
    big_vol_bar_list = []
    # 初始化做多止盈bar列
    stop_profit_buy_bar_list = []
    # 初始化做空止盈bar列
    stop_profit_sell_bar_list = []
    # 初始化做多止盈bd_bar列
    bd_stop_profit_buy_bar_list = []
    # 初始化做空止盈bd_bar列
    bd_stop_profit_sell_bar_list = []
    all_stop_profit_buy_bar_list = []
    all_stop_profit_sell_bar_list = []
    # 初始化一天的交易次数为0
    order_count_day = 0
    # 初始化bar列
    bar_list = []
    # 初始化下单bar列
    market_order_bar_list = []
    # if Time() in [0.2101]:
    #     # 这里只是日开盘的时候,处理进否可进场
    #     is_market = False
    start_postion = OpenInt()[-1]
    start_postion_price = Close()[-1]
    getCalcParamSLongDepositRatio("初始化initialize_values,保证金获取")
    # if trade_object == 'me':
    #     # 处理判断默认下单手数
    #     margin_value = round(Close()[-1] * ContractUnit() * margin_ratio,2)
    #     if margin_value < margin_unit:
    #         # 当单手保证金小于margin_unit时,默认下单手数变为2
    #         default_order_num = 2
    if trade_object == 'metwo':
        # 五倍下单手数
        default_order_num = 5
    else:
        # 一倍下单手数
        default_order_num = 1
    # 初始化基准价,不应该去*default_order_num
    profit_price = profit_point * ContractUnit() * PriceTick()
    # 处理动态成交量
    calVariableCoefficients()
    bar_list.append(CurrentBar())
    # 只有当有仓位的时候，才进行通知
    if A_SellPositionCanCover() > 0 or A_BuyPositionCanCover() > 0:
        # 通知
        send_msg_thread("开盘汇总",f"交易日:{TradeDate()}",is_all_notice=False)

# 处理动态成交量
def calVariableCoefficients():
    global vol_coefficients

    HisDataList = HisData(Enum_Data_Vol(), Enum_Period_Day(), 1, main_contractNo, 11)
    if len(HisDataList):
        average_vol = sum(HisDataList[:-1]) / len(HisDataList[:-1])
        vol_coefficients = round(average_vol / vol_variable_coefficients, 2)
        if HisDataList[-2] > HisDataList[-3] * 2:
            LogInfo(f'趋势起始,HisDataList[-2]:{HisDataList[-2]},HisDataList[-3]:{HisDataList[-3]}')
            

def calc_open_interest_slope(window_size=5):
    # 斜率为正：持仓量上升，资金可能在流入市场。
	# 斜率为负：持仓量下降，资金可能在流出市场。
	# 斜率接近零：持仓量变化不大，市场可能处于震荡或等待状态。
    # 短周期（3-5）：适合短线交易分析持仓变化。
	# 长周期（10-20）：适合中长线趋势跟踪。
    # 获取持仓量序列（假设 OpenInt 已经在环境中可用）
    open_interest = OpenInt()
    
    if len(open_interest) < window_size:
        raise ValueError(f"数据不足，持仓量数据长度 {len(open_interest)} 小于滑动窗口 {window_size}")

    # 选取最近 window_size 个数据
    y = open_interest[-window_size:]
    x = np.arange(len(y))

    # 计算斜率
    slope, _, _, _, _ = linregress(x, y)
    
    return slope

# 在主图上面加上BBI, EMA为加权属性
def bbi_handle(context):
    global bbi_gradient, bbi_value, pre_bbi_value, bbi_value_two, bbi_value_two_dif, pre_bbi_gradient
    global postion_gradient

    # 计算不同周期的EMA
    ema_values = [talib.EMA(Close(), period) for period in periods]
    # 计算当前BBI值
    bbi_value = sum(ema[-1] for ema in ema_values) / len(ema_values)
    # 计算前一个BBI值
    pre_bbi_value = sum(ema[-2] for ema in ema_values) / len(ema_values)

    # 确保足够的数据点计算梯度
    if CurrentBar() >= 6:
        # 这里除5是去平均率利
        bbi_gradient = (bbi_value - sum(ema[-5] for ema in ema_values) / len(ema_values)) / 5
        pre_bbi_gradient = (pre_bbi_value - sum(ema[-6] for ema in ema_values) / len(ema_values)) / 5
        # 持仓平均率利
        postion_gradient = calc_open_interest_slope()

    # 获取指定周期的收盘价和开盘价数据
    highPeriodMinCloseList = HisData(Enum_Data_Close(), Enum_Period_Min(), high_period_min, trade_contractNo, high_period_min)
    if context.triggerType() == "H":
        # 这个是因为回测的时候不会抓取最新的值,所以需要补上才可以与真实场景一样
        highPeriodMinCloseList = np.append(highPeriodMinCloseList,Close()[-1])
    # 计算当前和第4个周期的 BBI 值
    ema_values_two = [talib.EMA(highPeriodMinCloseList, period) for period in periods]
    bbi_value_two = sum(ema[-1] for ema in ema_values_two) / len(ema_values_two)
    # ---------------处理bbi_value_two_dif值--------------------
    # 同时间下,所以不除5
    bbi_value_two_dif = (highPeriodMinCloseList[-1] - bbi_value_two) / bbi_value_two

# 计算 BBI 值
def calculate_bbi(data, periods, index):
    ema_values = [talib.EMA(data, period) for period in periods]
    return sum(ema[index] for ema in ema_values) / len(ema_values)

# 在副图上面的Vol达标值
def values_show():
    # 副图 vol
    PlotNumeric("动量", vol_coefficients, RGB_Blue(), main=False, chartname = 'vol')
    PlotNumeric("成交量数", vol_increases_count, RGB_Purple(), main=False, chartname = 'vol')
    PlotNumeric("pre低比值", pre_bbi_gradient, RGB_Purple(), main=False, axis=True, chartname = 'vol')
    PlotNumeric("低比值", bbi_gradient, RGB_Red(), main=False, axis=True, chartname = 'vol')
    PlotNumeric("高比值", bbi_value_two_dif, RGB_Brown(), main=False, axis=False, chartname = 'vol')
    PlotNumeric("低差值", Close()[-1] - bbi_value, RGB_Purple(), main=False, axis=False, chartname = 'vol')
    PlotNumeric("高差值", Close()[-1] - bbi_value_two, RGB_Red(), main=False, axis=False, chartname = 'vol')
    PlotNumeric("现价", Close()[-1], RGB_Purple(), main=False, chartname = 'vol')
    PlotNumeric("仓差", OpenInt()[-1] - start_postion, RGB_Purple(), main=False, chartname = 'vol')
    PlotNumeric("价差", Close()[-1] - start_postion_price, RGB_Red(), main=False, chartname = 'vol')
    PlotNumeric("持仓率", postion_gradient, RGB_Red(), main=False, chartname = 'vol')
    # 副图 account
    # if is_backtesting:
    #     # 这几个在回测的时候再显示
    PlotNumeric("多持盈亏", A_BuyProfitLoss(), RGB_Blue(), False, False, chartname = 'account')
    PlotNumeric("下级多盈", lock_profit_price_buy + profit_price * A_BuyPositionCanCover(), RGB_Blue(), False, False, chartname = 'account')
    PlotNumeric("多仓数", A_BuyPosition(), RGB_Blue(), False, False, chartname = 'account')
    PlotNumeric("空持盈亏", A_SellProfitLoss(), RGB_Brown(), False, False, chartname = 'account')
    PlotNumeric("下级空盈", lock_profit_price_sell + profit_price * A_SellPositionCanCover(), RGB_Brown(), False, False, chartname = 'account')
    PlotNumeric("空仓数", A_SellPosition(), RGB_Brown(), False, False, chartname = 'account')
    PlotNumeric("权益", A_Assets(), RGB_Purple(), False, True, chartname = 'account')
    PlotNumeric("平仓盈亏", A_CoverProfit(), RGB_Red(), False, False, chartname = 'account')
    PlotNumeric("浮动盈亏", A_ProfitLoss(), RGB_Brown(), False, False, chartname = 'account')
    PlotNumeric("手续费", A_Cost(), RGB_Blue(), False, False, chartname = 'account')
    # PlotNumeric("bvt不成数", bvt_no_trade_count, RGB_Red(), False, False, chartname = 'account')
    # PlotNumeric("bvtd不成数", bvtd_no_trade_count, RGB_Red(), False, False, chartname = 'account')
    # PlotNumeric("仓位不成数", postion_no_trade_count, RGB_Red(), False, False, chartname = 'account')
    # 副图 loss_profit
    # PlotNumeric("下单数", order_trade_count, RGB_Purple(), False, False, chartname = 'loss_profit')
    # PlotNumeric("总持盈亏", A_TotalProfitLoss(), RGB_Purple(), False, True, chartname = 'loss_profit')
    PlotNumeric("多锁利润", is_lock_profit_buy, RGB_Purple(), False, True, chartname = 'loss_profit')
    PlotNumeric("多锁值", lock_profit_price_buy * lock_ratio, RGB_Purple(), False, True, chartname = 'loss_profit')
    PlotNumeric("多保本", is_protect_buy, RGB_Purple(), False, True, chartname = 'loss_profit')
    PlotNumeric("多保本值", profit_price * A_BuyPositionCanCover() * 0.5 * lock_ratio_protect, RGB_Purple(), False, True, chartname = 'loss_profit')
    PlotNumeric("空锁利润", is_lock_profit_sell, RGB_Blue(), False, True, chartname = 'loss_profit')    
    PlotNumeric("空锁值", lock_profit_price_sell * lock_ratio, RGB_Blue(), False, True, chartname = 'loss_profit')
    PlotNumeric("空保本", is_protect_sell, RGB_Blue(), False, True, chartname = 'loss_profit')
    PlotNumeric("空保本值", profit_price * A_SellPositionCanCover() * 0.5 * lock_ratio_protect, RGB_Blue(), False, True, chartname = 'loss_profit')
    if lock_buy_postion > 0:
        PlotNumeric("锁多数", lock_buy_postion, RGB_Gray(), False, False, chartname = 'loss_profit')
        PlotNumeric("锁多额", lock_buy_profitLoss, RGB_Brown(), False, False, chartname = 'loss_profit')
    if lock_sell_postion > 0:
        PlotNumeric("锁空数", lock_sell_postion, RGB_Gray(), False, False, chartname = 'loss_profit')
        PlotNumeric("锁空额", lock_sell_profitLoss, RGB_Brown(), False, False, chartname = 'loss_profit')
    # PlotNumeric("多价", A_BuyAvgPrice(), RGB_Blue(), main=False, axis=False, chartname = 'loss_profit')
    # PlotNumeric("空价", A_SellAvgPrice(), RGB_Brown(), main=False, axis=False, chartname = 'loss_profit')
    # # 副图 statistics_profit
    # PlotNumeric("平盈数", profit_count, RGB_Purple(), False, False, chartname = 'statistics_profit')
    # PlotNumeric("全盈数", all_profit_count, RGB_Brown(), False, False, chartname = 'statistics_profit')
    # PlotNumeric("bd盈数", bd_profit_count, RGB_Brown(), False, False, chartname = 'statistics_profit')
    # PlotNumeric("vol盈数", vol_profit_count, RGB_Blue(), False, False, chartname = 'statistics_profit')
    # PlotNumeric("趋势盈数", trending_profit_count, RGB_Blue(), False, False, chartname = 'statistics_profit')
    # PlotNumeric("趋势vol盈数", trending_profit_vol_count, RGB_Blue(), False, False, chartname = 'statistics_profit')
    # PlotNumeric("趋势bd盈数", trending_profit_bd_count, RGB_Blue(), False, False, chartname = 'statistics_profit')
    # # 副图 statistics_stop
    # PlotNumeric("平损数", stop_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("vol损数", vol_stop_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("bvt损数", bvt_stop_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("all损数", all_stop_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("趋势损数", trending_stop_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("趋势反转损数", trending_invert_stop_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("趋势vol损数", trending_stop_vol_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # PlotNumeric("趋势bd损数", trending_stop_bd_count, RGB_Purple(), False, False, chartname = 'statistics_stop')
    # 主图
    PlotNumeric("低值", bbi_value, RGB_Purple())
    PlotNumeric("高值", bbi_value_two, RGB_Red())
    PlotNumeric("持量", OpenInt()[-1], RGB_Brown(), axis=True)
    PlotNumeric("反转", invert_count, RGB_Blue(), axis=True)
    PlotNumeric("反转多", buy_invert_count_display, RGB_Blue(), axis=True)
    PlotNumeric("反转空", sell_invert_count_display, RGB_Blue(), axis=True)
    PlotNumeric("趋势数", big_vol_count, RGB_Purple(), axis=True)
    PlotNumeric("趋势", is_trending, RGB_Purple(), axis=True)
    if trending_buy_price == 0 or trending_sell_price == 0:
        PlotNumeric("趋势值", 0, RGB_Purple(), axis=True)
    if trending_buy_price != 0:
        PlotNumeric("趋势值", max(trending_buy_price, bbi_value_two), RGB_Purple(), axis=True)
    elif trending_sell_price != 0:
        PlotNumeric("趋势值", min(trending_sell_price, bbi_value_two), RGB_Purple(), axis=True)
    PlotNumeric("可做多", is_market_buy, RGB_Purple(), axis=True)
    PlotNumeric("可做空", is_market_sell, RGB_Purple(), axis=True)
    PlotNumeric("可买", is_market, RGB_Purple(), axis=True)
    PlotNumeric("可卖", is_close_postion, RGB_Purple(), axis=True)
    if Time() in start_trade_time:
        PlotVertLine(RGB_Purple(),main=True, axis = True)

def data_one_sided_handle():
    global one_sided_take_list, one_sided_loss_list

    # ------------------ 这里把4改成了3 -------------------------
    # 单边上涨行情,近4根K线的最高值要大于bbi值
    if len(one_sided_take_list) >= 3:
        one_sided_take_list.pop(0)  # 移除最早的数据
    # 这里只判断当前收盘价大于bbi值,并且当前收盘价大于前收盘价
    one_sided_take_list.append(round(Close()[-1],0) >= round(Close()[-2],0) and Vol()[-1] > Vol()[-2] and round(Close()[-1],0) > round(Open()[-1],0))
    # 单边下跌行情,近4根K线的最小值要小于bbi值
    if len(one_sided_loss_list) >= 3:
        one_sided_loss_list.pop(0)  # 移除最早的数据
    one_sided_loss_list.append(round(Close()[-1],0) <= round(Close()[-2],0) and Vol()[-1] > Vol()[-2] and round(Close()[-1],0) < round(Open()[-1],0))

# --------逻辑判断-------important---------------------
def determine_type(context):
    global bvt_no_trade_count, bvtd_no_trade_count, postion_no_trade_count, is_invert, invert_count
    global buy_invert_count_display, sell_invert_count_display
    global is_market_buy, is_market_sell
    global is_close_all_postion_buy, is_close_all_postion_sell
    global is_close_bd_postion_buy, is_close_bd_postion_sell
    global is_close_vol_postion_buy, is_close_vol_postion_sell
    global lock_sell_profitLoss, lock_buy_profitLoss
    global lock_sell_postion, lock_sell_postion

    if abs(bbi_gradient) < bbi_gradient_point and is_invert:
        # 如果反转的幅度小于阈值,则不进行反转
        is_invert = False

    # 当bbi_gradient大于0,表示向上
    # Close()[-1] > Open()[-1] 收阳线
    # abs(pre_bbi_gradient) > abs(bbi_gradient) 绝对值都是现值小于前值
    # is_invert 启动中
    if abs(pre_bbi_gradient) < abs(bbi_gradient) and is_invert and Vol()[-2] > vol_coefficients:
        # 重新定义，一定是当前的bbi大于前bbi，然后前量能大于现量能
        if is_trending:
            # 当在趋势的场景下,需要直接让反转不可用
            is_invert = False
        elif bbi_gradient > 0 and Close()[-1] < Open()[-1] and Close()[-2] > Open()[-2]:
            # 当bbi大于0时，向上涨，这时当前K要收阴线，前K线收阳线
            if is_market_sell:
                market_order(context,f"反转空单",Enum_Sell())
                sell_invert_count_display += 1
                invert_count += 1
                is_invert = False
                return 3
            else:
                if is_trending_vol and trending_buy_price != 0 and A_SellProfitLoss() + lock_sell_profitLoss > 0:
                    if get_order_num(Enum_Buy()) + lock_sell_postion > 0:
                        send_msg_thread("做多趋势",f"趋势反转空平损,平仓数:{get_order_num(Enum_Buy()) + lock_sell_postion}",is_all_notice=False)
                        close_postion(context,f"t反转空平损",Enum_Buy(),get_order_num(Enum_Buy()) + lock_sell_postion,'trending_invert_stop')
                        is_invert = False
                        return 1
                else:
                    send_msg_thread("反转空单x",f"反转空单x",is_all_notice=False)
                    is_invert = False
                    return 0 
        elif bbi_gradient < 0 and Close()[-1] > Open()[-1] and Close()[-2] < Open()[-2]:
            if is_market_buy:
                market_order(context,f"反转多单",Enum_Buy())
                buy_invert_count_display += 1
                invert_count += 1
                is_invert = False
                return 2
            else:
                if is_trending_vol and trending_sell_price != 0 and A_BuyProfitLoss() + lock_buy_profitLoss > 0:
                    if get_order_num(Enum_Sell()) + lock_buy_postion > 0:
                        send_msg_thread("做空趋势",f"趋势反转多平损,平仓数:{get_order_num(Enum_Sell()) + lock_buy_postion}",is_all_notice=False)
                        close_postion(context,f"t反转多平损",Enum_Sell(),get_order_num(Enum_Sell()) + lock_buy_postion,'trending_invert_stop')
                        is_invert = False
                        return 1
                else:
                    send_msg_thread("反转多单x",f"反转多单x",is_all_notice=False)
                    is_invert = False
                    return 0

    # 当前成交量大于前成交量
    # 不在当前的非交易时间内
    # 当前BAR要大于交易开始BAR数
    # 成交量不可超过动态量能
    # 持仓率正向判断
    if Vol()[-1] > Vol()[-2] and CurrentBar() > trade_begin_k_count and Vol()[-1] < vol_coefficients and postion_gradient > 0:
        if bbi_gradient > 0 and round(Close()[-1],0) > round(Open()[-1],0) and all(one_sided_take_list):
            # 过滤小波动
            if abs(bbi_value_two_dif) < bbi_value_two_dif_min_key_value and is_bvtd:
                bvtd_no_trade_count += 1
                PlotText(High()[-1], f"过滤小波动", color=RGB_Purple(), main=True)
                send_msg_thread("过滤小波动",f"bvtd不做多,bvtd:{bbi_value_two_dif}",is_all_notice=False)
                return 0
            if is_market_buy:
                market_order(context,f"多单",Enum_Buy())
                return 2
            else:
                if is_trending_vol and trending_sell_price != 0 and A_BuyProfitLoss() + lock_buy_profitLoss > 0:
                    if get_order_num(Enum_Sell()) + lock_buy_postion > 0:
                        send_msg_thread("做空趋势",f"空趋势多平损,平仓数:{get_order_num(Enum_Sell()) + lock_buy_postion}",is_all_notice=False)
                        close_postion(context,f"空趋势多平损",Enum_Sell(),get_order_num(Enum_Sell()) + lock_buy_postion,'trending_stop')
                        return 1
                else:
                    send_msg_thread("下多单x",f"下多单x",is_all_notice=False)
                    return 0
                
        elif bbi_gradient < 0 and round(Close()[-1],0) < round(Open()[-1],0) and all(one_sided_loss_list):
            if abs(bbi_value_two_dif) < bbi_value_two_dif_min_key_value and is_bvtd:
                bvtd_no_trade_count += 1
                PlotText(High()[-1], f"过滤小波动", color=RGB_Purple(), main=True)
                send_msg_thread("过滤小波动",f"bvtd不做空,bvtd:{bbi_value_two_dif}",is_all_notice=False)
                return 0
            if is_market_sell:
                market_order(context,f"空单",Enum_Sell())
                return 3
            else:
                if is_trending_vol and trending_buy_price != 0 and A_SellProfitLoss() + lock_sell_profitLoss > 0:
                    if get_order_num(Enum_Buy()) + lock_sell_postion > 0:
                        send_msg_thread("做多趋势",f"空趋势多平损,平仓数:{get_order_num(Enum_Buy()) + lock_sell_postion}",is_all_notice=False)
                        close_postion(context,f"空趋势多平损",Enum_Buy(),get_order_num(Enum_Buy()) + lock_sell_postion,'trending_stop')
                        return 1
                else:
                    send_msg_thread("下空单x",f"下空单x",is_all_notice=False)
                    return 0
    return 0

# 激活状态执行(稳K后进行处理)
def trigger_data_handle(context):
    global ret_exit, exit_order_id, enter_order_id, ret_enter
    global big_vol_count, big_vol_bar_list
    global trending_sell_price, trending_buy_price, is_trending
    global is_market_buy, is_market_sell
    global is_close_all_postion_buy, is_close_all_postion_sell
    global is_close_bd_postion_buy, is_close_bd_postion_sell
    global is_close_vol_postion_buy, is_close_vol_postion_sell
    global is_trending_order_result
    global is_lock_profit_buy, is_lock_profit_sell
    global lock_profit_price_buy, lock_profit_price_sell
    global is_protect_buy, is_protect_sell
    global lock_sell_profitLoss, lock_buy_profitLoss
    global lock_buy_postion, lock_sell_postion
    global trade_state

    # 非稳K情况
    # 成交量在大于动量4倍的情况下,当成是形成趋势的动作 ----- 趋势与振荡区分 - 4倍
    if is_trending_vol and Vol()[-1] >= vol_coefficients * trending_vol_coefficients and Time() not in no_trade_time and CurrentBar() not in big_vol_bar_list:
        big_vol_bar_list.append(CurrentBar())
         # 这里记录趋势阈值,阈值都为当前的开盘价
        if Open()[-1] > Close()[-1] and bbi_gradient < 0 and Close()[-1] < bbi_value_two:
            # 可能性的做空趋势,阴跌
            trending_buy_price = 0
            # 空趋势的情况下,不可进行做多,不可平空
            is_market_buy = False
            is_market_sell = True
            is_close_all_postion_buy = True
            is_close_all_postion_sell = False
            is_close_bd_postion_buy = True
            is_close_bd_postion_sell = False
            is_close_vol_postion_buy = True
            is_close_vol_postion_sell = False
            big_vol_count += 1
            is_trending = True
            new_trending_sell_price = max(Open()[-1], min(Close()[-2],Open()[-2]))
            if trending_sell_price != 0:
                trending_sell_price = max(new_trending_sell_price, trending_sell_price)
                if trending_sell_price == new_trending_sell_price:
                    PlotText(High()[-1], f"更新做空趋势\n{trending_sell_price}", color=RGB_Purple(), main=True)
                    if CurrentBar() > trade_begin_k_count:
                        send_msg_thread("更新做空趋势",f"当前量能{Vol()[-1]},做空趋势阈值{trending_sell_price}")
                    else:
                        send_msg_thread("更新做空趋势",f"当前量能{Vol()[-1]},做空趋势阈值{trending_sell_price}",is_all_notice=False)
                market_order(context,f"更新做空趋势",Enum_Sell())
            else:
                trending_sell_price = new_trending_sell_price
                PlotText(High()[-1], f"新做空趋势\n{trending_sell_price}", color=RGB_Purple(), main=True)
                if CurrentBar() > trade_begin_k_count:
                    send_msg_thread("新做空趋势",f"当前量能{Vol()[-1]},做空趋势阈值{trending_sell_price}")
                else:
                    send_msg_thread("新做空趋势",f"当前量能{Vol()[-1]},做空趋势阈值{trending_sell_price}",is_all_notice=False)
                if A_BuyPositionCanCover() > 0:
                    order_num = A_BuyPositionCanCover()
                    if A_BuyProfitLoss() + lock_buy_profitLoss > 0:
                        # 清空做多仓,前提是做多有利润的前提下
                        close_postion(context,f"空趋势全平多",Enum_Sell(),order_num,'all_stop')
                    # 追进做空仓 (转到全平后再去下单)
                    # market_order(context,f"做空趋势下单",Enum_Sell(),order_num)
                else:
                    market_order(context,f"新做空趋势",Enum_Sell())
        elif Close()[-1] > Open()[-1] and bbi_gradient > 0 and Close()[-1] > bbi_value_two:
            trending_sell_price = 0
            is_market_buy = True
            is_market_sell = False
            is_close_all_postion_buy = False
            is_close_all_postion_sell = True
            is_close_bd_postion_buy = False
            is_close_bd_postion_sell = True
            is_close_vol_postion_buy = False
            is_close_vol_postion_sell = True
            big_vol_count += 1
            is_trending = True
            new_trending_buy_price = min(Open()[-1], max(Close()[-2],Open()[-2]))
            if trending_buy_price != 0:
                trending_buy_price = min(new_trending_buy_price,trending_buy_price)
                if trending_buy_price == new_trending_buy_price:
                    PlotText(Low()[-1], f"更新做多趋势\n{trending_buy_price}", color=RGB_Purple(), main=True)
                    if CurrentBar() > trade_begin_k_count:
                        send_msg_thread("更新做多趋势",f"当前量能{Vol()[-1]},做多趋势阈值{trending_buy_price}")
                    else:
                        send_msg_thread("更新做多趋势",f"当前量能{Vol()[-1]},做多趋势阈值{trending_buy_price}",is_all_notice=False)
                market_order(context,f"更新做多趋势",Enum_Buy())
            else:
                trending_buy_price = new_trending_buy_price
                PlotText(Low()[-1], f"新做多趋势\n{trending_buy_price}", color=RGB_Purple(), main=True)
                if CurrentBar() > trade_begin_k_count:
                    send_msg_thread("新做多趋势",f"当前量能{Vol()[-1]},做多趋势阈值{trending_buy_price}")
                else:
                    send_msg_thread("新做多趋势",f"当前量能{Vol()[-1]},做多趋势阈值{trending_buy_price}",is_all_notice=False)
                if A_SellPositionCanCover() > 0:
                    order_num = A_SellPositionCanCover()
                    if A_SellProfitLoss() + lock_sell_profitLoss > 0:
                        # 清空做空仓,前提是有做空利润
                        close_postion(context,f"多趋势全平空",Enum_Buy(),order_num,'all_stop')
                    # 追进做多仓 (转到全平后再去下单)
                    # market_order(context,f"做多趋势下单",Enum_Buy(),order_num)
                else:
                    market_order(context,f"新做多趋势",Enum_Buy())

    # 稳K情况
    if context.triggerType() == "K" or context.triggerType() == "H":
        if context.kLineSlice() == 1 and context.kLineType() == Enum_Period_Min() and context.triggerData()['ContractNo'] == trade_contractNo:
            # 在这里增加量能进场，放在最前面，不受趋势影响
            if Time() not in no_trade_time:
                if abs(bbi_gradient) >= 2 * abs(pre_bbi_gradient) and Vol()[-1] > vol_coefficients and Vol()[-2] < vol_coefficients:
                    if bbi_gradient > 0:
                        if Close()[-1] <= Open()[-1]:
                            market_order(context,f"bg升量能做空",Enum_Sell())
                        else:
                            market_order(context,f"bg升量能做多",Enum_Buy())
                    elif bbi_gradient < 0:
                        if Close()[-1] >= Open()[-1]:
                            market_order(context,f"bg降量能做多",Enum_Buy())
                        else:
                            market_order(context,f"bg降量能做空",Enum_Sell())

            if is_trending_vol:
                # 重置, 趋势结束当前放在稳K后做判断
                if trending_buy_price != 0 and (Close()[-1] < trending_buy_price or Close()[-1] < bbi_value_two):
                    trending_buy_price = 0
                    is_market_buy = True
                    is_market_sell = True
                    is_close_all_postion_buy = True
                    is_close_all_postion_sell = True
                    is_close_bd_postion_buy = True
                    is_close_bd_postion_sell = True
                    is_close_vol_postion_buy = True
                    is_close_vol_postion_sell = True
                    is_trending = False
                    PlotText(Low()[-1], f"做多趋势结束", color=RGB_Purple(), main=True)
                    if CurrentBar() > trade_begin_k_count:
                        send_msg_thread("做多趋势结束",f"当前价{Close()[-1]}")
                    else:
                        send_msg_thread("做多趋势结束",f"当前价{Close()[-1]}",is_all_notice=False)
                elif trending_sell_price != 0 and (Close()[-1] > trending_sell_price or Close()[-1] > bbi_value_two):
                    trending_sell_price = 0
                    is_market_buy = True
                    is_market_sell = True
                    is_close_all_postion_buy = True
                    is_close_all_postion_sell = True
                    is_close_bd_postion_buy = True
                    is_close_bd_postion_sell = True
                    is_close_vol_postion_buy = True
                    is_close_vol_postion_sell = True
                    is_trending = False
                    PlotText(Low()[-1], f"做空趋势结束", color=RGB_Purple(), main=True)
                    if CurrentBar() > trade_begin_k_count:
                        send_msg_thread("做空趋势结束",f"当前价{Close()[-1]}")
                    else:
                        send_msg_thread("做空趋势结束",f"当前价{Close()[-1]}",is_all_notice=False)
            # 一定要在add_bbi_for_main后,在稳K后执行
            data_one_sided_handle()
            # 创建箭头方向标识,并在这里出现场景
            scene = determine_type(context)
            plot_vol_bar(scene)
    if context.triggerType() == "T":
        # 在这里二次处理动态成交量,确认数值
        calVariableCoefficients()
    if context.triggerType() == "C":
        pass
    if context.triggerType() == "O" and context.triggerData()['Cont'] == trade_contractNo:  
        triData = context.triggerData()
        # send_msg_thread("委托状态变化触发", f"{triData}", is_all_notice=False)
        send_msg_thread("委托状态触发", f"服务器标识:{triData['SessionId']},行情合约:{triData['Cont']},订单号:{triData['OrderId']},开平仓信号:{triData['Offset']},做多做空信号:{triData['Direct']},"
                        f"委托状态:{ctcfs(triData['OrderState'])},策略ID:{triData['StrategyId']},策略订单号:{triData['StrategyOrderId']}"
                        f"最新信息码:{triData['ErrorCode']},最新错误信息:{triData['ErrorText']}", is_all_notice=False)
        # 当前手动平仓完后,同步全局参数
        if triData["OrderState"] == '9':
            # 撤单需要推送撤单信息
            send_msg_thread("撤单",f"{triData['ErrorText']}")
        # triData["Offset"]  'N' : 无, 'O': 开仓, 'C' : 平仓, 'T' : 平今
        if triData["StrategyId"] == 0 and triData["OrderState"] == '6' and (triData["Offset"] == "C" or triData["Offset"] == "T"):
            if triData['Direct'] == 'B':
                if A_SellPositionCanCover() == 0:
                    is_lock_profit_sell = False
                    is_protect_sell = False
                    lock_profit_price_sell = 0
                    send_msg_thread("重置",f"做空配置",is_all_notice=False)
                # 重置锁值
                lock_sell_profitLoss = 0
                lock_sell_postion = 0
                PlotText(Low()[-1], f"手动空平成交", color=RGB_Purple(), main=True)
                send_msg_thread("手动空平成交", f"数量:{triData['OrderQty']},OrderId:{triData['OrderId']},OrderNo:{triData['OrderNo']}",is_all_notice=False)
            elif triData['Direct'] == 'S':
                if A_BuyPositionCanCover() == 0:
                    is_lock_profit_buy = False
                    is_protect_buy = False
                    lock_profit_price_buy = 0
                    send_msg_thread("重置",f"做多配置",is_all_notice=False)
                # 重置锁值
                lock_buy_profitLoss = 0
                lock_buy_postion = 0
                PlotText(Low()[-1], f"手动多平成交", color=RGB_Purple(), main=True)
                send_msg_thread("手动多平成交", f"数量:{triData['OrderQty']},OrderId:{triData['OrderId']},OrderNo:{triData['OrderNo']}",is_all_notice=False)
            exit_order_id = -1
            ret_exit = -1
        elif triData["StrategyId"] != 0 and triData["OrderState"] == '6' and (triData["Offset"] == "C" or triData["Offset"] == "T"):
            if triData['Direct'] == 'B':
                if A_SellPositionCanCover() == 0:
                    is_lock_profit_sell = False
                    is_protect_sell = False
                    lock_profit_price_sell = 0
                    send_msg_thread("重置",f"做空配置",is_all_notice=False)
                # 重置锁值
                lock_sell_profitLoss = 0
                lock_sell_postion = 0
                # 平仓的情况下B 其实是空平成功
                # PlotText(Low()[-1], f"空平成交", color=RGB_Purple(), main=True)
                send_msg_thread("空平成交", f"策略单号:{triData['StrategyOrderId']},OrderId:{triData['OrderId']},OrderNo:{triData['OrderNo']}",is_all_notice=False)
                if is_trending and is_trending_order_result is False:
                    is_trending_order_result = True
                    # 放在这里做趋势单下单
                    market_order(context,f"新做多趋势",Enum_Buy(),triData['MatchQty'])
            elif triData['Direct'] == 'S':
                if A_BuyPositionCanCover() == 0:
                    is_lock_profit_buy = False
                    is_protect_buy = False
                    lock_profit_price_buy = 0
                    send_msg_thread("重置",f"做多配置",is_all_notice=False)
                # 重置锁值
                lock_buy_profitLoss = 0
                lock_buy_postion = 0
                # PlotText(Low()[-1], f"多平成交", color=RGB_Purple(), main=True)
                send_msg_thread("多平成交", f"策略单号:{triData['StrategyOrderId']},OrderId:{triData['OrderId']},OrderNo:{triData['OrderNo']}",is_all_notice=False)
                if is_trending and is_trending_order_result is False:
                    is_trending_order_result = True
                    market_order(context,f"新做空趋势",Enum_Sell(),triData['MatchQty'])
            exit_order_id = -1
            ret_exit = -1
        elif triData["StrategyId"] != 0 and triData["OrderState"] == '6' and triData["Offset"] == "O":
            if triData['Direct'] == 'B':
                # PlotText(Low()[-1], f"多开成交", color=RGB_Purple(), main=True)
                send_msg_thread("多开成交", f"策略单号:{triData['StrategyOrderId']},OrderId:{triData['OrderId']},OrderNo:{triData['OrderNo']}",is_all_notice=False)
            elif triData['Direct'] == 'S':
                # PlotText(Low()[-1], f"空开成交", color=RGB_Purple(), main=True)
                send_msg_thread("空开成交", f"策略单号:{triData['StrategyOrderId']},OrderId:{triData['OrderId']},OrderNo:{triData['OrderNo']}",is_all_notice=False)
            enter_order_id = -1
            ret_enter = -1
    if context.triggerType() == 'N' and context.triggerData()['ServerType'] == 'T':  
        if context.triggerData()['EventType'] == 1:  
            StartTrade()
            # 帐号重连后再取一次保证金比例
            getCalcParamSLongDepositRatio("交易状态通知,保证金获取")
            send_msg_thread("交易状态通知,已连接",
                            f"{context.triggerData()['UserNo']}帐号交易连接,{'不' if IsTradeAllowed() == 0 else ''}允许实盘交易")
        else: 
            StopTrade()
            send_msg_thread("交易状态通知,已中断",
                            f"{context.triggerData()['UserNo']}帐号交易中断,{'不' if IsTradeAllowed() == 0 else ''}允许实盘交易")
    if context.triggerType() == "N" and context.triggerData()["ServerType"] == "Q":
        if context.triggerData()["EventType"] == 1:  
            StartTrade()  
            send_msg_thread("行情状态通知,已连接","重新开始实盘交易")
        elif context.triggerData()["EventType"] == 2:  
            StopTrade()   
            send_msg_thread("行情状态通知,已中断","暂停实盘交易")
    if context.triggerType() == "Z":  # 市场状态发生变化
        # 这里需要判断当前的行情状态,如果当前是稳K,则需要进行处理
        LogInfo("策略当前触发类型对应的数据: ", context.triggerData())
        LogInfo("策略当前触发类型对应的数据: ", ExchangeStatusStr(context.triggerData()['TradeState']))
        trade_state = context.triggerData()['TradeState']
    if context.triggerType() == 'U':
        data = context.triggerData()
        # "Cont": 主力合约，如"ZCE|Z|SR|MAIN"
        # "OriginCont": 主力合约换月前对应的合约，如"ZCE|F|SR|405"
        # "NewCont": 主力合约换月后对应的合约，如"ZCE|F|SR|409"
        # send_msg_thread("合约换月提醒",f"{data['Cont']}换月前对应合约为：{data['OriginCont']}， 换月后对应合约为: {data['NewCont']}")
        send_msg_thread("合约换月提醒",f"{data}")
        # 重启策略
        ReloadStrategy()

# --------------------------------------------------------utils methods--------------------------------------------------------------


# 成交量K线柱标色,创建副图vol
def plot_vol_bar(scene):
    global vol_increases_count, vol_increases_bar_list, is_market, is_close_postion, is_day_vol_notice

    color = RGB_Gray()
    if scene == 1:
        color = RGB_Yellow()
    elif scene == 2:
        color = RGB_Red()
    elif scene == 3:
        color = RGB_Green()
    if Vol()[-1] >= vol_coefficients:
        color = RGB_Purple()
        if CurrentBar() not in vol_increases_bar_list and Time() not in start_trade_time:
            vol_increases_bar_list.append(CurrentBar())
            vol_increases_count += 1
            if not is_market:
                is_market = True
            if not is_close_postion:
                is_close_postion = True
        
    # 这里用的4倍与趋势动量的4倍相对应
    if Vol()[-1] >= vol_coefficients * trending_vol_coefficients and Time() not in no_trade_time:
        color = RGB_Blue()

    PlotBar("Vol", Vol()[-1], 0, color, False, chartname = 'vol')

    # 判断当日成交量是否1.5倍昨日成交量
    HisDataList = HisData(Enum_Data_Vol(), Enum_Period_Day(), 1, main_contractNo, 3)
    if HisDataList[-1] > HisDataList[-2] * 1.5 and is_day_vol_notice and CurrentBar() > trade_begin_k_count:
        is_day_vol_notice = False
        PlotText(Low()[-1], f"成交量异常活跃", color=RGB_Purple(), main=True)
        send_msg_thread("成交量异常活跃",f"当前成交量:{HisDataList[-1]},昨日成交量:{HisDataList[-2]}")


# 时间转换工具: convert_to_time_format
def cttf(number):
    multiplied_number = int(number * 10000)
    number_str = str(multiplied_number).zfill(4)
    return number_str[:2] + ":" + number_str[2:]

# 默认is_all_notice为True,会通知也会写日志
def notice_content(start_content, content):
    try:
        # 默认为me的推送地址
        # send_url = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=eb2118be-789b-421f-b091-b69c1bb9fb7e"
        # if trade_object == 'jin':
        #     send_url = "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=79043a23-2b7a-44d3-8b65-664f2bab0c05"
        # send_data = {"msgtype": "text", "text": {"content": f"{start_content},{content}"}}
        # res = requests.post(url=send_url, headers={"Content-Type": "application/json"}, json=send_data)
        # 推送ntfy
        if trade_object == 'metwo':
            send_url = "https://ntfy.zmddg.com/fu"
        else:
            send_url = "https://ntfy.zmddg.com/one"
        requests.post(send_url,data=f"{start_content},{content}".encode(encoding='utf-8'))
    except Exception as e:
        # 异常处理代码块
        LogInfo(f"notice_content发生异常,内容为:{str(e)}")
    

# 通过线程进行发推送
def send_msg_thread(title, content, is_all_notice=True):
    try:
        start_content = f"{trade_contractNo}_{datetime.now().strftime('%H:%M:%S')},"
        if is_backtesting:
            start_content += f"Bar时:{cttf(Time())},"
        content_str = f"{title},{content},"
        if is_backtesting:
            # 在回测的时候才显示,其他时候没有必要
            content_str += f"权益:{round(A_Assets(),2)},总盈亏:{round(A_TotalProfitLoss(),2)},基准价:{profit_price},"
        
        LogInfo(f"{start_content}{content_str}")
        # 这里增加当回测的时候,都不进行通知
        if is_all_notice and is_backtesting is False:
            thread = threading.Thread(target=notice_content, args=(start_content, content_str))
            thread.daemon = True  # 将线程设置为守护线程
            thread.start()
    except Exception as e:
        # 异常处理代码块
        LogInfo(f"send_msg_thread发生异常,内容为:{str(e)}")

def ExchangeStatusStr(TradeState):
    """
        'N' 未知状态
        'I' 正初始化
        'R' 准备就绪
        '0' 交易日切换
        '1' 竞价申报
        '2' 竞价撮合
        '3' 连续交易
        '4' 交易暂停
        '5' 交易闭市
        '6' 竞价暂停
        '7' 报盘未连
        '8' 交易未连
        '9' 闭市处理
    """
    if TradeState == "N":
        return "未知状态"
    elif TradeState == "I":
        return "正初始化"
    elif TradeState == "R":
        return "准备就绪"
    elif TradeState == "0":
        return "交易日切换"
    elif TradeState == "1":
        return "竞价申报"
    elif TradeState == "2":
        return "竞价撮合"
    elif TradeState == "3":
        return "连续交易"
    elif TradeState == "4":
        return "交易暂停"
    elif TradeState == "5":
        return "交易闭市"
    elif TradeState == "6":
        return "竞价暂停"
    elif TradeState == "7":
        return "报盘未连"
    elif TradeState == "8":
        return "交易未连"
    elif TradeState == "9":
        return "闭市处理"
    else:
        return "未知状态"

# 下单状态转化为中文: convert_to_chinese_from_sendOrder
def ctcfs(order_state):
    if order_state == "N":
        return "无"
    elif order_state == "0":
        return "已发送"
    elif order_state == "1":
        return "已受理"
    elif order_state == "2":
        return "待触发"
    elif order_state == "3":
        return "已生效"
    elif order_state == "4":
        return "已排队"
    elif order_state == "5":
        return "部分成交"
    elif order_state == "6":
        return "完全成交"
    elif order_state == "7":
        return "待撤"
    elif order_state == "8":
        return "待改"
    elif order_state == "9":
        return "已撤单"
    elif order_state == "A":
        return "已撤余单"
    elif order_state == "B":
        return "指令失败"
    elif order_state == "C":
        return "待审核"
    elif order_state == "D":
        return "已挂起"
    elif order_state == "E":
        return "已申请"
    elif order_state == "F":
        return "无效单"
    elif order_state == "G":
        return "部分触发"
    elif order_state == "H":
        return "完全触发"
    elif order_state == "I":
        return "余单失败"
    else:
        return "无"


# 获取保证金比例
def getCalcParamSLongDepositRatio(content):
    global margin_ratio

    if TradeSvrState() == 1:
        # 重置保证金比例,这里只用多头保证金,其实也有空头保证金比例,一般都一样
        margin_ratio = A_CalcParam(trade_contractNo).get('SLongDepositRatio')
        if margin_ratio is None:
            send_msg_thread(f"{content}异常",f"保证金比例:{margin_ratio},重置为默认0.09",is_all_notice=False)
            margin_ratio = 0.09
        send_msg_thread(f"{content}",f"保证金比例:{margin_ratio}",is_all_notice=False)
    

# 历史回测阶段结束时执行该函数一次
def hisover_callback(context):
    send_msg_thread("历史回测阶段", "结束", is_all_notice=False)

# 策略退出前执行该函数一次
def exit_callback(context):
    send_msg_thread("策略即将退出", f"请查看情况", is_all_notice=False)
    pass
    