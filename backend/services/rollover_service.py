"""
换月自动执行服务

功能:
- 监控主力合约切换
- 检测到期合约
- 创建换月任务
- 执行换月操作
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
from supabase import Client

from backend.utils.notification import send_notification

logger = logging.getLogger(__name__)


class RolloverService:
    """换月执行服务"""

    def __init__(self, db: Client):
        self.db = db
        self.logger = logger

    # ==================== 配置管理 ====================

    async def create_config(
        self,
        account_id: str,
        exchange: str,
        variety_code: str,
        rollover_strategy: str = "auto",
        rollover_threshold: float = 0.7,
        days_before_expiry: int = 7,
        auto_execute: bool = False,
        **kwargs,
    ) -> Dict[str, Any]:
        """创建换月配置"""
        try:
            config_data = {
                "account_id": account_id,
                "exchange": exchange,
                "variety_code": variety_code,
                "rollover_strategy": rollover_strategy,
                "rollover_threshold": rollover_threshold,
                "days_before_expiry": days_before_expiry,
                "auto_execute": auto_execute,
                **kwargs,
            }

            result = self.db.table("rollover_configs").insert(config_data).execute()

            self.logger.info(f"创建换月配置: {exchange}.{variety_code}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"创建换月配置失败: {e}")
            raise

    async def get_configs(self, account_id: str = None) -> List[Dict[str, Any]]:
        """获取换月配置列表"""
        try:
            query = self.db.table("v_rollover_configs_summary").select("*")

            if account_id:
                query = query.eq("account_id", account_id)

            result = query.eq("is_enabled", True).execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取换月配置失败: {e}")
            return []

    # ==================== 任务管理 ====================

    async def create_task(
        self,
        config_id: str,
        account_id: str,
        old_symbol: str,
        new_symbol: str,
        variety_name: str,
        direction: str,
        old_position: int,
        rollover_volume: int,
        trigger_type: str,
        rollover_index: float = None,
    ) -> Dict[str, Any]:
        """创建换月任务"""
        try:
            task_data = {
                "config_id": config_id,
                "account_id": account_id,
                "old_symbol": old_symbol,
                "new_symbol": new_symbol,
                "variety_name": variety_name,
                "direction": direction,
                "old_position": old_position,
                "rollover_volume": rollover_volume,
                "trigger_type": trigger_type,
                "rollover_index": rollover_index,
                "status": "pending",
            }

            result = self.db.table("rollover_tasks").insert(task_data).execute()

            task = result.data[0] if result.data else None

            # 发送通知
            if task:
                message = (
                    f"合约: {old_symbol} → {new_symbol}\n"
                    f"持仓: {old_position} 手\n换月: {rollover_volume} 手\n触发: {trigger_type}"
                )
                await send_notification(
                    title=f"换月任务创建: {variety_name}",
                    message=message,
                    priority="default",
                    tags="repeat",
                )

            self.logger.info(f"创建换月任务: {old_symbol} -> {new_symbol}")
            return task

        except Exception as e:
            self.logger.error(f"创建换月任务失败: {e}")
            raise

    async def get_pending_tasks(self) -> List[Dict[str, Any]]:
        """获取待执行的换月任务"""
        try:
            result = self.db.table("v_pending_rollover_tasks").select("*").execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取待执行任务失败: {e}")
            return []

    async def update_task_status(
        self,
        task_id: str,
        status: str,
        error_message: str = None,
        **kwargs,
    ):
        """更新任务状态"""
        try:
            update_data = {"status": status, **kwargs}

            if status == "executing":
                update_data["started_at"] = datetime.now().isoformat()
            elif status in ["completed", "failed"]:
                update_data["completed_at"] = datetime.now().isoformat()

                # 计算执行时长
                task_result = (
                    self.db.table("rollover_tasks")
                    .select("started_at")
                    .eq("id", task_id)
                    .single()
                    .execute()
                )

                if task_result.data and task_result.data.get("started_at"):
                    started_at = datetime.fromisoformat(
                        task_result.data["started_at"].replace("Z", "+00:00")
                    )
                    duration_ms = int(
                        (datetime.now().timestamp() - started_at.timestamp()) * 1000
                    )
                    update_data["execution_duration_ms"] = duration_ms

            if error_message:
                update_data["error_message"] = error_message

            self.db.table("rollover_tasks").update(update_data).eq(
                "id", task_id
            ).execute()

            self.logger.info(f"更新任务状态: {task_id} -> {status}")

        except Exception as e:
            self.logger.error(f"更新任务状态失败: {e}")

    # ==================== 换月执行 ====================

    async def execute_rollover(self, task_id: str) -> bool:
        """
        执行换月操作
        1. 平掉旧合约持仓
        2. 开立新合约持仓
        3. 记录执行过程
        """
        try:
            # 获取任务信息
            task_result = (
                self.db.table("rollover_tasks")
                .select("*")
                .eq("id", task_id)
                .single()
                .execute()
            )

            if not task_result.data:
                raise ValueError(f"任务不存在: {task_id}")

            task = task_result.data

            # 更新状态为执行中
            await self.update_task_status(task_id, "executing")

            # 第1步: 平旧仓
            close_success = await self._close_old_position(task)

            if not close_success:
                await self.update_task_status(
                    task_id, "failed", error_message="平仓失败"
                )
                return False

            # 第2步: 开新仓
            open_success = await self._open_new_position(task)

            if not open_success:
                await self.update_task_status(
                    task_id, "failed", error_message="开仓失败"
                )
                return False

            # 更新状态为已完成
            await self.update_task_status(task_id, "completed")

            # 发送完成通知
            message = (
                f"合约: {task['old_symbol']} → {task['new_symbol']}\n"
                f"平仓: {task['close_volume']} 手\n开仓: {task['open_volume']} 手\n"
                f"成本: ¥{task.get('rollover_cost', 0):.2f}"
            )
            await send_notification(
                title=f"换月完成: {task['variety_name']}",
                message=message,
                priority="default",
                tags="white_check_mark",
            )

            self.logger.info(f"换月执行完成: {task_id}")
            return True

        except Exception as e:
            self.logger.error(f"执行换月失败: {e}")
            await self.update_task_status(task_id, "failed", error_message=str(e))
            return False

    async def _close_old_position(self, task: Dict[str, Any]) -> bool:
        """
        平掉旧合约持仓 - 调用极星API

        实际实现步骤:
        1. 获取旧合约最新价格(从天勤或行情缓存)
        2. 根据price_mode决定下单价格(市价/限价)
        3. 调用极星API下单平仓
        4. 等待成交确认
        5. 记录到rollover_executions表
        """
        try:
            self.logger.info(
                f"平旧仓: {task['old_symbol']} {task['direction']} {task['rollover_volume']}手"
            )

            # TODO: 实际集成时,替换为极星API调用
            #
            # 方式1: 调用极星策略HTTP接口
            # import requests
            # close_direction = "sell" if task["direction"] == "long" else "buy"
            # response = requests.post(
            #     "http://极星策略地址/api/close_position",
            #     json={
            #         "account_id": task["account_id"],
            #         "symbol": task["old_symbol"],
            #         "direction": close_direction,
            #         "volume": task["rollover_volume"],
            #         "order_type": "market"  # 或根据配置决定
            #     },
            #     headers={"X-API-Key": os.getenv("POLAR_API_KEY")}
            # )
            # order_result = response.json()
            #
            # # 等待成交(可通过轮询或webhook回调)
            # # ...
            #
            # # 记录执行详情
            # execution_data = {
            #     "task_id": task["id"],
            #     "step_type": "close",
            #     "symbol": task["old_symbol"],
            #     "direction": close_direction,
            #     "volume": task["rollover_volume"],
            #     "price": order_result["avg_price"],
            #     "commission": order_result["commission"],
            #     "polar_order_id": order_result["order_id"]
            # }
            # self.db.table("rollover_executions").insert(execution_data).execute()
            #
            # # 更新任务平仓信息
            # self.db.table("rollover_tasks").update({
            #     "close_volume": order_result["volume"],
            #     "close_avg_price": order_result["avg_price"],
            #     "close_cost": order_result["commission"]
            # }).eq("id", task["id"]).execute()
            #
            # return True

            # 临时返回(实际集成后删除)
            raise NotImplementedError(
                "换月平仓接口未实现,请根据极星API文档完成集成。\n"
                "参考上方TODO注释中的实现方式。"
            )

        except Exception as e:
            self.logger.error(f"平旧仓失败: {e}")
            return False

    async def _open_new_position(self, task: Dict[str, Any]) -> bool:
        """
        开立新合约持仓 - 调用极星API

        实际实现步骤:
        1. 获取新合约最新价格(从天勤或行情缓存)
        2. 根据price_mode决定下单价格(市价/限价)
        3. 调用极星API下单开仓
        4. 等待成交确认
        5. 记录到rollover_executions表
        6. 计算换月总成本
        """
        try:
            self.logger.info(
                f"开新仓: {task['new_symbol']} {task['direction']} {task['rollover_volume']}手"
            )

            # TODO: 实际集成时,替换为极星API调用
            #
            # 方式1: 调用极星策略HTTP接口
            # import requests
            # open_direction = "buy" if task["direction"] == "long" else "sell"
            # response = requests.post(
            #     "http://极星策略地址/api/open_position",
            #     json={
            #         "account_id": task["account_id"],
            #         "symbol": task["new_symbol"],
            #         "direction": open_direction,
            #         "volume": task["rollover_volume"],
            #         "order_type": "market"  # 或根据配置决定
            #     },
            #     headers={"X-API-Key": os.getenv("POLAR_API_KEY")}
            # )
            # order_result = response.json()
            #
            # # 等待成交(可通过轮询或webhook回调)
            # # ...
            #
            # # 记录执行详情
            # execution_data = {
            #     "task_id": task["id"],
            #     "step_type": "open",
            #     "symbol": task["new_symbol"],
            #     "direction": open_direction,
            #     "volume": task["rollover_volume"],
            #     "price": order_result["avg_price"],
            #     "commission": order_result["commission"],
            #     "polar_order_id": order_result["order_id"]
            # }
            # self.db.table("rollover_executions").insert(execution_data).execute()
            #
            # # 计算换月总成本
            # close_cost = task.get("close_cost", 0)
            # open_cost = order_result["commission"]
            # close_price = task.get("close_avg_price", 0)
            # open_price = order_result["avg_price"]
            # price_diff = open_price - close_price
            #
            # # 获取合约乘数
            # contract = self.db.table("contracts")\
            #     .select("multiplier")\
            #     .eq("polar_symbol", task["new_symbol"])\
            #     .single()\
            #     .execute()
            # multiplier = contract.data["multiplier"] if contract.data else 10
            #
            # rollover_cost = close_cost + open_cost + (price_diff * task["rollover_volume"] * multiplier)
            #
            # # 更新任务开仓信息和总成本
            # self.db.table("rollover_tasks").update({
            #     "open_volume": order_result["volume"],
            #     "open_avg_price": order_result["avg_price"],
            #     "open_cost": order_result["commission"],
            #     "price_diff": price_diff,
            #     "rollover_cost": rollover_cost
            # }).eq("id", task["id"]).execute()
            #
            # return True

            # 临时返回(实际集成后删除)
            raise NotImplementedError(
                "换月开仓接口未实现,请根据极星API文档完成集成。\n"
                "参考上方TODO注释中的实现方式。"
            )

        except Exception as e:
            self.logger.error(f"开新仓失败: {e}")
            return False

    # ==================== 监控和触发 ====================

    async def check_main_contract_switches(self):
        """检查主力合约切换,创建换月任务"""
        try:
            # 获取最近的主力切换记录(1小时内)
            one_hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()

            result = (
                self.db.table("main_contract_switches")
                .select("*")
                .gte("switch_date", one_hour_ago)
                .execute()
            )

            for switch in result.data:
                await self._handle_main_switch(switch)

        except Exception as e:
            self.logger.error(f"检查主力切换失败: {e}")

    async def _handle_main_switch(self, switch: Dict[str, Any]):
        """处理主力合约切换"""
        try:
            exchange = switch["exchange"]
            variety_code = switch["variety_code"]

            # 查找该品种的换月配置
            config_result = (
                self.db.table("rollover_configs")
                .select("*")
                .eq("exchange", exchange)
                .eq("variety_code", variety_code)
                .eq("is_enabled", True)
                .eq("trigger_on_main_switch", True)
                .execute()
            )

            if not config_result.data:
                return

            for config in config_result.data:
                # 检查是否满足换月阈值
                rollover_index = switch.get("rollover_index", 0)
                if rollover_index < config["rollover_threshold"]:
                    continue

                # 查找该账户在旧合约上的持仓
                old_symbol = switch["old_main_contract"]
                account_id = config["account_id"]

                position_result = (
                    self.db.table("positions")
                    .select("*")
                    .eq("account_id", account_id)
                    .eq("symbol", old_symbol)
                    .execute()
                )

                if not position_result.data:
                    continue

                position = position_result.data[0]

                # 计算换月数量
                rollover_ratio = config["rollover_ratio"]
                total_position = position["long_position"] + position["short_position"]
                rollover_volume = int(total_position * rollover_ratio)

                if rollover_volume == 0:
                    continue

                # 确定方向
                direction = "long" if position["long_position"] > 0 else "short"
                old_position = (
                    position["long_position"]
                    if direction == "long"
                    else position["short_position"]
                )

                # 创建换月任务
                await self.create_task(
                    config_id=config["id"],
                    account_id=account_id,
                    old_symbol=old_symbol,
                    new_symbol=switch["new_main_contract"],
                    variety_name=switch["variety_name"],
                    direction=direction,
                    old_position=old_position,
                    rollover_volume=rollover_volume,
                    trigger_type="main_switch",
                    rollover_index=rollover_index,
                )

        except Exception as e:
            self.logger.error(f"处理主力切换失败: {e}")

    async def check_expiring_contracts(self):
        """检查即将到期的合约,创建换月任务"""
        try:
            # 获取所有换月配置
            configs = await self.get_configs()

            for config in configs:
                days_before = config["days_before_expiry"]
                target_date = (datetime.now() + timedelta(days=days_before)).date()

                # 查找即将到期的合约
                contract_result = (
                    self.db.table("contracts")
                    .select("*")
                    .eq("exchange", config["exchange"])
                    .eq("variety_code", config["variety_code"])
                    .lte("expire_date", target_date.isoformat())
                    .eq("is_active", True)
                    .execute()
                )

                for contract in contract_result.data:
                    await self._handle_expiring_contract(config, contract)

        except Exception as e:
            self.logger.error(f"检查到期合约失败: {e}")

    async def _handle_expiring_contract(
        self, config: Dict[str, Any], contract: Dict[str, Any]
    ):
        """处理即将到期的合约"""
        try:
            old_symbol = contract["symbol"]
            account_id = config["account_id"]

            # 查找持仓
            position_result = (
                self.db.table("positions")
                .select("*")
                .eq("account_id", account_id)
                .eq("symbol", old_symbol)
                .execute()
            )

            if not position_result.data:
                return

            position = position_result.data[0]
            total_position = position["long_position"] + position["short_position"]

            if total_position == 0:
                return

            # 找到下一个月份的合约(新主力)
            new_symbol_result = (
                self.db.table("contracts")
                .select("*")
                .eq("exchange", config["exchange"])
                .eq("variety_code", config["variety_code"])
                .eq("is_main_contract", True)
                .execute()
            )

            if not new_symbol_result.data:
                return

            new_contract = new_symbol_result.data[0]

            # 确定方向
            direction = "long" if position["long_position"] > 0 else "short"
            old_position = (
                position["long_position"]
                if direction == "long"
                else position["short_position"]
            )

            # 计算换月数量
            rollover_ratio = config["rollover_ratio"]
            rollover_volume = int(old_position * rollover_ratio)

            if rollover_volume == 0:
                return

            # 创建换月任务
            await self.create_task(
                config_id=config["id"],
                account_id=account_id,
                old_symbol=old_symbol,
                new_symbol=new_contract["symbol"],
                variety_name=contract["variety_name"],
                direction=direction,
                old_position=old_position,
                rollover_volume=rollover_volume,
                trigger_type="expiry",
            )

        except Exception as e:
            self.logger.error(f"处理到期合约失败: {e}")

    async def process_pending_tasks(self):
        """处理待执行的换月任务"""
        try:
            tasks = await self.get_pending_tasks()

            for task in tasks:
                # 检查是否自动执行
                if task["auto_execute"]:
                    await self.execute_rollover(task["id"])
                else:
                    self.logger.info(
                        f"待执行任务: {task['old_symbol']} -> {task['new_symbol']} (需手动确认)"
                    )

        except Exception as e:
            self.logger.error(f"处理待执行任务失败: {e}")

    async def start_monitoring(self, interval: int = 300):
        """
        启动监控服务
        interval: 监控间隔(秒), 默认5分钟
        """
        self.logger.info(f"换月监控服务启动,间隔: {interval}秒")

        while True:
            try:
                # 检查主力切换
                await self.check_main_contract_switches()

                # 检查到期合约
                await self.check_expiring_contracts()

                # 处理待执行任务
                await self.process_pending_tasks()

            except Exception as e:
                self.logger.error(f"监控循环错误: {e}")

            await asyncio.sleep(interval)
