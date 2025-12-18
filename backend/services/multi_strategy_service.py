"""
多策略并行管理服务

功能:
- 策略组管理
- 资源分配
- 信号协调
- 冲突检测
- 性能分析
"""

from datetime import timedelta
import json
import logging
from datetime import datetime, date
from typing import Dict, List, Any
from supabase import Client

from backend.utils.notification import send_notification

logger = logging.getLogger(__name__)


class MultiStrategyService:
    """多策略管理服务"""

    def __init__(self, db: Client):
        self.db = db
        self.logger = logger

    # ==================== 策略组管理 ====================

    async def create_group(
        self,
        account_id: str,
        group_name: str,
        description: str = "",
        total_capital: float = None,
        max_position_ratio: float = 1.0,
        max_risk_per_strategy: float = 0.2,
        allow_opposite_positions: bool = True,
        position_conflict_mode: str = "allow",
    ) -> Dict[str, Any]:
        """创建策略组"""
        try:
            group_data = {
                "account_id": account_id,
                "group_name": group_name,
                "description": description,
                "total_capital": total_capital,
                "max_position_ratio": max_position_ratio,
                "max_risk_per_strategy": max_risk_per_strategy,
                "allow_opposite_positions": allow_opposite_positions,
                "position_conflict_mode": position_conflict_mode,
            }

            result = self.db.table("strategy_groups").insert(group_data).execute()

            self.logger.info(f"创建策略组: {group_name}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"创建策略组失败: {e}")
            raise

    async def get_groups(self, account_id: str = None) -> List[Dict[str, Any]]:
        """获取策略组列表"""
        try:
            query = self.db.table("v_strategy_group_summary").select("*")

            if account_id:
                query = query.eq("account_id", account_id)

            result = query.execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取策略组失败: {e}")
            return []

    async def add_member(
        self,
        group_id: str,
        instance_id: str,
        capital_allocation: float = None,
        position_limit: int = None,
        priority: int = 0,
    ) -> Dict[str, Any]:
        """添加策略到组"""
        try:
            member_data = {
                "group_id": group_id,
                "instance_id": instance_id,
                "capital_allocation": capital_allocation,
                "position_limit": position_limit,
                "priority": priority,
            }

            result = (
                self.db.table("strategy_group_members").insert(member_data).execute()
            )

            # 发送通知
            instance_result = (
                self.db.table("strategy_instances")
                .select("instance_name")
                .eq("id", instance_id)
                .single()
                .execute()
            )

            if instance_result.data:
                await send_notification(
                    title="策略加入组",
                    message=f"策略实例 {instance_result.data['instance_name']} 已加入策略组",
                    tags="inbox_tray",
                )

            self.logger.info(f"添加策略到组: {instance_id} -> {group_id}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"添加策略到组失败: {e}")
            raise

    async def remove_member(self, group_id: str, instance_id: str):
        """从组中移除策略"""
        try:
            self.db.table("strategy_group_members").delete().eq(
                "group_id", group_id
            ).eq("instance_id", instance_id).execute()

            self.logger.info(f"从组中移除策略: {instance_id}")

        except Exception as e:
            self.logger.error(f"移除策略失败: {e}")
            raise

    # ==================== 信号管理 ====================

    async def create_signal(
        self,
        instance_id: str,
        symbol: str,
        signal_type: str,
        direction: str,
        volume: int,
        price: float = None,
        confidence: float = 1.0,
        strength: str = "medium",
        expires_at: datetime = None,
    ) -> Dict[str, Any]:
        """创建交易信号"""
        try:
            signal_data = {
                "instance_id": instance_id,
                "symbol": symbol,
                "signal_type": signal_type,
                "direction": direction,
                "volume": volume,
                "price": price,
                "confidence": confidence,
                "strength": strength,
                "expires_at": expires_at.isoformat() if expires_at else None,
                "status": "pending",
            }

            result = self.db.table("strategy_signals").insert(signal_data).execute()

            self.logger.info(f"创建信号: {signal_type} {symbol} {direction} {volume}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"创建信号失败: {e}")
            raise

    async def get_pending_signals(
        self, group_id: str = None
    ) -> List[Dict[str, Any]]:
        """获取待处理信号"""
        try:
            query = self.db.table("v_pending_signals").select("*")

            if group_id:
                # 筛选该组的信号
                members_result = (
                    self.db.table("strategy_group_members")
                    .select("instance_id")
                    .eq("group_id", group_id)
                    .execute()
                )

                instance_ids = [m["instance_id"] for m in members_result.data]
                query = query.in_("instance_id", instance_ids)

            result = query.execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取待处理信号失败: {e}")
            return []

    async def process_signal(self, signal_id: str) -> bool:
        """
        处理信号
        1. 检查冲突
        2. 检查资源
        3. 执行或拒绝
        """
        try:
            # 获取信号详情
            signal_result = (
                self.db.table("strategy_signals")
                .select("*")
                .eq("id", signal_id)
                .single()
                .execute()
            )

            if not signal_result.data:
                return False

            signal = signal_result.data

            # 获取策略所在的组
            member_result = (
                self.db.table("strategy_group_members")
                .select("group_id")
                .eq("instance_id", signal["instance_id"])
                .eq("is_active", True)
                .execute()
            )

            if not member_result.data:
                # 不在任何组中,直接执行
                return await self._execute_signal(signal)

            group_id = member_result.data[0]["group_id"]

            # 检查冲突
            has_conflict = await self._check_signal_conflict(group_id, signal)

            if has_conflict:
                # 记录冲突并拒绝
                await self._reject_signal(
                    signal_id, "Conflict with other strategies"
                )
                return False

            # 检查资源
            has_resources = await self._check_resources(group_id, signal)

            if not has_resources:
                await self._reject_signal(signal_id, "Insufficient resources")
                return False

            # 执行信号
            return await self._execute_signal(signal)

        except Exception as e:
            self.logger.error(f"处理信号失败: {e}")
            return False

    async def _check_signal_conflict(
        self, group_id: str, signal: Dict[str, Any]
    ) -> bool:
        """检查信号冲突"""
        try:
            # 调用数据库函数检查冲突
            result = self.db.rpc(
                "check_strategy_conflicts",
                {
                    "p_group_id": group_id,
                    "p_instance_id": signal["instance_id"],
                    "p_symbol": signal["symbol"],
                    "p_direction": signal["direction"],
                    "p_volume": signal["volume"],
                },
            ).execute()

            if result.data and len(result.data) > 0:
                conflict = result.data[0]
                if conflict.get("has_conflict"):
                    # 记录冲突
                    await self._record_conflict(group_id, signal, conflict)
                    return True

            return False

        except Exception as e:
            self.logger.error(f"检查信号冲突失败: {e}")
            return False

    async def _record_conflict(
        self, group_id: str, signal: Dict[str, Any], conflict: Dict[str, Any]
    ):
        """记录策略冲突"""
        try:
            conflict_data = {
                "group_id": group_id,
                "instance_id_1": signal["instance_id"],
                "instance_id_2": conflict["conflicting_instance_id"],
                "conflict_type": conflict["conflict_type"],
                "symbol": signal["symbol"],
                "description": conflict["description"],
            }

            self.db.table("strategy_conflicts").insert(conflict_data).execute()

        except Exception as e:
            self.logger.error(f"记录冲突失败: {e}")

    async def _check_resources(
        self, group_id: str, signal: Dict[str, Any]
    ) -> bool:
        """检查资源是否充足"""
        try:
            # 获取组配置
            group_result = (
                self.db.table("strategy_groups")
                .select("*")
                .eq("id", group_id)
                .single()
                .execute()
            )

            if not group_result.data:
                return True  # 没有限制

            _ = group_result.data

            # 这里可以添加更复杂的资源检查逻辑
            # 例如: 检查资金、保证金、持仓限制等

            return True

        except Exception as e:
            self.logger.error(f"检查资源失败: {e}")
            return False

    async def _execute_signal(self, signal: Dict[str, Any]) -> bool:
        """
        执行策略信号 - 调用极星API

        实际实现步骤:
        1. 根据signal_type确定操作类型(开仓/平仓/反手)
        2. 获取当前最新价格
        3. 调用极星API下单
        4. 等待成交确认
        5. 更新信号执行状态
        """
        try:
            self.logger.info(
                f"执行信号: {signal['signal_type']} {signal['symbol']} "
                f"{signal['direction']} {signal['volume']}"
            )

            # TODO: 实际集成时,替换为极星API调用
            #
            # 方式1: 调用极星策略HTTP接口
            # import requests
            # response = requests.post(
            #     "http://极星策略地址/api/order",
            #     json={
            #         "account_id": signal["account_id"],
            #         "symbol": signal["symbol"],
            #         "signal_type": signal["signal_type"],  # open/close/reverse
            #         "direction": signal["direction"],      # buy/sell
            #         "volume": signal["volume"],
            #         "price": signal.get("price"),          # None表示市价
            #         "strategy_instance_id": signal["instance_id"]
            #     },
            #     headers={"X-API-Key": os.getenv("POLAR_API_KEY")}
            # )
            # order_result = response.json()
            #
            # # 更新信号执行状态
            # self.db.table("strategy_signals").update({
            #     "status": "executed",
            #     "executed_at": datetime.now().isoformat(),
            #     "execution_price": order_result["avg_price"],
            #     "execution_volume": order_result["volume"],
            #     "polar_order_id": order_result["order_id"]
            # }).eq("id", signal["id"]).execute()
            #
            # return True

            # 临时返回(实际集成后删除)
            raise NotImplementedError(
                "策略信号执行接口未实现,请根据极星API文档完成集成。\n"
                "参考上方TODO注释中的实现方式。"
            )

        except Exception as e:
            self.logger.error(f"执行信号失败: {e}")
            return False

    async def _reject_signal(self, signal_id: str, reason: str):
        """拒绝信号"""
        try:
            self.db.table("strategy_signals").update(
                {"status": "rejected", "rejection_reason": reason}
            ).eq("id", signal_id).execute()

            self.logger.info(f"拒绝信号: {signal_id} - {reason}")

        except Exception as e:
            self.logger.error(f"拒绝信号失败: {e}")

    # ==================== 性能管理 ====================

    async def record_performance(
        self,
        instance_id: str,
        performance_date: date,
        metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        """记录策略性能"""
        try:
            perf_data = {
                "instance_id": instance_id,
                "date": performance_date.isoformat(),
                **metrics,
            }

            result = (
                self.db.table("strategy_performance")
                .upsert(perf_data, on_conflict="instance_id,date")
                .execute()
            )

            self.logger.info(f"记录性能: {instance_id} {performance_date}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"记录性能失败: {e}")
            raise

    async def get_performance(
        self,
        instance_id: str = None,
        start_date: date = None,
        end_date: date = None,
    ) -> List[Dict[str, Any]]:
        """获取策略性能"""
        try:
            query = self.db.table("strategy_performance").select("*")

            if instance_id:
                query = query.eq("instance_id", instance_id)

            if start_date:
                query = query.gte("date", start_date.isoformat())

            if end_date:
                query = query.lte("date", end_date.isoformat())

            result = query.order("date", desc=True).execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取性能失败: {e}")
            return []

    async def get_performance_ranking(
        self, days: int = 30
    ) -> List[Dict[str, Any]]:
        """获取性能排名"""
        try:
            start_date = (datetime.now().date() - timedelta(days=days)).isoformat()

            result = (
                self.db.table("v_strategy_performance_ranking")
                .select("*")
                .gte("date", start_date)
                .execute()
            )

            return result.data

        except Exception as e:
            self.logger.error(f"获取性能排名失败: {e}")
            return []

    # ==================== 资源监控 ====================

    async def record_resource_usage(
        self, group_id: str, usage_data: Dict[str, Any]
    ):
        """记录资源使用情况"""
        try:
            resource_data = {
                "group_id": group_id,
                "total_capital_used": usage_data.get("total_capital_used"),
                "total_position": usage_data.get("total_position"),
                "total_margin_used": usage_data.get("total_margin_used"),
                "total_risk": usage_data.get("total_risk"),
                "risk_utilization": usage_data.get("risk_utilization"),
                "strategy_breakdown": json.dumps(
                    usage_data.get("strategy_breakdown", {})
                ),
            }

            self.db.table("resource_usage").insert(resource_data).execute()

        except Exception as e:
            self.logger.error(f"记录资源使用失败: {e}")

    async def get_resource_usage(
        self, group_id: str, hours: int = 24
    ) -> List[Dict[str, Any]]:
        """获取资源使用历史"""
        try:
            cutoff_time = (
                datetime.now() - timedelta(hours=hours)
            ).isoformat()

            result = (
                self.db.table("resource_usage")
                .select("*")
                .eq("group_id", group_id)
                .gte("timestamp", cutoff_time)
                .order("timestamp", desc=True)
                .execute()
            )

            return result.data

        except Exception as e:
            self.logger.error(f"获取资源使用失败: {e}")
            return []

    # ==================== 冲突管理 ====================

    async def get_conflicts(
        self, group_id: str, resolved: bool = None
    ) -> List[Dict[str, Any]]:
        """获取冲突记录"""
        try:
            query = (
                self.db.table("strategy_conflicts")
                .select("*")
                .eq("group_id", group_id)
            )

            if resolved is not None:
                query = query.eq("resolved", resolved)

            result = query.order("created_at", desc=True).execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取冲突记录失败: {e}")
            return []

    async def resolve_conflict(
        self, conflict_id: str, resolution: str
    ):
        """解决冲突"""
        try:
            self.db.table("strategy_conflicts").update(
                {
                    "resolved": True,
                    "resolution": resolution,
                    "resolved_at": datetime.now().isoformat(),
                }
            ).eq("id", conflict_id).execute()

            self.logger.info(f"解决冲突: {conflict_id} - {resolution}")

        except Exception as e:
            self.logger.error(f"解决冲突失败: {e}")

    # ==================== 监控服务 ====================

    async def monitor_and_process(self):
        """监控并处理信号"""
        try:
            # 获取所有待处理信号
            signals = await self.get_pending_signals()

            for signal in signals:
                await self.process_signal(signal["id"])

        except Exception as e:
            self.logger.error(f"监控处理失败: {e}")
