import math
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.repositories.incident_repository import IncidentRepository
from app.schemas.incident import (
    IncidentCreate, 
    IncidentResponse, 
    IncidentPagination, 
    VoteResponse, 
    OfficialChannelResponse,
    IncidentStatsResponse
)

class IncidentService:
    """
    Capa de servicio para la gestión de incidentes, validación comunitaria
    y detección de brotes (spikes).
    """

    def __init__(self, repo: Optional[IncidentRepository] = None):
        self.repo = repo or IncidentRepository()

    def list_incidents(
        self,
        db: Session,
        page: int = 1,
        limit: int = 10,
        entity: Optional[str] = None,
        vector: Optional[str] = None,
        search: Optional[str] = None
    ) -> IncidentPagination:
        items, total = self.repo.get_paginated(db, page, limit, entity, vector, search)
        total_pages = math.ceil(total / limit) if total > 0 else 1

        # Detección de brotes activos en las últimas 24 horas (al menos 3 reportes de la misma entidad)
        recent_spikes = self.repo.get_recent_reports_count_by_entity(db, hours=24)
        has_active_outbreak = len(recent_spikes) > 0
        outbreak_entity = recent_spikes[0][0] if has_active_outbreak else None

        # Mapear respuesta marcando flag de spike si coincide con la entidad en brote
        response_items = []
        for item in items:
            resp = IncidentResponse.model_validate(item)
            if has_active_outbreak and item.impersonated_entity.lower() == outbreak_entity.lower():
                resp.is_outbreak_spike = True
            response_items.append(resp)

        return IncidentPagination(
            items=response_items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_active_outbreak=has_active_outbreak,
            outbreak_entity=outbreak_entity
        )

    def create_incident(self, db: Session, data: IncidentCreate) -> IncidentResponse:
        created = self.repo.create(db, data)
        return IncidentResponse.model_validate(created)

    def vote_incident(self, db: Session, incident_id: int, fingerprint: str) -> Optional[VoteResponse]:
        incident = self.repo.get_by_id(db, incident_id)
        if not incident:
            return None

        success, new_votes = self.repo.register_vote(db, incident_id, fingerprint)
        if not success:
            return VoteResponse(
                success=False,
                incident_id=incident_id,
                votes_count=new_votes,
                message="Ya has validado este incidente anteriormente desde este dispositivo."
            )
        return VoteResponse(
            success=True,
            incident_id=incident_id,
            votes_count=new_votes,
            message="¡Gracias por colaborar! Tu validación alerta a más personas sobre esta amenaza."
        )

    def delete_incident(self, db: Session, incident_id: int) -> bool:
        return self.repo.soft_delete(db, incident_id)

    def list_verified_channels(self, db: Session) -> List[OfficialChannelResponse]:
        channels = self.repo.get_verified_channels(db)
        return [OfficialChannelResponse.model_validate(c) for c in channels]

    def get_stats(self, db: Session) -> IncidentStatsResponse:
        return IncidentStatsResponse(**self.repo.get_stats(db))
