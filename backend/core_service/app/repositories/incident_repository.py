from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from app.models.incident import IncidentReport, IncidentVote, OfficialChannel
from app.schemas.incident import IncidentCreate

class IncidentRepository:
    """
    Capa de acceso a datos para Incidentes aplicando Repository Pattern
    y Soft Delete (filtrado obligatorio por deleted_at IS NULL).
    """

    def get_paginated(
        self,
        db: Session,
        page: int = 1,
        limit: int = 10,
        entity: Optional[str] = None,
        vector: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[IncidentReport], int]:
        query = db.query(IncidentReport).filter(IncidentReport.deleted_at.is_(None))

        if entity:
            query = query.filter(IncidentReport.impersonated_entity.ilike(f"%{entity}%"))
        
        if vector:
            query = query.filter(IncidentReport.attack_vector == vector.upper())

        if search:
            query = query.filter(
                (IncidentReport.title.ilike(f"%{search}%")) |
                (IncidentReport.description.ilike(f"%{search}%")) |
                (IncidentReport.evidence_text.ilike(f"%{search}%"))
            )

        total = query.count()
        offset = (page - 1) * limit
        items = query.order_by(desc(IncidentReport.created_at)).offset(offset).limit(limit).all()

        return items, total

    def get_by_id(self, db: Session, incident_id: int) -> Optional[IncidentReport]:
        return db.query(IncidentReport).filter(
            IncidentReport.id == incident_id,
            IncidentReport.deleted_at.is_(None)
        ).first()

    def create(self, db: Session, data: IncidentCreate) -> IncidentReport:
        db_item = IncidentReport(
            title=data.title,
            description=data.description,
            impersonated_entity=data.impersonated_entity,
            attack_vector=data.attack_vector.upper() if data.attack_vector else "WHATSAPP",
            evidence_text=data.evidence_text,
            suspicious_phone=data.suspicious_phone,
            suspicious_url=data.suspicious_url,
            fake_cbu=data.fake_cbu,
            votes_count=1,
            status="active"
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    def soft_delete(self, db: Session, incident_id: int) -> bool:
        incident = self.get_by_id(db, incident_id)
        if not incident:
            return False
        incident.deleted_at = datetime.now(timezone.utc)
        db.commit()
        return True

    def register_vote(self, db: Session, incident_id: int, fingerprint: str) -> Tuple[bool, int]:
        incident = self.get_by_id(db, incident_id)
        if not incident:
            return False, 0

        # Verificar si la huella ya votó en este incidente
        existing = db.query(IncidentVote).filter(
            IncidentVote.incident_id == incident_id,
            IncidentVote.user_fingerprint == fingerprint
        ).first()

        if existing:
            return False, incident.votes_count

        vote = IncidentVote(
            incident_id=incident_id,
            user_fingerprint=fingerprint
        )
        db.add(vote)
        incident.votes_count += 1
        db.commit()
        db.refresh(incident)

        return True, incident.votes_count

    def get_recent_reports_count_by_entity(self, db: Session, hours: int = 24) -> List[Tuple[str, int]]:
        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        return db.query(
            IncidentReport.impersonated_entity,
            func.count(IncidentReport.id).label("count")
        ).filter(
            IncidentReport.deleted_at.is_(None),
            IncidentReport.created_at >= since
        ).group_by(IncidentReport.impersonated_entity).having(func.count(IncidentReport.id) >= 3).all()

    def get_verified_channels(self, db: Session) -> List[OfficialChannel]:
        return db.query(OfficialChannel).filter(OfficialChannel.deleted_at.is_(None)).all()

    def get_stats(self, db: Session) -> dict:
        incidents_row = db.query(
            func.count(IncidentReport.id),
            func.coalesce(func.sum(IncidentReport.votes_count), 0),
            func.count(func.distinct(IncidentReport.impersonated_entity))
        ).filter(IncidentReport.deleted_at.is_(None)).one()

        verified_channels = db.query(func.count(OfficialChannel.id)).filter(OfficialChannel.deleted_at.is_(None)).scalar()
        active_outbreaks = len(self.get_recent_reports_count_by_entity(db, hours=24))

        return {
            "total_incidents": incidents_row[0],
            "total_votes": int(incidents_row[1]),
            "verified_channels": verified_channels,
            "distinct_entities": incidents_row[2],
            "active_outbreaks_24h": active_outbreaks,
        }
