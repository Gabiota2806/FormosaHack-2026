from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse, PaginatedResourceResponse
from app.services.resource_service import ResourceService

router = APIRouter(prefix="", tags=["Recursos Core de Negocio"])


def get_resource_service() -> ResourceService:
    return ResourceService()


@router.get("/", response_model=PaginatedResourceResponse, summary="Listar recursos paginados con búsqueda y filtros")
def list_resources(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Cantidad de registros por página"),
    search: Optional[str] = Query(None, description="Término de búsqueda (título, descripción o localidad)"),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
    service: ResourceService = Depends(get_resource_service),
):
    return service.list_resources(
        db=db,
        page=page,
        limit=limit,
        search=search,
        category=category,
        status_filter=status,
    )


@router.get("/{resource_id}", response_model=ResourceResponse, summary="Obtener detalle de un recurso por ID")
def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    service: ResourceService = Depends(get_resource_service),
):
    return service.get_resource(db=db, resource_id=resource_id)


@router.post("/", response_model=ResourceResponse, status_code=status.HTTP_201_CREATED, summary="Crear un nuevo recurso")
def create_resource(
    data: ResourceCreate,
    db: Session = Depends(get_db),
    service: ResourceService = Depends(get_resource_service),
):
    return service.create_resource(db=db, data=data)


@router.put("/{resource_id}", response_model=ResourceResponse, summary="Actualizar un recurso existente")
def update_resource(
    resource_id: int,
    data: ResourceUpdate,
    db: Session = Depends(get_db),
    service: ResourceService = Depends(get_resource_service),
):
    return service.update_resource(db=db, resource_id=resource_id, data=data)


@router.delete("/{resource_id}", summary="Eliminar lógicamente un recurso (Soft Delete)")
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    service: ResourceService = Depends(get_resource_service),
):
    return service.delete_resource(db=db, resource_id=resource_id)
