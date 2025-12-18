"""
锁仓执行引擎
负责执行锁仓操作,记录执行历史
"""
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
import uuid
from supabase import Client

from utils.db import get_supabase_client
from utils.logger import get_logger

logger = get_logger(__name__)


class LockEngine:
    """锁仓执行引擎"""

    def __init__(self):
        self.db: Client = get_supabase_client()

    async def execute_lock(
        self,
        trigger_id: str,
        account_id: str,
        symbol: str,
        direction: str,
        lock_volume: int,
        trigger_price: float,
        method: str = "auto"
    ) -> Dict[str, Any]:
        """
        执行锁仓操作

        Args:
            trigger_id: 触发记录ID
            account_id: 账户ID
            symbol: 合约代码
            direction: 持仓方向 (long/short)
            lock_volume: 锁定手数
            trigger_price: 触发价格
            method: 执行方式 (auto/manual)

        Returns:
            执行结果字典
        """
        try:
            logger.info(
                f"[锁仓执行] 开始执行锁仓: {symbol} {direction} {lock_volume}手 @{trigger_price}"
            )

            # 1. 获取当前持仓信息
            position = await self._get_position(account_id, symbol)
            if not position:
                raise Exception(f"未找到持仓: {symbol}")

            # 2. 验证持仓是否足够
            current_position = (
                position["long_position"]
                if direction == "long"
                else position["short_position"]
            )
            if current_position < lock_volume:
                raise Exception(
                    f"持仓不足,当前{direction}仓: {current_position}手, 需要锁定: {lock_volume}手"
                )

            # 3. 获取执行前状态
            before_state = {
                "position": current_position,
                "avg_price": position.get("long_avg_price" if direction == "long" else "short_avg_price"),
                "profit": position.get("long_profit" if direction == "long" else "short_profit", 0),
            }

            # 4. 计算锁仓方向(反向)
            lock_direction = "sell" if direction == "long" else "buy"

            # 5. 执行锁仓(这里模拟,实际应调用极星API或推送到data_pusher)
            lock_result = await self._execute_lock_order(
                account_id=account_id,
                symbol=symbol,
                direction=lock_direction,
                volume=lock_volume,
                price=trigger_price,
            )

            # 6. 计算锁定利润
            multiplier = await self._get_contract_multiplier(symbol)
            if direction == "long":
                locked_profit = (trigger_price - Decimal(str(before_state["avg_price"]))) * lock_volume * multiplier
            else:
                locked_profit = (Decimal(str(before_state["avg_price"])) - trigger_price) * lock_volume * multiplier

            # 7. 更新持仓锁定状态
            await self._update_position_lock(
                account_id=account_id,
                symbol=symbol,
                direction=direction,
                lock_volume=lock_volume,
                lock_price=trigger_price,
            )

            # 8. 记录执行历史
            execution_id = await self._save_execution_history(
                trigger_id=trigger_id,
                account_id=account_id,
                symbol=symbol,
                direction=direction,
                before_state=before_state,
                lock_volume=lock_volume,
                lock_direction=lock_direction,
                lock_price=float(trigger_price),
                locked_profit=float(locked_profit),
                polar_order_id=lock_result.get("order_id"),
                method=method,
            )

            # 9. 更新触发记录状态
            await self._update_trigger_status(
                trigger_id=trigger_id,
                status="executed",
                execution_time=datetime.now().isoformat(),
                result=f"锁定{lock_volume}手 @{trigger_price}, 锁定利润: {locked_profit:.2f}元",
            )

            logger.info(
                f"[锁仓执行] 执行成功: {symbol} {direction} {lock_volume}手, 锁定利润: {locked_profit:.2f}元"
            )

            return {
                "success": True,
                "execution_id": execution_id,
                "lock_volume": lock_volume,
                "lock_price": float(trigger_price),
                "locked_profit": float(locked_profit),
                "order_id": lock_result.get("order_id"),
            }

        except Exception as e:
            logger.error(f"[锁仓执行] 执行失败: {str(e)}")

            # 更新触发记录为失败状态
            await self._update_trigger_status(
                trigger_id=trigger_id,
                status="failed",
                execution_time=datetime.now().isoformat(),
                error=str(e),
            )

            return {"success": False, "error": str(e)}

    async def _execute_lock_order(
        self, account_id: str, symbol: str, direction: str, volume: int, price: float
    ) -> Dict[str, Any]:
        """
        执行锁仓订单 - 调用极星API

        集成方式:
        1. 调用极星策略的下单接口 (推荐)
        2. 通过WebSocket推送指令到极星策略
        3. 通过极星HTTP API下单

        返回:
            {"success": True, "order_id": "极星订单号"}
        """
        logger.info(
            f"[锁仓下单] {symbol} {direction} {volume}手 @{price}"
        )

        # TODO: 实际集成时,替换为极星API调用
        #
        # 方式1: 如果极星策略提供HTTP接口
        # import requests
        # response = requests.post(
        #     "http://极星策略地址/api/order",
        #     json={
        #         "account_id": account_id,
        #         "symbol": symbol,
        #         "direction": direction,
        #         "volume": volume,
        #         "order_type": "market"  # 或 "limit"
        #         "price": price if order_type == "limit" else None
        #     },
        #     headers={"X-API-Key": os.getenv("POLAR_API_KEY")}
        # )
        # order_id = response.json()["order_id"]
        #
        # 方式2: 如果通过WebSocket通知极星策略
        # await self._send_to_polar_strategy({
        #     "action": "lock",
        #     "account_id": account_id,
        #     "symbol": symbol,
        #     "direction": direction,
        #     "volume": volume,
        #     "price": price
        # })
        #
        # 方式3: 等待极星策略推送成交到 /api/trades,不主动下单
        # (需要极星策略监听数据库或WebSocket,自行判断并下单)

        # 临时返回(实际集成后删除)
        raise NotImplementedError(
            "锁仓下单接口未实现,请根据极星API文档完成集成。\n"
            "参考上方TODO注释中的3种集成方式。"
        )

    async def _get_position(self, account_id: str, symbol: str) -> Optional[Dict]:
        """获取持仓信息"""
        result = (
            self.db.table("positions")
            .select("*")
            .eq("account_id", account_id)
            .eq("symbol", symbol)
            .execute()
        )

        return result.data[0] if result.data else None

    async def _get_contract_multiplier(self, symbol: str) -> int:
        """获取合约乘数"""
        result = (
            self.db.table("contracts")
            .select("multiplier")
            .eq("polar_symbol", symbol)
            .execute()
        )

        return result.data[0]["multiplier"] if result.data else 10

    async def _update_position_lock(
        self,
        account_id: str,
        symbol: str,
        direction: str,
        lock_volume: int,
        lock_price: float,
    ):
        """更新持仓锁定状态"""
        lock_field = "is_long_locked" if direction == "long" else "is_short_locked"
        lock_price_field = (
            "long_lock_price" if direction == "long" else "short_lock_price"
        )

        # 获取当前持仓
        position = await self._get_position(account_id, symbol)
        if not position:
            return

        # 更新锁定状态
        update_data = {
            lock_field: True,
            lock_price_field: lock_price,
        }

        # 如果是部分锁仓,更新遗留持仓
        if direction == "long":
            remaining = position["long_position"] - lock_volume
            if remaining > 0:
                update_data["legacy_long_position"] = lock_volume
                update_data["legacy_long_profit"] = (
                    lock_price - position["long_avg_price"]
                ) * lock_volume * await self._get_contract_multiplier(symbol)
        else:
            remaining = position["short_position"] - lock_volume
            if remaining > 0:
                update_data["legacy_short_position"] = lock_volume
                update_data["legacy_short_profit"] = (
                    position["short_avg_price"] - lock_price
                ) * lock_volume * await self._get_contract_multiplier(symbol)

        self.db.table("positions").update(update_data).eq("id", position["id"]).execute()

    async def _save_execution_history(
        self,
        trigger_id: str,
        account_id: str,
        symbol: str,
        direction: str,
        before_state: Dict,
        lock_volume: int,
        lock_direction: str,
        lock_price: float,
        locked_profit: float,
        polar_order_id: Optional[str],
        method: str,
    ) -> str:
        """保存执行历史"""
        execution_data = {
            "id": str(uuid.uuid4()),
            "trigger_id": trigger_id,
            "account_id": account_id,
            "symbol": symbol,
            "direction": direction,
            "before_position": before_state["position"],
            "before_avg_price": before_state["avg_price"],
            "before_profit": before_state["profit"],
            "lock_volume": lock_volume,
            "lock_direction": lock_direction,
            "lock_price": lock_price,
            "locked_profit": locked_profit,
            "after_locked_position": lock_volume,
            "after_open_position": before_state["position"] - lock_volume,
            "polar_order_id": polar_order_id,
            "execution_method": method,
        }

        result = self.db.table("lock_executions").insert(execution_data).execute()
        return result.data[0]["id"]

    async def _update_trigger_status(
        self,
        trigger_id: str,
        status: str,
        execution_time: Optional[str] = None,
        result: Optional[str] = None,
        error: Optional[str] = None,
    ):
        """更新触发记录状态"""
        update_data = {"execution_status": status}

        if execution_time:
            update_data["execution_time"] = execution_time

        if result:
            update_data["execution_result"] = result

        if error:
            update_data["error_message"] = error

        self.db.table("lock_triggers").update(update_data).eq("id", trigger_id).execute()
