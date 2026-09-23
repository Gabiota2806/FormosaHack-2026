from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.resource_repository import ResourceRepository
from app.schemas.resource import ResourceCreate, ResourceUpdate, PaginatedResourceResponse, ResourceResponse

class ResourceService:
    def __init__(self, repository: ResourceRepository = None):
        self.repository = repository or ResourceRepository()

    def list_resources(
        self,
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> PaginatedResourceResponse:
        # Validación de paginación
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20

        items, total, total_pages = self.repository.get_paginated(
            db=db,
            page=page,
            limit=limit,
            search=search,
            category=category,
            status=status_filter
        )

        return PaginatedResourceResponse(
            data=[ResourceResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )

    def get_resource(self, db: Session, resource_id: int) -> ResourceResponse:
        item = self.repository.get_by_id(db, resource_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurso con ID {resource_id} no encontrado"
            )
        return ResourceResponse.model_validate(item)

    def create_resource(self, db: Session, data: ResourceCreate) -> ResourceResponse:
        # Regla de negocio: Sanitizar título y descripción
        data.title = data.title.strip()
        if data.description:
            data.description = data.description.strip()

        item = self.repository.create(db, data)
        return ResourceResponse.model_validate(item)

    def update_resource(self, db: Session, resource_id: int, data: ResourceUpdate) -> ResourceResponse:
        item = self.repository.update(db, resource_id, data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurso con ID {resource_id} no encontrado para actualizar"
            )
        return ResourceResponse.model_validate(item)

    def delete_resource(self, db: Session, resource_id: int) -> dict:
        success = self.repository.soft_delete(db, resource_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurso con ID {resource_id} no encontrado para eliminar"
            )
        return {"message": "Recurso eliminado lógicamente (Soft Delete)", "id": resource_id}
