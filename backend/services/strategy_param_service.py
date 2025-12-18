"""
策略参数远程配置服务

功能:
- 策略参数定义管理
- 参数配置更新
- 参数模板管理
- 参数变更历史
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any
from supabase import Client

from backend.utils.notification import send_notification

logger = logging.getLogger(__name__)


class StrategyParamService:
    """策略参数管理服务"""

    def __init__(self, db: Client):
        self.db = db
        self.logger = logger

    # ==================== 策略定义管理 ====================

    async def create_strategy(
        self,
        name: str,
        display_name: str,
        version: str,
        description: str = "",
        category: str = "",
        risk_level: str = "medium",
        created_by: str = "system",
    ) -> Dict[str, Any]:
        """创建策略定义"""
        try:
            strategy_data = {
                "name": name,
                "display_name": display_name,
                "version": version,
                "description": description,
                "category": category,
                "risk_level": risk_level,
                "created_by": created_by,
            }

            result = self.db.table("strategies").insert(strategy_data).execute()

            self.logger.info(f"创建策略定义: {name}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"创建策略定义失败: {e}")
            raise

    async def add_param_definition(
        self,
        strategy_id: str,
        param_key: str,
        param_name: str,
        param_type: str,
        default_value: Any = None,
        description: str = "",
        min_value: float = None,
        max_value: float = None,
        is_required: bool = False,
        group_name: str = "",
        unit: str = "",
        display_order: int = 0,
    ) -> Dict[str, Any]:
        """添加参数定义"""
        try:
            param_def = {
                "strategy_id": strategy_id,
                "param_key": param_key,
                "param_name": param_name,
                "param_type": param_type,
                "default_value": json.dumps(default_value) if default_value is not None else None,
                "description": description,
                "min_value": min_value,
                "max_value": max_value,
                "is_required": is_required,
                "group_name": group_name,
                "unit": unit,
                "display_order": display_order,
            }

            result = self.db.table("strategy_param_definitions").insert(param_def).execute()

            self.logger.info(f"添加参数定义: {param_key}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"添加参数定义失败: {e}")
            raise

    # ==================== 策略实例管理 ====================

    async def create_instance(
        self,
        strategy_id: str,
        account_id: str,
        instance_name: str,
        symbols: List[str] = None,
    ) -> Dict[str, Any]:
        """创建策略实例"""
        try:
            instance_data = {
                "strategy_id": strategy_id,
                "account_id": account_id,
                "instance_name": instance_name,
                "symbols": symbols or [],
                "status": "stopped",
            }

            result = self.db.table("strategy_instances").insert(instance_data).execute()

            instance = result.data[0] if result.data else None

            # 初始化默认参数
            if instance:
                await self._init_default_params(instance["id"], strategy_id)

            self.logger.info(f"创建策略实例: {instance_name}")
            return instance

        except Exception as e:
            self.logger.error(f"创建策略实例失败: {e}")
            raise

    async def _init_default_params(self, instance_id: str, strategy_id: str):
        """初始化实例的默认参数"""
        try:
            # 获取策略的参数定义
            result = (
                self.db.table("strategy_param_definitions")
                .select("*")
                .eq("strategy_id", strategy_id)
                .execute()
            )

            param_defs = result.data

            # 为每个参数创建配置
            for param_def in param_defs:
                if param_def.get("default_value"):
                    await self.set_param(
                        instance_id=instance_id,
                        param_key=param_def["param_key"],
                        param_value=json.loads(param_def["default_value"]),
                        changed_by="system",
                        change_reason="初始化默认参数",
                    )

        except Exception as e:
            self.logger.error(f"初始化默认参数失败: {e}")

    async def update_instance_status(
        self, instance_id: str, status: str, error_message: str = None
    ):
        """更新实例状态"""
        try:
            update_data = {"status": status}

            if status == "running":
                update_data["started_at"] = datetime.now().isoformat()
            elif status in ["stopped", "error"]:
                update_data["stopped_at"] = datetime.now().isoformat()

            if error_message:
                update_data["error_message"] = error_message

            self.db.table("strategy_instances").update(update_data).eq(
                "id", instance_id
            ).execute()

            self.logger.info(f"更新实例状态: {instance_id} -> {status}")

        except Exception as e:
            self.logger.error(f"更新实例状态失败: {e}")

    async def update_heartbeat(self, instance_id: str):
        """更新心跳时间"""
        try:
            self.db.table("strategy_instances").update(
                {"last_heartbeat": datetime.now().isoformat()}
            ).eq("id", instance_id).execute()

        except Exception as e:
            self.logger.error(f"更新心跳失败: {e}")

    # ==================== 参数配置管理 ====================

    async def get_params(self, instance_id: str) -> Dict[str, Any]:
        """
        获取实例的当前参数配置
        返回 {param_key: param_value} 的字典
        """
        try:
            result = (
                self.db.table("v_current_strategy_params")
                .select("param_key, param_value")
                .eq("instance_id", instance_id)
                .execute()
            )

            params = {}
            for row in result.data:
                try:
                    params[row["param_key"]] = json.loads(row["param_value"])
                except json.JSONDecodeError:
                    params[row["param_key"]] = row["param_value"]

            return params

        except Exception as e:
            self.logger.error(f"获取参数配置失败: {e}")
            return {}

    async def get_param(self, instance_id: str, param_key: str) -> Any:
        """获取单个参数值"""
        params = await self.get_params(instance_id)
        return params.get(param_key)

    async def set_param(
        self,
        instance_id: str,
        param_key: str,
        param_value: Any,
        changed_by: str = "system",
        change_reason: str = "",
        effective_at: datetime = None,
    ) -> Dict[str, Any]:
        """
        设置参数值
        1. 验证参数
        2. 将旧配置设为非活跃
        3. 创建新配置
        4. 发送通知
        """
        try:
            # 获取实例信息
            instance_result = (
                self.db.table("strategy_instances")
                .select("*, strategies(name, display_name)")
                .eq("id", instance_id)
                .single()
                .execute()
            )

            if not instance_result.data:
                raise ValueError(f"实例不存在: {instance_id}")

            instance = instance_result.data
            strategy_id = instance["strategy_id"]

            # 验证参数
            await self._validate_param(strategy_id, param_key, param_value)

            # 获取当前配置
            current_result = (
                self.db.table("strategy_param_configs")
                .select("*")
                .eq("instance_id", instance_id)
                .eq("param_key", param_key)
                .eq("is_active", True)
                .execute()
            )

            current_config = current_result.data[0] if current_result.data else None
            current_version = current_config["version"] if current_config else 0

            # 将旧配置设为非活跃
            if current_config:
                self.db.table("strategy_param_configs").update(
                    {"is_active": False}
                ).eq("id", current_config["id"]).execute()

            # 创建新配置
            new_config = {
                "instance_id": instance_id,
                "param_key": param_key,
                "param_value": json.dumps(param_value),
                "version": current_version + 1,
                "is_active": True,
                "effective_at": (effective_at or datetime.now()).isoformat(),
                "changed_by": changed_by,
                "change_reason": change_reason,
            }

            result = self.db.table("strategy_param_configs").insert(new_config).execute()

            # 发送通知
            if instance["status"] == "running":
                old_val = current_config['param_value'] if current_config else 'None'
                message = f"参数 {param_key} 已更新\n旧值: {old_val}\n新值: {param_value}"
                await send_notification(
                    title=f"参数变更: {instance['instance_name']}",
                    message=message,
                    tags="gear",
                )

            self.logger.info(
                f"设置参数: {instance['instance_name']}.{param_key} = {param_value}"
            )

            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"设置参数失败: {e}")
            raise

    async def _validate_param(self, strategy_id: str, param_key: str, param_value: Any):
        """验证参数值"""
        try:
            # 获取参数定义
            result = (
                self.db.table("strategy_param_definitions")
                .select("*")
                .eq("strategy_id", strategy_id)
                .eq("param_key", param_key)
                .execute()
            )

            if not result.data:
                raise ValueError(f"参数定义不存在: {param_key}")

            param_def = result.data[0]

            # 类型验证
            param_type = param_def["param_type"]
            if param_type == "int" and not isinstance(param_value, int):
                raise ValueError(f"参数类型错误: {param_key} 应为整数")
            elif param_type == "float" and not isinstance(param_value, (int, float)):
                raise ValueError(f"参数类型错误: {param_key} 应为浮点数")
            elif param_type == "bool" and not isinstance(param_value, bool):
                raise ValueError(f"参数类型错误: {param_key} 应为布尔值")
            elif param_type == "string" and not isinstance(param_value, str):
                raise ValueError(f"参数类型错误: {param_key} 应为字符串")

            # 范围验证
            if param_type in ["int", "float"]:
                if param_def.get("min_value") is not None:
                    if param_value < float(param_def["min_value"]):
                        raise ValueError(
                            f"参数值过小: {param_key} 最小值为 {param_def['min_value']}"
                        )
                if param_def.get("max_value") is not None:
                    if param_value > float(param_def["max_value"]):
                        raise ValueError(
                            f"参数值过大: {param_key} 最大值为 {param_def['max_value']}"
                        )

        except Exception as e:
            self.logger.error(f"参数验证失败: {e}")
            raise

    async def batch_set_params(
        self,
        instance_id: str,
        params: Dict[str, Any],
        changed_by: str = "system",
        change_reason: str = "",
    ):
        """批量设置参数"""
        results = []
        for param_key, param_value in params.items():
            try:
                result = await self.set_param(
                    instance_id=instance_id,
                    param_key=param_key,
                    param_value=param_value,
                    changed_by=changed_by,
                    change_reason=change_reason,
                )
                results.append({"key": param_key, "success": True, "data": result})
            except Exception as e:
                results.append({"key": param_key, "success": False, "error": str(e)})

        return results

    # ==================== 参数模板管理 ====================

    async def create_template(
        self,
        strategy_id: str,
        template_name: str,
        params: Dict[str, Any],
        description: str = "",
        risk_level: str = "medium",
        created_by: str = "system",
    ) -> Dict[str, Any]:
        """创建参数模板"""
        try:
            template_data = {
                "strategy_id": strategy_id,
                "template_name": template_name,
                "description": description,
                "params": json.dumps(params),
                "risk_level": risk_level,
                "created_by": created_by,
            }

            result = (
                self.db.table("strategy_param_templates").insert(template_data).execute()
            )

            self.logger.info(f"创建参数模板: {template_name}")
            return result.data[0] if result.data else None

        except Exception as e:
            self.logger.error(f"创建参数模板失败: {e}")
            raise

    async def apply_template(
        self, instance_id: str, template_id: str, changed_by: str = "system"
    ):
        """应用参数模板到实例"""
        try:
            # 获取模板
            template_result = (
                self.db.table("strategy_param_templates")
                .select("*")
                .eq("id", template_id)
                .single()
                .execute()
            )

            if not template_result.data:
                raise ValueError(f"模板不存在: {template_id}")

            template = template_result.data
            params = json.loads(template["params"])

            # 批量应用参数
            await self.batch_set_params(
                instance_id=instance_id,
                params=params,
                changed_by=changed_by,
                change_reason=f"应用模板: {template['template_name']}",
            )

            # 更新使用次数
            self.db.table("strategy_param_templates").update(
                {"usage_count": template.get("usage_count", 0) + 1}
            ).eq("id", template_id).execute()

            self.logger.info(f"应用参数模板: {template['template_name']}")

        except Exception as e:
            self.logger.error(f"应用参数模板失败: {e}")
            raise

    # ==================== 参数历史管理 ====================

    async def get_param_history(
        self, instance_id: str, param_key: str = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """获取参数变更历史"""
        try:
            query = (
                self.db.table("strategy_param_history")
                .select("*")
                .eq("instance_id", instance_id)
            )

            if param_key:
                query = query.eq("param_key", param_key)

            result = query.order("created_at", desc=True).limit(limit).execute()

            return result.data

        except Exception as e:
            self.logger.error(f"获取参数历史失败: {e}")
            return []

    async def rollback_param(
        self, instance_id: str, param_key: str, changed_by: str = "system"
    ):
        """回滚参数到上一个版本"""
        try:
            # 获取历史记录
            history = await self.get_param_history(instance_id, param_key, limit=2)

            if len(history) < 2:
                raise ValueError("没有可回滚的历史版本")

            # 回滚到上一个值
            old_value = json.loads(history[1]["new_value"])

            await self.set_param(
                instance_id=instance_id,
                param_key=param_key,
                param_value=old_value,
                changed_by=changed_by,
                change_reason=f"回滚参数 (从 {history[0]['created_at']})",
            )

            self.logger.info(f"回滚参数: {param_key}")

        except Exception as e:
            self.logger.error(f"回滚参数失败: {e}")
            raise
