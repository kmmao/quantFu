"""
天勤TqSDK行情服务

功能:
1. 订阅期货合约实时行情
2. 自动更新持仓表的最新价格
3. 触发浮盈重新计算
4. 通过WebSocket推送给前端

使用方式:
    service = TqSdkService()
    await service.start()  # 启动行情循环
"""

from tqsdk import TqApi, TqAuth
from typing import Dict, Optional
import asyncio
from datetime import datetime
from config import settings
from utils.db import get_supabase_client
from utils.contract_mapper import ContractMapper


class TqSdkService:
    """天勤行情服务"""

    def __init__(self):
        """初始化服务"""
        self.api: Optional[TqApi] = None
        self.quotes: Dict[str, object] = {}  # {tqsdk_symbol: quote对象}
        self.db = get_supabase_client()
        self.running = False

    def connect(self):
        """
        连接天勤API

        注意:天勤免费版只能获取行情,不能交易
        """
        try:
            # 创建天勤连接
            self.api = TqApi(
                auth=TqAuth(
                    settings.tqsdk_account,
                    settings.tqsdk_password
                ),
                web_gui=False  # 不启动Web界面
            )
            print("✅ 天勤API连接成功")
            return True
        except Exception as e:
            print(f"❌ 天勤API连接失败: {e}")
            return False

    def subscribe_contract(self, tqsdk_symbol: str):
        """
        订阅合约行情

        Args:
            tqsdk_symbol: 天勤格式合约代码,如"CZCE.TA2505"
        """
        if not self.api:
            raise RuntimeError("天勤API未连接,请先调用connect()")

        if tqsdk_symbol not in self.quotes:
            quote = self.api.get_quote(tqsdk_symbol)
            self.quotes[tqsdk_symbol] = quote
            print(f"📊 订阅行情: {tqsdk_symbol}")

        return self.quotes[tqsdk_symbol]

    def subscribe_contracts_from_db(self):
        """
        从数据库读取所有合约并订阅

        自动订阅contracts表中所有合约的行情
        """
        result = self.db.table("contracts")\
            .select("tqsdk_symbol, polar_symbol")\
            .execute()

        subscribed_count = 0
        for contract in result.data:
            try:
                self.subscribe_contract(contract['tqsdk_symbol'])
                subscribed_count += 1
            except Exception as e:
                print(f"订阅失败 {contract['tqsdk_symbol']}: {e}")

        print(f"✅ 成功订阅 {subscribed_count} 个合约行情")
        return subscribed_count

    async def update_position_prices(self):
        """
        更新所有持仓的最新价格和浮盈

        流程:
        1. 从positions表获取所有持仓
        2. 获取对应合约的最新价格
        3. 重新计算浮盈
        4. 更新数据库
        """
        # 获取所有持仓
        positions_response = self.db.table("positions")\
            .select("id, symbol, long_position, long_avg_price, short_position, short_avg_price")\
            .or_("long_position.gt.0,short_position.gt.0")\
            .execute()

        updated_count = 0

        for position in positions_response.data:
            try:
                # 转换为天勤格式
                tqsdk_symbol = ContractMapper.polar_to_tqsdk(position['symbol'])

                # 获取最新价格
                if tqsdk_symbol in self.quotes:
                    quote = self.quotes[tqsdk_symbol]
                    last_price = quote.last_price

                    # 获取合约乘数
                    multiplier = await self._get_multiplier(position['symbol'])

                    # 计算浮盈
                    long_profit = 0
                    short_profit = 0

                    if position['long_position'] > 0 and position['long_avg_price']:
                        long_profit = (last_price - float(position['long_avg_price'])) * \
                                     position['long_position'] * multiplier

                    if position['short_position'] > 0 and position['short_avg_price']:
                        short_profit = (float(position['short_avg_price']) - last_price) * \
                                      position['short_position'] * multiplier

                    # 更新数据库
                    self.db.table("positions")\
                        .update({
                            "last_price": last_price,
                            "long_profit": long_profit,
                            "short_profit": short_profit,
                            "last_update_time": datetime.now().isoformat(),
                            "updated_at": datetime.now().isoformat()
                        })\
                        .eq("id", position['id'])\
                        .execute()

                    updated_count += 1

            except Exception as e:
                print(f"更新持仓价格失败 {position['symbol']}: {e}")

        if updated_count > 0:
            print(f"✅ 更新了 {updated_count} 个持仓的价格")

        return updated_count

    async def _get_multiplier(self, polar_symbol: str) -> int:
        """获取合约乘数"""
        try:
            result = self.db.table("contracts")\
                .select("multiplier")\
                .eq("polar_symbol", polar_symbol)\
                .single()\
                .execute()
            return result.data.get('multiplier', 10) if result.data else 10
        except Exception:
            return 10

    async def market_data_loop(self):
        """
        行情数据循环(主循环)

        持续运行,监听行情变化并更新数据库
        """
        self.running = True
        print("🚀 启动行情监听循环...")

        update_counter = 0

        while self.running:
            try:
                # 等待行情更新
                self.api.wait_update()

                # 检查是否有价格变化
                price_changed = False
                for symbol, quote in self.quotes.items():
                    if self.api.is_changing(quote, "last_price"):
                        price_changed = True
                        print(f"📈 {symbol} 价格: {quote.last_price}")
                        break

                # 如果有价格变化,更新持仓
                if price_changed:
                    await self.update_position_prices()
                    update_counter += 1

                # 每100次更新打印一次统计
                if update_counter % 100 == 0 and update_counter > 0:
                    print(f"📊 已更新 {update_counter} 次持仓价格")

                # 短暂休眠,避免CPU占用过高
                await asyncio.sleep(0.5)

            except KeyboardInterrupt:
                print("\n⏹️  收到停止信号,退出行情循环")
                self.running = False
                break
            except Exception as e:
                print(f"❌ 行情循环错误: {e}")
                await asyncio.sleep(5)  # 出错后等待5秒再继续

    def get_quote_info(self, tqsdk_symbol: str) -> Optional[Dict]:
        """
        获取合约行情快照

        Args:
            tqsdk_symbol: 天勤格式合约代码

        Returns:
            行情字典或None
        """
        if tqsdk_symbol not in self.quotes:
            return None

        quote = self.quotes[tqsdk_symbol]

        return {
            "symbol": tqsdk_symbol,
            "last_price": quote.last_price,
            "bid_price": quote.bid_price1,
            "ask_price": quote.ask_price1,
            "volume": quote.volume,
            "open_interest": quote.open_interest,
            "high": quote.highest,
            "low": quote.lowest,
            "open": quote.open,
            "pre_settlement": quote.pre_settlement,
            "datetime": quote.datetime
        }

    async def start(self):
        """
        启动天勤服务

        完整流程:
        1. 连接天勤API
        2. 订阅数据库中所有合约
        3. 启动行情循环
        """
        print("=" * 50)
        print("启动天勤行情服务")
        print("=" * 50)

        # 1. 连接
        if not self.connect():
            raise RuntimeError("天勤连接失败")

        # 2. 订阅合约
        count = self.subscribe_contracts_from_db()
        if count == 0:
            print("⚠️  警告: 未订阅任何合约,请检查contracts表")

        # 3. 启动循环
        await self.market_data_loop()

    def stop(self):
        """停止服务"""
        self.running = False
        if self.api:
            self.api.close()
        print("✅ 天勤服务已停止")


# ============================================
# 独立运行模式(用于测试)
# ============================================

async def main():
    """测试运行"""
    service = TqSdkService()

    try:
        await service.start()
    except KeyboardInterrupt:
        print("\n停止服务...")
        service.stop()


if __name__ == "__main__":
    asyncio.run(main())
