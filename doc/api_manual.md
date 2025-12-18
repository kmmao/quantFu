# 极智量化 API 手册
极智量化 API手册




GetSessionStartTime  ................................ ................................ ................................ . 59
GetSessionEndTime ................................ ................................ ................................ ... 59
MaxSingleTradeSize ................................ ................................ ................................ ... 63

A_TodayBuyPosition  ................................ ................................ ................................ .. 77
A_TodaySellPos ition  ................................ ................................ ................................ .. 78
A_OrderEntryOrExit  ................................ ................................ ................................ .. 79
A_AllQueueOrderNo  ................................ ................................ ................................ . 86
A_OrderContractNo  ................................ ................................ ................................ .. 87

Enum_PartCanceled  ................................ ................................ ................................ .. 93
Enum_Order_Offer  ................................ ................................ ................................ ... 97
Enum_Order_Gho st ................................ ................................ ................................ .. 98
Enum_Order_Swap  ................................ ................................ ................................ ... 98

Enum_Data_Typica l................................ ................................ ................................ ..101
SetAFunUseForHis  ................................ ................................ ................................ ...109
SetStopWinKtBlack ................................ ................................ ................................ ...111



## K线数据
BarCount

### BarCount
**说明**
指定合约 Bar的总数


**语法**
`int BarCount(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
contractNo 参数不填写时，函数返回基准合约、 基准周期对应的 Bar的总
数，其他参数填写或不填写都不生效


**示例**
BarCount() 返回基准合约的 Bar总数
BarCount("ZCE|F|SR|905", "M", "1") 获取白糖 905合约 1分钟 K线的 Bar
总数

Open

### Open
**说明**
指定合约指定周期的开盘价序列


**语法**
`float64 array[ ] Open(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0

注意：该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时
的barDataLen 参数的设置值， 或是通过界面设置添加合约时在 "引用根数 "处设置
的值


**备注**
简写 O，返回值 numpy数组包含截止当前 Bar的所有开盘价
K线类型为 Tick时返回值为截止当前 Bar的最新价序列
Open()[ -1]表示当前 Bar开盘价， Open()[ -2]表示上一个 Bar开盘价，以此

类推

注意：
a. contractNo 参数不填写时，函数返回基准合约、基准周期对应的开盘
价序列，其他参数填写或不填写都不生效
b. 该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时的
barDataLen 参数的设置值，或是通过界面设置添加合约 时在 "引用根数 "处设置的
值


**示例**
Open() 获取基准合约的所有开盘价列表
Open('ZCE|F|SR|905', 'M', 1) 获取白糖 905合约 1分钟 K线的所有开盘价
列表

Close

### Close
**说明**
指定合约指定周期的收盘价序列


**语法**
`float64 array[] Close(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
简写 C，返回 numpy数组，包括截止当前 Bar的所有收盘价
K线类型为 Tick时返回值为截止当前 Bar的最新价序列
Close()[ -1]表示当前 Bar收盘价， Close()[ -2]表示上一个 Bar收盘价，以此
类推

注意：
a. contractNo 参数不填写时，函数返回基准合约、基准周期对应的收盘
价序列，其他参数填写或不填写都不生效
b. 该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时的
barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数 "处设置的
值


**示例**
Close() 获取基准合约的所有收盘价列表
Close('ZCE|F|SR|905', 'M', 1) 获取白糖 905合约 1分钟 K线的所有收盘价
列表

High

### High
**说明**
指定合约指定周期的最高价序列


**语法**
`float64 array[] High(string contractNo='', char kLi neType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0

注意：
a. contractNo 参数不填写时，函数返回基准合约、基准周期对应的最高
价序列，其他参数填写或不填写都不生效
b. 该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时的
barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数 "处设置的
值


**备注**
简写 H，返回 numpy数组，包括截止当前 Bar的所有最高价
K线类型为 Tick时返回值为截止当前 Bar的最新价序列
High()[ -1]表示当前 Bar最高价， High()[ -2]表示上一个 Bar最高价，以此类
推


**示例**
High() 获取基准合约的所有最高价列表
High('ZCE|F|SR|905', 'M', 1) 获取白糖 905合约 1分钟 K线的所有最高价
列表

Low

### Low
**说明**
指定合约指定周期的最低价序列


**语法**
`float64 array[] Low(string contractNo='', char klineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0

注意：
a. contractNo 参数不填写时，函数返回基准合约、基准周期对应的最低

价序列，其他参数填写或不填写都不生效
b. 该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时的
barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数 "处设置的
值


**备注**
简写 L，返回 numpy数组，包括截止当前 Bar的所有最低价
K线类型为 Tick时返回值为截止当前 Bar的最新价序列
Low()[ -1]表示当前 Bar最低价， Low()[ -2]表示上一个 Bar最低价，以此类
推


**示例**
Low() 获取基准合约的所有最低价列表
Low('ZCE|F|SR|905', 'M', 1) 获取白糖 905合约 1分钟 K线的所有最低价
列表

OpenD

### OpenD
**说明**
指定合约指定周期 N天前的开盘价序列


**语法**
`float OpenD(int daysAgo=0, string contractNo='')`



**参数**
daysAgo 第几天前，默认值为 0，即当天
contractNo 合约编号，默认值为空，取基准合约


**备注**
使 用 该 函 数 前 请 确 保 在 策 略 的 initial方 法 中 使 用
SetBarInterval(contractNo, 'D', 1) 方法订阅 contractNo 合约的日线信息；
若daysAgo超过了订阅合约 contractNo 日线数据的样本数量，则返回为 -
1。

注意：合约 contractNo 日线数据的样本数量为用 SetBarInterval 函数订阅
合约时的 barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数
"处设置的值


**示例**
OpenD(3, 'ZCE|F|SR|905') 获取白糖 905合约 3天前的开盘价

CloseD

### CloseD
**说明**
指定合约指定周期 N天前的收盘价


**语法**
`float CloseD(int daysAgo=0, string contractNo='')`



**参数**
daysAgo 第几天前，默认值为 0，即当天
contractNo 合约编号，默认基准合约


**备注**
使 用 该 函 数 前 请 确 保 在 策 略 的 initial方 法 中 使 用
SetBarInterval(contractNo, 'D', 1) 方法订阅 contractNo 合约的日线信息；
若daysAgo超过了订阅合约 contractNo 日线数据的样本数量，则返回为 -
1。

注意：合约 contractNo 日线数据的样本数量为用 SetBarInterval 函数订阅
合约时的 barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数
"处设置的值


**示例**
CloseD(3，'ZCE|F|SR|905') 获取白糖 905合约 3天前的收盘价

HighD

### HighD
**说明**
指定合约指定周期 N天前的最高价


**语法**
`float HighD(int daysAgo=0, string contractNo='')`



**参数**
daysAgo 第几天前，默认值为 0，即当天
contractNo 合约编号，默认基准合约


**备注**
使 用 该 函 数 前 请 确 保 在 策 略 的 initial方 法 中 使 用
SetBarInterval(contractNo, 'D', 1) 方法订阅 contractNo 合约的日线信息；
若daysAgo超过了订阅合约 contractNo 日线数据的样本数量，则返回为 -
1。

注意：合约 contractNo 日线数据的样本数量为用 SetBarInterval 函数订阅
合约时的 barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数
"处设置的值


**示例**
HighD(3，'ZCE|F|SR|905') 获取白糖 905合约 3天前的最高价

LowD


### 
**说明**
指定合约指定周期 N天前的最低价


**语法**
`float LowD(int daysAgo=0, string contractNo='')`



**参数**
daysAgo 第几天前，默认值为 0，即当天
contractNo 合约编号，默认基准合约


**备注**
使 用 该 函 数 前 请 确 保 在 策 略 的 initial方 法 中 使 用
SetBarInterval(contractNo, 'D', 1) 方法订阅 contractNo 合约的日线信息；
若daysAgo超过了订阅合约 contractNo 日线数据的样本数量，则返回为 -
1。

注意：合约 contractNo 日线数据的样本数量为用 SetBarInterval 函数订阅
合约时的 barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数
"处设置的值


**示例**
LowD(3，'ZCE|F|SR|905') 获取白糖 905合约 3天前的最低价

Vol

### Vol
**说明**
指定合约指定周期的成交量序列


**语法**
`int32 array[] Vol(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
简写 V，返回 numpy数组，包括截止当前 Bar的所有成交量
Vol()[ -1]表示当前 Bar成交量， Vol()[ -2]表示上一个 Bar成交量，以此类推

注意：
a. contractNo 参数不填写时，函数返回基准合约、基准周期对应的成交
量序列，其他参数填写或不填写都不生效

b. 该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时的
barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数 "处设置的
值


**示例**
Vol() 获取基准合约的所有成交量列表
Vol('ZCE|F|SR|905', 'M', 1) 获取白糖 905合约 1分钟 K线的所有成交量
列表

OpenInt

### OpenInt
**说明**
指定合约指定周期的持仓量序列


**语法**
`int32 array[] OpenInt(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineV alue K线周期，默认值为 0


**备注**
返回 numpy数组，包括截止当前 Bar的所有持仓量
OpenInt()[ -1]表示当前 Bar持仓量， OpenInt()[ -2]表示上一个 Bar持仓量，
以此类推

注意：
a. contractNo 参数不填写时，函数返回基准合约、基准周期对应的持仓
量序列，其他参数填写或不填写都不生效
b. 该函数能取到的最大数据长度为用 SetBarInterval 函数订阅合约时的
barDataLen 参数的设置值，或是通过界面设置添加合约时在 "引用根数 "处设置的
值

BarStatus

### BarStatus
**说明**
指定合约当前 Bar的状态值


**语法**
`int BarStatus(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空

kLineValue K 线周期，默认值为 0


**备注**
返回值整型， 0表示第一个 Bar，1表示中间普通 Bar，2表示最后一个
Bar

注意： contractNo 参数不填写时，函数返回基准合约、基准周期对应的当
前Bar的状态值，其他参数填写或不填写都不生效

CurrentBar

### CurrentBar
**说明**
指定合约当前 Bar的索引值


**语法**
`int CurrentBar(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
第一个 Bar返回值为 1，其他 Bar递增
当无数据时，不存在当前 Bar，返回 -1
当该方法中三个参数中有任意一个参数不填写时，返回基准合约的当前
Bar索引

注意： contractNo 参数不填写时，函数返回基准合约、基准周期对应的当
前Bar的索引值，其他参数填写或不填写都不生效

Date

### Date
**说明**
当前 Bar的日期


**语法**
`int Date(string con tractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数
kLineValue K 线周期


**备注**
简写 D，返回格式为 YYYYMMDD 的整数

contractNo 参数不填写时，函数返回基准合约、基准周期对应的当前 Bar
的日期，其他参数填写或不填写都不生效


**示例**
当前 Bar对应的日期为 2019 -03-25，则 Date返回值为 20190325

Time

### Time
**说明**
当前 Bar的时间


**语法**
`float Time(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
简写 T，返回格式为 0.HHMMSS 的浮点数

contractNo 参数不填写时，函数返回基准合约、基准周期对应的当前 Bar
的时间，其他参数填写或不填写都不生效


**示例**
当前 Bar对应的时间为 11:34:21，Time返回值为 0.113421
当前 Bar对应的时间为 09:34:00，Time返回值为 0.0934
当前 Bar对应的时间为 11:34:00，Time返回值为 0.1134

TradeDate

### TradeDate
**说明**
指定合约当前 Bar的交易日


**语法**
`int TradeDate(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
返回格式为 YYYYMMDD 的整数

注意： contractNo 参数不填写时，函数返回基准合约、基准周期对应的当
前Bar的交易日，其他参数填写或不填写都不生效


**示例**
当前 Bar对应的交易日为 2019 -03-25，则 TradeDate 返回值为 20190325

HistoryDataExist

### HistoryDataExist
**说明**
指定合约的历史数据是否有效


**语法**
`int HistoryDataExist(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0


**备注**
有效返回 1，否则返回 0

注意： contractNo 参数不填写时，函数返回基准合约、基准周期对应的历
史数据是否有效，其他参数填写或不填写都不生效

HisData

### HisData
**说明**
获取各种历史数据数组


**语法**
float64/int32 array[] HisData(enum dataType, enum kLineType='', int
`kLineValue=0, string contractNo='', int maxLength=100)`



**参数**
dataType 指定历史数据的种类，可选的枚举函数和相应含义为：
Enum_Data_Close(): 收盘价
Enum_Data_Open(): 开盘价
Enum_Data_High(): 最高价
Enum_Data_Low(): 最低价
Enum_Data_Median(): 中间价
Enum_Data_Typical(): 标准价
Enum_Data_Weighted(): 加权收盘价
Enum_Data_Vol(): 成交量
Enum_Data_Opi(): 持仓量

Enum_Data_Time(): K 线时间

kLineType 指定周期类型，可选的枚举函数和相应含义为：
Enum_Period_Tick(): 周期类型 _分笔
Enum_Period_Min(): 周期类型 _分钟
Enum_Period_Day(): 周期类型 _日线

kLineValue 周期数，  如： 5分钟线，周期数就是 5；50秒线，周期数为
50
要订阅秒线，周期类型选择 Enum_Period _tick，周期数选择大于等于 1的
整数
contractNo 合约编号，默认值为空，取当前合约
maxLength 定返回历史数据数组的最大长度，默认值为 100


**备注**
注意：
a. 获取前要使用 SetBarInterval 订阅指定合约，指定周期，指定数量的历
史数据，否则 HisData取不到数据
b. 返回 numpy数组，获取订阅的 maxLength 个指定的种类的历史数据

注意：对于 contractNo 、kLineType 、kLineValue 三个参数， contractN o参
数不填写时，函数返回基准合约、基准周期对应的 dataType 类型的历史数据数
组， kLineType 和kLineValue 参数填写或不填写都不生效


**示例**
`closeList =HisData(Enum_Data_Close(), Enum_Period_Min(), 5,`

"ZCE|F|SR|906", 1000) # 获取合约 ZCE|F|SR|906 包含当前 Bar在内的之前 1000
个5分钟线的收盘价
closeList[ -1] # 当前 Bar的收盘价
closeList[ -2] # 上一个 Bar的收盘价

HisBarsInfo

### HisBarsInfo
**说明**
获取最多 maxLength 根指定类型的历史 K线详细数据


**语法**
`list HisBarsInfo(string contractNo='', char kLineType='', int kLineValue=0, int`

maxLength=100)


**参数**
contractNo 合约编号，默认值为空，取基准合约
kLineType K 线类型，可选值请参阅周期类型枚举函数，默认值为空
kLineValue K 线周期，默认值为 0

maxLength 返回历史数据数组的最大长度，默认值为 100


**备注**
返回列表，包括截止当前 Bar的最多 maxLength 个K线的历史数据，列
表中的每个元素是 K线数据的详细信息
列表中的元素以字典的形式保存每个 K线的数据信息，字典中每个键值
的含义如下 :
ContractNo 合约编号，如 'NYMEX|F|CL|1907'
DateTimeStamp 更新时间，如 20190521130800000
KLineIndex K 线索引，如 1
KLineQty K 线成交量，如 18
TotalQty 总成交量，如 41401
KLineSlice K 线周期，  如1
KLineType K 线类型，如 'M'
OpeningPrice 开盘价，  如63.5
LastPrice 收盘价，如 63.49
SettlePrice 结算价，如 63.21
HighPrice 最高价，如 63.5
LowPrice 最低价，  如63.49
PositionQty 总持仓，如 460816
TradeDate 交易日期，如 20190521

注意：对于 contractNo 、kLineType 、kLineValue 三个参数， contractNo 参
数不填写时，函数返回基准合约、基准周期对应的历史数据信息， kLineType 和
kLineValue 参数填写或不填写都不生效


**示例**
`barList = HisBarsInfo("ZCE|F|SR|906", Enum_Period_Min(), 5, 1000) # 获取`

合约 ZCE|F|SR|906 包含当前 Bar在内的之前 1000个历史 5分钟 K线的数据
barInfo = barList[ -1] # 当前 Bar的详细信息


## 即时行情
Q_UpdateTime

### Q_UpdateTime
**说明**
获取指定合约即时行情的更新时间


**语法**
`string Q_UpdateTime(string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**
返回格式为 "YYYYMMDDHHMMSSmmm" 的字符串，
若指定合约即时行情的更新时间为 2019 -05-21 10:07:46.000 ，则该函数放
回为 20190521100746000
历史阶段或没有即时行情时该函数返回默认值“ 0”

Q_PreClose

### Q_PreClose
**说明**
合约昨收盘价


**语法**
`float Q_PreClose(string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**
返回浮点数
历史阶段或没有即时行情时该函数返回默认值 0

Q_SettlePrice

### Q_SettlePrice
**说明**
合约收盘价


**语法**
`float Q_SettlePrice( string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_BuyTotalVol

### Q_BuyTotalVol
**说明**
合约委买总量


**语法**
`int Q_BuyTotalVol(string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**

历史阶段或没有即时行情时该函数返回默认值 0

Q_SellTotalVol

### Q_SellTotalVol
**说明**
合约委卖总量


**语法**
`int Q_SellTotalVol(string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_AskPrice

### Q_AskPrice
**说明**
合约最优卖价


**语法**
`float Q_AskPrice(string contractNo='', int level=1)`



**参数**
contractNo 合约编号，默认当前合约
level 档位数，默认 1档


**备注**
可获取指定合约、指定深度的最优卖价
历史阶段或没有即时行情时该函数返回默认值 0

Q_AskVol

### Q_AskVol
**说明**
合约最优卖量


**语法**
`float Q_AskVol(string contractNo='', int level=1)`



**参数**
contractNo 合约编号，默认当前合约
level 档位数，默认 1档


**备注**
可获取指定合约，指定深度的最优卖量
历史阶段或没有即时行情时该函数返回默认值 0

Q_AvgPrice

### Q_AvgPrice
**说明**
当前合约的实时均价


**语法**
`float Q_AvgPrice(string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**
返回实时均价即结算价
历史阶段或没有即时行情时该函数返回默认值 0

Q_BidPrice

### Q_BidPrice
**说明**
合约最优买价


**语法**
`float Q_BidPrice(string contractNo='', int level=1)`



**参数**
contractNo 合约编号，默认当前合约
level 档位数，默认 1档


**备注**
可获取指定合约，指定深度的最优买价
历史阶段或没有即时行情时该函数返回默认值 0

Q_BidVol

### Q_BidVol
**说明**
合约最优买量


**语法**
`float Q_BidVol(string contractNo='', int level=1)`



**参数**
contractNo 合约编号，默认当前合约
level 档位数，默认 1档


**备注**
可获取指定合约，指定深度的最优买量
历史阶段或没有即时行情时该函数返回默认值 0

Q_Clo se

### Q_Clo se
**说明**
当日收盘价，未收盘则取昨收盘


**语法**
`float Q_Close(string contractNo='')`



**参数**
contractNo 合约编号，默认当前合约


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_High

### Q_High
**说明**
当日最高价


**语法**
`float Q_High(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_HisHigh

### Q_HisHigh
**说明**
历史最高价


**语法**
`float Q_HisHigh(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_HisLow

### Q_HisLow
**说明**
历史最低价


**语法**
`float Q_HisLow(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_Last

### Q_Last
**说明**
最新价


**语法**
`float Q_Last(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_LastDate

### Q_LastDate
**说明**
最新成交日期


**语法**
`int Q_LastDate(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
返回当前公式应用商品的最新成交日期， 格式为 YYYYMMDD 整数表示的
日期。
历史阶段或没有即时行情时该函数返回默认值 0

Q_LastTime

### Q_LastTime
**说明**
最新成交时间


**语法**
`float Q_LastTime(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
返回当前公式应用商品的最新成交时间，以格式为 0.HHMMSSmmm 浮点
数表示的时间
历史阶段或没有即时行情时该函数返回默认值 0

Q_LastVol

### Q_LastVol
**说明**
现手


**语法**
`float Q_LastVol(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
返回值的单位为手
历史阶段或没有即时行情时该函数返回默认值 0

Q_Low

### Q_Low
**说明**
当日最低价


**语法**
`float Q_Low(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_LowLimit

### Q_LowLimit
**说明**
当日跌停板价


**语法**
`float Q_LowLimit(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_Open

### Q_Open
**说明**
当日开盘价


**语法**
`float Q_Open(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_OpenInt

### Q_OpenInt
**说明**
持仓量


**语法**
`float Q_OpenInt(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
返回值的单位为手
历史阶段或没有即时行情时该函数返回默认值 0

Q_PreOpenInt

### Q_PreOpenInt
**说明**
昨持仓量


**语法**
`float Q_PreOpenInt(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_PreSettlePrice

### Q_PreSettlePrice
**说明**
昨结算


**语法**
`float Q_PreSettlePrice(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_PriceChg

### Q_PriceChg
**说明**
当日涨跌


**语法**
`float Q_PriceChg(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_PriceChgRadio

### Q_PriceChgRadio
**说明**
当日涨跌幅


**语法**
`float Q_PriceChgRadio(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_TotalVol

### Q_TotalVol
**说明**
当日成交量


**语法**
`float Q_TotalVol(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_TurnOver

### Q_TurnOver
**说明**
当日成交额


**语法**
`float Q_TurnOver(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_UpperLimit

### Q_UpperLimit
**说明**
当日涨停板价


**语法**
`float Q_UpperLimit(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
历史阶段或没有即时行情时该函数返回默认值 0

Q_TheoryPrice

### Q_TheoryPrice
**说明**
当日期权理论价


**语法**
`float Q_TheoryPrice(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

Q_Sigma

### Q_Sigma
**说明**
当日期权波动率


**语法**
`float Q_Sigma(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

Q_Delta

### Q_Delta
**说明**
当日期权 Delta


**语法**
`float Q_Delta(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

Q_Gamma

### Q_Gamma
**说明**
当日期权 Gamma


**语法**
`float Q_Gamma(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

Q_Vega

### Q_Vega
**说明**
当日期权 Vega


**语法**
`float Q_Vega(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

Q_Theta

### Q_Theta
**说明**
当日期权 Theta


**语法**
`float Q_Theta(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

Q_Rho

### Q_Rho
**说明**
当日期权 Rho


**语法**
`float Q_Rho(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
不存在时返回 0

QuoteDataExist

### QuoteDataExist
**说明**
行情数据是否有效


**语法**

`int QuoteDataExist(string contractNo='')`



**参数**
contractNo 合约编号


**备注**
数据有效时返回 1，否则返回 0

CalcTradeDate

### CalcTradeDate
**说明**
计算指定合约，指定时间戳所属的交易日


**语法**
`int CalcTradeDate(string contractNo='', int dateTimeStamp=0)`



**参数**
contractNo 合约编号，默认基准合约
dateTimeStamp 时间戳，默认 0


**备注**
正常情况，返回指定合约指定时间戳所属的交易日
当返回值为 -1时，表示合约参数有误
当返回值为 -2时，表示时间戳参数有误，比如传入非交易时段时间戳


**示例**
`CalcTradeDate(dateTimeStamp=2019083011000000 0)`

CalcTradeDate('ZCE|F|SR|001', 20190830110000000)


## 策略交易
Buy

### Buy
**说明**
产生一个建多仓操作


**语法**
`void Buy(int orderQty=0, float orderPrice=0, string contractNo="", bool`

needCover = True, string userNo='', char hedge='')


**参数**
orderQty 买入数量，为整型值，默认为 0；
orderPrice 买入价格，为浮点数，默认为 0；
contractNo 合约代码，为字符串，默认使用基准合约；
needCover 是否先清掉反方向持仓，默认为 True；

userNo 用户编号，为字符串，默认使用用户通过 SetUserNo 函数设置的
第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
产生一个建多仓操作 ，无返回值。
该函数仅用于建多仓，其处理规则如下：
如果当前持仓状态为持平，该函数按照参数进行建多仓。
如果当前持仓状态为空仓，该函数平掉所有空仓，同时按照参数进行建
多仓，两个动作同时发出。


**示例**
在当前没有持仓或者持有多头仓位的情况下：
Buy(50,10.2) 表示用 10.2的价格买入 50张合约。
Buy(10,Close()[ -1]) 表示用当前 Bar收盘价买入 10张合约，马上发送委
托。
Buy(5,0) 表示用现价买入 5张合约，马上发送委托。
Buy(0,0)  表示用现价按交易设置中设置的手数，马上发送委托。
`Buy(10,Close()[ -1],hedge=Enum_Hedge()) 表示用当前 Bar收盘价买入 10`

张合约，定单类型为套保。

在当前持有空头仓位的情况下：
Buy(10,Close()[ -1]) 表示平掉所有空仓， 并用当前 Bar收盘价买入 10张合
约，马上发送委托。

BuyToCover

### BuyToCover
**说明**
产生一个平空仓操作


**语法**
`void BuyToCover(int orderQty=0, float orderPrice=0, string contractNo="",`

string userNo='', char coverFlag = 'A', char hedge='')


**参数**
orderQty 买入数量，为整型值，默认为 0；
orderPrice 买入价格，为浮点数，默认为 0；
contract 合约代码，为字符串，默认使用基准合约；
userNo 用户编号，为字符串，默认使用用户通过 SetUserNo 函数设置的
第一个账号，或通过界面设置的关联账号；
coverFla g 平今平昨标志（此参数仅对 SHFE和INE有效）
默认设置为 'A'自适应 (先平昨再平今 )

若平昨，则需设置为 'C'
若平今，则需设置为 'T'
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
产生一个平仓空操作，无返回值。
该函数仅用于平仓空，其处理规则如下：
如果当前持仓状态为持平，该函数不执行任何操作。
如果当前持仓状态为多仓，该函数不执行任何操作。
如果当前持仓状态为空仓，如果此时 orderQty 使用默认值，该函数将平
掉所有空仓，达到持平的状态，否则只平掉参数 orderQty 的空仓。


**示例**
在持有空头仓位的情况下：
BuyToCover(50,10.2) 表示用 10.2的价格空头买入 50张合约。
BuyToCover(10,Close()[ -1]) 表示用当前 Bar收盘价空头买入 10张合约，
马上发送委托。
BuyToCover(5,0) 表示用现价空头买入 5张合约 )，马上发送委托。
BuyToCover(0,0) 表示用现价按交易设置中的设置 ,马上发送委托。
`BuyToCover(10,Close()[ -1],hedge=Enum_Hedge()) 表示用当前 Bar收盘价`

空头买入 10张合约，定单类型为套保。

Sell

### Sell
**说明**
产生一个平多仓操作


**语法**
`void Sell(int orderQty=0, float orderPrice=0, string contractNo="", string`

userNo='', char cove rFlag = 'A', char hedge='')


**参数**
orderQty 卖出数量，为整型值，默认为 0；
orderPrice 卖出价格，为浮点数，默认为 0；
contract 合约代码，为字符串，默认使用基准合约；
userNo 用户编号，为字符串，默认使用用户通过 SetUserNo 函数设置的
第一个账号，或通过界面设置的关联账号；
coverFlag 平今平昨标志（此参数仅对 SHFE和INE有效）
默认设置为 'A'自适应 (先平昨再平今 )
若平昨，则需设置为 'C'
若平今，则需设置为 'T'
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和

相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
产生一个平多仓操作，无返回值。
该函数仅用平多仓，其处理规则如下：
如果当前持仓状态为持平，该函数不执行任何操作。
如果当前持仓状态为空仓，该函数不执行任何操作。
如果当前持仓状态为多仓，如果此时 orderQty 使用默认值，该函数将平
掉所有多仓，达到持平的状态，否则只平掉参数 orderQty 的多仓。


**示例**
在持有多头仓位的情况下：
Sell(50,10.2) 表示用 10.2的价格卖出 50张合约。
Sell(10,Close()[ -1]) 表示用当前 Bar收盘价卖出 10张合约，马上发送委
托。
Sell(5,0) 表示用现价卖出 5张合约，马上发送委托。
Sell(0,0) 表示用现价按交易设置中的设置，马上发送委托。
`Sell(10,Close()[ -1],hedge=Enum_Hedge()) 表示用当前 Bar收盘价卖出 10`

张合约，定单类型为套保。

SellShort

### SellShort
**说明**
产生一个建空仓操作


**语法**
`void SellShort(int orderQty=0, float orderPrice=0, string contractNo="", bool`

needCover = True, string userNo='', char hedge='')


**参数**
orderQty 卖出数量，为整型值，默认为 0；
orderPrice 卖出价格，为浮点数，默认为 0；
contract 合约代码，为字符串，默认使用基准合约；
needCover 是否先清掉方向持仓，默认为 True；
userNo 用户编号，为字符串，默认使用用户通过 SetUserNo 函数设置的
第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
产生一个建空仓操作，无返回值。

该函数仅用于建空仓，其处理规则如下：
如果当前持仓状态为持平，该函数按照参数进行空头建仓。
如果当前持仓状态为多仓，该函数平掉所有多仓，同时按照参数进行空
头建仓，两个动作同时发出
如果当前持仓状态为空仓，该函数将继续建仓，但具体是否能够成功建
仓要取决于系统中关于连续建仓的设置，以及资金，最大持仓量等限制。


**示例**
在没有持仓或者持有空头持仓的情况下：
SellShort(50,10.2) 表示用 10.2的价格空头卖出 50张合约。
SellShort(10,Close()[ -1]) 表示用当前 Bar收盘价空头卖出 10张合约，马
上发送委托。
SellShort(5,0) 表示用现价空头卖出 5张合约，马上发送委托。
SellShort(0,0) 表示用现价按交易设置中设置的手数，马上发送委托。
`SellShort(10,Close()[ -1],hedge=Enum_Hedge()) 表示用当前 Bar收盘价空`

头卖出 10张合约，定单类型为套保。

`在MarketPosition()=1 的情况下： （当前持有多头持仓）`

SellShort(10,Close()[ -1]) 表示平掉所有多头仓位，并用当前 Bar收盘价空
头卖出 10张合约，马上发送委托。

StartTrade

### StartTrade
**说明**
开启实盘交易。


**语法**
void StartTrade()


**备注**
在策略运行时，使用 StopTrade 可以暂时停止策略向实盘发单，通过该方
法可以开启策略向实盘发单的功能。

StopTrade

### StopTrade
**说明**
暂停实盘交易。


**语法**
void StopTrade()


**备注**
在策略运行时，使用 StopTrade 可以暂时停止策略向实盘发单。

UnloadStrategy

### UnloadStrategy
**说明**
停止策略。


**语法**
void UnloadStrategy()


**备注**
在策略运行时，使用 UnloadStrategy 可以停止策略，策略进程结束。


**示例**
当账号 12345678 断线时，停止策略
`if TradeSvrState("12345678")==2: UnloadStrategy()`


ReloadStrategy

### ReloadStrategy
**说明**
重启策略。


**语法**
void ReloadStrategy()


**备注**
在策略运行时，使用 ReloadStrategy 可以停止并重新启动策略


**示例**
当账号 12345678 连接正常时，重启策略
`if TradeSvrState("12345678")==1: ReloadStrategy()`


IsTradeAllowed

### IsTradeAllowed
**说明**
是否允许实盘交易。


**语法**
`int IsTradeAllowed()`



**备注**
获取策略是否可以向实盘发单，策略实盘运行时并且允许向实盘发单返
回1，否则返回 0。


## 策略状态
AvgEntryPrice

### AvgEntryPrice
**说明**
获得指定账户下指定合约和投保类型持仓的平均建仓价格。


**语法**
`float AvgEntryPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约
userNo 用户编号，为字符串，默认值为空。为空时表示不区分账户信息
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举 值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果


**示例**
`posPrice = AvgEntryPrice() # 获取策略中的基准合约的投机仓的平均建仓`

价格
`posPrice = AvgEntryPrice("ZCE|F|SR|905, "user") # 获取策略中的用户名为`

"user"的SR105的投机仓的平均建仓价格

BarsSinceEntry

### BarsSinceEntry
**说明**
获得指定账户下指定合约和投保类型持仓的第一个建仓位置到当前位置
的Bar计数。


**语法**
`int BarsSinceEntry(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约
userNo 用户编号，为字符串，默认值为空。为空时表示不区分账户信息
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_S peculate() 投机
Enum_Hedge() 套保


**备注**

账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
只有在策略有持仓的状况下，该函数才有意义，否则返回 -1。
注意：在开仓 Bar上为 0。


**示例**
`count = BarsSinceEntry() # 获取策略中的基准合约的投机仓的第一个建仓`

位置到当前位置的 Bar计数
`count = BarsSinceEntry("ZCE|F|SR|905, "user") # 获取策略中的用户名为`

"user "的SR105的投机仓的第一个建仓位置到当前位置的 Bar计数

BarsSinceExit

### BarsSinceExit
**说明**
获得指定账户下指定合约和投保类型持仓的最近平仓位置到当前位置的
Bar计数。


**语法**
`int BarsSinceExit(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若从未平过仓，则返回 -1。
注意：在平仓 Bar上为 0。

BarsSinceLastEntry

### BarsSinceLastEntry
**说明**
获得指定账户下指定合约和投保类型持仓的最后一个建仓位置到当前位
置的 Bar计数。


**语法**
`int BarsSinceLastEntry( string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：

Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若当前策略无持仓，则返回 -1。
注意：在建仓 Bar上为 0。

BarsSinceLastBuyEntry

### BarsSinceLastBuyEntry
**说明**
获得指定账户下指定合约和投保类型持仓的最后一个 Buy建仓位置到当
前位置的 Bar计数。


**语法**
`int BarsSinceLastBuyEntry(string contractNo='', string userNo='', char`

hedge='')


**参数**
contractNo 合约编号，默 认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若当前策略无持仓，则返回 -1。
注意：在建仓 Bar上为 0。

BarsSinceLastSellEntry

### BarsSinceLastSellEntry
**说明**
获得指定账户下指定合约和投保类型持仓的最后一个 Sell建仓位置到当
前位置的 Bar计数。


**语法**
`int BarsSinceLastSellEntry(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机

Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若当前策略无持仓，则返回 -1。
注意：在建仓 Bar上为 0。

BarsSinceToday

### BarsSinceToday
**说明**
获得当天的第一根 Bar到当前的 Bar个数。


**语法**
`int BarsSinceToday(string contractNo='', char kLineType='', int kLineValue=0)`



**参数**
contractNo 合约编号，默认为空，取基准合约
kLineType K 线类型，字符型，默认值为空
kLineValue K 线周期，整形，默认值为 0

ContractProfit

### ContractProfit
**说明**
获得指定账户下指定合约和投保类型持仓的每手浮动盈亏。


**语法**
`float ContractProfit(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。

CurrentContracts

### CurrentContracts
**说明**
获得指定账户下指定合约和投保类型持仓的持仓合约数 (净持仓 )。


**语法**
`int CurrentContracts(str ing contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
该函数返回策略当前的净持仓数量，多仓为正值，空仓为负值，持平返
回0。
若账户的买持仓为 5，卖方向持仓为 3，则该函数返回值为 2

BuyPosition

### BuyPosition
**说明**
获得指定账户下指定合约和投保类型持仓的买入方向的持仓量。


**语法**
`int BuyPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值 为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。

SellPosition

### SellPosition
**说明**
获得指定账户下指定合约和投保类型持仓的卖出方向的持仓量。


**语法**
`int SellPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：

Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。

EntryDate

### EntryDate
**说明**
获得指定账户下指 定合约和投保类型持仓的第一个建仓位置的日期。


**语法**
`int EntryDate(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前无持仓， 则返回无效日期 :19700101 ， 否则返回 YYYYMMDD 格
式的日期。

EntryPrice

### EntryPrice
**说明**
获得指定账户下指定合约和投保类型持仓的第一次建仓的委托价格。


**语法**
`float EntryPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前无持仓，则返回 0。

EntryTime

### EntryTime
**说明**
获得指定账户下指定合约和投保类型持仓的第一个建仓位置的时间。


**语法**
`float EntryTime(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
返回值为 0.HHMMSSmmm 格式的时间。
若策略当前无持仓，则返回 0。

ExitDate

### ExitDate
**说明**
获得指定账户下指定合约和投保类型持仓的最近平仓位置 Bar日期。


**语法**
`int ExitDate(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
返回值为 YYYYMMDD 格式的日期。
若从未平过仓，则返回无效日期 :19700101 。

ExitPrice

### ExitPrice
**说明**
获得指定账户下指定合约和投保类型持仓的最近一次平仓的委托价格。


**语法**
`float ExitPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若合约从未被平仓，则返回 0，否则返回合约最近一次平仓时的委托价
格。

ExitTime

### ExitTime
**说明**
获得指定账户下指定合约和投保类型持仓的最近平仓位置 Bar时间。


**语法**
`float ExitTime(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认 值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
返回值为 0.HHMMSSmmm 格式的时间。
若合约从未平过仓，则返回 0。

LastEntryDate

### LastEntryDate
**说明**
获得指定账户下指定合约和投保类型持仓的最后一个建仓位置的日期。


**语法**
`int LastEntryDate(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合 约和投保标志的持仓的对应结果。
返回值为 YYYYMMDD 格式的日期。
若策略当前无持仓，则返回无效日期 :19700101 。

LastEntryPrice

### LastEntryPrice
**说明**
获得指定账户下指定合约和投保类型持仓的最后一次建仓的委托价格。


**语法**
`float LastEntryPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前持仓为 0，则返回 0。

LastBuyEntryPrice

### LastBuyEntryPrice
**说明**
获得指定账户下指定合约和投保类型的当前 Buy持仓的最后一次建仓的
委托价格。


**语法**
`float LastBuyEntryPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和

相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略 中指定合约和投保标志的持仓的对应结果。
获得当前 Buy持仓的最后一个建仓价格，返回值为浮点数。
若策略当前 Buy持仓为 0，则返回 0。

LastSellEntryPrice

### LastSellEntryPrice
**说明**
获得指定账户下指定合约和投保类型的当前 Sell持仓的最后一次建仓的
委托价格


**语法**
`float LastSellEntryPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前 Sell持仓为 0，则返回 0。

HighestSinceLastBuyEntry

### HighestSinceLastBuyEntry
**说明**
获得指定账户下指定合约和投保类型 的当前 Buy持仓的最后一次建仓以
来的最高价。


**语法**
`float HighestSinceLastBuyEntry(string contractNo='', string userNo='', char`

hedge='')


**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate( ) 投机

Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前 Buy持仓为 0，则返回 0。

LowestSinceLastBuyEntry

### LowestSinceLastBuyEntry
**说明**
获得指定账户下指定合约和投保类型的当前 Buy持仓的最后一次建仓以
来的最低价。


**语法**
`float LowestSinceLastBuyEntry(string contractNo='', string userNo='', char`

hedge='')


**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前 Buy持仓为 0，则返回 0。

HighestSinceLastSellEntry

### HighestSinceLastSellEntry
**说明**
获得指定账户下指定合约和投保类型的当前 Sell持仓的最后一次建仓以
来的最高价。


**语法**
`float HighestSinceLastSellEntry(string contractNo='', string userNo='', char`

hedge='')


**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前 Sell持仓为 0，则返回 0。

LowestSinceLastSellEntry

### LowestSinceLastSellEntry
**说明**
获得指定账户下指定合约和投保类型的当前 Sell持仓的最后一次建仓以
来的最低价。


**语法**
`float LowestSinceLastSellEntry(string contractNo='', string userNo ='', char`

hedge='')


**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前 Sell持仓为 0，则返回 0。

LastEntryTime

### LastEntryTime
**说明**
获得指定账户下指定合约和投保类型持仓的最后一个建仓位置的时间。


**语法**
`float LastEntryTime(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为 ：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前持仓为 0，则返回 0。

MarketPosition

### MarketPosition
**说明**
获得指定账户下指定合约和投保类型持仓的当前持仓状态。


**语法**
`int MarketPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
返回值定义如下：
-1 当前位置持空仓数量大于持多仓数量
0 当前位置为持平
1 当前位置持多仓数量大于持空仓数量
该函数统计的持仓状态为虚拟回测引擎中的持仓对应的状态，与实盘账
户中的持仓信息并不一致。


**示例**
`if(MarketPosition("ZCE|F|SR|905")==1) 判断合约 ZCE|F|SR|905 当前是否`

持多仓
`if(MarketPosition("ZCE|F|SR|905")!=0) 判断合约 ZCE|F|SR|905 当前是否有`

持仓，无论持空仓或多仓

PositionProfit

### PositionProfit
**说明**
获得指定账户下指定合约和投保类型持仓的浮动盈亏。


**语法**
`float PositionProfit(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 合约编号，默认值为空，取基准合约。
userNo 用户编号， 为字符串， 默认值为空。 为空时表示不区分账户信息。
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
账户信息不填时，统计策略中指定合约和投保标志的持仓的对应结果。
若策略当前持仓为 0，则返回 0


**示例**
无

BarsLast

### BarsLast
**说明**
返回最后一次满足条件时距离当前的 bar数


**语法**
`int BarsLast(bool condition)`



**参数**
condition 传入的条件表达式


**备注**
返回最后一次满足条件时距离当前的 bar数。


**示例**
BarsLast(Close() > Open()); 从当前 Bar开始，最近出现 Close()> Open()的
Bar到当前 Bar的偏移值。如果为 0，即当前 Bar为最近的满足条件的 Bar。

StrategyId

### StrategyId
**说明**
获取当前策略 Id


**语法**
`int StrategyId()`



## 策略性能
Available

### Available
**说明**
返回策略当前可用虚拟资金。


**语法**
`float Available()`


CurrentEquity

### CurrentEquity
**说明**

返回策略的当前账户权益。


**语法**
`float CurrentEquity()`


FloatProfit

### FloatProfit
**说明**
返回指定合约的浮动盈亏。


**语法**
`float FloatProfit(string contractNo='')`



**参数**
contractNo 合约编号，不填则返回整个策略的手续费，填写时取对应合
约的

GrossLoss

### GrossLoss
**说明**
返回账户的累计总亏损。


**语法**
`float GrossLoss()`


GrossProfit

### GrossProfit
**说明**
返回指定合约的总利润。


**语法**
`float GrossProfit()`


Margin

### Margin
**说明**
返回指定合约的持仓保证金。


**语法**
`float Margin(string contractNo='')`



**参数**
contractNo 合约编号，不填则返回整个策略的手续费，填写时取对应合
约的

NetProfit

### NetProfit
**说明**
返回指定合约的平仓盈亏。


**语法**
`float NetProfit(string contractNo='')`



**参数**
contractNo 合约编号，不填则返回整个策略的手续费，填写时取对应合
约的

NumEvenTrades

### NumEvenTrades
**说明**
返回该账户下保本交易的总手数。


**语法**
`int NumEvenTrades()`


NumLosTrades

### NumLosTrades
**说明**
返回该账户下亏损交易的总手数。


**语法**
`int NumLosTrades()`


NumWinTrades

### NumWinTrades
**说明**
返回该账户下盈利交易的总手数。


**语法**
`int NumWinTrades()`


NumAllTimes

### NumAllTimes
**说明**
返回该账户的开仓次数。


**语法**
`int NumAllTimes()`


NumWinTimes

### NumWinTimes
**说明**
返回该账户的盈利次数。


**语法**
`int NumWinTimes()`


NumLoseTimes

### NumLoseTimes
**说明**
返回该账户的亏损次数。


**语法**
`int NumLoseTimes()`


NumEventTimes

### NumEventTimes
**说明**
返回该账户的保本次数。


**语法**
`int NumEventTimes()`


PercentProfit

### PercentProfit
**说明**
返回该账户的盈利成功率。


**语法**
`float PercentProfit()`


TradeCost

### TradeCost
**说明**
返回指定合约产生的手续费。


**语法**
`float TradeCost(string contractNo='')`



**参数**
contractNo 合约编号，不填则返回整个策略的手续费，填写时取对应合
约的

TotalTrades

### TotalTrades
**说明**
返回该账户的交易总开仓手数。


**语法**
`int TotalTrades()`



## 属性函数
BarInterval

### BarInterval
**说明**

返回界面合约图表 K线周期数值


**语法**
`int BarInterval()`



**备注**
返回界面图表 K线周期数值，通常和 BarType一起使用进行数据周期的
判别


**示例**
当前数据周期为 1日线， BarInterval 等于 1；
当前数据周期为 22日线， BarInterval 等于 22；
当前数据周期为 60分钟线， BarInterval 等于 60；
当前数据周期为 1TICK线， BarInterval 等于 1；br> 当前数据周期为 5000
量线， BarInterval 等于 5000。

BarType

### BarType
**说明**
返回界面合约 K线图表周期类型字符


**语法**
char BarType()


**备注**
通常和 BarInterval 一起使用进行数据周期的判别
返回值如下定义：
'T' 分笔
'S' 秒线
'M' 分钟
'D' 日线


**示例**
当前数据周期为 22日线， BarType等于 D；
当前数据周期为 60分钟线， BarType等于 M；
当前数据周期为 1TICK线， BarType等于 T。

BidAskSize

### BidAskSize
**说明**
买卖盘个数


**语法**
`int BidAskSize(string contractNo='')`



**参数**

contractNo 合约编号，默认值为空。为空时，取基准合约


**备注**
郑商所、上期所、和能源交易所的合约返回值为 5，
大商所和中金所的合约的返回值为 1，
外盘交易所的合约返回值为 10。


**示例**
郑商所白糖的买卖盘个数为 5个，因此其 BidAskSize 等于 5；
郑商所棉花的买卖盘个数为 1个，因此其 BidAskSize 等于 1。

ContractUnit

### ContractUnit
**说明**
每张合约包含的基本单位数量，即每手乘数


**语法**
`int ContractUnit(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**备注**
返回 1张合约包含多少标的物

ExchangeName

### ExchangeName
**说明**
合约对应交易所名称代码


**语法**
`string ExchangeName(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**示例**
郑商所下各合约的交易所名称为： "ZCE"
ExchangeName("ZCE|Z|TA|MAIN")

ExchangeTime

### ExchangeTime
**说明**
交易所时间


**语法**
string ExchangeTime(string exchangeNo)


**参数**
exchangeNo 交易所编号，例如 "ZCE"，"DCE"，"SHFE"，"CFFEX"，"INE"


**备注**
返回字符串  "2019 -07-05 22:11:00"
当交易所编号为无效编号时，返回空字符串
该函数返回的时间是系统时间


**示例**
ExchangeTime('ZCE')

ExchangeStatus

### ExchangeStatus
**说明**
交易所状态


**语法**
string ExchangeStatus(string exchangeNo)


**参数**
exchangeNo 交易所编号，例如 "ZCE"，"DCE"，"SHFE"，"CFFEX"，"INE"


**备注**
可能的返回值如下：
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

该方法仅适用于内盘交易所，对外盘交易所返回值为 'N'未知状态。


**示例**
ExchangeStatus('ZCE')

CommodityStatus

### CommodityStatus
**说明**
品种或合约交易状态


**语法**
string CommodityStatus(string commodityNo|string contractNo)


**参数**
commodityNo 品种编号，例如 "ZCE|F|SR" ，"DCE|F|I"
或者
contractNo 合约编号，例如 "ZCE|F|SR|001" ，"DCE|F|I|2001"

**备注**
可能的返回值如下：
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

该方法仅适用于内盘品种，对外盘品种返回值为未知状态 'N'。
若取不到品种状态信息，则该函数默认返回交易所状态。


**示例**
CommodityStatus('ZCE|F|SR')

GetSessionCount

### GetSessionCount
**说明**
获取交易时间段的个数


**语法**
`int GetSessionCount(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约。

GetSessionStartTime

### GetSessionStartTime
**说明**
获取合约指定交易时间段的开始时间。


**语法**
`float GetSessionStartTime(string contractNo='', int index=0)`



**参数**
contractNo 合约编号，为空时，取基准合约。
index 交易时间段的索引值，从 0开始。


**备注**
返回指定合约的交易时间段开始时间，格式为 0.HHMMSS 的浮点数。
若index索引超出交易时段大小，则返回 0.0

GetSession EndTime

### GetSession EndTime
**说明**
获取指定交易时间段的结束时间。


**语法**
`float GetSessionEndTime(string contractNo='', int index=0)`



**参数**
contractNo 合约编号，为空时，取基准合约。
index 交易时间段的索引值，从 0开始。


**备注**
返回指定合约的交易时间段结束时间，格式为 0.HHMMSS 的浮点数。
若index索引超出交易时段大小，则返回 0.0


**示例**
contractNo = "ZCE|F|SR|905"
`sessionCount = GetSessionCount(contractNo)`

for i in range(0, sessionCount -1):
`sessionEndTime = GetSessionEndTime(contractNo, i)`


由于合约 ZCE|F|TA|908 的第三段交易结束时间为 11:30:00，
所以 GetSessionEndTime("ZCE|F|TA|908", 2) 的返回值为 0.113

TradeSessionBe ginTime

### TradeSessionBe ginTime
**说明**
获取指定合约指定交易日的指定交易时间段的开始时间戳。


**语法**

`int TradeSessionBeginTime(string contractNo='', int tradeDate=0, int index=0)`



**参数**
contractNo 合约编号，为空时，取基准合约。
tradeDate 指定的交易日，默认 0
index 交易时间段的索引值，从 0开始，默认取第一个交易时段。


**备注**
返回时间戳类型，如 20190904213000000

TradeSessionEndTime

### TradeSessionEndTime
**说明**
获取指定合约指定交易日的指定交易时间段的结束时间戳。


**语法**
`int TradeSessionEndTime(string contractNo='', int tradeDate=0, int index= -1)`



**参数**
contractNo 合约编号，为空时，取基准合约。
tradeDate 指定的交易日，默认 0
index 交易时间段的索引值，从 0开始，默认取最后一个交易时段。


**备注**
返回时间戳类型，如 20190904213000000

GetNextTimeInfo

### GetNextTimeInfo
**说明**
获取指定合约指定时间点的下一个时间点及交易状态。


**语法**
`dict GetNextTimeInfo(string contractNo, float timeStr)`



**参数**
contractNo 合约编号。
timeStr 指定的时间点，格式为 0.HHMMSS 。


**备注**
返回时间字典，结构如下：
{
'Time' : 0.21,
'TradeState' : 3
}
其中 Time对应的值表示指定时间 timeStr的下一个时间点，返回指定合
约的交易时间段开始时间，格式为 0.HHMMSS 的浮点数。

TradeState 表示对应时间点的交易状态，数据类型为字符， 可能出现的值
及相应的状态含义如下：
'1' : 集合竞价
'2' : 集合竞价撮合
'3' : 连续交易
'4' : 暂停
'5' : 闭市
'6' : 闭市处理时间
'0' : 交易日切换时间
'N' : 未知状态
'I' : 正初始化
'R' : 准备就绪
异常情况返回为空字典： {}


**示例**
GetNextTimeInfo('SHFE|F|CU|1907', 0.22) # 获取 22:00:00 后下一个时间
点的时间和交易状态
获取当前时间下一个时间点的时间和交易状态
import time # 需要在策略头部添加 time库
`curTime = time.strftime('0.%H%M%S',time.localtime(time.time()))`

`timeInfoDict =  GetNextTimeInfo("SHFE|F|CU|1907", curTime)`


CurrentDate

### CurrentDate
**说明**
公式处于历史阶段时，返回历史 K线当时的日期。处于实时阶段时，返
回客户端所在操作系统的日期


**语法**
`int CurrentDate()`



**备注**
格式为 YYMMDD 的整数。


**示例**
如果当前日期为 2019 -7-13，CurrentDate 返回值为 20190713

CurrentTime

### CurrentTime
**说明**
公式处于历史阶段时，返回历史 K线当时的时间。处于实时阶段时，返
回客户端所在操作系统的时间


**语法**
`float CurrentTime()`



**备注**
格式为 0.HHMMSS 的浮点数。


**示例**
如果当前时间为 11:34:21，CurrentTime 返回值为 0.113421 。

TimeDiff

### TimeDiff
**说明**
返回两个时间之间的间隔秒数，忽略日期差异


**语法**
`int TimeDiff(float datetime1, float datetime2)`



**参数**
datetime1 输入较早时间
datetime2 输入较晚个时间


**备注**
该函数只计算两个时间之间的差值，不考虑两个参数的日期
若输入参数不为 float类型，则函数返回值为 0


**示例**
TimeDiff(20190404.104110,20110404.104120); 返回两时间相差 10秒；
TimeDiff(20190404.1041,20110404.1043); 返回两时间相差 2分钟，即 120
秒

IsInSession

### IsInSession
**说明**
操作系统的当前时间是否为指定合约的交易时间。


**语法**
`int IsInSession(string contractNo='')`



**参数**
contractNo 合约编号，默认为基础合约。


**备注**
获取操作系统的当前时间，是否为指定合约的交易时间。


**示例**
如果当前时间为 11:34:21，IsInSession("ZCE|F|TA|909") 返回值为 0。

MarginRatio

### MarginRatio
**说明**

获取合约默认保证金比率


**语法**
`float MarginRatio(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约。

MaxBarsBack

### MaxBarsBack
**说明**
最大回溯 Bar数


**语法**
`float MaxBarsBack()`



**备注**
设SetBarInterval 函数订阅基准合约时的 barDataLen 参数的设置值或是
通过界面设置添加基准合约时在 "引用根数 "处设置的值为 VALUE
若当前基准合约历史数据长度不大于 VALUE，则返回基准合约当前历史
数据长度；若当前基准合约历史数据长度大于 VALUE，返回 VALUE的值

MaxSingleTradeSize

### MaxSingleTradeSize
**说明**
单笔交易限量


**语法**
`int MaxSingleTradeSize()`



**备注**
单笔交易限量，对于不能交易的商品，返回 -1，对于无限量的商品，返回
0

PriceTick

### PriceTick
**说明**
合约最小变动价


**语法**
`float PriceTick(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约。


**示例**
沪铝的最小变动价为 5，因此其 PriceTick 等于 5

沪金的最小变动价为 0.02，因此其 PriceTick 返回值为 0.02

OptionStyle

### OptionStyle
**说明**
期权类型，欧式还是美式


**语法**
`int OptionStyle(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**备注**
返回值 0为欧式， 1为美式

OptionType

### OptionType
**说明**
返回期权的类型，是看涨还是看跌期权


**语法**
`int OptionType(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**备注**
返回值 0为看涨， 1为看跌，  -1为异常

PriceScale

### PriceScale
**说明**
合约价格精度


**语法**
`int PriceScale(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**示例**
上期沪金的报价精确到小数点 2位， 最小变动价位为 0.02， 则PriceScale
的返回值为 2，即精度为小数点后 2位

Symbol

### Symbol
**说明**

获取展示合约，即基准合约的编号


**语法**
string Symbol()


**备注**
期货、现货、指数 : <EXG>|<TYPE>|<ROOT>|<YEAR><MONTH>[DAY]

期权 : <EXG>|<TYPE>|<ROOT>|<YEAR><MONTH>[DAY]<CP><STRIKE>

跨期套利 :
<EXG>|<TYPE>|<ROOT>|<YEAR><MONTH>[DAY]|<YEAR><MONTH>[DAY]

跨品种套利 : <EXG>|<TYPE>|<ROOT&ROOT>|<YEAR><MONTH>[DAY]

极星跨期套利 :
<EXG>|s|<ROOT>|<YEAR><MONTH>[DAY]|<YEAR><MONTH>[DAY]

极星跨品种套利 :
<EXG>|m|<ROOT -ROOT>|<YEAR><MONTH>|<YEAR><MONTH>

极星现货期货套利 : <EXG>|p|<ROOT -ROOT>||<YEAR><MONTH>


**示例**
"ZCE|F|SR|001" ，"ZCE|O|SR|001C5000"

SymbolName

### SymbolName
**说明**
获取合约名称


**语法**
`string SymbolName(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**示例**
"ZCE|F|SR|001" 的合约名称为 "白糖 001"

SymbolType

### SymbolType
**说明**
获取合约所属的品种编号


**语法**
`string SymbolType(string contractNo='')`



**参数**
contractNo 合约编号，为空时，取基准合约


**示例**
"ZCE|F|SR|001" 的品种编号为 "ZCE|F|SR"

GetTrendContract

### GetTrendContract
**说明**
获取商品主连 /近月对应的合约


**语法**
`string GetTrendContract(string contractNo="")`



**参数**
contractNo 取商品主连 /近月编号，为空时，取基准合约


**备注**
若contractNo 为具体的合约，则返回 contractNo


**示例**
GetTrendContract('DCE|Z|I|MAIN') 的返回为 "DCE|F|I|1909"
GetTrendContract('DCE|Z|I|NEARBY') 的返回为 "DCE|F|I|1907"

QuoteSvrState

### QuoteSvrState
**说明**
获取行情服务器的连接状态


**语法**
`int QuoteSvrState()`



**备注**
返回值 1表示连接， 2表示断开


**示例**
当行情服务器连接正常时，开启实盘交易
`if QuoteSvrState() == 1:`

StartTrade()

TradeSvrState

### TradeSvrState
**说明**
获取交易服务器的连接状态


**语法**
`int TradeSvrState(char server, string userNo='')`



**参数**
userNo 用户编号，为字符串，默认值为空


**备注**
返回值 1表示连接， 2表示断开


**示例**
TradeSvrState() # 获取用户通过界面设置的关联账号或通过 SetUserNo 设
置的第一个账户的连接状态
当账号 12345678 连接正常时，重启策略
`if TradeSvrState("12345678")==1:`

ReloadStrategy()


## 账户函数
A_AccountID

### A_AccountID
**说明**
返回当前公式应用的交易帐户 ID。


**语法**
string A_AccountID()


**备注**
返回的交易账号 ID为通过 SetUserNo 函数设置的第一个账号，或通过界
面添加策略时设置的关联账号。
若既通过 SetUserNo 又通过界面设置了账号，则以代码设置为准。
适用于实时行情交易，不推荐在历史回测阶段使用。

A_AllAccountID

### A_AllAccountID
**说明**
返回策略设置的所有交易帐户 ID。


**语法**
list A_AllAccountID()


**备注**
没有账号登录时，返回空列表
返回设置的所有账号
适用于实时行情交易，不推荐在历史回测阶段使用。

A_GetAllPositionSymbol

### A_GetAllPositionSymbol
**说明**
获得指定账户与策略相关的持仓合约。


**语法**
`list A_GetAllPositionSymbol(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
该函数返回类型为字符串列表，列表内容为账户中与策略相关的持仓合
约的合约编号。
如策略中订阅了 A、B合约， 账号中有 A、C合约的持仓， 则返回值为 [A]。

若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，获取历史阶段策略相关的持仓合约列表。

A_Cost

### A_Cost
**说明**
返回指定交易帐户的手续费。


**语法**
`float A_Cost(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的手续费，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，获取历史阶段策略虚拟账户的手续费。

A_Assets

### A_Assets
**说明**
返回指定交易帐户的动态权益。


**语法**
`float A_Assets(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的动态权益，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，获取历史阶段策略虚拟账户的当前权益。

A_Available

### A_Available
**说明**
返回指定交易帐户的可用资金。


**语法**
`float A_Available(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的可用资金，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，获取历史阶段策略虚拟账户的可用资金。

A_Margin

### A_Margin
**说明**
返回指定交易帐户的持仓保证金。


**语法**
`float A_Margin(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的持仓保证金，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseFor His()函数，则该函数可以在历
史阶段使用，获取历史阶段策略虚拟账户的持仓保证金。

A_ProfitLoss

### A_ProfitLoss
**说明**
返回指定交易帐户的浮动盈亏。


**语法**
`float A_ProfitLoss(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的浮动盈亏，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，获取历史阶段策略虚拟账户的浮动盈亏。

A_PerProfitLoss
"""

### """
**说明**
返回当前账户的逐笔浮盈。


**语法**
`float A_PerProfitLoss(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的逐笔浮盈，指定交易账号未登录时返回值为 0。
适用于实时行情交易，不推荐在历史回测阶段使用。
"""

A_CoverProfit

### A_CoverProfit
**说明**
返回当前账户的平仓盈亏。


**语法**
`float A_CoverProfit(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的平仓盈亏，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，获取历史阶段策略虚拟账户的平仓盈亏。

A_PerCoverProfit
"""

### """
**说明**
返回当前账户的逐笔平盈。


**语法**
`float A_PerProfitLoss(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的逐笔浮盈，指定交易账号未登录时返回值为 0。
适用于实时行情交易，不推荐在历史回测阶段使用。
"""

A_TotalFreeze

### A_TotalFreeze
**说明**
返回指定交易帐户的冻结资金。


**语法**
`float A_TotalFreeze(string userNo='')`



**参数**
userNo 指定的交易账户，默认当前账户


**备注**
返回指定交易帐户的冻结资金，指定交易账号未登录时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回 0。

A_BuyAvgPrice

### A_BuyAvgPrice
**说明**
返回指定帐户下当前商品的买入持仓均价。


**语法**
`float A_BuyAvgPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contr actNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的买入持仓均价，指定交易账号未登录或商品

不存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的买入持仓均价。

A_BuyPosition

### A_BuyPosition
**说明**
返回指定帐户下当前商品的买入持仓。


**语法**
`int A_BuyPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的买入持仓，指定交易账号未登录或商品不存
在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应 商品的买入持仓。


**示例**
当前持多仓 2手， A_BuyPosition 返回 2。

A_BuyPositionCanCover

### A_BuyPositionCanCover
**说明**
返回指定帐户下买仓可平数量。


**语法**
`int A_BuyPositionCanCover(string contractNo='', string userNo='', char`

hedge='')


**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和

相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
可平仓数量 =持仓数量 -已排队的挂单数量
指定交易账号未登录或商品不存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对 应账户对应商品的买入持仓。

A_BuyProfitLoss

### A_BuyProfitLoss
**说明**
返回指定帐户下当前商品的买入持仓盈亏。


**语法**
`float A_BuyProfitLoss(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的买入持仓盈亏，指定交易账号未登录或商品
不存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的买入持仓盈亏。

A_SellAvgPrice

### A_SellAvgPrice
**说明**
返回指定帐户下当前商品的卖出持仓均价。


**语法**
`float A_SellAvgPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数

设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的卖出持仓均价，指定交易账号未登录或商品
不存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的卖出持仓均价。

A_SellPosition

### A_SellPosition
**说明**
返回指定帐户下当前商品的卖出持仓。


**语法**
`int A_SellPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的卖出持仓，指定交易账号未登录或商品不存
在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的卖出持仓。


**示例**
当前持空仓 3手， A_SellPosition 返回 3。

A_SellPositionCanCover

### A_SellPositionCanCover
**说明**
返回指定帐户下卖仓可平数量。


**语法**
`int A_SellPositionCanCover(string contractNo='', string userNo='', char`


hedge='')


**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate( ) 投机
Enum_Hedge() 套保


**备注**
可平仓数量 =持仓数量 -已排队的挂单数量
指定交易账号未登录或商品不存在时返回值为 0
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的卖出持仓。 。

A_SellProfitLoss

### A_SellProfitLoss
**说明**
返回指定帐户下当前商品的卖出持仓盈亏。


**语法**
`float A_SellProfitLoss(string contractNo='', st ring userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的卖出持仓盈亏，指定交易账号未登录或商品
不存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的卖出持仓盈亏。

A_TotalAvgPrice

### A_TotalAvgPrice
**说明**
返回指定帐户下当前商品的持仓均价。


**语法**
`float A_TotalAvgPrice(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的持仓均价，指定交易账号未登录或商品不存
在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的持仓均价。

A_TotalPosition

### A_TotalPosition
**说明**
返回指定帐户下当前商品的总持仓。


**语法**
`int A_TotalPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的总持仓，指定交易账号未登录或商品不存在
时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商 品的总持仓。
该持仓为所有持仓的合计值，正数表示多仓，负数表示空仓，零为无持
仓。

A_TotalProfitLoss

### A_TotalProfitLoss
**说明**
返回指定帐户下当前商品的总持仓盈亏。


**语法**
`float A_TotalProfitLoss(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的总持仓盈亏，指定交易账号未登录或商品不
存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的总浮动盈亏。

A_TodayBuyPosition

### A_TodayBuyPosition
**说明**
返回指定帐户下当前商品的当日买入持仓。


**语法**
`int A_TodayBuyPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo ，指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Speculate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的当日买入持仓，指定交易账号未登录或商品
不存在时返回值为 0。

若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的当日买入持仓。

A_TodaySellPosition

### A_TodaySellPosition
**说明**
返回指定帐户下当前商品的当日卖出持仓。


**语法**
`int A_TodaySellPosition(string contractNo='', string userNo='', char hedge='')`



**参数**
contractNo 指定商品的合约编号，默认值为空，为空时采用基准合约编
号。
userNo 指定的交易账户，默认值为空，为空时使用通过 SetUserNo 函数
设置的第一个账号，或通过界面设置的关联账号；
hedge 定单的投保标志，不填时默认定单类型为投机，可选的枚举值和
相应含义为：
Enum_Specul ate() 投机
Enum_Hedge() 套保


**备注**
返回指定帐户下当前商品的当日卖出持仓，指定交易账号未登录或商品
不存在时返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户对应商品的当日卖出持仓。

A_OrderBuyOrSell

### A_OrderBuyOrSell
**说明**
返回指定帐户下当前商品的某个委托单的买卖类型。


**语法**
`char A_OrderBuyOrSell(int|string localOr derId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的买卖类型，返回值为：
'B' : 买入
'S' : 卖出
'A' : 双边
指定定单号不存在时返回值为空字符 ''。
指定定单号对应的合约在策略中没有订阅的话，返回值为 ''。
该函数返回值可以与 Enum_Buy 、Enum_Sell 等买卖状态枚举值进行比较，

根据类型不同分别处理。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的买卖类型。


**示例**
`nBorS = A_OrderBuyOrSell('1 -1')`

`if nBorS == Enum_Buy():`

...

A_OrderEntryOrExit

### A_OrderEntryOrExit
**说明**
返回指定帐户下当前商品的某个委托单的开平仓状态。


**语法**
`char A_OrderEntryOrExit(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的开平仓状态，返回值：
'N' : 无
'O' : 开仓
'C' : 平仓
'T' : 平今
'1' : 开平，应价时有效，本地套利也可以
'2' : 平开，应价时有效，本地套利也可以
指定定单号不存在时返回值为空字符 ''。
指定定单号对应的合约在策略中没有订阅的话，返回值为 ''。
该函数返回值可以与 Enum_Entry() 、Enum_Exit() 等开平仓状态枚举值进
行比较，根据类型不同分别处理。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的开平仓状态。


**示例**
`orderFlag = A_OrderEntryOrExit('1 -1')`

`if orderFlag == Enum_Exit():`

...

A_OrderFilledLot

### A_OrderFilledLot
**说明**
返回指定帐户下当前商品的某个委托 单的成交数量。


**语法**

`int A_OrderFilledLot(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的成交数量，指定定单号不存在
时返回值为 0。
指定定单号对应的合约在策略中没有订阅的话，返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的成交数量。

A_OrderFilledPrice

### A_OrderFilledPrice
**说明**
返回指定帐户下当前商品的某个委托单的成交价格。


**语法**
`float A_OrderFilledPrice(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的成交价格，指定定单号不存在
时返回值为 0。
指定定单号对应的合约在策略中没有订阅的话，返回值为 0。
该成交价格可能为多个成交价格的平均值。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的成交价格。

A_OrderFilledList
"""

### """
**说明**
返回定单的成交情况信息


**语法**
`list A_OrderFilledList(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个定单的成交信息，返回值为列表，列表
中为字典类型，字典类型中包含成交明细。

包含信息：
'UserNo': 用户名
'Sign': 关键字，用于区分连接的服务器
'Cont': 行情合约
'Direct': 买卖方向
'Offset': 开仓平仓  或 应价买入开平
'Hedge': 投机保值
'OrderNo': 委托号
'MatchPrice': 成交价
'MatchQty': 成交量
'FeeCurrency': 手续费币种
'MatchFee': 手续费
'MatchDateTime': 成交时间
'AddOne': T+1 成交
'Deleted': 是否删除
'MatchNo': 成交号
若定单号所对应的定单无成交信息，则返回空列表 []。
定单号对应的合约在策略中没有订阅的话，返回值为 []。
适用于实时行情交易，不推荐在历史回测阶段使用。
"""

A_OrderLot

### A_OrderLot
**说明**
返回指定帐户下当前商品的某个委托单的委托数量。


**语法**
`int A_OrderLot(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的委托数量，指定定单号不存在
时返回值为 0。
指定定单号对应的合约在策略中没有订阅的话，返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的委托数量。

A_OrderPrice

### A_OrderPrice
**说明**
返回指定帐户下当前商品的某个委托单的委托价格。


**语法**
`float A_OrderPrice(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的委托价格，指定定单号不存在
时返回值为 0。
指定定单号对应的合约在策略中没有订阅的话，返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的委托价格。

A_OrderStatus

### A_OrderStatus
**说明**
返回指定帐户下当前商品的某个委托单的状态。


**语法**
`char A_OrderStatus(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的 状态，返回值：
'N' : 无
'0' : 已发送
'1' : 已受理
'2' : 待触发
'3' : 已生效
'4' : 已排队
'5' : 部分成交
'6' : 完全成交
'7' : 待撤
'8' : 待改
'9' : 已撤单
'A' : 已撤余单
'B' : 指令失败
'C' : 待审核
'D' : 已挂起
'E' : 已申请
'F' : 无效单
'G' : 部分触发
'H' : 完全触发
'I' : 余单失败
该函数返回值可以与委托状态枚举函数 Enum_Sended() 、Enum_Accept()

等函数进行比较，根据类型不同分别处理。
指定定单号不存在时返回值为空字符串“” 。
指定定单号对应的合约在策略中没有订阅的话，返回值为“” 。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的状态。
'''

A_OrderIsClose

### A_OrderIsClose
**说明**
判断某个委托单是否完结。


**语法**
`int A_OrderIsClose(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
当委托单是完结状态，返回 1，否则返回 0。
当委托单不存在时返回 0。
当委托单对应的合约在策略中没有订阅的话，返回值为 1。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，若该定单在历史阶段存在，则返回 1，否则返回 0。

A_OrderTime

### A_OrderTime
**说明**
返回指定公式应用的帐户下当前商品的某个委托单的委托时间。


**语法**
`float A_OrderTime(int|string localOrderId='')`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
返回指定帐户下当前商品的某个委托单的委托时间，返回格式为
YYYYMMDD.hhmmss 的数值，当委托单不存在时返回 0。
如果委托单对应的合约在策略中没有订阅的话，返回值为 0。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的某个委托单的委托时间。

A_FirstOrderNo

### A_FirstOrderNo
**说明**
返回指定账户第一个定单号。


**语法**
`int A_FirstOrderNo(string contractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为遍历所有合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为 -1，表示没有任何定单，否则，返回第一个定单的索引值，
该函数经常和 A_NextOrderNo 函数合用，用于遍历所有的定单。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应的第一个定单号。

A_NextOrderNo

### A_NextOrderNo
**说明**
返回指定账户下一个定单号。


**语法**
`int A_NextOrderNo(int localOrderId=0, string contractNo='', string userNo ='')`



**参数**
localOrderId 定单号，默认为 0，
contractNo 合约代码，默认为遍历所有合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为 -1，表示没有任何定单，否则，返回处在 OrderNo 后面的定
单索引值，
该函数常和 A_FirstOrderNo 联合使用。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的下一个定单号。

A_LastOrderNo

### A_LastOrderNo
**说明**
返回指定账户最近发送的定单号。


**语法**
`int A_LastOrderNo(string contractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为遍历所有合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为 -1，表示没有任何定单， 否则， 返回最后一个定单的索引值。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户最近的定单号。

A_FirstQueueOrderNo

### A_FirstQueueOrderNo
**说明**
返回指定账户第一个排队 (可撤 )定单号。


**语法**
`int A_FirstQueueOrderNo(string contractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为遍历所有合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为 -1，表示没有任何可撤排队定单， 否则， 返回第一个定 单的索
引值。
该函数经常和 A_NextQueueOrderNo 函数合用，用于遍历排队中的定单。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数在历史阶
段返回 -1。

A_NextQueueOrderNo

### A_NextQueueOrderNo
**说明**
返回指定账户下一个排队 (可撤 )定单号。


**语法**
`int A_NextQueueOrderNo(int localOrderId=0, string contractNo='', string`

userNo='')


**参数**
localOrderId 定单号，默认为 0，
contractNo 合约代码，默认为遍历所有合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为 -1，表示没有任何排队定单，否则，返回处在 OrderNo 后面
的定单索引值，
该函数常和 A_FirstQueueOrderNo 联合使用。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数在历史阶
段返回 -1。

A_AllQueueOrderNo

### A_AllQueueOrderNo
**说明**
返回指定账户所有排队 (可撤 )定单号。


**语法**
`list A_AllQueueOrderNo(string contractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为遍历所有合约，指定后只遍历指定合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为空列表，表示没有任何排队定单，否则，返回包含处于排队
中的委托定单号的列表。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数在历史阶
段返回空列表。

A_LatestFilledTime

### A_LatestFilledTime
**说明**
返回指定账户最新一笔完全成交委托单对应的时间。


**语法**
`float A_LatestFilledTime(string contractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为遍历所有合约，指定后只遍历指定合约。
userNo 指定的交易账户，默认当前账户


**备注**
若返回值为 0，表示没有对应的完全成交的委托，否则， 返回最新一笔 完
全成交委托单对应的时间，返回格式为 YYYYMMDD.hhmmss 的数值。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的最新一笔成交定单的委托时间。

A_AllOrderNo

### A_AllOrderNo
**说明**
返回包含指定合约指定账户所有定单号的列表。


**语法**
`list A_AllOrderNo(string contractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为遍历所有合约，指定后只遍历指定合约。
userNo 指定的交易账户，默认当前账户


**备注**
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应的所有定单号的列表。

A_OrderContractNo

### A_OrderContractNo
**说明**
返回定单的合约号。


**语法**
`string A_OrderContractNo(int|string localOrderId=0)`



**参数**
localOrderId 定单号， 或者使用 A_SendOrder 返回的下单编号。


**备注**
返回结果如： "ZCE|F|TA|305" 等，
如果 localOrderId 没有对应的委托单，则返回结果为字符串。
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，返回回测阶段对应账户的定单的合约号。

A_SendOrder

### A_SendOrder
**说明**
针对指定的帐户、商品发送委托单。


**语法**
`int string A_SendOrder(char orderDirct, char entryOrExit, int orderQty, float`

orderPrice, string contractNo='', string userNo='', char orderType='2', char
validType='0', char hedge='T', char triggerType='N', char triggerMode='N', char
`triggerCondition='N', float triggerPrice=0)`



**参数**
orderDir ct 发送委托单的买卖类型，取值为 Enum_Buy() 或Enum_Sell() 之
一，
entryOrExit 发送委托单的开平仓类型， 取值为 Enum_Entry() ，Enum_Exit() ，
Enum_ExitToday() 之一，
orderQty 委托单的交易数量，
orderPrice 委托单的交易价格，
contractNo 商品合约编号，默认值为基准合约，
userNo 指定的账户名称，默认为界面选定的账户名称，
orderType 定单类型，字符类型，默认值为 '2'，可选值为 ：
'1' : 市价单
'2' : 限价单
...（详见文档）

可使用如 Enum_Order_Market() 、Enum_Order_Limit() 定单类型枚举函
数获取相应的类型，
validType 定单有效类型，字符类型，默认值为 '0'，可选值为：
'0' : 当日有效
...（详见文档）
可使用如 Enum_GFD() 定单有效类型枚举函数获取相应的类型，
hedge 投保标记，字符类型，默认值为 'T'，可选值为：
'T' : 投机
'B' : 套保
...（详见文档）
可使用如 Enum_Speculate() 、Enum_Hedge() 定单投保标记枚举函数获
取相应的类型，
triggerType 触发委托类型，默认值为 'N'，可用的值为：
'N' : 普通单
'P' : 预备单 (埋单 )
'A' : 自动单
'C' : 条件单
triggerMode 触发模式，默认值为 'N'，可用的值为：
'N' : 普通单
'L' : 最新价
'B' : 买价
'A' : 卖价
triggerCondition 触发条件，默认值为 'N'，可用的值为：
'N' : 无
'g' : 大于
'G' : 大于等于
'l' : 小于
'L' : 小于等于
triggerPrice 触发价格，默认价格为 0。


**备注**
针对当前公式指定的帐户、商品发送委托单，发送成功返回如 "1-2"的下
单编号，发送失败返回空字符串 ""。
返回结果形式为： retCode， retMsg，retCode的数据类型为可以为负的
整数，  retMsg的数据类型为字符串。
其中发送成功时 retCode为0，retMsg为返回的下单编号 localOrderId ，
其组成规则为：策略 id-该策略中发送委托单的次数，所以下单编号 "1-2"表示在
策略 id为1的策略中的第 2次发送委托单返回的下单编号。
当发送失败时 retCode为负数， retMsg为返回的发送失败的原因， retCode
可能返回的值及含义如下：
-1 : 未选择实盘运行，请在设置界面勾选 "实盘运行 "，或者在策略代
码中调用 SetActual() 方法选择实盘运行；
-2 : 策略当前状态不是实盘运行状态， 请勿 在历史回测阶段调用该函

数；
-3 : 未指定下单账户信息；
-4 : 输入的账户没有在极星客户端登录；
-5 : 请调用 StartTrade 方法开启实盘下单功能。
该函数直接发单，不经过任何确认，并会在每次公式计算时发送，一般
需要配合着仓位头寸进行条件处理，在不清楚运行机制的情况下，请慎用。

注意：
若在 initialize函数中调用了 SetAFunUseForHis() 函数，则该函数可以在历
史阶段使用，此时 retCode为负值， retMsg为历史阶段的定单编号。发送失败
retMsg为空字符串。


**示例**
`retCode, retMsg = A_SendOrder(Enum_Buy(), Enum_Exit(), 1, Q_AskPrice())`

当retCode为0时表明发送定单信息成功， retMsg为返回的下单编号
localOrderId 。

A_ModifyOrder

### A_ModifyOrder
**说明**
发送改单指令。


**语法**
`int A_ModifyOrder(int|string localOrderId, int orderQty, float orderPrice)`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号，
orderQty 委托单的交易数量，
orderPrice 委托单的交易价格，


**备注**
改单只对下单数量和下单价格生效。
针对指定定单发送改单指令，发送成功返回 1，发送失败返回 0。
该函数直接发单，不经过任何确认，并会在每次公式计算时发送，一般
需要配合着仓位头寸进行条件处理，在不清楚运行机制的情况下，请慎用。
适用于实时行情交易，不推荐在历史回测阶段使用。

A_DeleteOrder

### A_DeleteOrder
**说明**
针对指定帐户、商品发送撤单指令。


**语法**
`int A_DeleteOrder(int|string localOrderId)`



**参数**
localOrderId 定单号，或者使用 A_SendOrder 返回的下单编号。


**备注**
针对指定帐户、商品发送撤单指令，发送成功返回 1，发送失败返回 0。
该函数直接发单，不经过任何确认，并会在每次公式计算时发送，一般
需要配合着仓位头寸进行条件处理，在不清楚运行机制的情况下，请慎用。
适用于实时行情交易，不推荐在历史回测阶段使用。

A_GetOrderNo

### A_GetOrderNo
**说明**
获取下单编号对应的定单号和委托号。


**语法**
string, string A_GetOrderNo(string localOrderId)


**参数**
localOrderId 使用 A_SendOrder 返回的下单编号。


**备注**
针对 当 前 策 略 使用 A_Send Order返 回 的 下 单编 号 ， 可 以 使 用
A_GetOrderNo 获取下单编号对应的定单号和委托号。
由于使用 A_SendOrder 返回的下单编号 localOrderId 与策略相关，所以在
策略重启后 localOrderId 会发生变化。
由于委托单对应的定单号与客户端有关，所以在客户端重启后，委托单
对应的定单号可能会发生变化。
由于委托号是服务器生成的， 所以在使用 A_SendOrder 得到下单编号后，
如果服务器还没有返回相应的委托单信息， 可能获取不到相应的定单号和委托号。
当localOrderId 对应的定单号和委托号还没有从服务器返回， 则对应的值
为空字符串。
适用于实时行情交易，不推荐在历史回测阶段使用。


**示例**
`retCode, retMsg = A_SendOrder(.....)`

time.sleep(5)
if retCode == 0:
`sessionId, orderNo = A_GetOrderNo(retMsg)`


DeleteAllOrders

### DeleteAllOrders
**说明**
批量撤单函数。


**语法**

`void DeleteAllOrders(string co ntractNo='', string userNo='')`



**参数**
contractNo 合约代码，默认为所有合约，指定后只撤指定合约。
userNo 指定的交易账户，默认当前账户


**备注**
本函数将检查指定账户下所有处于排队状态的定单，并依次发送撤单指
令
适用于实时行情交易，不推荐在历史回测阶段使用。


## 枚举函数
Enum_Buy

### Enum_Buy
**说明**
返回买卖状态的买入枚举值


**语法**
char Enum_Buy()

Enum_Sell

### Enum_Sell
**说明**
返回买卖状态的卖出枚举值


**语法**
char Enum_Sell()

Enum_Entry

### Enum_Entry
**说明**
返回开平状态的开仓枚举值


**语法**
char Enum_Entry()

Enum_Exit

### Enum_Exit
**说明**
返回开平状态的平仓枚举值


**语法**
char Enum_Exit()

Enum_ExitToday

### Enum_ExitToday
**说明**

返回开平状态的平今枚举值


**语法**
char Enum_ExitToday()

Enum_EntryExitIgnore

### Enum_EntryExitIgnore
**说明**
返回开平状态不区分开平的枚举值


**语法**
char Enum_EntryExitIgnore()

Enum_Sended

### Enum_Sended
**说明**
返回委托状态为已发送的枚举值


**语法**
char Enum_Sended()

Enum_Accept

### Enum_Accept
**说明**
返回委托状态为已受理的枚举值


**语法**
char Enum_Accept()

Enum_Triggering

### Enum_Triggering
**说明**
返回委托状态为待触发的枚举值


**语法**
char Enum_Triggering()

Enum_Active

### Enum_Active
**说明**
返回委托状态为已生效的枚举值


**语法**
char Enum_Active()

Enum_Queued

### Enum_Queued
**说明**
返回委托状态为已排队的枚举值


**语法**
char Enum_Queued()

Enum_FillPart

### Enum_FillPart
**说明**
返回委托状态为部分成交的枚举值


**语法**
char Enum_FillPart()

Enum_Filled

### Enum_Filled
**说明**
返回委托状态为全部成交的枚举值


**语法**
char Enum_Filled()

Enum_Canceling

### Enum_Canceling
**说明**
返回委托状态为待撤的枚举值


**语法**
char Enum_Canceling()

Enum_Modifying

### Enum_Modifying
**说明**
返回委托状态为待改的枚举值


**语法**
char Enum_Modifying()

Enum_Canceled

### Enum_Canceled
**说明**
返回委托状态为已撤单的枚举值


**语法**
char Enum_Canceled()

Enum_PartCanceled

### Enum_PartCanceled
**说明**
返回委托状态为已撤余单的枚举值


**语法**
char Enum_PartCanceled()

Enum_Fail

### Enum_Fail
**说明**
返回委托状态为指令失败的枚举值


**语法**
char Enum_Fail()

Enum_Suspended

### Enum_Suspended
**说明**
返回委托状态为已挂起的枚举值


**语法**
char Enum_Suspended()

Enum_Apply

### Enum_Apply
**说明**
返回委托状态为已申请的枚举值


**语法**
char Enum_Apply()

Enum_Period_Tick

### Enum_Period_Tick
**说明**
返回周期类型成交明细的枚举值


**语法**
char Enum_Period_Tick()

Enum_Period_Min

### Enum_Period_Min
**说明**
返回周期类型分钟线的枚举值


**语法**
char Enum_Period_Min()

Enum_Period_Day

### Enum_Period_Day
**说明**
返回周期类型日线的枚举值


**语法**
char Enum_Period_Day()

RGB_Red

### RGB_Red
**说明**
返回颜色类型红色的枚举值


**语法**
`int RGB_Red()`



**备注**
返回 16进制颜色代码

RGB_Green

### RGB_Green
**说明**
返回颜色类型绿色的枚举值


**语法**
`int RGB_Green()`



**备注**
返回 16进制颜色代码

RGB_Blue

### RGB_Blue
**说明**
返回颜色类型蓝色的枚举值


**语法**
`int RGB_Blue()`



**备注**
返回 16进制颜色代码

RGB_Yellow

### RGB_Yellow
**说明**
返回颜色类型黄色的枚举值


**语法**
`int RGB_Yellow()`



**备注**
返回 16进制颜色代码

RGB_Purple

### RGB_Purple
**说明**
返回颜色类型紫色的枚举值


**语法**
`int RGB_Purple()`



**备注**
返回 16进制颜色代码

RGB_Gray

### RGB_Gray
**说明**
返回颜色类型灰色的枚举值


**语法**
`int RGB_Gray()`



**备注**
返回 16进制颜色代码

RGB_Brown

### RGB_Brown
**说明**
返回颜色类型褐色的枚举值


**语法**
`int RGB_Brown()`



**备注**
返回 16进制颜色代码

Enum_Order_Market

### Enum_Order_Market
**说明**
返回定单类型市价单的枚举值


**语法**
char Enum_Order_Market()

Enum_Order_Limit

### Enum_Order_Limit
**说明**
返回定单类型限价单的枚举值


**语法**
char Enum_Order_Limit()

Enum_Order_MarketStop

### Enum_Order_MarketStop
**说明**
返回定单类型市价止损单的枚举值


**语法**
char Enum_Order_MarketStop()

Enum_Order_LimitStop

### Enum_Order_LimitStop
**说明**
返回定单类型限价止损单的枚举值


**语法**
char Enum_Order_LimitStop()

Enum_Order_Execute

### Enum_Order_Execute
**说明**
返回定单类型行权单的枚举值


**语法**
char Enum_Order_Execute()

Enum_Order_Abandon

### Enum_Order_Abandon
**说明**
返回定单类型弃权单的枚举值


**语法**
char Enum_Order_Abandon()

Enum_Order_Enquiry

### Enum_Order_Enquiry
**说明**
返回定单类型询价单的枚举值


**语法**
char Enum_Order_Enquiry()

Enum_Order_Offer

### Enum_Order_Offer
**说明**
返回定单类型应价单的枚举值


**语法**
char Enum_Order_Offer()

Enum_Order_Iceberg

### Enum_Order_Iceberg
**说明**
返回定单类型冰山单的枚举值


**语法**
char Enum_Order_Iceberg()

Enum_Order_Ghost

### Enum_Order_Ghost
**说明**
返回定单类型影子单的枚举值


**语法**
char Enum_Order_Ghost()

Enum_Order_Swap

### Enum_Order_Swap
**说明**
返回定单类型互换单的枚举值


**语法**
char Enum_Order_Swap()

Enum_Order_SpreadApply

### Enum_Order_SpreadApply
**说明**
返回定单类型套利申请的枚举值


**语法**
char Enum_Order_SpreadApply()

Enum_Order_HedgApply

### Enum_Order_HedgApply
**说明**
返回定单类型套保申请的枚举值


**语法**
char Enum_Order_HedgApply( )

Enum_Order_OptionAutoClose

### Enum_Order_OptionAutoClose
**说明**
返回定单类型行权前期权自对冲申请的枚举值


**语法**
char Enum_Order_OptionAutoClose()

Enum_Order_FutureAutoClose

### Enum_Order_FutureAutoClose
**说明**
返回定单类型履约期货自对冲申请的枚举值


**语法**
char Enum_Order_FutureAutoClose()

Enum_Order_MarketOptionKeep

### Enum_Order_MarketOptionKeep
**说明**
返回定单类型做市商留仓的枚举值


**语法**
char Enum_Order_MarketOptionKeep()

Enum_GFD

### Enum_GFD
**说明**
返回定单有效类型当日有效的枚举值


**语法**
char Enum_GFD()

Enum_GTC

### Enum_GTC
**说明**
返回定单有效类型长期有效的枚举值


**语法**
char Enum_GTC()

Enum_IOC

### Enum_IOC
**说明**
返回定单有效类型即时部分有效的枚举值


**语法**
char Enum_IOC()

Enum_FOK

### Enum_FOK
**说明**
返回定单有效类型即时全部有效的枚举值


**语法**
char Enum_FOK()

Enum_Speculate

### Enum_Speculate
**说明**
返回定单投保标记投机的枚举值


**语法**
char Enum_Speculate()

Enum_Hedge

### Enum_Hedge
**说明**

返回定单投保标记套保的枚举值


**语法**
char Enum_Hedge()

Enum_Spread

### Enum_Spread
**说明**
返回定单投保标记套利的枚举值


**语法**
char Enum_Spread()

Enum_Market

### Enum_Market
**说明**
返回定单投保标记做市的枚举值


**语法**
char Enum_Market()

Enum_Data_Close

### Enum_Data_Close
**说明**
返回收盘价的枚举值


**语法**
char Enum_Data_Close()

Enum_Data_Open

### Enum_Data_Open
**说明**
返回开盘价的枚举值


**语法**
char Enum_Data_Open()

Enum_Data_High

### Enum_Data_High
**说明**
返回最高价的枚举值


**语法**
char Enum_Data_High()

Enum_Data_Low

### Enum_Data_Low
**说明**
返回最低价的枚举值


**语法**
char Enum_Data_Low()

Enum_Data_Median

### Enum_Data_Median
**说明**
返回中间价的枚举值，中间价 =（最高价 +最低价） / 2


**语法**
char Enum_Data_Median()

Enum_Data_Typical

### Enum_Data_Typical
**说明**
返回标准价的枚举值，标准价 =（最高价 +最低价 +收盘价） / 3


**语法**
char Enum_Data_Typical()

Enum_Data_Weighted

### Enum_Data_Weighted
**说明**
返回加权收盘价的枚举值，加权收盘价 =（最高价 +最低价 +开盘价 +收盘
价） / 4


**语法**
char Enum_Data_Weighted()

Enum_Data_Vol

### Enum_Data_Vol
**说明**
返回成交量的枚举值


**语法**
char Enum_Data_Vol()

Enum_Data_Opi

### Enum_Data_Opi
**说明**
返回持仓量的枚举值


**语法**
char Enum_Data_Opi()

Enum_Data_Time

### Enum_Data_Time
**说明**
返回 K线时间的枚举值


**语法**

char Enum_Data_Time()


## 设置函数
SetUserNo

### SetUserNo
**说明**
设置实盘交易账户


**语法**
`int SetUserNo(string userNo1, string userNo2, string userNo3, ...)`



**参数**
userNo* 实盘交易账户 ID，不能为空字符串


**备注**
返回 0成功， -1失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetUserNo('ET001')
SetUserNo('ET001', 'ET002', 'ET003')

SetBarInterval

### SetBarInterval
**说明**
设置指定合约的 K线类型和 K线周期，以及策略历史回测的起始点信息


**语法**
`int SetBarInterval(string contractNo, char barType, int barInterval,`

int|string|char sampleConfig=2000, barDataLen=2000, isTrigger=Fa lse)


**参数**
contractNo 合约编号
barType K 线类型  T分笔， M分钟， D日线
barInterval K 线周期
sampleConfig 策略历史回测的起始点信息，可选的值为：
字符 A : 使用所有 K线
字符 N : 不执行历史 K线
整数  : 历史回测使用的 K线根数
字符串  : 用于历史回测样本的起始日期，格式为 YYYYMMDD ，精确
到日，例如 2019 -04-30的日期格式为 '20190430'
默认为使用 2000根K线进行回测
barDataLen 引用根数，默认值为 2000
isTrigger  设置非基准合约是否触发，基准合约设置该参数无效，默认值

为False


**备注**
返回整型， 0成功， -1失败
通过该方法系统会订阅指定合约的 K线数据，
对于相同的合约，如果使用该函数设置不同的 K线类型 (barType) 和周期
(barInterval) ，则系统会同时订阅指定的 K线类型和周期的行情数据
如果使用该方法订阅了多个合约，则第一个合约为基准合约
如果在策略中使用 SetBarInterval 方法订阅了合约，则在设置界面选中的
基准合约便不再订阅
若要订阅秒线数据，可以设置 K线类型为 'T'，K线周期为 n(n>0)，则表示
订阅 n秒的 K线。
由于秒线是由 tick数据合成的，若使用固定根数订阅秒线数据，订阅的
数据长度并不一定是设置的 K线根数，建议设置 sampleConfig 为“使用所有 K
线”或“起始日期”订阅秒线数据
若要订阅 tick数据，可以设置 K线类型为 'T'，K线周期为 0，则表示订阅
tick数据。

barDataLen 用于设置 K线数据函数 （如 Open、Close、High、Low、Vol等）
所能取到的最大数据长度。
可通过给 barDataLen 设置合适的值以适当提高 K线数据函数访问数据的
效率。例如，若不需要访问太多历史 K线数据，可设置 barDataLen 为一个较小
的值。
注意：若 barDataLen 的值大于当前策略中所能取到的最大数据长度，则
K线数据函数只能取到策略所能提供的数据长度。

该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
订阅合约 ZCE|F|SR|109 的3分钟 K线数据，并使用所有 K线样本进行历
史回测
SetBar Interval('ZCE|F|SR|109', 'M', 3, 'A')
订阅合约 ZCE|F|SR|109 的3分钟 K线数据，并不使用 K线样本进行历史
回测
SetBarInterval('ZCE|F|SR|109', 'M', 3, 'N')
订阅合约 ZCE|F|SR|109 的3分钟 K线数据，并使用 2000根K线样本进
行历史回测
SetBarInterval('ZCE|F|SR|109', 'M', 3, 2000)
订阅合约 ZCE|F|SR|109 的3分钟 K线数据，由于 sampleCo nfig的默认值
为2000，所以使用 2000根K线样本进行历史回测
SetBarInterval('ZCE|F|SR|109', 'M', 3)
订阅合约 ZCE|F|SR|906 的3分钟 K线数据， 并使用 2019 -04-30起的 K线
进行历史回测
SetBarInterval('ZCE|F|SR|109', 'M', 3, '20190430')

订阅合约 ZCE|Z|SR|MAIN 的1秒钟 K线数据，并使用 2000根K线样本
进行历史回测
SetBarInterval(' ZCE|Z|SR|MA IN', 'T', 1, 2000)
订阅合约 ZCE|F|SR|109 的tick数据，并使用所有 K线样本进行历史回测
SetBarInterval(' ZCE|F|SR|109', 'T', 0, 'A')
订阅合约 ZCE|F|SR|109 的1分钟 K线数据，并使用 2000根K线样本进
行历史回测，引用根数设置为 200
SetBarInterval(' ZC E|Z|SR|109', 'M', 1, 2000, 200)

SetInitCapital

### SetInitCapital
**说明**
设置初始资金，不设置默认 100万


**语法**
`int SetInitCapital(float capital=10000000)`



**参数**
capital 初始资金，默认为 10000000


**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetInitCapital(200*10000) ，设置初始资金为 200万

SetMargin

### SetMargin
**说明**
设置保证金参数，不设置或设置失败取界面设置的保证金比例


**语法**
`int SetMargin(float type, float value=0, string contractNo='')`



**参数**
type 0：按比例收取保证金，  1：按定额收取保证金，
value 按比例收取保证金时的比例，  或者按定额收取保证金时的额度，
contractNo 合约编号，默认为基础合约。


**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetMargin(0, 0.08) 设置基础合约的保证金按比例收取 8%

SetMargin(1, 80000, 'ZCE|F|SR|906') 设置合约 ZCE|F|SR|906 的保证金按
额度收取 80000

SetTradeFee

### SetTradeFee
**说明**
设置手续费收取方式


**语法**
`int SetTradeFee(string type, int feeType, float feeValue, string contractNo='')`



**参数**
type 手续费类型， 'A'-全部， 'O'-开仓， 'C'-平仓， 'T'-平今
feeType 手续费收取方式， 1-按比例收取， 2-按定额收取
feeValue 按比例收取手续费时， feeValue 为收取比例；按定额收取手续
费时， feeValue 为收取额度
contractNo 合约编号，默认为基础合约

**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetTradeFee('O', 2, 5) 设置基础合约的开仓手续费为 5元/手
SetTradeFee('O', 1, 0.02) 设置基础合约的开仓手续费为每笔 2%
SetTradeFee('T', 2, 5, "ZCE|F|SR|906") 设置合约 ZCE|F|SR|906 的平今手
续费为 5元/手

SetAc tual

### SetAc tual
**说明**
设置策略在实盘上运行


**语法**
`int SetActual()`



**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。

SetOrderWay

### SetOrderWay
**说明**
设置发单方式


**语法**
`int SetOrderWay(int type)`



**参数**
type 在实盘上的发单方式， 1 表示实时发单， 2 表示 K线完成后发单


**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetOrderWay(1) # 在实盘上使用实时数据运行策略，实时发单
SetOrderWay(2) # 在实盘上使用实时数据运行策略，在 K线稳定后发单

SetTradeDirection

### SetTradeDirection
**说明**
设置交易方向


**语法**
`int SetTradeDirection(int tradeDirection)`



**参数**
tradeDirection 设置交易方向
0 : 双向交易
1 : 仅多头
2 : 仅空头


**备注**
返回整型， 0成功， -1失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetTradeDirection(0) # 双向交易

SetMinTradeQuantity

### SetMinTradeQuantity
**说明**
设置最小下单量，单位为手，默认值为 1手。


**语法**
`int SetMinTradeQuantity(int tradeQty=1)`



**参数**
tradeQty 最小下单量，默认为 1，不超过 1000


**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。

SetHedge

### SetHedge
**说明**
设置投保标志


**语法**
`int SetHedge(char hedge)`



**参数**
hedge 投保标志
'T' : 投机
'B' : 套保


**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。


**示例**
SetHedge('T') # 设置基础合约的投保标志为投机

SetSlippage

### SetSlippage
**说明**
设置滑点损耗


**语法**
`int SetSlippage(int slippage)`



**参数**
slippage 滑点损耗


**备注**
返回值 0表示成功， -1表示失败
该函数只能在初始化函数 initialize中调用，否则会提示错误。

SetTriggerType

### SetTriggerType
**说明**
设置触发方式


**语法**
`int SetTriggerType(int type, int|list value=None)`



**参数**
type 触发方式，可使用的值为：
1 : 即时行情触发

2 : 交易数据触发
3 : 每隔固定时间触发
4 : 指定时刻触发
5 : K线触发
6 : 连接状态触发
`value 当触发方式是为每隔固定时间触发 (type=3)时， value为触发间隔，`

单位为毫秒，必须为 100的整数倍，
`当触发方式为指定时刻触发 (type=4)时， value为触发时刻列表，时间的`

格式为 '20190511121314'
当type为其他值时，该值无效，可以不填


**备注**
返回值 0表示成功， -1表示失败

即时行情触发：订阅的合约的即时行情更新时会触发策略，运行策略的
handle_data() 函数
交易数据触发：订单的状态发生改变和交易所或品种的状态发生改变时
会触发策略，运行策略的 handle_data() 函数
每隔固定时间触发：每隔固定的时间间隔会触发策略，运行策略的
handle_data() 函数
指定时刻触发： 在用户指定的时刻会触发策略， 运行策略的 handle_data()
函数
K线触发：  由K线数据触发策略，运行策略的 handle_data() 函数
连接状态触发：行情服务器的连接状态以及交易账号的连接状态的改变
会触发策略，运行策略的 handle_data() 函数

注意：
a:当订阅交易数据触发时，只有与策略相关联的合约的交易数据的变化
才会触发策略
b:只有通过 SetUserNo 设置的账号或在界面上通过关联账号设置的账号
的连接状态改变才会触发策略，与策略无关的账号的状态改变不会触发策略
c:与策略相关联的合约的交易所和品种的状态发生改变才会触发策略

该函数除设置触发方式 3外，设置其余触发方式只能在初始化函数
initialize中调用，否则会提示错误。
该函数在设置触发方式 3时，可以在除 initialize 函数外的其他函数中设
置，即动态设置固定时间间隔触发，如：
调用 SetTriggerType(3, 1000) 时，设置每隔 1秒触发
调用 SetTriggerType(3, 0) 时，取消设置的固定时间间隔触发


**示例**
SetTriggerType(3, 1000) # 每隔 1000毫秒触发一次
SetTriggerType(4, ['084000', '084030', '084100']) # 指定时刻触发

SetLogLevel

### SetLogLevel
**说明**
设置输出日志的显示级别


**语法**
`void SetLogLevel(int level)`



**参数**
level 日志级别，可使用的值为：
1 : 显示 LogD ebug()、LogInfo()、LogWarn() 和LogError() 函数输出的所
有级别的日志
2 : 显示 LogInfo()、LogWarn() 和LogError() 函数输出的日志
3 : 显示 LogWarn() 和LogError() 函数输出的日志
4 : 只显示用 LogError() 函数输出的日志
5 : 客户端上不显示日志函数输出的日志


**示例**
SetLogLevel(2) # 显示用 LogInfo、LogWarn 和LogError函数输出的日志
SetLog Level(5) # 所有的日志均不在界面上显示

SetAFunUseForHis

### SetAFunUseForHis
**说明**
设置账户函数可以在历史阶段使用


**语法**
void SetAFunUseForHis()


**备注**
调用该函数可以设置账户函数分类中的函数在历史阶段获取回测阶段对
应的相关信息，进入实盘后获得实盘账户对应的信息。

SetWinPoint

### SetWinPoint
**说明**
设置止盈点


**语法**
`void SetWinPoint(int winPoint, int nPriceType = 0, int nAddTick = 0, string`

contractNo = "")


**参数**
`winPoint 赢利点数值，若当前价格相对于最近一次开仓价格的盈利点数`

达到或超过该值，就进行止盈；
nPriceType 平仓下单价格类型  0:最新价  1：对盘价  2：挂单价  3：市价
4：停板价，默认值为 0；

nAddTick 超价点数  仅当 nPrice为0，1，2时有效，默认为 0；
contractNo 合约代码，默认为基准合约。


**备注**
止损止盈只对用 Buy、Sell函数下单的 方式有效， A_SendOrder 函数因为
在历史阶段下单调用的是 Buy、Sell函数，因此止损止盈对 A_SendOrder 函数在
历史阶段下单也生效


**示例**
SetWinPoint(10) # 当价格相对于最近一次开仓价格超过 10个点，进行止
盈平仓。 如郑棉合约多头： 开仓价格为 15000， 当前价格大于或等于 5*10=50 时，
即达到 15050，则进行平仓。

SetStopPoint

### SetStopPoint
**说明**
设置止损点


**语法**
`void SetStopPoint(int stopPoint, int nPriceType = 0, int nAddTick = 0, string`

contractNo = "")


**参数**
`stopPoint 止损点数，若当前价格相对于最近一次开仓价格亏损点数达到`

或跌破该值，就进行止损；
nPriceType 平仓下单价格类型  0:最新价  1：对盘价  2：挂单价  3：市价
4：停板价，默认值为 0；
nAddTick 超价点数  仅当 nPrice为0，1，2时有效，默认为 0；
contractNo 合约代码，默认为基准合约。


**备注**
止损止盈只 对用 Buy、Sell函数下单的方式有效， A_SendOrder 函数因为
在历史阶段下单调用的是 Buy、Sell函数，因此止损止盈对 A_SendOrder 函数在
历史阶段下单也生效


**示例**
SetStopPoint(10) # 当价格跌破 10个点，进行止损平仓。  如：如郑棉合
约多头：开仓价格为 15000，当前价格小于或等于 5*10=50 时，即达到 14950，
则进行平仓。

SetFloatStopPoint

### SetFloatStopPoint
**说明**
设置浮动止损点


**语法**

`int SetFloatStopPoint(i nt startPoint, int stopPoint, int nPriceType = 0, int`

nAddTick = 0, string contractNo = "")


**参数**
`startPoint 启动点数， 当前价格相对于最后一次开仓价格盈利点数超过该`

值后启动浮动止损监控；
`stopPoint 止损点数，若当前价格相对于最近一次开仓价格亏损点数达到`

或跌破该值，就进行止损；
nPriceType 平仓下单价格类型  0:最新价  1：对盘价  2：挂单价  3：市价
4：停板价，默认为 0；
nAddTick 超价点数  仅当 nPrice为0，1，2时有效，默认为 0；
contractNo 合约代码，默认为基准合约。


**备注**
止损止盈只对用 Buy、Sell函数下单的方式有效， A_SendOrder 函数因为
在历史阶段下单调用的是 Buy、Sell函数，因此止损止盈对 A_SendOrder 函数在
历史阶段下单也生效


**示例**
SetFloatStopPoint(20,10)
举例：郑棉合约，多头方向。开仓价格为 15000，当前价格突破 15100后
开启浮动 止损， 若此， 止损点会随着价格上升而不断上升。 假如价格上涨到 15300，
则此时的止损价格为 (15300 -50)，即 15250，若价格从 15300回落到 15250，则进
行自动平仓。

SetStopWinKtBlack

### SetStopWinKtBlack
**说明**
设置不触发止损止盈和浮动止损的 K线类型


**语法**
`int SetStopWinKtBlack(op, kt)`



**参数**
op 操作类型必须为  0: 取消设置， 1: 增加设置，中的一个
kt K线类型必须为  'D'，'M'，'T'，中的一个


**备注**
返回整型， 0成功， -1失败
止损止盈只对用 Buy、Sell函数下单的方式有效， A_SendOrder 函数因为
在历史阶段下单调用的是 Buy、Sell函数，因此止损止盈对 A_SendOrder 函数在
历史阶段下单也生效

SubQuote

### SubQuote
**说明**

订阅指定合约的即时行情。


**语法**
`int SubQuote(string contractNo1, string contractNo2, string contractNo3, ...)`



**参数**
contractNo 合约编号，为空不做任何操作


**备注**
该函数只能在初始化函数 initialize中调用，否则会提示错误。
最多支持订阅十个合约


**示例**
SubQuote("ZCE|F|TA|909") 订阅合约 TA909的即时行情；
SubQuote("ZCE|F|TA|909", "ZCE|F|TA|910") 订阅合约 TA909和TA910的
即时行情；
SubQuote("ZCE|F|TA") 订阅 TA品种下所有合约的即时行情

UnsubQuote

### UnsubQuote
**说明**
退订指定合约的即时行情。


**语法**
`int UnsubQuote(string contractNo1, string contractNo2, string`

contractNo3, ...)


**参数**
contractNo 合约编号


**备注**
暂时不支持退订即时行情，该函数无效


## 绘图函数
PlotNumeric

### PlotNumeric
**说明**
在当前 Bar输出一个数值


**语法**
`void PlotNumeric(string name,float value,int color=0xdd0000,bool main=True,`

`char axis=False, int barsback=0)`



**参数**

name 输出值的名称，不区分大小写；
value 输出的数值；
color 输出值的显示颜色，默认表示使用属性设置框中的颜色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图
axis 指标是否使用独立坐标， True -独立坐标， False -非独立坐标，默认非
独立坐标
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出一个数值，输出的值用于在上层调用模块显示


**示例**
PlotNumeric ("MA1",Ma1Value)
输出 MA1的值。

PlotIcon

### PlotIcon
**说明**
在当前 Bar输出一个图标


**语法**
`void PlotIcon(float value,int icon=0, bool main=True, int barsback=0)`



**参数**
value 输出的值
icon 图标类型， 0-默认图标， 1-笑脸， 2-哭脸， 3-上箭头， 4-下箭头， 5-
上箭头 2，6-下箭头 2
7-喇叭， 8-加锁， 9-解锁， 10-货币 +，11-货币 -，12-加号， 13-
减号， 14-叹号， 15-叉号，默认值为 0
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出一个图标，输出的值用于在上层调用模块显示


**示例**
PlotIcon(10,14)

PlotDot

### PlotDot
**说明**
在当前 Bar输出一个点


**语法**
`void PlotDot(string name, float value, int icon=0, int color=0xdd0000, bool`

`main=True, int barsback=0)`



**参数**
value 输出的值
icon 图标类型 0-15，共 15种样式，包括箭头，圆点，三角等，默认值为
0
color 输出值的显示颜色，默认表示使用属性设置框中的颜色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出一个点，输出的值用于在上层调用模块显示。

icon图标类型如下：
0：↑
1：↓
2：●
3：→
4：▲
5：▼
6：▲
7：▼
8：?
9：?
10：□
11：+
12: ×
13: ○
14: ?
15: ◆


**示例**
`PlotDot(name="Dot", value=Close()[ -1], main=True)`


PlotBar

### PlotBar
**说明**
绘制一根 Bar


**语法**
`void PlotBar(string name, float vol1, float vol2, int color=0x999999, bool`

`main=True, bool filled=True, int barsback=0)`



**参数**
name bar 名称
vol1 柱子起始点

vol2 柱子结束点
color 输出值的显示颜色，默认表示使用属性设 置框中的颜色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图
filled 是否填充，默认填充
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出一个 Bar，输出的值用于在上层调用模块显示。


**示例**
PlotBar("BarExample1", Vol()[ -1], 0, RGB_Red())

PlotText

### PlotText
**说明**
在当前 Bar输出字符串


**语法**
`void PlotText(float coord, string text, int color=0x999999, bool main=True, int`

barsback=0)


**参数**
coord 输出的价格
text 输出的字符串，最多支持 19个英文字符
color 输出值的显示颜色，默认表示使用属性设置框中的颜色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出字符串，输出的值用于在上层调用模块显示。


**示例**
`PlotText(Close()[ -1], "ORDER", main=True)`


PlotVertLine

### PlotVertLine
**说明**
在当前 Bar输出一个竖线


**语法**
`void PlotVertLine(int color=0xdd0000, bool main=True, bool axis=False, int`

barsback=0)


**参数**
color 输出值的显示颜色，默认表示使用属性设置框中的颜色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图

axis 指标是否使用独立坐标， True -独立坐标， False -非独立坐标，默认非
独立坐标
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出一条竖线，输出的值用于在上层调用模块显示。


**示例**
`PlotVertLine(main=True, axis = True)`


PlotPartLine

### PlotPartLine
**说明**
绘制斜线段


**语法**
`void PlotPa rtLine(string name, int index1, float price1, int count, float price2,`

`int color=0xdd0000, bool main=True, bool axis=False, int width=1)`



**参数**
name 名称
index1 起始 bar索引
price1 起始价格
count 从起始 bar回溯到结束 bar的根数
price2 结束价格
color 输出值的显示颜色，默认表示使用属性设置框中的颜 色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图
axis 指标是否使用独立坐标， True -独立坐标， False -非独立坐标，默认非
独立坐标
width 线段宽度，默认 1


**备注**
在指定区间输出一个斜线，输出的值用于在上层调用模块显示。


**示例**
`idx1 = CurrentBar()`

`p1 = Close()[ -1]`

if idx1 >= 100:
count = 1
`p2 = Close()[ -2]`

PlotPartLine("PartLine", idx1, p1, count, p2, RGB_Red(), True, True, 1)

PlotStickLine

### PlotStickLine
**说明**
绘制竖线段


**语法**
`void PlotStickLine(string name, float price1, float price2, int color=0xdd0000,`

`bool main=True, bool axis=False, int barsback=0)`



**参数**
name 名称
price1 起始价格
price2 结束价格
color 输出值的显示颜色，默认表示使用属性设置框中的颜色；
main 指标是否加载到主图， True -主图， False -幅图，默认主图
axis 指标是否使用独立坐标， True -独立坐标， False -非独立坐标，默认非
独立坐标
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**备注**
在当前 Bar输出一个竖线段，输出的值用于在上层调用模块显示。


**示例**
PlotStickLine("StickLine", Close()[ -1], Open()[ -1], RGB_Blue(), True, True, 0)

UnPlotText

### UnPlotText
**说明**
在当前 Bar取消输出的字符串


**语法**
`void UnPlotText(bool main=True, int barsback=0)`



**参数**
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**
UnPlotText()

UnPlotIcon

### UnPlotIcon
**说明**
在当前 Bar取消输出的 Icon


**语法**
`void UnPlotIcon(bool main=True, int barsback=0)`



**参数**

main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**
UnPlotIcon()

UnPlotDot

### UnPlotDot
**说明**
在当前 Bar取消输出的 Dot


**语法**
`void UnPlotDot(string name, bool main=True, int barsback=0)`



**参数**
name 名称
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**
UnPlotDot("Dot")

UnPlotBar

### UnPlotBar
**说明**
在当前 Bar取消输出的 Bar


**语法**
`void UnPlotBar(string name, bool main=True, int barsback=0)`



**参数**
name 名称
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**

UnPlotBar( "Bar")
UnPlotNumeric

### UnPlotNumeric
**说明**
在当前 Bar取消输出的 Numeric


**语法**
`void UnPlotNumeric(string name, bool main=True,  int barsback=0)`



**参数**

name 名称
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**
UnPlotNumeric("numeric")

UnPlotVertLine

### UnPlotVertLine
**说明**
在当前 Bar取消输出的竖线


**语法**
`void UnPlotVertLine(bool main=True, int barsback=0)`



**参数**
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**
UnPlotVertLine()

UnPlotPartLine

### UnPlotPartLine
**说明**
在当前 Bar取消输出的斜线段


**语法**
`void UnPlotPartLine(string name, int index1, int count, bool main=True)`



**参数**
name 名称
index1 起始 bar索引
count 从起始 bar回溯到结束 bar的根数
main 指标是否加载到主图， True -主图， False -幅图，默认主图


**示例**
UnPlotPartLine("PartLine", idx1, count, True)

UnPlotStickLine

### UnPlotStickLine
**说明**
在当前 Bar取消输出的竖线段


**语法**
`void UnPlotStickLine(string name, bool main=True, int barsback=0)`



**参数**
name 名称
main 指标是否加载到主图， True -主图， False -幅图，默认主图
barsback 从当前 Bar向前回溯的 Bar数，默认值为当前 Bar。


**示例**
UnPlotStickLine("StickLine")


## 统计函数
SMA

### SMA
**说明**
获取加权移动平均值

**语法**
`SMA(numpy.array price, int period, int weight)`


**参数**
price 序列值， numpy数组
period 周期
weight 权重


**备注**
返回值为浮点型 numpy.array ；
如果计算成功，此时返回值是计算出的 sma值序列；
如果计算失败，此时返回值 numpy.array 为空


**示例**
SMA(Close(), 12, 2)

ParabolicSAR

### ParabolicSAR
**说明**
计算抛物线转向

**语法**
`ParabolicSAR(numpy.array high, numpy.array low, float afstep, float aflimit)`


**参数**
high 最高价序列值， numpy数组
low 最低价序列值， numpy数组
afstep 加速因子
aflimit 加速因子的限量


**备注**
返回值为四个值，均为数值型 numpy.array
第一个值序列为 oParClose ，当前 bar的停损值；
第二个值序列为 oParOpen ，下一 Bar的停损值；

第三个值序列为 oPosition ，输出建议的持仓状态， 1 - 买仓， -1 - 卖仓；
第四个值序列为 oTransition ，输出当前 Bar的状态是否发生反转， 1 或 -
1 为反转， 0 为保持不变。
当输入 high，low的numpy数组为空时，计算失败，返回的四个值均为
空的 numpy.array


**示例**
ParabolicSAR(High(), Low(), 0.02, 0.2)

REF

### REF
**说明**
求N周期前数据的值

**语法**
`float REF(numpy.array price,int length)`



**参数**
Price 价格
Length 需要计算的周期数。


**备注**
Length不能小于 0


**示例**
获得上一周期的收盘价，等价于 Close[ -2]
REF( Close(), 1)
返回 10周期前的高低收价格的平均值
REF((Close() + High() + Low())/ 3, 10)

Highest

### Highest
**说明**
求最高


**语法**
`numpy.array Highest(list|numpy.array price, int length)`



**参数**
price 用于求最高值的值，必须是数值型列表；
length 需要计算的周期数，为整型。


**备注**
该函数计算指定周期内的数值型序列值的最高值，返回值为浮点数数字
列表 ;
当price的类型不是 list或者 price的长度为 0时，则返回为空的
numpy.array()


**示例**
Highest (Close(), 12); 计算 12周期以来的收盘价的最高值；
Highest (HisData(Enum_Data_Typical()), 10); 计算 10周期以来高低收价格
的平均值的最高值。

Lowest

### Lowest
**说明**
求最低


**语法**
`numpy.array Lowest(list|numpy.array price, int length)`



**参数**
price 用于求最低值的值，必须是数值型列表；
length 需要计算的周期数，为整型。


**备注**
该函数计算指定周期内的数值型序列值的最低值，返回值为浮点数数字
列表 ;
当price的类型不是 list或者 price的长度为 0时，则返回为空的
numpy.array()


**示例**
计算 12周期以来的收盘价的最低值
Lowest (Close(), 12)
计算 10周期以来高低 收价格的平均值的最低值
Lowest (HisData(Enum_Data_Typical()), 10)

CountIf

### CountIf
**说明**
获取最近 N周期条件满足的计数


**语法**
`int CountIf(bool condition, int period)`



**参数**
condition 传入的条件表达式；
period 计算条件的周期数


**备注**
获取最近 N周期条件满足的计数


**示例**

CountIf(Close() > Open(), 10); 最近 10周期出现 Close>Open 的周期总数

CrossOver

### CrossOver
**说明**
求是否上穿


**语法**
Bool CrossOver(np.array Price1, np.array Price2)


**参数**
Price1 求相关系统的数据源 1，必须是 np数组 ;
Price2 求相关系统的数据源 2，必须是 np数组 ;


**备注**
该函数返回 Price1数值型序列值是否上穿 Price2数值型序列值，返回值
为布尔型。


**示例**
CrossOver(Close[1], AvgPri ce); 判断上一个 Bar的收盘价 Close是否上穿
AvgPrice，
注意： 在使用判断穿越的函数时，要尽量避免使用例如 close等不确定的
元素，否则会导致信号消失，
一般情况下， Close可以改用 High和Low分别判断向上突破（函数
CrossOver ）和向下突破（函数 CrossUnder ）。

CrossUnder

### CrossUnder
**说明**
求是否下破


**语法**
Bool CrossUnder(np.array Price1, np.array Price2)


**参数**
Price1 求相关系统的数据源 1，必须是 np数组 ;
Price2 求相关系统的数据源 2，必须是 np数组 ;


**备注**
该函数返回 Price1数值型序列值是否上穿 Price2数值型序列值，返回值
为布尔型。


**示例**
CrossOver(Close[1], AvgPrice); 判断上一个 Bar的收盘价 Close是否上穿
AvgPrice.
注意： 在使用判断穿越的函数时，要尽量避免使用例如 close等不确定的

元素，否则会导致信号消失，
一般情况下， Close可以改用 High和Low分别判断向上突破（函数
CrossOver ）和向下突破（函数 CrossUnder ）。

SwingHigh

### SwingHigh
**说明**
求波峰点


**语法**
`float SwingHigh(np.array Price, int Length, int Instance, int Strength)`



**参数**
Price 用于求波峰点的值，必须是 np数组或者序列变量
Length 是需要计算的周期数，为整型
Instance 设置返回哪一个波峰点， 1 - 最近的波峰点， 2 - 倒数第二个，
以此类推
Strength 设置转折点两边的需要的周期数，必须小于 Length；


**备注**
该函数计算指定周期内的数值型序列值的波峰点；
当序列值的 CurrentBar 小于 Length时，该函数返回 -1.0


**示例**
SwingHigh(Close(), 10, 1, 2); 计算 Close在最近 10个周期的波峰点的值，
最高点两侧每侧至少需要 2个Bar。

SwingLow

### SwingLow
**说明**
求波谷点


**语法**
`float SwingLow(np.array Price, int L ength, int Instance, int Strength)`



**参数**
Price 用于求波峰点的值，必须是 np数组或者序列变量
Length 是需要计算的周期数，为整型
Instance 设置返回哪一个波峰点， 1 - 最近的波谷点， 2 - 倒数第二个，
以此类推
Strength 设置转折点两边的需要的周期数，必须小于 Length；


**备注**
该函数计算指定周期内的数值型序列值的波谷点，返回值为浮点数；
当序列值的 CurrentBar 小于 Length时，该函数返回 -1.0


**示例**
SwingLow(Close, 10, 1, 2); 计算 Close在最近 10个周期的波谷点的值，最
低点两侧需要至少 2个Bar。


## 日志函数
LogDebug

### LogDebug
**说明**
在运行日志窗口中打印用户指定的调试信息。


**语法**
LogDebug(args)


**参数**
args 用户需要打印的内容，如需要在运行日志窗口中输出多个内容，内
容之间用英文逗号分隔。


**示例**
`accountId = A_AccountID()`

LogDebug(" 当前使用的用户账户 ID为 : ", accountId)
`available = A_Available()`

LogDebug(" 当前使用的用户账户 ID为 : %s，可用资金为  : %10.2f" %
(accountId, available))

`cBar = CurrentBar()`

LogDebug(" 当前 Bar的索引值  : ", cBar)

LogInfo

### LogInfo
**说明**
在运行日志窗口中打印用户指定的普通信息。


**语法**
LogInfo(args)


**参数**
args 用户需要打印的内容，如需要在运行日志窗口中输出多个内容，内
容之间用英文逗号分隔。


**示例**
`accountId = A_AccountID()`

LogInfo("当前使用的用户账户 ID为 : ", accountId)
`available = A_Available()`

LogInfo(" 当前使用的用户账户 ID为 : %s，可用资金为  : %10.2f" %

(accountId, available))

`cBar = CurrentBar()`

LogInfo("当前 Bar的索引值  : ", cBar)

LogWarn

### LogWarn
**说明**
在运行日志窗口中打印用户指定的警告信息。


**语法**
LogWarn(args)


**参数**
args 用户需要打印的内容，如需要在运行日志窗口中输出多个内容，内
容之间用英文逗号分隔。


**示例**
`accountId = A_AccountID()`

LogWarn(" 当前使用的用户账户 ID为 : ", accountId)
`available = A_Available()`

LogWarn(" 当前使用的用户账户 ID为 : %s，可用资金为  : %10.2f" %
(accountId, available))

`cBar = CurrentBar()`

LogWarn(" 当前 Bar的索引值  : ", cBar)

LogError

### LogError
**说明**
在运行日志窗口中打印用户指定的错误信息。


**语法**
LogError(args)


**参数**
args 用户需要打印的内容，如需要在运行日志窗口中输出多个内容，内
容之间用英文逗号分隔。


**示例**
`accountId = A_Account ID()`

LogError(" 当前使用的用户账户 ID为 : ", accountId)
`available = A_Available()`

LogError(" 当前使用的用户账户 ID为 : %s，可用资金为  : %10.2f" %
(accountId, available))

`cBar = CurrentBar()`

LogError(" 当前 Bar的索引值  : ", cBar)

Alert

### Alert
**说明**
弹出警告提醒


**语法**
`void Alert(string Info, bool bBeep=True, string level='Signal')`



**参数**
Info 提醒的内容
bBeep 是否播放警告声音，默认为 True
level 声音类型，包括 'Signal'、'Info'、'Warn'、'Error'


**备注**
多行提示信息需要自行换行，例如：
AlertStr = ' 合约 : ' + contNo + ' \n'\
'方向 : ' + self._bsMap[direct] + self._ocMap[offset ] + '\n' +\
'数量 : ' + str(share) + ' \n' +\
'价格 : ' + str(price) + ' \n' +\
'时间 : ' + str(curBar['DateTimeStamp']) + ' \n'


**示例**
Alert("Hello"); 弹出提示


## context函数
strategyStatus

### strategyStatus
**说明**
获取当前策略状态


**语法**
context.strategyStatus()


**备注**
返回值 'H'表示回测阶段，  'C'表示实时数据阶段

triggerType

### triggerType
**说明**
获取当前触发类型


**语法**

context.triggerType()


**备注**
返回字符， 'T' 定时触发； 'C' 周期性触发； 'K' 实时阶段 K线触发； 'H' 回
测阶段 K线触发； 'S' 即时行情触发； 'O' 委托状态变化触发； 'N' 连接状态触发；
'Z' 市场状态触发

contractNo

### contractNo
**说明**
获取当前触发合约


**语法**
context.contractNo()


**备注**
返回字符串，例如 : 'SHFE|F|CU|1907'

kLineType

### kLineType
**说明**
获取当前触发的 K线类型


**语法**
context.kLineType()


**备注**
返回字符， 'T' 分笔； 'M' 分钟； 'D' 日线；

kLineSlice

### kLineSlice
**说明**
获取当前触发的 K线周期


**语法**
context.kLineSlice()


**备注**
返回整型，例如 1

tradeDate

### tradeDate
**说明**
获取当前触发的交易日


**语法**
context.tradeDate()


**备注**
返回字符串， YYYYMMDD 格式， '20190524'

dateTimeStamp

### dateTimeStamp
**说明**
获取当前触发的时间戳


**语法**
context.dateTimeStamp()


**备注**
返回字符串， YYYYMMDD 格式， '20190524'

triggerData

### triggerData
**说明**
获取当前触发类型对应的数据


**语法**
context.triggerData()


**备注**
返回值是 python字典类型

K线触发返回的是 K线数据字典，字典键值含义如下：
'ContractNo': 合约编号
'KLineType': K 线类型
'KLineSlice': K 线周期
'TradeDate': 交易日
'TotalQty': 总成交量
'DateTimeStamp': 时间戳
'PositionQty': 持仓量
******tick 数据独有 ******
"LastQty": 明细现手
"PositionChg": 持仓量变化
"BuyPrice" : 买价
"SellPrice": 卖价
"BuyQty": 买量
"SellQty": 卖量
******除tick类型外的其他 K线类型数据独有 ******
'LastPrice': 最新价 (收盘价 )
'KLineQty': K 线成交量
'OpeningPrice': 开盘价
'HighPrice': 最高价

'LowPrice': 最低价
'SettlePrice': 结算价

交易触发返回的是交易数据字典，字典键值含义如下：
"SessionId": 会话号
"UserNo": 用户名
"Sign"：服务器标识
"Cont": 行情合约
"OrderType" : 定单类型
"ValidType": 有效类型
"ValidTime": 有效日期时间 (GTD情况下使用 )
"Direct": 买卖方向
"Offset": 开仓平仓  或 应价买入开平
"Hedge": 投机保值
"OrderPrice": 委托价格  或 期权应价买入价格
"TriggerPrice": 触发价格
"TriggerMode": 触发模式
"TriggerCondition": 触发条件
"OrderQty": 委托数量  或 期权应价数量
"StrategyType": 策略类型
"Remark": 下单备注字段，只有下单时生效。
"AddOneIsValid": T+1 时段有效 (仅港交所 )
"OrderState": 委托状态
"OrderId": 定单号
"OrderNo": 委托号
"MatchPrice": 成交价
"MatchQty": 成交量
"ErrorCode": 最新信息码
"ErrorText": 最新错误信息
"InsertTime": 下单时间
"UpdateTime": 更新时间
"StrategyId": 策略 id
"StrategyOrderId": 订单的本地号

即时行情触发返回的是即时行情数据字典，字典键值含义如下：
'ContractNo': 合约编号
'UpdateTime': 更新时间
'Lv1Data': 1 档行情数据，类型为 字典，键值含义如下
{
'PreClosingPrice': 昨收盘价
'PreSettlePrice': 昨结算价
'OpeningPrice': 开盘价
'LastPrice': 最新价
'HighPrice': 最高价

'LowPrice': 最低价
'HisHighPrice': 历史最高价
'HisLowPrice': 历史最低价
'LimitUpPrice': 涨停价
'LimitDownPrice': 跌停价
'TotalQty': 当日总成交量
'PositionQty': 持仓量
'AveragePrice': 均价
'ClosingPrice': 收盘价
'SettlePrice': 结算价
'LastQty': 最新成交量
'BestBidPrice': 最优买价
'BestBidQty': 最优买量
'BestAskPrice': 最优卖价
'BestAskQty': 最优卖量
'ImpliedBidPrice':  隐含买价
'ImpliedBidQty': 隐含买量
'ImpliedAskPrice': 隐含卖价
'ImpliedAskQty': 隐含卖量
'UpDown': 涨跌
'Growth': 涨幅
'TurnRate': 换手率
'DateTime': 更新时间
}
'Lv2BidData': 买深度行情，对应的类型为 python的列表类型，形如
[[62.2, 27], [62.19, 15], [62.18, 17], [62.17, 9],[[62.2, 27]] ，表示每档行情的价格和手
数
'Lv2AskData': 卖深度行情，对应的类型为 python的列表类型，形如
[[62.22, 30], [62.23, 11], [62.24, 13], [62.25, 12], [62.25, 16]] ，表示每档行情的价格
和手数
'FidMean': 行情变化字段

连接状态触发

"ServerType": 服务器类型， 'Q'行情服务器， 'T'交易服务器 "
EventType": 连接状态， 1连接， 2断开
"UserNo": 用户名，交易服务器连接状态触发时有效
市场状态触发返回的是市场状态相关的数据字典，字典键值含义如下：
"Sign": 服务器标识
"ExchangeNo": 交易所编号
"ExchangeDateTime": 交易所时间
"LocalDateTime": 本地时间
"TradeState": 交易状态，状态值含义见 ExchangeStatus 函数说明
"CommodityNo": 种编号（含交易所和品种类型）
