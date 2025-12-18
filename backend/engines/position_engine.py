"""
持仓计算引擎
根据成交记录重建持仓明细
"""
from decimal import Decimal
from typing import Dict
from utils.db import get_supabase_client


class PositionEngine:
    """持仓计算引擎"""

    def __init__(self):
        self.db = get_supabase_client()

    async def rebuild_position(self, account_id: str, symbol: str) -> Dict:
        """
        根据成交记录重建持仓

        核心算法:
        1. 获取所有成交记录(按时间正序)
        2. 逐笔计算持仓(开仓加权平均,平仓减少仓位)
        3. 获取最新价格(天勤)
        4. 计算浮盈浮亏
        5. 更新数据库

        Args:
            account_id: 账户ID(极星账户ID,如85178443)
            symbol: 合约代码(极星格式)

        Returns:
            更新后的持仓信息
        """
        # 1. 获取该合约的所有成交记录(时间正序)
        trades_response = self.db.table("trades")\
            .select("*")\
            .eq("account_id", account_id)\
            .eq("symbol", symbol)\
            .order("timestamp", desc=False)\
            .execute()

        trades = trades_response.data

        # 2. 初始化持仓
        long_position = 0
        long_avg_price = Decimal('0')
        short_position = 0
        short_avg_price = Decimal('0')

        # 3. 逐笔计算
        for trade in trades:
            volume = trade['volume']
            price = Decimal(str(trade['price']))

            if trade['direction'] == 'buy':
                if trade['offset'] == 'open':
                    # 买开:增加多仓(加权平均)
                    if long_position > 0:
                        old_cost = long_avg_price * long_position
                        new_cost = price * volume
                        long_position += volume
                        long_avg_price = (old_cost + new_cost) / long_position
                    else:
                        long_position = volume
                        long_avg_price = price
                else:
                    # 买平:减少空仓
                    short_position = max(0, short_position - volume)
                    if short_position == 0:
                        short_avg_price = Decimal('0')

            elif trade['direction'] == 'sell':
                if trade['offset'] == 'open':
                    # 卖开:增加空仓(加权平均)
                    if short_position > 0:
                        old_cost = short_avg_price * short_position
                        new_cost = price * volume
                        short_position += volume
                        short_avg_price = (old_cost + new_cost) / short_position
                    else:
                        short_position = volume
                        short_avg_price = price
                else:
                    # 卖平:减少多仓
                    long_position = max(0, long_position - volume)
                    if long_position == 0:
                        long_avg_price = Decimal('0')

        # 4. 获取合约乘数
        multiplier = await self._get_contract_multiplier(symbol)

        # 5. 获取最新价格(后续由天勤服务更新,这里先用0)
        last_price = Decimal('0')

        # 6. 计算浮盈
        long_profit = Decimal('0')
        short_profit = Decimal('0')

        if long_position > 0 and last_price > 0:
            long_profit = (last_price - long_avg_price) * long_position * multiplier

        if short_position > 0 and last_price > 0:
            short_profit = (short_avg_price - last_price) * short_position * multiplier

        # 7. 更新或插入持仓数据
        position_data = {
            "account_id": account_id,
            "symbol": symbol,
            "long_position": long_position,
            "long_avg_price": float(long_avg_price) if long_avg_price > 0 else None,
            "long_profit": float(long_profit),
            "short_position": short_position,
            "short_avg_price": float(short_avg_price) if short_avg_price > 0 else None,
            "short_profit": float(short_profit),
            "last_price": float(last_price) if last_price > 0 else None,
            "updated_at": "now()"
        }

        result = self.db.table("positions")\
            .upsert(position_data, on_conflict="account_id,symbol")\
            .execute()

        return result.data[0] if result.data else position_data

    async def _get_contract_multiplier(self, symbol: str) -> int:
        """
        获取合约乘数

        Args:
            symbol: 合约代码(极星格式)

        Returns:
            合约乘数,默认10
        """
        try:
            result = self.db.table("contracts")\
                .select("multiplier")\
                .eq("polar_symbol", symbol)\
                .single()\
                .execute()

            return result.data.get('multiplier', 10) if result.data else 10
        except Exception:
            return 10  # 默认乘数

    async def get_all_positions(self, account_id: str) -> list:
        """
        获取账户所有持仓

        Args:
            account_id: 账户ID

        Returns:
            持仓列表
        """
        result = self.db.table("v_positions_summary")\
            .select("*")\
            .eq("account_id", account_id)\
            .execute()

        return result.data

    async def update_position_price(self, symbol: str, last_price: float):
        """
        更新持仓的最新价格(由天勤服务调用)

        Args:
            symbol: 合约代码(极星格式)
            last_price: 最新价格
        """
        # 获取所有该合约的持仓
        positions_response = self.db.table("positions")\
            .select("*")\
            .eq("symbol", symbol)\
            .execute()

        for position in positions_response.data:
            # 重新计算浮盈
            multiplier = await self._get_contract_multiplier(symbol)

            long_profit = 0
            short_profit = 0

            if position['long_position'] > 0 and position['long_avg_price']:
                long_profit = (last_price - float(position['long_avg_price'])) * \
                             position['long_position'] * multiplier

            if position['short_position'] > 0 and position['short_avg_price']:
                short_profit = (float(position['short_avg_price']) - last_price) * \
                              position['short_position'] * multiplier

            # 更新
            self.db.table("positions")\
                .update({
                    "last_price": last_price,
                    "long_profit": long_profit,
                    "short_profit": short_profit,
                    "last_update_time": "now()",
                    "updated_at": "now()"
                })\
                .eq("id", position['id'])\
                .execute()
