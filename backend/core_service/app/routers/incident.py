from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.incident import (
    IncidentCreate, 
    IncidentResponse, 
    IncidentPagination, 
    VoteRequest, 
    VoteResponse, 
    OfficialChannelResponse
)
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/incidents", tags=["Radar de Amenazas"])

def get_incident_service() -> IncidentService:
    return IncidentService()

@router.get(
    "",
    response_model=IncidentPagination,
    summary="Listar amenazas y alertas comunitarias (Paginado)",
    description="Retorna el feed paginado en el servidor, con filtros opcionales de entidad simulada, vector y alertas de brote activo."
)
def get_incidents(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(10, ge=1, le=50, description="Cantidad de registros por página"),
    entity: Optional[str] = Query(None, description="Filtrar por entidad suplantada"),
    vector: Optional[str] = Query(None, description="Filtrar por vector (WHATSAPP, SMS, LLAMADA, WEB)"),
    search: Optional[str] = Query(None, description="Búsqueda por texto en título o descripción"),
    db: Session = Depends(get_db),
    service: IncidentService = Depends(get_incident_service)
):
    return service.list_incidents(db, page=page, limit=limit, entity=entity, vector=vector, search=search)

@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reportar un nuevo intento de estafa",
    description="Permite a un usuario o moderador registrar una nueva amenaza en el radar comunitario."
)
def create_incident(
    payload: IncidentCreate,
    db: Session = Depends(get_db),
    service: IncidentService = Depends(get_incident_service)
):
    return service.create_incident(db, payload)

@router.post(
    "/{incident_id}/me-too",
    response_model=VoteResponse,
    summary="Validar amenaza comunitaria ('A mí también me llegó')",
    description="Incrementa el contador de votos solidarios para alertar a la comunidad y activar alertas de brote."
)
def vote_incident(
    incident_id: int,
    payload: VoteRequest,
    db: Session = Depends(get_db),
    service: IncidentService = Depends(get_incident_service)
):
    result = service.vote_incident(db, incident_id, payload.user_fingerprint)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidente no encontrado o eliminado."
        )
    return result

@router.delete(
    "/{incident_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar reporte (Soft Delete)",
    description="Aplica borrado lógico mediante deleted_at sin destruir el registro en la base de datos."
)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    service: IncidentService = Depends(get_incident_service)
):
    deleted = service.delete_incident(db, incident_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incidente no encontrado.")
    return None

@router.get(
    "/channels/verified",
    response_model=List[OfficialChannelResponse],
    summary="Obtener canales oficiales verificados",
    description="Lista los contactos telefónicos y dominios web oficiales de Banco Formosa, REFSA y entidades locales."
)
def get_verified_channels(
    db: Session = Depends(get_db),
    service: IncidentService = Depends(get_incident_service)
):
    return service.list_verified_channels(db)
