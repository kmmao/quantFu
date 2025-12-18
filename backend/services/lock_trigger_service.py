"""
锁仓触发监控服务
实时监控价格和利润,触发锁仓条件时执行锁仓
"""
import asyncio
from datetime import datetime
from typing import Dict, Any
import uuid

from supabase import Client
from utils.db import get_supabase_client
from utils.logger import get_logger
from engines.lock_engine import LockEngine
from utils.notification import send_notification

logger = get_logger(__name__)


class LockTriggerService:
    """锁仓触发监控服务"""

    def __init__(self):
        self.db: Client = get_supabase_client()
        self.lock_engine = LockEngine()
        self.running = False
        self.check_interval = 1.0  # 检查间隔(秒)

    async def start(self):
        """启动监控服务"""
        self.running = True
        logger.info("🔒 锁仓触发监控服务启动")

        try:
            while self.running:
                await self.check_all_configs()
                await asyncio.sleep(self.check_interval)
        except Exception as e:
            logger.error(f"锁仓监控服务异常: {e}")
            self.running = False

    def stop(self):
        """停止监控服务"""
        self.running = False
        logger.info("🛑 锁仓触发监控服务停止")

    async def check_all_configs(self):
        """检查所有活跃的锁仓配置"""
        try:
            # 获取所有活跃配置(通过视图)
            result = (
                self.db.table("v_active_lock_configs")
                .select("*")
                .execute()
            )

            configs = result.data
            if not configs:
                return

            logger.debug(f"检查 {len(configs)} 个锁仓配置")

            for config in configs:
                await self._check_config(config)

        except Exception as e:
            logger.error(f"检查锁仓配置失败: {e}")

    async def _check_config(self, config: Dict[str, Any]):
        """检查单个配置是否触发"""
        try:
            # 基本信息
            config_id = config["id"]
            account_id = config["account_id"]
            symbol = config["symbol"]
            direction = config["direction"]
            trigger_type = config["trigger_type"]
            auto_execute = config["auto_execute"]

            # 当前状态
            current_position = config.get("current_position", 0)
            current_profit = config.get("current_profit", 0)
            current_price = config.get("last_price", 0)

            # 如果没有持仓,跳过
            if not current_position or current_position <= 0:
                return

            # 根据触发类型检查条件
            triggered = False
            trigger_reason = ""
            lock_volume = 0

            if trigger_type == "profit":
                # 利润触发
                if config.get("profit_lock_enabled"):
                    threshold = config.get("profit_lock_threshold", 0)
                    if current_profit >= threshold:
                        triggered = True
                        trigger_reason = f"利润达到阈值: {current_profit:.2f} >= {threshold:.2f}"
                        lock_ratio = config.get("profit_lock_ratio", 0.8)
                        lock_volume = int(current_position * lock_ratio)

            elif trigger_type == "price":
                # 价格触发
                target_price = config.get("trigger_price")
                if target_price:
                    if direction == "long" and current_price >= target_price:
                        triggered = True
                        trigger_reason = f"价格达到目标: {current_price} >= {target_price}"
                        lock_ratio = config.get("profit_lock_ratio", 0.8)
                        lock_volume = int(current_position * lock_ratio)
                    elif direction == "short" and current_price <= target_price:
                        triggered = True
                        trigger_reason = f"价格达到目标: {current_price} <= {target_price}"
                        lock_ratio = config.get("profit_lock_ratio", 0.8)
                        lock_volume = int(current_position * lock_ratio)

                # 止损触发
                stop_loss_price = config.get("stop_loss_price")
                if stop_loss_price:
                    if direction == "long" and current_price <= stop_loss_price:
                        triggered = True
                        trigger_reason = f"触发止损: {current_price} <= {stop_loss_price}"
                        lock_volume = current_position  # 全部锁仓
                    elif direction == "short" and current_price >= stop_loss_price:
                        triggered = True
                        trigger_reason = f"触发止损: {current_price} >= {stop_loss_price}"
                        lock_volume = current_position

            elif trigger_type == "trailing":
                # 移动止损
                if config.get("trailing_stop"):
                    _ = config.get("trailing_distance", 0)
                    # 简化实现:从最高价回落一定距离触发
                    # 实际应维护最高价/最低价状态

            # 如果触发
            if triggered and lock_volume > 0:
                logger.info(
                    f"[触发锁仓] {symbol} {direction} - {trigger_reason}"
                )

                # 创建触发记录
                trigger_id = await self._create_trigger_record(
                    config_id=config_id,
                    account_id=account_id,
                    symbol=symbol,
                    direction=direction,
                    trigger_type=trigger_type,
                    trigger_price=current_price,
                    trigger_profit=current_profit,
                    trigger_condition=trigger_reason,
                    lock_volume=lock_volume,
                    auto_execute=auto_execute,
                )

                # 发送通知
                await self._send_trigger_notification(
                    account_name=config.get("account_name"),
                    symbol=symbol,
                    direction=direction,
                    trigger_reason=trigger_reason,
                    lock_volume=lock_volume,
                    current_price=current_price,
                    auto_execute=auto_execute,
                )

                # 如果启用自动执行
                if auto_execute:
                    logger.info(f"[自动执行] 开始执行锁仓: {symbol} {direction} {lock_volume}手")

                    execution_result = await self.lock_engine.execute_lock(
                        trigger_id=trigger_id,
                        account_id=account_id,
                        symbol=symbol,
                        direction=direction,
                        lock_volume=lock_volume,
                        trigger_price=current_price,
                        method="auto",
                    )

                    if execution_result["success"]:
                        await self._send_execution_notification(
                            account_name=config.get("account_name"),
                            symbol=symbol,
                            direction=direction,
                            lock_volume=lock_volume,
                            lock_price=current_price,
                            locked_profit=execution_result.get("locked_profit", 0),
                        )
                    else:
                        logger.error(f"[自动执行失败] {execution_result.get('error')}")

        except Exception as e:
            logger.error(f"检查配置失败 {config.get('id')}: {e}")

    async def _create_trigger_record(
        self,
        config_id: str,
        account_id: str,
        symbol: str,
        direction: str,
        trigger_type: str,
        trigger_price: float,
        trigger_profit: float,
        trigger_condition: str,
        lock_volume: int,
        auto_execute: bool,
    ) -> str:
        """创建触发记录"""
        trigger_data = {
            "id": str(uuid.uuid4()),
            "config_id": config_id,
            "account_id": account_id,
            "symbol": symbol,
            "direction": direction,
            "trigger_type": trigger_type,
            "trigger_price": trigger_price,
            "trigger_profit": trigger_profit,
            "trigger_condition": trigger_condition,
            "lock_volume": lock_volume,
            "lock_price": trigger_price,
            "execution_status": "pending" if auto_execute else "waiting_confirm",
        }

        result = self.db.table("lock_triggers").insert(trigger_data).execute()
        return result.data[0]["id"]

    async def _send_trigger_notification(
        self,
        account_name: str,
        symbol: str,
        direction: str,
        trigger_reason: str,
        lock_volume: int,
        current_price: float,
        auto_execute: bool,
    ):
        """发送触发通知"""
        direction_cn = "多仓" if direction == "long" else "空仓"
        action = "自动执行中" if auto_execute else "等待确认"

        message = f"""
🔒 锁仓触发通知

账户: {account_name}
合约: {symbol}
方向: {direction_cn}
触发条件: {trigger_reason}
锁定手数: {lock_volume}手
当前价格: {current_price}

状态: {action}
        """.strip()

        await send_notification(
            title="锁仓触发",
            message=message,
            priority="high",
        )

    async def _send_execution_notification(
        self,
        account_name: str,
        symbol: str,
        direction: str,
        lock_volume: int,
        lock_price: float,
        locked_profit: float,
    ):
        """发送执行完成通知"""
        direction_cn = "多仓" if direction == "long" else "空仓"

        message = f"""
✅ 锁仓执行成功

账户: {account_name}
合约: {symbol}
方向: {direction_cn}
锁定手数: {lock_volume}手
锁定价格: {lock_price}
锁定利润: {locked_profit:.2f}元

执行时间: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        """.strip()

        await send_notification(
            title="锁仓执行成功",
            message=message,
            priority="high",
        )


# 运行示例
async def main():
    """测试运行"""
    service = LockTriggerService()
    try:
        await service.start()
    except KeyboardInterrupt:
        service.stop()
        print("\n服务已停止")


if __name__ == "__main__":
    asyncio.run(main())
