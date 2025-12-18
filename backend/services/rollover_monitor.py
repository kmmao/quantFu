"""
换月监测服务

功能:
1. 监测主力合约切换
2. 计算换月指数
3. 发送换月提醒
4. 记录换月建议

换月判断标准:
- 新合约持仓量 > 旧合约持仓量 * 1.2
- 新合约成交量持续3天超过旧合约
- 距离到期 < 15个交易日
"""

from typing import Dict, List, Optional
from datetime import datetime
from utils.db import get_supabase_client
from utils.contract_mapper import ContractMapper
import requests
from config import settings


class RolloverMonitor:
    """换月监测器"""

    def __init__(self):
        self.db = get_supabase_client()

    def calculate_rollover_index(
        self,
        current_volume: int,
        current_oi: int,
        next_volume: int,
        next_oi: int
    ) -> float:
        """
        计算换月指数

        Args:
            current_volume: 当前合约成交量
            current_oi: 当前合约持仓量
            next_volume: 下一合约成交量
            next_oi: 下一合约持仓量

        Returns:
            换月指数 (>1.2建议换月)

        算法:
            index = (next_oi / current_oi) * 0.7 + (next_volume / current_volume) * 0.3
        """
        if current_oi == 0 or current_volume == 0:
            return 0

        oi_ratio = next_oi / current_oi
        volume_ratio = next_volume / current_volume

        # 加权平均(持仓量权重70%,成交量权重30%)
        rollover_index = oi_ratio * 0.7 + volume_ratio * 0.3

        return round(rollover_index, 3)

    def check_rollover_needed(
        self,
        variety_code: str,
        current_symbol: str,
        next_symbol: str
    ) -> Dict:
        """
        检查是否需要换月

        Args:
            variety_code: 品种代码,如"TA"
            current_symbol: 当前合约(极星格式)
            next_symbol: 下一合约(极星格式)

        Returns:
            检查结果字典
        """
        # 从market_data表获取行情数据
        current_data = self._get_market_data(current_symbol)
        next_data = self._get_market_data(next_symbol)

        if not current_data or not next_data:
            return {
                "need_rollover": False,
                "reason": "行情数据不足"
            }

        # 计算换月指数
        rollover_index = self.calculate_rollover_index(
            current_volume=current_data['volume'],
            current_oi=current_data['open_interest'],
            next_volume=next_data['volume'],
            next_oi=next_data['open_interest']
        )

        # 判断
        need_rollover = rollover_index >= 1.2

        # 检查到期日
        days_to_expiry = self._get_days_to_expiry(current_symbol)

        result = {
            "variety_code": variety_code,
            "current_symbol": current_symbol,
            "next_symbol": next_symbol,
            "rollover_index": rollover_index,
            "need_rollover": need_rollover or (days_to_expiry is not None and days_to_expiry < 15),
            "current_oi": current_data['open_interest'],
            "next_oi": next_data['open_interest'],
            "current_volume": current_data['volume'],
            "next_volume": next_data['volume'],
            "days_to_expiry": days_to_expiry,
            "recommendation": self._get_recommendation(rollover_index, days_to_expiry),
            "checked_at": datetime.now().isoformat()
        }

        return result

    def _get_market_data(self, polar_symbol: str) -> Optional[Dict]:
        """从数据库获取行情数据"""
        try:
            # 转换为天勤格式
            tqsdk_symbol = ContractMapper.polar_to_tqsdk(polar_symbol)

            # 查询最新行情
            result = self.db.table("market_data")\
                .select("volume, open_interest")\
                .eq("symbol", tqsdk_symbol)\
                .order("timestamp", desc=True)\
                .limit(1)\
                .execute()

            if result.data:
                return result.data[0]
            return None
        except Exception:
            return None

    def _get_days_to_expiry(self, polar_symbol: str) -> Optional[int]:
        """获取距离到期天数"""
        try:
            result = self.db.table("contracts")\
                .select("expiry_date")\
                .eq("polar_symbol", polar_symbol)\
                .single()\
                .execute()

            if result.data and result.data.get('expiry_date'):
                expiry_date = datetime.fromisoformat(result.data['expiry_date'])
                delta = expiry_date - datetime.now()
                return delta.days
            return None
        except Exception:
            return None

    def _get_recommendation(self, rollover_index: float, days_to_expiry: Optional[int]) -> str:
        """生成换月建议"""
        if days_to_expiry and days_to_expiry < 5:
            return "⚠️ 紧急换月!距离到期不足5天"
        elif days_to_expiry and days_to_expiry < 15:
            return "⚠️ 建议换月,距离到期不足15天"
        elif rollover_index >= 1.5:
            return "✅ 强烈建议换月(指数≥1.5)"
        elif rollover_index >= 1.2:
            return "✅ 建议换月(指数≥1.2)"
        elif rollover_index >= 1.0:
            return "⏳ 可考虑换月(指数≥1.0)"
        else:
            return "❌ 暂不建议换月"

    def send_rollover_notification(self, check_result: Dict):
        """
        发送换月通知

        Args:
            check_result: 换月检查结果
        """
        if not check_result['need_rollover']:
            return

        title = f"换月提醒 - {check_result['variety_code']}"
        content = f"""
{check_result['recommendation']}

当前合约: {check_result['current_symbol']}
下一合约: {check_result['next_symbol']}

换月指数: {check_result['rollover_index']}
持仓量对比: {check_result['next_oi']} / {check_result['current_oi']}
成交量对比: {check_result['next_volume']} / {check_result['current_volume']}

距离到期: {check_result['days_to_expiry']}天
        """.strip()

        try:
            requests.post(
                settings.ntfy_url,
                data=f"{title}\n{content}".encode('utf-8'),
                timeout=3
            )
            print(f"✅ 换月通知已发送: {check_result['variety_code']}")
        except Exception:
            print(f"❌ 换月通知发送失败: {check_result['variety_code']}")

    def monitor_all_varieties(self) -> List[Dict]:
        """
        监测所有品种的换月情况

        Returns:
            检查结果列表
        """
        # 获取所有主力合约
        main_contracts = self.db.table("contracts")\
            .select("variety_code, polar_symbol")\
            .eq("is_main", True)\
            .execute()

        results = []

        for contract in main_contracts.data:
            variety_code = contract['variety_code']
            current_symbol = contract['polar_symbol']

            # 查找下一个月份的合约
            next_symbol = self._find_next_contract(variety_code, current_symbol)

            if next_symbol:
                result = self.check_rollover_needed(
                    variety_code,
                    current_symbol,
                    next_symbol
                )
                results.append(result)

                # 如果需要换月,发送通知
                if result['need_rollover']:
                    self.send_rollover_notification(result)

        return results

    def _find_next_contract(self, variety_code: str, current_symbol: str) -> Optional[str]:
        """
        查找下一个月份的合约

        Args:
            variety_code: 品种代码
            current_symbol: 当前合约

        Returns:
            下一合约代码或None
        """
        # 从当前合约提取月份
        current_month = ContractMapper.extract_month(current_symbol)

        # 查询同品种的其他合约(按月份排序)
        result = self.db.table("contracts")\
            .select("polar_symbol, contract_month")\
            .eq("variety_code", variety_code)\
            .neq("polar_symbol", current_symbol)\
            .order("contract_month", desc=False)\
            .execute()

        # 找到当前月份之后的第一个合约
        for contract in result.data:
            if contract['contract_month'] > current_month:
                return contract['polar_symbol']

        return None


# ============================================
# 独立运行模式(定时任务)
# ============================================

async def main():
    """测试运行"""
    monitor = RolloverMonitor()

    print("=" * 50)
    print("开始检查换月情况")
    print("=" * 50)

    results = monitor.monitor_all_varieties()

    print(f"\n检查完成,共检查 {len(results)} 个品种\n")

    for result in results:
        print(f"品种: {result['variety_code']}")
        print(f"  当前: {result['current_symbol']}")
        print(f"  下一: {result['next_symbol']}")
        print(f"  指数: {result['rollover_index']}")
        print(f"  建议: {result['recommendation']}")
        print()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
