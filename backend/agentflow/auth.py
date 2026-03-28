from fastapi import Header, HTTPException, status

from agentflow.config import get_settings


async def require_admin(x_admin_token: str = Header(..., alias="X-Admin-Token")) -> None:
    """FastAPI dependency — validates the X-Admin-Token header."""
    settings = get_settings()
    if x_admin_token != settings.admin_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-Admin-Token header",
        )
