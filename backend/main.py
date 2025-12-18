"""
期货量化管理平台 - FastAPI主应用
"""
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional
import uvicorn
from datetime import datetime

from config import settings
from models.schemas import (
    TradeEvent,
    PositionSnapshot,
    ResponseModel,
    Position,
    PositionListResponse
)
from engines.position_engine import PositionEngine
from utils.db import get_supabase_client, test_connection
from utils.contract_mapper import ContractMapper


# 全局实例
position_engine = PositionEngine()
supabase = get_supabase_client()


# 生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭时的处理"""
    # 启动时
    print("🚀 Starting QuantFu Backend Server...")

    # 测试数据库连接
    if await test_connection():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")

    yield

    # 关闭时
    print("🛑 Shutting down...")


# 创建FastAPI应用
app = FastAPI(
    title="期货量化管理平台 API",
    description="集成极星量化与天勤行情的期货管理系统",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境改为具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# 健康检查
# ============================================

@app.get("/")
async def root():
    """根路径"""
    return {
        "service": "QuantFu Backend API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """健康检查 - 基础版本"""
    db_ok = await test_connection()
    return {
        "status": "healthy" if db_ok else "unhealthy",
        "database": "ok" if db_ok else "error",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health/detailed")
async def detailed_health_check():
    """
    详细健康检查 - 用于监控系统

    返回:
    - 数据库连接状态
    - 天勤连接状态 (如果已配置)
    - 账户数量
    - 持仓数量
    - 最近成交时间
    - 系统运行时长
    """
    import os
    import psutil
    from datetime import datetime, timedelta

    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {},
        "metrics": {},
        "warnings": []
    }

    # 1. 数据库连接检查
    try:
        db_ok = await test_connection()
        health_data["components"]["database"] = {
            "status": "ok" if db_ok else "error",
            "type": "PostgreSQL"
        }
        if not db_ok:
            health_data["status"] = "unhealthy"
            health_data["warnings"].append("Database connection failed")
    except Exception as e:
        health_data["components"]["database"] = {
            "status": "error",
            "error": str(e)
        }
        health_data["status"] = "unhealthy"

    # 2. 天勤连接检查
    tqsdk_user = os.getenv('TQSDK_USER')
    tqsdk_password = os.getenv('TQSDK_PASSWORD')
    if tqsdk_user and tqsdk_password:
        health_data["components"]["tqsdk"] = {
            "status": "configured",
            "user": tqsdk_user
        }
    else:
        health_data["components"]["tqsdk"] = {
            "status": "not_configured"
        }
        health_data["warnings"].append("TqSDK not configured")

    # 3. 获取系统指标
    try:
        # 账户数量
        accounts_response = supabase.table("accounts").select("id", count="exact").execute()
        account_count = accounts_response.count if accounts_response.count else 0

        # 持仓数量
        positions_response = supabase.table("positions").select("id", count="exact").execute()
        position_count = positions_response.count if positions_response.count else 0

        # 最近成交
        latest_trade_response = supabase.table("trades")\
            .select("created_at")\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()

        latest_trade_time = None
        if latest_trade_response.data:
            latest_trade_time = latest_trade_response.data[0].get('created_at')
            # 检查是否超过1小时无成交
            if latest_trade_time:
                last_trade_dt = datetime.fromisoformat(latest_trade_time.replace('Z', '+00:00'))
                now = datetime.now().astimezone()
                if (now - last_trade_dt) > timedelta(hours=1):
                    health_data["warnings"].append("No trades in the last hour")

        health_data["metrics"] = {
            "accounts": account_count,
            "positions": position_count,
            "latest_trade": latest_trade_time
        }

    except Exception as e:
        health_data["warnings"].append(f"Failed to fetch metrics: {str(e)}")

    # 4. 系统资源使用
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')

        health_data["system"] = {
            "cpu_percent": round(cpu_percent, 2),
            "memory_percent": round(memory.percent, 2),
            "memory_used_gb": round(memory.used / (1024**3), 2),
            "memory_total_gb": round(memory.total / (1024**3), 2),
            "disk_percent": round(disk.percent, 2),
            "disk_used_gb": round(disk.used / (1024**3), 2),
            "disk_total_gb": round(disk.total / (1024**3), 2)
        }

        # 资源告警
        if cpu_percent > 80:
            health_data["warnings"].append(f"High CPU usage: {cpu_percent}%")
        if memory.percent > 80:
            health_data["warnings"].append(f"High memory usage: {memory.percent}%")
        if disk.percent > 80:
            health_data["warnings"].append(f"High disk usage: {disk.percent}%")

    except Exception as e:
        health_data["warnings"].append(f"Failed to fetch system metrics: {str(e)}")

    # 5. 最终状态判断
    if health_data["warnings"]:
        if health_data["status"] == "healthy":
            health_data["status"] = "degraded"

    return health_data


# ============================================
# 极星数据接收接口
# ============================================

@app.post("/api/trades", response_model=ResponseModel)
async def receive_trade(trade: TradeEvent):
    """
    接收极星推送的成交数据

    极星v12.py策略调用此接口推送每笔成交
    """
    try:
        # 1. 查找账户ID(将极星账户ID转为UUID)
        account_response = supabase.table("accounts")\
            .select("id")\
            .eq("polar_account_id", trade.account_id)\
            .single()\
            .execute()

        if not account_response.data:
            raise HTTPException(
                status_code=404,
                detail=f"Account not found: {trade.account_id}"
            )

        account_uuid = account_response.data['id']

        # 2. 存储成交记录
        trade_data = {
            "account_id": account_uuid,
            "symbol": trade.symbol,
            "direction": trade.direction,
            "offset": trade.offset,
            "volume": trade.volume,
            "price": trade.price,
            "order_id": trade.order_id,
            "timestamp": trade.timestamp.isoformat(),
            "source": trade.source
        }

        supabase.table("trades").insert(trade_data).execute()

        # 3. 触发持仓重建
        await position_engine.rebuild_position(account_uuid, trade.symbol)

        # 4. 返回成功
        return ResponseModel(
            code=200,
            message="Trade received successfully",
            data={"trade_id": trade.order_id}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/position_snapshots", response_model=ResponseModel)
async def receive_snapshot(snapshot: PositionSnapshot):
    """
    接收持仓快照(用于对账)

    极星v12.py定时(10分钟)推送持仓快照
    """
    try:
        # 查找账户ID
        account_response = supabase.table("accounts")\
            .select("id")\
            .eq("polar_account_id", snapshot.account_id)\
            .single()\
            .execute()

        if not account_response.data:
            raise HTTPException(status_code=404, detail="Account not found")

        account_uuid = account_response.data['id']

        # 获取计算的持仓
        calculated_response = supabase.table("positions")\
            .select("long_position, short_position")\
            .eq("account_id", account_uuid)\
            .eq("symbol", snapshot.symbol)\
            .single()\
            .execute()

        calculated = calculated_response.data if calculated_response.data else {}

        # 对账
        calculated_long = calculated.get('long_position', 0)
        calculated_short = calculated.get('short_position', 0)

        is_matched = (calculated_long == snapshot.long_position and
                      calculated_short == snapshot.short_position)

        # 存储快照
        snapshot_data = {
            "account_id": account_uuid,
            "symbol": snapshot.symbol,
            "polar_long_position": snapshot.long_position,
            "polar_short_position": snapshot.short_position,
            "polar_long_avg_price": snapshot.long_avg_price,
            "polar_short_avg_price": snapshot.short_avg_price,
            "polar_long_profit": snapshot.long_profit,
            "polar_short_profit": snapshot.short_profit,
            "calculated_long_position": calculated_long,
            "calculated_short_position": calculated_short,
            "is_matched": is_matched,
            "diff_long": calculated_long - snapshot.long_position,
            "diff_short": calculated_short - snapshot.short_position,
            "timestamp": snapshot.timestamp.isoformat()
        }

        supabase.table("position_snapshots").insert(snapshot_data).execute()

        # 如果不匹配,发送告警
        if not is_matched:
            print(f"⚠️  持仓对账不一致: {snapshot.symbol}")
            print(f"   极星: 多{snapshot.long_position} 空{snapshot.short_position}")
            print(f"   计算: 多{calculated_long} 空{calculated_short}")

        return ResponseModel(
            code=200,
            message="Snapshot received",
            data={"matched": is_matched}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 持仓查询接口
# ============================================

@app.get("/api/positions/{account_polar_id}", response_model=PositionListResponse)
async def get_positions(account_polar_id: str):
    """
    获取账户所有持仓

    Args:
        account_polar_id: 极星账户ID,如85178443
    """
    try:
        # 查找账户
        account_response = supabase.table("accounts")\
            .select("id")\
            .eq("polar_account_id", account_polar_id)\
            .single()\
            .execute()

        if not account_response.data:
            raise HTTPException(status_code=404, detail="Account not found")

        account_uuid = account_response.data['id']

        # 获取持仓
        positions_response = supabase.table("v_positions_summary")\
            .select("*")\
            .eq("account_id", account_uuid)\
            .execute()

        positions = [Position(**pos) for pos in positions_response.data]

        return PositionListResponse(
            total=len(positions),
            positions=positions
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/positions/rebuild/{account_polar_id}/{symbol}")
async def rebuild_position(account_polar_id: str, symbol: str):
    """
    手动触发持仓重建

    用于数据不一致时的修复
    """
    try:
        # 查找账户
        account_response = supabase.table("accounts")\
            .select("id")\
            .eq("polar_account_id", account_polar_id)\
            .single()\
            .execute()

        if not account_response.data:
            raise HTTPException(status_code=404, detail="Account not found")

        account_uuid = account_response.data['id']

        # 重建持仓
        result = await position_engine.rebuild_position(account_uuid, symbol)

        return ResponseModel(
            code=200,
            message="Position rebuilt successfully",
            data=result
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 合约映射接口
# ============================================

@app.get("/api/contracts")
async def get_contracts():
    """获取所有合约"""
    result = supabase.table("contracts").select("*").execute()
    return {"total": len(result.data), "contracts": result.data}


@app.get("/api/contracts/convert/polar-to-tqsdk")
async def convert_polar_to_tqsdk(polar_symbol: str):
    """极星格式转天勤格式"""
    try:
        tqsdk_symbol = ContractMapper.polar_to_tqsdk(polar_symbol)
        return {"polar": polar_symbol, "tqsdk": tqsdk_symbol}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================
# 锁仓管理接口
# ============================================

@app.get("/api/lock/configs")
async def get_lock_configs(account_id: str = None):
    """获取锁仓配置列表"""
    try:
        query = supabase.table("v_active_lock_configs").select("*")

        if account_id:
            query = query.eq("account_id", account_id)

        result = query.execute()
        return {"total": len(result.data), "configs": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lock/configs")
async def create_lock_config(config: dict):
    """创建锁仓配置"""
    try:
        result = supabase.table("lock_configs").insert(config).execute()
        return ResponseModel(
            code=200,
            message="Lock config created successfully",
            data=result.data[0] if result.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/lock/configs/{config_id}")
async def update_lock_config(config_id: str, config: dict):
    """更新锁仓配置"""
    try:
        result = supabase.table("lock_configs").update(config).eq("id", config_id).execute()
        return ResponseModel(
            code=200,
            message="Lock config updated successfully",
            data=result.data[0] if result.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/lock/configs/{config_id}")
async def delete_lock_config(config_id: str):
    """删除锁仓配置"""
    try:
        supabase.table("lock_configs").delete().eq("id", config_id).execute()
        return ResponseModel(code=200, message="Lock config deleted successfully")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lock/triggers")
async def get_lock_triggers(
    account_id: str = None,
    status: str = None,
    limit: int = 100
):
    """获取锁仓触发记录"""
    try:
        query = supabase.table("v_lock_trigger_summary").select("*")

        if account_id:
            query = query.eq("account_id", account_id)

        if status:
            query = query.eq("execution_status", status)

        result = query.limit(limit).execute()
        return {"total": len(result.data), "triggers": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lock/execute/{trigger_id}")
async def manual_execute_lock(trigger_id: str):
    """手动执行锁仓(对于等待确认的触发)"""
    try:
        from engines.lock_engine import LockEngine

        # 获取触发记录
        trigger_result = supabase.table("lock_triggers").select("*").eq("id", trigger_id).execute()
        if not trigger_result.data:
            raise HTTPException(status_code=404, detail="Trigger not found")

        trigger = trigger_result.data[0]

        if trigger["execution_status"] != "waiting_confirm":
            raise HTTPException(
                status_code=400,
                detail=f"Trigger status is {trigger['execution_status']}, cannot execute"
            )

        # 执行锁仓
        lock_engine = LockEngine()
        execution_result = await lock_engine.execute_lock(
            trigger_id=trigger_id,
            account_id=trigger["account_id"],
            symbol=trigger["symbol"],
            direction=trigger["direction"],
            lock_volume=trigger["lock_volume"],
            trigger_price=trigger["trigger_price"],
            method="manual",
        )

        return ResponseModel(
            code=200 if execution_result["success"] else 500,
            message="Lock executed successfully" if execution_result["success"] else execution_result.get("error"),
            data=execution_result
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lock/executions")
async def get_lock_executions(
    account_id: str = None,
    symbol: str = None,
    limit: int = 100
):
    """获取锁仓执行历史"""
    try:
        query = supabase.table("lock_executions").select("*")

        if account_id:
            query = query.eq("account_id", account_id)

        if symbol:
            query = query.eq("symbol", symbol)

        result = query.order("executed_at", desc=True).limit(limit).execute()
        return {"total": len(result.data), "executions": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# K线图数据接口
# ============================================

@app.get("/api/kline/{symbol}")
async def get_kline(
    symbol: str,
    duration: int = 300,
    length: int = 500
):
    """
    获取K线数据

    Args:
        symbol: 合约代码(TqSDK格式,如 CZCE.TA2505)
        duration: K线周期(秒) - 60=1分钟, 300=5分钟, 3600=1小时, 86400=日线
        length: 获取的K线数量(默认500)
    """
    try:
        from services.kline_service import KlineService

        service = KlineService()
        klines = service.get_klines(symbol, duration, length)
        service.close()

        return {
            "symbol": symbol,
            "duration": duration,
            "total": len(klines),
            "klines": klines
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/kline/{symbol}/with-positions")
async def get_kline_with_positions(
    symbol: str,
    account_id: str,
    duration: int = 300,
    length: int = 500
):
    """
    获取K线数据并叠加持仓标记

    Args:
        symbol: 合约代码(TqSDK格式)
        account_id: 账户ID
        duration: K线周期(秒)
        length: K线数量
    """
    try:
        from services.kline_service import KlineService

        service = KlineService()
        data = service.get_klines_with_positions(symbol, account_id, duration, length)
        service.close()

        return {
            "symbol": symbol,
            "duration": duration,
            "total": len(data['klines']),
            "klines": data['klines'],
            "markers": data['markers'],
            "position": data['position']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quote/{symbol}")
async def get_quote(symbol: str):
    """获取实时行情"""
    try:
        from services.kline_service import KlineService

        service = KlineService()
        quote = service.get_quote(symbol)
        service.close()

        if quote:
            return quote
        else:
            raise HTTPException(status_code=404, detail="Quote not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 合约管理接口
# ============================================

@app.get("/api/contracts/list")
async def list_contracts(
    exchange: Optional[str] = None,
    variety_code: Optional[str] = None,
    is_main: Optional[bool] = None,
    is_active: bool = True
):
    """
    获取合约列表

    Query Parameters:
        exchange: 交易所代码 (可选)
        variety_code: 品种代码 (可选)
        is_main: 是否主力合约 (可选)
        is_active: 是否活跃 (默认true)
    """
    try:
        query = supabase.table("contracts").select("*")

        if exchange:
            query = query.eq("exchange", exchange)
        if variety_code:
            query = query.eq("variety_code", variety_code)
        if is_main is not None:
            query = query.eq("is_main_contract", is_main)
        if is_active is not None:
            query = query.eq("is_active", is_active)

        result = query.order("exchange").order("variety_code").order("contract_month").execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(result.data), "contracts": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contracts/main")
async def get_main_contracts():
    """获取所有主力合约"""
    try:
        result = supabase.table("v_main_contracts").select("*").execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(result.data), "contracts": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contracts/expiring")
async def get_expiring_contracts(days: int = 30):
    """
    获取即将到期的合约

    Query Parameters:
        days: 多少天内到期 (默认30天)
    """
    try:
        result = supabase.table("v_expiring_contracts").select("*").execute()

        # 过滤天数
        filtered = [c for c in result.data if c.get("days_to_expiry", 999) <= days]

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(filtered), "contracts": filtered}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contracts/sync/{symbol}")
async def sync_contract(symbol: str):
    """
    同步单个合约信息

    Path Parameters:
        symbol: 合约代码 (TqSDK格式, 如 CZCE.TA2505)
    """
    try:
        from services.contract_service import ContractService
        from services.tqsdk_service import tq_api

        service = ContractService(tq_api, supabase)
        contract = await service.sync_contract_info(symbol)

        if contract:
            return ResponseModel(
                code=200,
                message="Contract synced successfully",
                data=contract
            )
        else:
            raise HTTPException(status_code=404, detail="Contract not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contracts/sync-variety/{exchange}/{variety_code}")
async def sync_variety(exchange: str, variety_code: str):
    """
    同步某个品种的所有合约

    Path Parameters:
        exchange: 交易所代码 (CZCE/DCE/SHFE/INE/CFFEX)
        variety_code: 品种代码 (如 TA, I, RB)
    """
    try:
        from services.contract_service import ContractService
        from services.tqsdk_service import tq_api

        service = ContractService(tq_api, supabase)
        contracts = await service.sync_variety_contracts(exchange, variety_code)

        return ResponseModel(
            code=200,
            message=f"Synced {len(contracts)} contracts",
            data={"total": len(contracts), "contracts": contracts}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contracts/main-switches")
async def get_main_switches(
    exchange: Optional[str] = None,
    variety_code: Optional[str] = None,
    limit: int = 50
):
    """
    获取主力合约切换历史

    Query Parameters:
        exchange: 交易所代码 (可选)
        variety_code: 品种代码 (可选)
        limit: 返回记录数 (默认50)
    """
    try:
        query = supabase.table("main_contract_switches").select("*")

        if exchange:
            query = query.eq("exchange", exchange)
        if variety_code:
            query = query.eq("variety_code", variety_code)

        result = query.order("switch_date", desc=True).limit(limit).execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(result.data), "switches": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/contracts/expiry-alerts")
async def get_expiry_alerts(account_id: Optional[str] = None):
    """
    获取到期提醒配置

    Query Parameters:
        account_id: 账户ID (可选)
    """
    try:
        query = supabase.table("v_contract_expiry_reminders").select("*")

        if account_id:
            query = query.eq("account_id", account_id)

        result = query.order("days_to_expiry").execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(result.data), "alerts": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contracts/expiry-alerts")
async def create_expiry_alert(request: dict):
    """
    创建到期提醒配置

    Body:
        account_id: 账户ID
        symbol: 合约代码
        alert_days_before: 提前几天提醒 (默认7天)
        alert_enabled: 是否启用 (默认true)
    """
    try:
        result = supabase.table("contract_expiry_alerts").insert(request).execute()

        return ResponseModel(
            code=200,
            message="Expiry alert created successfully",
            data=result.data[0] if result.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/contracts/expiry-alerts/{alert_id}")
async def update_expiry_alert(alert_id: str, request: dict):
    """更新到期提醒配置"""
    try:
        result = supabase.table("contract_expiry_alerts")\
            .update(request)\
            .eq("id", alert_id)\
            .execute()

        return ResponseModel(
            code=200,
            message="Expiry alert updated successfully",
            data=result.data[0] if result.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/contracts/expiry-alerts/{alert_id}")
async def delete_expiry_alert(alert_id: str):
    """删除到期提醒配置"""
    try:
        supabase.table("contract_expiry_alerts").delete().eq("id", alert_id).execute()

        return ResponseModel(
            code=200,
            message="Expiry alert deleted successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/contracts/calculate-margin")
async def calculate_margin(request: dict):
    """
    计算保证金

    Body:
        account_id: 账户ID
        symbol: 合约代码
        price: 价格
        volume: 手数
        direction: 方向 (long/short)
    """
    try:
        from services.contract_service import ContractService
        from services.tqsdk_service import tq_api

        service = ContractService(tq_api, supabase)
        result = await service.calculate_margin(
            account_id=request["account_id"],
            symbol=request["symbol"],
            price=float(request["price"]),
            volume=int(request["volume"]),
            direction=request.get("direction", "long")
        )

        return ResponseModel(
            code=200,
            message="Margin calculated successfully",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 策略参数管理接口
# ============================================

@app.get("/api/strategies")
async def list_strategies(is_active: Optional[bool] = None):
    """获取策略列表"""
    try:
        query = supabase.table("strategies").select("*")

        if is_active is not None:
            query = query.eq("is_active", is_active)

        result = query.order("created_at", desc=True).execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(result.data), "strategies": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategies")
async def create_strategy(request: dict):
    """
    创建策略定义

    Body:
        name: 策略名称
        display_name: 显示名称
        version: 版本
        description: 描述
        category: 分类
        risk_level: 风险等级
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        strategy = await service.create_strategy(**request)

        return ResponseModel(
            code=200,
            message="Strategy created successfully",
            data=strategy
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategies/{strategy_id}/params")
async def get_strategy_param_definitions(strategy_id: str):
    """获取策略的参数定义"""
    try:
        result = supabase.table("strategy_param_definitions")\
            .select("*")\
            .eq("strategy_id", strategy_id)\
            .order("display_order")\
            .execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"params": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategies/{strategy_id}/params")
async def add_param_definition(strategy_id: str, request: dict):
    """添加参数定义"""
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        param_def = await service.add_param_definition(strategy_id=strategy_id, **request)

        return ResponseModel(
            code=200,
            message="Parameter definition added successfully",
            data=param_def
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-instances")
async def list_strategy_instances(
    account_id: Optional[str] = None,
    status: Optional[str] = None
):
    """获取策略实例列表"""
    try:
        query = supabase.table("v_active_strategy_instances").select("*")

        if account_id:
            query = query.eq("account_id", account_id)
        if status:
            query = query.eq("status", status)

        result = query.execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"total": len(result.data), "instances": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-instances")
async def create_strategy_instance(request: dict):
    """
    创建策略实例

    Body:
        strategy_id: 策略ID
        account_id: 账户ID
        instance_name: 实例名称
        symbols: 合约列表
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        instance = await service.create_instance(**request)

        return ResponseModel(
            code=200,
            message="Strategy instance created successfully",
            data=instance
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/strategy-instances/{instance_id}/status")
async def update_instance_status(instance_id: str, request: dict):
    """
    更新实例状态

    Body:
        status: 状态 (running/stopped/paused/error)
        error_message: 错误信息 (可选)
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        await service.update_instance_status(
            instance_id=instance_id,
            status=request["status"],
            error_message=request.get("error_message")
        )

        return ResponseModel(
            code=200,
            message="Status updated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-instances/{instance_id}/heartbeat")
async def update_heartbeat(instance_id: str):
    """更新心跳时间"""
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        await service.update_heartbeat(instance_id)

        return ResponseModel(
            code=200,
            message="Heartbeat updated"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-instances/{instance_id}/params")
async def get_instance_params(instance_id: str):
    """获取实例的当前参数配置"""
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        params = await service.get_params(instance_id)

        # 同时获取参数定义信息
        result = supabase.table("v_current_strategy_params")\
            .select("*")\
            .eq("instance_id", instance_id)\
            .execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"params": params, "details": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/strategy-instances/{instance_id}/params/{param_key}")
async def set_instance_param(instance_id: str, param_key: str, request: dict):
    """
    设置单个参数

    Body:
        param_value: 参数值
        changed_by: 修改人
        change_reason: 修改原因
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        result = await service.set_param(
            instance_id=instance_id,
            param_key=param_key,
            param_value=request["param_value"],
            changed_by=request.get("changed_by", "api"),
            change_reason=request.get("change_reason", "")
        )

        return ResponseModel(
            code=200,
            message="Parameter updated successfully",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/strategy-instances/{instance_id}/params")
async def batch_set_params(instance_id: str, request: dict):
    """
    批量设置参数

    Body:
        params: {param_key: param_value, ...}
        changed_by: 修改人
        change_reason: 修改原因
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        results = await service.batch_set_params(
            instance_id=instance_id,
            params=request["params"],
            changed_by=request.get("changed_by", "api"),
            change_reason=request.get("change_reason", "")
        )

        return ResponseModel(
            code=200,
            message="Parameters updated",
            data={"results": results}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-instances/{instance_id}/params/history")
async def get_param_history(
    instance_id: str,
    param_key: Optional[str] = None,
    limit: int = 50
):
    """获取参数变更历史"""
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        history = await service.get_param_history(instance_id, param_key, limit)

        return ResponseModel(
            code=200,
            message="Success",
            data={"history": history}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-instances/{instance_id}/params/{param_key}/rollback")
async def rollback_param(instance_id: str, param_key: str, request: dict):
    """
    回滚参数到上一个版本

    Body:
        changed_by: 操作人
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        await service.rollback_param(
            instance_id=instance_id,
            param_key=param_key,
            changed_by=request.get("changed_by", "api")
        )

        return ResponseModel(
            code=200,
            message="Parameter rolled back successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-templates")
async def list_templates(strategy_id: Optional[str] = None):
    """获取参数模板列表"""
    try:
        query = supabase.table("strategy_param_templates").select("*")

        if strategy_id:
            query = query.eq("strategy_id", strategy_id)

        result = query.order("usage_count", desc=True).execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"templates": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-templates")
async def create_template(request: dict):
    """
    创建参数模板

    Body:
        strategy_id: 策略ID
        template_name: 模板名称
        params: 参数JSON
        description: 描述
        risk_level: 风险等级
        created_by: 创建人
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        template = await service.create_template(**request)

        return ResponseModel(
            code=200,
            message="Template created successfully",
            data=template
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-instances/{instance_id}/apply-template/{template_id}")
async def apply_template(instance_id: str, template_id: str, request: dict):
    """
    应用参数模板

    Body:
        changed_by: 操作人
    """
    try:
        from services.strategy_param_service import StrategyParamService

        service = StrategyParamService(supabase)
        await service.apply_template(
            instance_id=instance_id,
            template_id=template_id,
            changed_by=request.get("changed_by", "api")
        )

        return ResponseModel(
            code=200,
            message="Template applied successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 换月管理接口
# ============================================

@app.get("/api/rollover/configs")
async def list_rollover_configs(account_id: Optional[str] = None):
    """获取换月配置列表"""
    try:
        from services.rollover_service import RolloverService

        service = RolloverService(supabase)
        configs = await service.get_configs(account_id)

        return ResponseModel(
            code=200,
            message="Success",
            data={"configs": configs}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rollover/configs")
async def create_rollover_config(request: dict):
    """
    创建换月配置

    Body:
        account_id: 账户ID
        exchange: 交易所代码
        variety_code: 品种代码
        rollover_strategy: 换月策略(auto/manual/threshold)
        rollover_threshold: 换月阈值
        days_before_expiry: 到期前几天换月
        auto_execute: 是否自动执行
        rollover_ratio: 换月比例
        price_mode: 价格模式(market/limit/optimal)
    """
    try:
        from services.rollover_service import RolloverService

        service = RolloverService(supabase)
        config = await service.create_config(**request)

        return ResponseModel(
            code=200,
            message="Rollover config created successfully",
            data=config
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/rollover/configs/{config_id}")
async def update_rollover_config(config_id: str, request: dict):
    """更新换月配置"""
    try:
        result = supabase.table("rollover_configs")\
            .update(request)\
            .eq("id", config_id)\
            .execute()

        return ResponseModel(
            code=200,
            message="Rollover config updated successfully",
            data=result.data[0] if result.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/rollover/configs/{config_id}")
async def delete_rollover_config(config_id: str):
    """删除换月配置"""
    try:
        supabase.table("rollover_configs").delete().eq("id", config_id).execute()

        return ResponseModel(
            code=200,
            message="Rollover config deleted successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rollover/tasks")
async def list_rollover_tasks(
    account_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """获取换月任务列表"""
    try:
        query = supabase.table("v_rollover_task_summary").select("*")

        if account_id:
            query = query.eq("account_id", account_id)
        if status:
            query = query.eq("status", status)

        result = query.order("trigger_time", desc=True).limit(limit).execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"tasks": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rollover/tasks")
async def create_rollover_task(request: dict):
    """
    手动创建换月任务

    Body:
        config_id: 配置ID
        account_id: 账户ID
        old_symbol: 旧合约
        new_symbol: 新合约
        variety_name: 品种名称
        direction: 方向(long/short)
        old_position: 旧合约持仓量
        rollover_volume: 换月数量
        trigger_type: 触发类型
    """
    try:
        from services.rollover_service import RolloverService

        service = RolloverService(supabase)
        task = await service.create_task(**request)

        return ResponseModel(
            code=200,
            message="Rollover task created successfully",
            data=task
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rollover/tasks/{task_id}/execute")
async def execute_rollover_task(task_id: str):
    """执行换月任务"""
    try:
        from services.rollover_service import RolloverService

        service = RolloverService(supabase)
        success = await service.execute_rollover(task_id)

        if success:
            return ResponseModel(
                code=200,
                message="Rollover executed successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Rollover execution failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rollover/tasks/{task_id}/cancel")
async def cancel_rollover_task(task_id: str):
    """取消换月任务"""
    try:
        from services.rollover_service import RolloverService

        service = RolloverService(supabase)
        await service.update_task_status(task_id, "cancelled")

        return ResponseModel(
            code=200,
            message="Rollover task cancelled"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rollover/statistics")
async def get_rollover_statistics(
    account_id: Optional[str] = None,
    year_month: Optional[str] = None
):
    """
    获取换月统计

    Query Parameters:
        account_id: 账户ID(可选)
        year_month: 统计月份 YYYY-MM(可选)
    """
    try:
        query = supabase.table("rollover_statistics").select("*")

        if account_id:
            query = query.eq("account_id", account_id)
        if year_month:
            query = query.eq("year_month", year_month)

        result = query.order("year_month", desc=True).execute()

        return ResponseModel(
            code=200,
            message="Success",
            data={"statistics": result.data}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# 多策略管理接口
# ============================================

@app.get("/api/strategy-groups")
async def list_strategy_groups(account_id: Optional[str] = None):
    """获取策略组列表"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        groups = await service.get_groups(account_id)

        return ResponseModel(
            code=200,
            message="Success",
            data={"groups": groups}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-groups")
async def create_strategy_group(request: dict):
    """
    创建策略组

    Body:
        account_id: 账户ID
        group_name: 组名称
        description: 描述
        total_capital: 总资金
        max_position_ratio: 最大持仓比例
        max_risk_per_strategy: 单策略最大风险比例
        allow_opposite_positions: 是否允许对冲持仓
        position_conflict_mode: 冲突模式(allow/reject/merge)
    """
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        group = await service.create_group(**request)

        return ResponseModel(
            code=200,
            message="Strategy group created successfully",
            data=group
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/strategy-groups/{group_id}")
async def update_strategy_group(group_id: str, request: dict):
    """更新策略组"""
    try:
        result = supabase.table("strategy_groups")\
            .update(request)\
            .eq("id", group_id)\
            .execute()

        return ResponseModel(
            code=200,
            message="Strategy group updated successfully",
            data=result.data[0] if result.data else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-groups/{group_id}/members")
async def add_group_member(group_id: str, request: dict):
    """
    添加策略到组

    Body:
        instance_id: 实例ID
        capital_allocation: 资金分配
        position_limit: 持仓限制
        priority: 优先级
    """
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        member = await service.add_member(group_id=group_id, **request)

        return ResponseModel(
            code=200,
            message="Member added successfully",
            data=member
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/strategy-groups/{group_id}/members/{instance_id}")
async def remove_group_member(group_id: str, instance_id: str):
    """从组中移除策略"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        await service.remove_member(group_id, instance_id)

        return ResponseModel(
            code=200,
            message="Member removed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-signals")
async def list_strategy_signals(
    group_id: Optional[str] = None,
    status: Optional[str] = None
):
    """获取交易信号列表"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)

        if status == "pending":
            signals = await service.get_pending_signals(group_id)
        else:
            query = supabase.table("strategy_signals").select("*")
            if group_id:
                # 需要join来筛选
                pass
            if status:
                query = query.eq("status", status)
            result = query.order("created_at", desc=True).limit(100).execute()
            signals = result.data

        return ResponseModel(
            code=200,
            message="Success",
            data={"signals": signals}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-signals")
async def create_strategy_signal(request: dict):
    """
    创建交易信号

    Body:
        instance_id: 实例ID
        symbol: 合约代码
        signal_type: 信号类型(open/close/reverse)
        direction: 方向(long/short)
        volume: 数量
        price: 价格
        confidence: 置信度
        strength: 强度(weak/medium/strong)
        expires_at: 过期时间
    """
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        signal = await service.create_signal(**request)

        return ResponseModel(
            code=200,
            message="Signal created successfully",
            data=signal
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-signals/{signal_id}/process")
async def process_strategy_signal(signal_id: str):
    """处理交易信号"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        success = await service.process_signal(signal_id)

        if success:
            return ResponseModel(
                code=200,
                message="Signal processed successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Signal processing failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-performance")
async def get_strategy_performance(
    instance_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """获取策略性能"""
    try:
        from services.multi_strategy_service import MultiStrategyService
        from datetime import date

        service = MultiStrategyService(supabase)
        performance = await service.get_performance(
            instance_id=instance_id,
            start_date=date.fromisoformat(start_date) if start_date else None,
            end_date=date.fromisoformat(end_date) if end_date else None
        )

        return ResponseModel(
            code=200,
            message="Success",
            data={"performance": performance}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-performance")
async def record_strategy_performance(request: dict):
    """
    记录策略性能

    Body:
        instance_id: 实例ID
        date: 日期
        metrics: 性能指标
    """
    try:
        from services.multi_strategy_service import MultiStrategyService
        from datetime import date

        service = MultiStrategyService(supabase)
        result = await service.record_performance(
            instance_id=request["instance_id"],
            performance_date=date.fromisoformat(request["date"]),
            metrics=request["metrics"]
        )

        return ResponseModel(
            code=200,
            message="Performance recorded successfully",
            data=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-performance/ranking")
async def get_performance_ranking(days: int = 30):
    """获取策略性能排名"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        ranking = await service.get_performance_ranking(days)

        return ResponseModel(
            code=200,
            message="Success",
            data={"ranking": ranking}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/strategy-conflicts")
async def get_strategy_conflicts(
    group_id: str,
    resolved: Optional[bool] = None
):
    """获取策略冲突记录"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        conflicts = await service.get_conflicts(group_id, resolved)

        return ResponseModel(
            code=200,
            message="Success",
            data={"conflicts": conflicts}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/strategy-conflicts/{conflict_id}/resolve")
async def resolve_strategy_conflict(conflict_id: str, request: dict):
    """
    解决策略冲突

    Body:
        resolution: 解决方式(allow/reject/merge/priority)
    """
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        await service.resolve_conflict(conflict_id, request["resolution"])

        return ResponseModel(
            code=200,
            message="Conflict resolved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/resource-usage/{group_id}")
async def get_resource_usage(group_id: str, hours: int = 24):
    """获取资源使用情况"""
    try:
        from services.multi_strategy_service import MultiStrategyService

        service = MultiStrategyService(supabase)
        usage = await service.get_resource_usage(group_id, hours)

        return ResponseModel(
            code=200,
            message="Success",
            data={"usage": usage}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# WebSocket实时推送(后续实现)
# ============================================

@app.websocket("/ws/positions")
async def websocket_positions(websocket: WebSocket):
    """WebSocket实时推送持仓变化"""
    await websocket.accept()
    try:
        while True:
            # 等待客户端消息
            _ = await websocket.receive_text()
            # 这里后续集成Supabase Realtime
            await websocket.send_json({"message": "Connected"})
    except WebSocketDisconnect:
        print("WebSocket disconnected")


# ============================================
# 启动服务
# ============================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True  # 开发模式自动重载
    )
