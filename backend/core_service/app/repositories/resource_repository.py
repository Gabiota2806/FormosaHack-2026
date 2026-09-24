import math
from datetime import datetime, timezone
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.resource import ResourceItem
from app.schemas.resource import ResourceCreate, ResourceUpdate


class ResourceRepository:
    """
    Capa de acceso a datos para ResourceItem aplicando Repository Pattern.
    Filtra obligatoriamente por deleted_at IS NULL para preservar el Soft Delete.
    """

    def get_paginated(
        self,
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[ResourceItem], int, int]:
        query = db.query(ResourceItem).filter(ResourceItem.deleted_at.is_(None))

        if search:
            query = query.filter(
                or_(
                    ResourceItem.title.ilike(f"%{search}%"),
                    ResourceItem.description.ilike(f"%{search}%"),
                    ResourceItem.location.ilike(f"%{search}%")
                )
            )
        if category:
            query = query.filter(ResourceItem.category == category)
        if status:
            query = query.filter(ResourceItem.status == status)

        total = query.count()
        total_pages = math.ceil(total / limit) if limit > 0 else 1
        offset = (page - 1) * limit
        items = query.order_by(ResourceItem.id.desc()).offset(offset).limit(limit).all()

        return items, total, total_pages

    def get_by_id(self, db: Session, resource_id: int) -> Optional[ResourceItem]:
        return db.query(ResourceItem).filter(
            ResourceItem.id == resource_id,
            ResourceItem.deleted_at.is_(None)
        ).first()

    def create(self, db: Session, data: ResourceCreate) -> ResourceItem:
        item = ResourceItem(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update(self, db: Session, resource_id: int, data: ResourceUpdate) -> Optional[ResourceItem]:
        item = self.get_by_id(db, resource_id)
        if not item:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(item, key, value)

        item.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(item)
        return item

    def soft_delete(self, db: Session, resource_id: int) -> bool:
        item = self.get_by_id(db, resource_id)
        if not item:
            return False

        item.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True
