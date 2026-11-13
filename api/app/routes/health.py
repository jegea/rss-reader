from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger

router = APIRouter(
    prefix="/health",
    tags=["health"],
)

logger = get_logger(__name__)


@router.get("")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
def readiness_check(
    db: Session = Depends(get_db),
) -> dict[str, str]:
    try:
        db.scalar(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Readiness check failed: database unavailable")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )

    return {
        "status": "ok",
        "database": "connected",
    }