import re
from dataclasses import dataclass
from typing import List, Optional, Set

from sqlalchemy.orm import Session

from app.models.incident import IncidentReport, OfficialChannel

OUTBREAK_VOTES_THRESHOLD = 3

PHONE_CANDIDATE_REGEX = re.compile(r"\+?\d[\d\s.\-()]{7,19}\d")
URL_CANDIDATE_REGEX = re.compile(r"(?:https?://[^\s,;)\]}<>]+|www\.[^\s,;)\]}<>]+)", re.IGNORECASE)
CBU_REGEX = re.compile(r"\b\d{22}\b")


def normalize_phone(raw: str) -> Optional[str]:
    """Normaliza un teléfono argentino a sus últimos 10 dígitos (sin 54 ni 9 móvil)."""
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 22:
        return None
    if digits.startswith("54") and len(digits) > 10:
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("9"):
        digits = digits[1:]
    if len(digits) > 10:
        digits = digits[-10:]
    if len(digits) != 10:
        return None
    return digits


def normalize_domain(raw: str) -> Optional[str]:
    """Normaliza una URL o dominio a su host en minúsculas sin esquema ni www."""
    host = re.sub(r"^https?://", "", (raw or "").strip().lower())
    host = re.split(r"[/?#]", host)[0]
    if host.startswith("www."):
        host = host[4:]
    if not host or "." not in host:
        return None
    return host


@dataclass(frozen=True)
class ThreatIndicatorRecord:
    """Indicador de amenaza persistido en incident_reports y validado por votos."""
    indicator_type: str  # PHONE | URL | CBU
    value: str
    entity: str
    votes: int


class ThreatIntelRepository:
    """
    Repositorio de Inteligencia de Amenazas (FH26-54): expone los indicadores
    (teléfonos, dominios y CBU) de incidentes comunitarios con votos suficientes
    y la whitelist de canales oficiales, respetando Soft Delete.
    """

    def get_active_indicators(
        self, db: Session, min_votes: int = OUTBREAK_VOTES_THRESHOLD
    ) -> List[ThreatIndicatorRecord]:
        incidents = db.query(IncidentReport).filter(
            IncidentReport.deleted_at.is_(None),
            IncidentReport.votes_count >= min_votes,
        ).all()

        indicators: List[ThreatIndicatorRecord] = []
        for incident in incidents:
            phone = normalize_phone(incident.suspicious_phone) if incident.suspicious_phone else None
            if phone:
                indicators.append(ThreatIndicatorRecord(
                    indicator_type="PHONE",
                    value=phone,
                    entity=incident.impersonated_entity,
                    votes=incident.votes_count,
                ))

            domain = normalize_domain(incident.suspicious_url) if incident.suspicious_url else None
            if domain:
                indicators.append(ThreatIndicatorRecord(
                    indicator_type="URL",
                    value=domain,
                    entity=incident.impersonated_entity,
                    votes=incident.votes_count,
                ))

            if incident.fake_cbu:
                cbu = re.sub(r"\D", "", incident.fake_cbu)
                if len(cbu) == 22:
                    indicators.append(ThreatIndicatorRecord(
                        indicator_type="CBU",
                        value=cbu,
                        entity=incident.impersonated_entity,
                        votes=incident.votes_count,
                    ))

        return indicators

    def get_whitelisted_values(self, db: Session) -> Set[str]:
        """Teléfonos y dominios oficiales verificados que NUNCA deben marcarse como brote."""
        channels = db.query(OfficialChannel).filter(OfficialChannel.deleted_at.is_(None)).all()

        whitelist: Set[str] = set()
        for channel in channels:
            for raw_phone in (channel.official_phones or "").split(","):
                phone = normalize_phone(raw_phone)
                if phone:
                    whitelist.add(phone)
            if channel.verified_whatsapp:
                phone = normalize_phone(channel.verified_whatsapp)
                if phone:
                    whitelist.add(phone)
            for raw_domain in (channel.official_domains or "").split(","):
                domain = normalize_domain(raw_domain)
                if domain:
                    whitelist.add(domain)
        return whitelist
