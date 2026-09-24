from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.resource_repository import ResourceRepository
from app.schemas.resource import ResourceCreate, ResourceUpdate, PaginatedResourceResponse, ResourceResponse


class ResourceService:
    """
    Capa de servicio para recursos del Core.
    Delega acceso a datos al Repository y centraliza reglas de negocio:
    sanitización de strings, mapeo a schemas de respuesta y manejo de 404.
    La validación de paginación ocurre en el Router vía Query(ge/le),
    por lo que este service NO debe normalizar silenciosamente los parámetros.
    """

    def __init__(self, repo: Optional[ResourceRepository] = None):
        self.repo = repo or ResourceRepository()

    def list_resources(
        self,
        db: Session,
        page: int,
        limit: int,
        search: Optional[str] = None,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> PaginatedResourceResponse:
        items, total, total_pages = self.repo.get_paginated(
            db=db,
            page=page,
            limit=limit,
            search=search,
            category=category,
            status=status_filter,
        )

        return PaginatedResourceResponse(
            data=[ResourceResponse.model_validate(item) for item in items],
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    def get_resource(self, db: Session, resource_id: int) -> ResourceResponse:
        item = self.repo.get_by_id(db, resource_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurso con ID {resource_id} no encontrado",
            )
        return ResourceResponse.model_validate(item)

    def create_resource(self, db: Session, data: ResourceCreate) -> ResourceResponse:
        data.title = data.title.strip()
        if data.description:
            data.description = data.description.strip()

        item = self.repo.create(db, data)
        return ResourceResponse.model_validate(item)

    def update_resource(self, db: Session, resource_id: int, data: ResourceUpdate) -> ResourceResponse:
        item = self.repo.update(db, resource_id, data)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurso con ID {resource_id} no encontrado para actualizar",
            )
        return ResourceResponse.model_validate(item)

    def delete_resource(self, db: Session, resource_id: int) -> dict:
        success = self.repo.soft_delete(db, resource_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recurso con ID {resource_id} no encontrado para eliminar",
            )
        return {"message": "Recurso eliminado lógicamente (Soft Delete)", "id": resource_id}
