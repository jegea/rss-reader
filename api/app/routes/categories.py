from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.logging import get_logger
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)

logger = get_logger(__name__)

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
) -> Category:
    existing_category = db.scalar(
        select(Category).where(Category.name == payload.name)
    )

    if existing_category:
        logger.warning(
            "Category creation rejected: name='%s' already exists",
            payload.name,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )

    category = Category(name=payload.name)
    db.add(category)

    logger.info(
        "Category created: id=%s name='%s'",
        category.id,
        category.name,
    )

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        logger.warning(
            "Category creation failed due to an integrity constraint: name='%s'",
            payload.name,
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )

    return category

@router.get(
    "",
    response_model=list[CategoryResponse],
)
def list_categories(
    db: Session = Depends(get_db),
) -> list[Category]:
    statement = select(Category).order_by(Category.name)

    return list(db.scalars(statement).all())

@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
)
def get_category(
    category_id: UUID,
    db: Session = Depends(get_db),
) -> Category:
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    return category

@router.patch(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
) -> Category:
    category = db.get(Category, category_id)

    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    changes = payload.model_dump(exclude_unset=True)

    if not changes or changes["name"] is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="At least one valid field must be provided",
        )

    new_name = changes["name"]

    if new_name == category.name:
        return category

    existing_category = db.scalar(
        select(Category).where(
            Category.name == new_name,
            Category.id != category_id,
        )
    )

    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )

    category.name = new_name

    try:
        db.commit()
        db.refresh(category)

        logger.info(
            "Category updated: id=%s name='%s'",
            category.id,
            category.name,
        )
    except IntegrityError:
        db.rollback()

        logger.warning(
            "Category update failed due to an integrity constraint: id=%s name='%s'",
            category_id,
            new_name,
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Category already exists",
        )

    return category