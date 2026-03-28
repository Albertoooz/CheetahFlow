from fastapi import APIRouter
from sqlalchemy import text

from agentflow.db.session import AsyncSessionLocal

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """Liveness + DB connectivity check."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        db_status = f"error: {exc}"

    return {"status": "ok", "db": db_status}
