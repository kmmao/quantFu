"""
Pydantic数据模型定义
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ============================================
# 极星推送数据模型
# ============================================

class TradeEvent(BaseModel):
    """成交事件(极星推送)"""
    account_id: str = Field(..., description="账户ID(极星账户ID)")
    symbol: str = Field(..., description="合约代码(极星格式)")
    direction: str = Field(..., pattern="^(buy|sell)$", description="方向")
    offset: str = Field(..., pattern="^(open|close)$", description="开平")
    volume: int = Field(..., gt=0, description="成交手数")
    price: float = Field(..., gt=0, description="成交价格")
    order_id: Optional[str] = Field(None, description="订单ID")
    timestamp: datetime = Field(..., description="成交时间")
    source: str = Field(default="polar", description="数据来源")

    class Config:
        json_schema_extra = {
            "example": {
                "account_id": "85178443",
                "symbol": "ZCE|F|TA|2505",
                "direction": "buy",
                "offset": "open",
                "volume": 2,
                "price": 5500.0,
                "order_id": "ORDER123456",
                "timestamp": "2025-01-15T10:30:00",
                "source": "polar"
            }
        }


class PositionSnapshot(BaseModel):
    """持仓快照(极星定时推送,用于对账)"""
    account_id: str = Field(..., description="账户ID")
    symbol: str = Field(..., description="合约代码")
    long_position: int = Field(default=0, description="多仓手数")
    short_position: int = Field(default=0, description="空仓手数")
    long_avg_price: float = Field(default=0, description="多仓均价")
    short_avg_price: float = Field(default=0, description="空仓均价")
    long_profit: float = Field(default=0, description="多仓浮盈")
    short_profit: float = Field(default=0, description="空仓浮盈")
    timestamp: datetime = Field(..., description="快照时间")


# ============================================
# 响应数据模型
# ============================================

class Position(BaseModel):
    """持仓详情"""
    id: Optional[str] = None
    account_id: str
    symbol: str
    variety_name: Optional[str] = None
    exchange: Optional[str] = None

    # 多头
    long_position: int = 0
    long_avg_price: Optional[Decimal] = None
    long_profit: Decimal = Decimal('0')

    # 空头
    short_position: int = 0
    short_avg_price: Optional[Decimal] = None
    short_profit: Decimal = Decimal('0')

    # 锁仓
    is_long_locked: bool = False
    long_lock_price: Optional[Decimal] = None
    is_short_locked: bool = False
    short_lock_price: Optional[Decimal] = None

    # 实时价格
    last_price: Optional[Decimal] = None
    last_update_time: Optional[datetime] = None

    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Account(BaseModel):
    """账户信息"""
    id: Optional[str] = None
    account_name: str
    polar_account_id: str
    broker: Optional[str] = None
    user_id: Optional[str] = None
    status: str = "active"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Contract(BaseModel):
    """合约信息"""
    id: Optional[str] = None
    variety_code: str
    variety_name: Optional[str] = None
    exchange: str
    polar_symbol: str
    tqsdk_symbol: str
    is_main: bool = False
    contract_month: Optional[str] = None
    expiry_date: Optional[datetime] = None
    multiplier: Optional[int] = None
    price_tick: Optional[Decimal] = None
    margin_ratio: Optional[Decimal] = None

    class Config:
        from_attributes = True


# ============================================
# API响应模型
# ============================================

class ResponseModel(BaseModel):
    """通用响应模型"""
    code: int = Field(default=200, description="状态码")
    message: str = Field(default="success", description="消息")
    data: Optional[dict] = Field(default=None, description="数据")


class TradeResponse(ResponseModel):
    """成交推送响应"""
    pass


class PositionListResponse(BaseModel):
    """持仓列表响应"""
    total: int
    positions: list[Position]


# ============================================
# WebSocket消息模型
# ============================================

class WSMessage(BaseModel):
    """WebSocket消息"""
    type: str = Field(..., description="消息类型: trade/position/quote/notification")
    data: dict = Field(..., description="消息数据")
    timestamp: datetime = Field(default_factory=datetime.now, description="时间戳")
