"""
K线数据服务
使用TqSDK获取历史K线数据
"""
from typing import List, Dict, Any, Optional
from datetime import datetime

from utils.logger import get_logger
from utils.db import get_supabase_client
from services.tqsdk_manager import tqsdk_manager

logger = get_logger(__name__)


class KlineService:
    """K线数据服务"""

    def __init__(self):
        self.db = get_supabase_client()

    @property
    def api(self):
        """获取天勤API实例（单例）"""
        return tqsdk_manager.get_api()

    def get_klines(
        self,
        symbol: str,
        duration: int = 60,
        data_length: int = 500
    ) -> List[Dict[str, Any]]:
        """
        获取K线数据

        Args:
            symbol: 合约代码(TqSDK格式,如 CZCE.TA2505)
            duration: K线周期(秒),60=1分钟,300=5分钟,3600=1小时,86400=日线
            data_length: 获取的K线数量

        Returns:
            K线数据列表
        """
        try:
            if not self.api:
                logger.error("天勤服务未连接")
                return []

            # 获取K线数据（使用单例连接）
            klines = self.api.get_kline_serial(symbol, duration, data_length)

            # 转换为标准格式
            result = []
            for i in range(len(klines)):
                if klines.iloc[i]['volume'] == 0:  # 跳过无效数据
                    continue

                result.append({
                    'time': int(klines.iloc[i]['datetime'] / 1e9),  # 转换为秒级时间戳
                    'open': float(klines.iloc[i]['open']),
                    'high': float(klines.iloc[i]['high']),
                    'low': float(klines.iloc[i]['low']),
                    'close': float(klines.iloc[i]['close']),
                    'volume': int(klines.iloc[i]['volume']),
                })

            logger.info(f"获取K线成功: {symbol} {duration}秒 {len(result)}条")

            # 打印前5条数据用于调试
            if result:
                logger.info(f"前5条K线数据:")
                for i, kline in enumerate(result[:5], 1):
                    logger.info(f"  [{i}] {datetime.fromtimestamp(kline['time']).strftime('%Y-%m-%d %H:%M:%S')} - "
                              f"开:{kline['open']:.2f} 高:{kline['high']:.2f} "
                              f"低:{kline['low']:.2f} 收:{kline['close']:.2f} 量:{kline['volume']}")

            return result

        except Exception as e:
            logger.error(f"获取K线失败: {e}")
            return []

    def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """获取实时行情"""
        try:
            if not self.api:
                logger.error("天勤服务未连接")
                return None

            quote = self.api.get_quote(symbol)

            return {
                'symbol': symbol,
                'last_price': float(quote.last_price),
                'open': float(quote.open),
                'high': float(quote.highest),
                'low': float(quote.lowest),
                'volume': int(quote.volume),
                'open_interest': int(quote.open_interest),
                'bid_price': float(quote.bid_price1),
                'ask_price': float(quote.ask_price1),
                'datetime': quote.datetime,
            }

        except Exception as e:
            logger.error(f"获取行情失败: {e}")
            return None

    def get_klines_with_positions(
        self,
        symbol: str,
        account_id: str,
        duration: int = 60,
        data_length: int = 500
    ) -> Dict[str, Any]:
        """
        获取K线数据并叠加持仓标记

        Args:
            symbol: 合约代码(TqSDK格式)
            account_id: 账户ID (UUID格式)
            duration: K线周期
            data_length: K线数量

        Returns:
            包含K线和持仓标记的数据
        """
        try:
            # 1. 获取K线数据
            klines = self.get_klines(symbol, duration, data_length)
            if not klines:
                return {'klines': [], 'markers': []}

            # 2. 验证 account_id 是否为有效的 UUID 格式
            import uuid
            try:
                uuid.UUID(account_id)
            except (ValueError, AttributeError):
                logger.warning(f"无效的 account_id 格式: {account_id}, 跳过持仓查询")
                return {'klines': klines, 'markers': [], 'position': None}

            # 3. 获取持仓信息
            # 将TqSDK格式转换为Polar格式
            polar_symbol = self._tqsdk_to_polar(symbol)

            position_result = (
                self.db.table("positions")
                .select("*")
                .eq("account_id", account_id)
                .eq("symbol", polar_symbol)
                .execute()
            )

            # 4. 获取成交记录(用于标记开仓/平仓点)
            trades_result = (
                self.db.table("trades")
                .select("*")
                .eq("account_id", account_id)
                .eq("symbol", polar_symbol)
                .order("timestamp", desc=False)
                .execute()
            )

            # 5. 生成持仓标记
            markers = []
            if trades_result.data:
                for trade in trades_result.data:
                    timestamp = int(datetime.fromisoformat(trade['timestamp']).timestamp())

                    # 确保时间戳在K线范围内
                    if timestamp < klines[0]['time'] or timestamp > klines[-1]['time']:
                        continue

                    marker = {
                        'time': timestamp,
                        'position': 'aboveBar' if trade['direction'] == 'buy' else 'belowBar',
                        'color': '#26a69a' if trade['direction'] == 'buy' else '#ef5350',
                        'shape': 'arrowUp' if trade['direction'] == 'buy' else 'arrowDown',
                        'text': f"{trade['direction']} {trade['volume']}手 @{trade['price']}",
                        'size': 1,
                    }
                    markers.append(marker)

            # 6. 当前持仓信息
            current_position = None
            if position_result.data:
                pos = position_result.data[0]
                current_position = {
                    'long_position': pos.get('long_position', 0),
                    'long_avg_price': pos.get('long_avg_price', 0),
                    'long_profit': pos.get('long_profit', 0),
                    'short_position': pos.get('short_position', 0),
                    'short_avg_price': pos.get('short_avg_price', 0),
                    'short_profit': pos.get('short_profit', 0),
                    'last_price': pos.get('last_price', 0),
                }

            return {
                'klines': klines,
                'markers': markers,
                'position': current_position,
            }

        except Exception as e:
            logger.error(f"获取K线和持仓失败: {e}")
            return {'klines': [], 'markers': [], 'position': None}

    def _tqsdk_to_polar(self, tqsdk_symbol: str) -> str:
        """TqSDK格式转Polar格式(简化实现)"""
        # 查询数据库
        result = (
            self.db.table("contracts")
            .select("polar_symbol")
            .eq("tqsdk_symbol", tqsdk_symbol)
            .execute()
        )

        if result.data:
            return result.data[0]['polar_symbol']

        # 简单转换(如果数据库查不到)
        return tqsdk_symbol

    def close(self):
        """关闭连接（已弃用，使用单例模式）"""
        # 不再需要关闭，由单例管理器统一管理
        pass


# 测试运行
if __name__ == "__main__":
    service = KlineService()

    # 测试获取K线
    klines = service.get_klines("CZCE.TA2505", duration=300, data_length=100)
    print(f"获取到 {len(klines)} 条K线数据")

    if klines:
        print(f"最新K线: {klines[-1]}")

    service.close()
