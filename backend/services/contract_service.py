"""
合约管理服务

功能:
- 同步合约信息
- 识别主力合约
- 监控主力切换
- 到期提醒
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from tqsdk import TqApi
from supabase import Client

from backend.utils.notification import send_notification

logger = logging.getLogger(__name__)


class ContractService:
    """合约管理服务"""

    def __init__(self, tq_api: TqApi, db: Client):
        self.tq = tq_api
        self.db = db
        self.logger = logger

        # 品种映射
        self.variety_mapping = {
            # 郑商所
            "CZCE": {
                "TA": "PTA",
                "MA": "甲醇",
                "CF": "棉花",
                "SR": "白糖",
                "OI": "菜油",
                "RM": "菜粕",
                "FG": "玻璃",
            },
            # 大商所
            "DCE": {
                "I": "铁矿石",
                "J": "焦炭",
                "JM": "焦煤",
                "M": "豆粕",
                "Y": "豆油",
                "P": "棕榈油",
                "A": "豆一",
                "B": "豆二",
                "C": "玉米",
            },
            # 上期所
            "SHFE": {
                "RB": "螺纹钢",
                "HC": "热轧卷板",
                "CU": "铜",
                "AL": "铝",
                "ZN": "锌",
                "PB": "铅",
                "NI": "镍",
                "AU": "黄金",
                "AG": "白银",
                "RU": "橡胶",
                "FU": "燃油",
            },
            # 能源中心
            "INE": {
                "SC": "原油",
                "NR": "20号胶",
            },
            # 中金所
            "CFFEX": {
                "IF": "沪深300股指",
                "IC": "中证500股指",
                "IH": "上证50股指",
            },
        }

    def parse_symbol(self, symbol: str) -> Dict[str, str]:
        """
        解析合约代码
        CZCE.TA2505 -> {exchange: CZCE, variety: TA, month: 2505}
        """
        parts = symbol.split(".")
        if len(parts) != 2:
            raise ValueError(f"Invalid symbol format: {symbol}")

        exchange = parts[0]
        code = parts[1]

        # 提取品种代码和月份
        i = 0
        while i < len(code) and code[i].isalpha():
            i += 1

        variety_code = code[:i]
        contract_month = code[i:]

        return {
            "exchange": exchange,
            "variety_code": variety_code,
            "contract_month": contract_month,
        }

    def get_variety_name(self, exchange: str, variety_code: str) -> str:
        """获取品种名称"""
        return self.variety_mapping.get(exchange, {}).get(variety_code, variety_code)

    async def sync_contract_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        同步单个合约信息到数据库
        """
        try:
            # 获取行情数据
            quote = self.tq.get_quote(symbol)
            if not quote:
                self.logger.warning(f"无法获取合约行情: {symbol}")
                return None

            # 解析合约信息
            parsed = self.parse_symbol(symbol)
            variety_name = self.get_variety_name(
                parsed["exchange"], parsed["variety_code"]
            )

            # 构造合约数据
            contract_data = {
                "exchange": parsed["exchange"],
                "variety_code": parsed["variety_code"],
                "variety_name": variety_name,
                "symbol": symbol,
                "contract_month": parsed["contract_month"],
                "contract_multiplier": int(quote.get("volume_multiple", 1)),
                "price_tick": float(quote.get("price_tick", 1)),
                "margin_ratio": float(quote.get("margin", 0.1)),
                "price_limit_up": (
                    float(quote["upper_limit"]) if quote.get("upper_limit") else None
                ),
                "price_limit_down": (
                    float(quote["lower_limit"]) if quote.get("lower_limit") else None
                ),
                "last_price": (
                    float(quote["last_price"])
                    if quote.get("last_price") and quote["last_price"] == quote["last_price"]
                    else None
                ),
                "settlement_price": (
                    float(quote["settlement"])
                    if quote.get("settlement") and quote["settlement"] == quote["settlement"]
                    else None
                ),
                "open_interest": int(quote.get("open_interest", 0)),
                "volume": int(quote.get("volume", 0)),
                "trading_status": "normal",
                "is_active": True,
            }

            # 插入或更新数据库
            result = (
                self.db.table("contracts")
                .upsert(contract_data, on_conflict="symbol")
                .execute()
            )

            self.logger.info(f"同步合约信息成功: {symbol}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"同步合约信息失败 {symbol}: {e}")
            return None

    async def sync_variety_contracts(
        self, exchange: str, variety_code: str
    ) -> List[Dict[str, Any]]:
        """
        同步某个品种的所有合约
        """
        try:
            # 获取品种的所有合约列表
            # 注意: TqSDK 没有直接的API获取合约列表,这里需要根据实际情况构造
            # 通常合约月份为当前月及后续11个月
            contracts = []
            current_date = datetime.now()

            for i in range(12):
                target_date = current_date + timedelta(days=30 * i)
                year = target_date.year % 100  # 取后两位
                month = target_date.month

                # 构造合约代码
                contract_month = f"{year:02d}{month:02d}"
                symbol = f"{exchange}.{variety_code}{contract_month}"

                # 同步合约信息
                contract = await self.sync_contract_info(symbol)
                if contract:
                    contracts.append(contract)

                # 避免请求过快
                await asyncio.sleep(0.1)

            return contracts

        except Exception as e:
            self.logger.error(f"同步品种合约失败 {exchange}.{variety_code}: {e}")
            return []

    async def identify_main_contract(
        self, exchange: str, variety_code: str
    ) -> Optional[str]:
        """
        识别主力合约 (持仓量最大的合约)
        """
        try:
            # 查询该品种的所有活跃合约
            result = (
                self.db.table("contracts")
                .select("*")
                .eq("exchange", exchange)
                .eq("variety_code", variety_code)
                .eq("is_active", True)
                .order("open_interest", desc=True)
                .limit(1)
                .execute()
            )

            if result.data:
                main_contract = result.data[0]
                return main_contract["symbol"]

            return None

        except Exception as e:
            self.logger.error(f"识别主力合约失败 {exchange}.{variety_code}: {e}")
            return None

    async def update_main_contract(
        self, exchange: str, variety_code: str
    ) -> Optional[Dict[str, Any]]:
        """
        更新主力合约标记
        """
        try:
            # 识别当前主力合约
            new_main = await self.identify_main_contract(exchange, variety_code)
            if not new_main:
                return None

            # 获取之前的主力合约
            old_main_result = (
                self.db.table("contracts")
                .select("symbol")
                .eq("exchange", exchange)
                .eq("variety_code", variety_code)
                .eq("is_main_contract", True)
                .execute()
            )

            old_main = old_main_result.data[0]["symbol"] if old_main_result.data else None

            # 如果主力合约发生变化
            if old_main and old_main != new_main:
                # 取消旧主力标记
                self.db.table("contracts").update({"is_main_contract": False}).eq(
                    "symbol", old_main
                ).execute()

                # 设置新主力标记
                self.db.table("contracts").update({"is_main_contract": True}).eq(
                    "symbol", new_main
                ).execute()

                # 记录主力切换
                await self._record_main_contract_switch(
                    exchange, variety_code, old_main, new_main
                )

                self.logger.info(f"主力合约切换: {old_main} -> {new_main}")

            elif not old_main:
                # 首次设置主力合约
                self.db.table("contracts").update({"is_main_contract": True}).eq(
                    "symbol", new_main
                ).execute()

                self.logger.info(f"设置主力合约: {new_main}")

            return {"old_main": old_main, "new_main": new_main}

        except Exception as e:
            self.logger.error(f"更新主力合约失败 {exchange}.{variety_code}: {e}")
            return None

    async def _record_main_contract_switch(
        self, exchange: str, variety_code: str, old_main: str, new_main: str
    ):
        """记录主力合约切换"""
        try:
            # 获取旧主力和新主力的数据
            old_contract = (
                self.db.table("contracts").select("*").eq("symbol", old_main).execute()
            )
            new_contract = (
                self.db.table("contracts").select("*").eq("symbol", new_main).execute()
            )

            if not old_contract.data or not new_contract.data:
                return

            old_data = old_contract.data[0]
            new_data = new_contract.data[0]

            # 计算换月指数
            rollover_index = self._calculate_rollover_index(old_data, new_data)

            # 插入切换记录
            switch_data = {
                "exchange": exchange,
                "variety_code": variety_code,
                "variety_name": new_data["variety_name"],
                "old_main_contract": old_main,
                "new_main_contract": new_main,
                "old_open_interest": old_data["open_interest"],
                "new_open_interest": new_data["open_interest"],
                "old_volume": old_data["volume"],
                "new_volume": new_data["volume"],
                "rollover_index": rollover_index,
            }

            self.db.table("main_contract_switches").insert(switch_data).execute()

            # 发送通知
            variety_name = new_data["variety_name"]
            await send_notification(
                title=f"主力合约切换: {variety_name}",
                message=f"{old_main} → {new_main}\n换月指数: {rollover_index:.2f}",
                tags="chart_with_upwards_trend",
            )

        except Exception as e:
            self.logger.error(f"记录主力切换失败: {e}")

    def _calculate_rollover_index(
        self, old_contract: Dict, new_contract: Dict
    ) -> float:
        """
        计算换月指数
        换月指数 = (新合约持仓量 / 旧合约持仓量) * 0.7 + (新合约成交量 / 旧合约成交量) * 0.3
        """
        old_oi = old_contract["open_interest"] or 1
        new_oi = new_contract["open_interest"] or 0
        old_vol = old_contract["volume"] or 1
        new_vol = new_contract["volume"] or 0

        oi_ratio = new_oi / old_oi
        vol_ratio = new_vol / old_vol

        return oi_ratio * 0.7 + vol_ratio * 0.3

    async def check_expiry_alerts(self):
        """检查到期提醒"""
        try:
            # 查询需要提醒的合约
            result = (
                self.db.table("v_contract_expiry_reminders")
                .select("*")
                .eq("should_alert", True)
                .execute()
            )

            for reminder in result.data:
                # 检查是否已经提醒过
                if reminder.get("last_alert_time"):
                    last_alert = datetime.fromisoformat(
                        reminder["last_alert_time"].replace("Z", "+00:00")
                    )
                    # 24小时内不重复提醒
                    if datetime.now().timestamp() - last_alert.timestamp() < 86400:
                        continue

                # 发送提醒
                await self._send_expiry_alert(reminder)

                # 更新提醒时间
                self.db.table("contract_expiry_alerts").update(
                    {
                        "last_alert_time": datetime.now().isoformat(),
                        "alert_count": reminder.get("alert_count", 0) + 1,
                    }
                ).eq("id", reminder["id"]).execute()

        except Exception as e:
            self.logger.error(f"检查到期提醒失败: {e}")

    async def _send_expiry_alert(self, reminder: Dict):
        """发送到期提醒"""
        symbol = reminder["symbol"]
        variety_name = reminder["variety_name"]
        days_to_expiry = int(reminder["days_to_expiry"])

        await send_notification(
            title=f"合约即将到期: {variety_name}",
            message=f"合约 {symbol} 将在 {days_to_expiry} 天后到期\n请及时平仓或换月",
            priority="high",
            tags="warning",
        )

    async def calculate_margin(
        self,
        account_id: str,
        symbol: str,
        price: float,
        volume: int,
        direction: str = "long",
    ) -> Dict[str, Any]:
        """
        计算保证金
        """
        try:
            # 获取合约信息
            result = (
                self.db.table("contracts").select("*").eq("symbol", symbol).execute()
            )

            if not result.data:
                raise ValueError(f"合约不存在: {symbol}")

            contract = result.data[0]

            # 计算
            contract_multiplier = contract["contract_multiplier"]
            margin_ratio = contract["margin_ratio"]

            contract_value = price * volume * contract_multiplier
            required_margin = contract_value * margin_ratio

            # 保存计算记录
            calc_data = {
                "account_id": account_id,
                "symbol": symbol,
                "price": price,
                "volume": volume,
                "direction": direction,
                "contract_multiplier": contract_multiplier,
                "margin_ratio": margin_ratio,
                "required_margin": required_margin,
                "contract_value": contract_value,
            }

            self.db.table("margin_calculations").insert(calc_data).execute()

            return {
                "contract_value": contract_value,
                "required_margin": required_margin,
                "margin_ratio": margin_ratio,
                "contract_multiplier": contract_multiplier,
            }

        except Exception as e:
            self.logger.error(f"计算保证金失败: {e}")
            raise

    async def monitor_main_contracts(self):
        """
        监控主力合约 (定时任务)
        建议每小时运行一次
        """
        self.logger.info("开始监控主力合约...")

        try:
            # 获取所有品种
            for exchange, varieties in self.variety_mapping.items():
                for variety_code in varieties.keys():
                    # 同步合约信息
                    await self.sync_variety_contracts(exchange, variety_code)

                    # 更新主力合约
                    await self.update_main_contract(exchange, variety_code)

                    # 避免请求过快
                    await asyncio.sleep(1)

            self.logger.info("主力合约监控完成")

        except Exception as e:
            self.logger.error(f"主力合约监控失败: {e}")

    async def start_monitoring(self, interval: int = 3600):
        """
        启动监控服务
        interval: 监控间隔(秒), 默认1小时
        """
        self.logger.info(f"合约监控服务启动,间隔: {interval}秒")

        while True:
            try:
                # 监控主力合约
                await self.monitor_main_contracts()

                # 检查到期提醒
                await self.check_expiry_alerts()

            except Exception as e:
                self.logger.error(f"监控循环错误: {e}")

            await asyncio.sleep(interval)
