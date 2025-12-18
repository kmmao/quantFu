"""
合约代码格式转换工具
极星格式 ↔ 天勤格式
"""
import re
from typing import Dict


class ContractMapper:
    """合约格式映射器"""

    # 交易所映射
    EXCHANGE_MAP = {
        "SHFE": "SHFE",     # 上期所
        "ZCE": "CZCE",      # 郑商所(天勤用CZCE)
        "DCE": "DCE",       # 大商所
        "CFFEX": "CFFEX",   # 中金所
        "INE": "INE"        # 能源中心
    }

    # 反向映射
    EXCHANGE_REVERSE_MAP = {v: k for k, v in EXCHANGE_MAP.items()}

    @staticmethod
    def polar_to_tqsdk(polar_symbol: str) -> str:
        """
        极星格式 → 天勤格式

        示例:
            ZCE|F|TA|2505 → CZCE.TA2505
            SHFE|F|RB|2505 → SHFE.rb2505
            DCE|Z|V|2505 → DCE.v2505
            CFFEX|Z|IF|2505 → CFFEX.IF2505

        Args:
            polar_symbol: 极星格式合约代码

        Returns:
            天勤格式合约代码

        Raises:
            ValueError: 格式错误时抛出
        """
        parts = polar_symbol.split('|')
        if len(parts) != 4:
            raise ValueError(f"Invalid polar symbol format: {polar_symbol}")

        exchange, contract_type, variety, month = parts

        # 1. 交易所转换
        tq_exchange = ContractMapper.EXCHANGE_MAP.get(exchange, exchange)

        # 2. 品种代码转换
        if exchange == "ZCE":
            # 郑商所:大写
            tq_variety = variety.upper()
        elif exchange == "CFFEX":
            # 中金所:大写(股指期货)
            tq_variety = variety.upper()
        else:
            # 其他:小写
            tq_variety = variety.lower()

        # 3. 月份代码处理
        # 2505 → 2505
        # 郑商所特殊:如果是三位数(如605),转为2605
        if len(month) == 3 and exchange == "ZCE":
            month = f"2{month}"

        return f"{tq_exchange}.{tq_variety}{month}"

    @staticmethod
    def tqsdk_to_polar(tqsdk_symbol: str, contract_type: str = "F") -> str:
        """
        天勤格式 → 极星格式

        示例:
            CZCE.TA2505 → ZCE|F|TA|2505
            SHFE.rb2505 → SHFE|F|RB|2505
            DCE.v2505 → DCE|Z|V|2505

        Args:
            tqsdk_symbol: 天勤格式合约代码
            contract_type: 合约类型 F=期货 O=期权 Z=其他

        Returns:
            极星格式合约代码

        Raises:
            ValueError: 格式错误时抛出
        """
        if '.' not in tqsdk_symbol:
            raise ValueError(f"Invalid tqsdk symbol format: {tqsdk_symbol}")

        exchange, code = tqsdk_symbol.split('.')

        # 1. 交易所反向映射
        polar_exchange = ContractMapper.EXCHANGE_REVERSE_MAP.get(exchange, exchange)

        # 2. 提取品种和月份
        match = re.match(r'([a-zA-Z]+)(\d+)', code)
        if not match:
            raise ValueError(f"Cannot parse variety and month from: {code}")

        variety, month = match.groups()

        # 3. 品种代码转大写(极星统一大写)
        variety = variety.upper()

        # 4. 确定合约类型(如果是DCE或ZCE,通常用Z)
        if polar_exchange in ["DCE", "ZCE"] and contract_type == "F":
            contract_type = "Z"

        return f"{polar_exchange}|{contract_type}|{variety}|{month}"

    @staticmethod
    def extract_variety_code(polar_symbol: str) -> str:
        """
        提取品种代码

        Args:
            polar_symbol: 极星格式合约代码

        Returns:
            品种代码

        Example:
            ZCE|F|TA|2505 → TA
        """
        parts = polar_symbol.split('|')
        if len(parts) != 4:
            raise ValueError(f"Invalid polar symbol: {polar_symbol}")
        return parts[2]

    @staticmethod
    def extract_month(polar_symbol: str) -> str:
        """
        提取月份代码

        Args:
            polar_symbol: 极星格式合约代码

        Returns:
            月份代码

        Example:
            ZCE|F|TA|2505 → 2505
        """
        parts = polar_symbol.split('|')
        if len(parts) != 4:
            raise ValueError(f"Invalid polar symbol: {polar_symbol}")
        return parts[3]

    @staticmethod
    def extract_exchange(polar_symbol: str) -> str:
        """
        提取交易所代码

        Args:
            polar_symbol: 极星格式合约代码

        Returns:
            交易所代码

        Example:
            ZCE|F|TA|2505 → ZCE
        """
        parts = polar_symbol.split('|')
        if len(parts) != 4:
            raise ValueError(f"Invalid polar symbol: {polar_symbol}")
        return parts[0]

    @staticmethod
    def parse_polar_symbol(polar_symbol: str) -> Dict[str, str]:
        """
        解析极星合约代码

        Args:
            polar_symbol: 极星格式合约代码

        Returns:
            包含各部分的字典

        Example:
            ZCE|F|TA|2505 → {
                "exchange": "ZCE",
                "contract_type": "F",
                "variety": "TA",
                "month": "2505"
            }
        """
        parts = polar_symbol.split('|')
        if len(parts) != 4:
            raise ValueError(f"Invalid polar symbol: {polar_symbol}")

        return {
            "exchange": parts[0],
            "contract_type": parts[1],
            "variety": parts[2],
            "month": parts[3]
        }


# 测试代码
if __name__ == "__main__":
    # 测试极星→天勤
    test_cases = [
        "ZCE|F|TA|2505",
        "SHFE|F|RB|2505",
        "DCE|Z|V|2505",
        "CFFEX|Z|IF|2505",
        "ZCE|Z|MA|605"
    ]

    print("极星 → 天勤转换测试:")
    for polar in test_cases:
        tqsdk = ContractMapper.polar_to_tqsdk(polar)
        print(f"  {polar} → {tqsdk}")

        # 反向转换
        polar_back = ContractMapper.tqsdk_to_polar(tqsdk)
        match = "✓" if polar == polar_back else "✗"
        print(f"  {tqsdk} → {polar_back} {match}\n")
