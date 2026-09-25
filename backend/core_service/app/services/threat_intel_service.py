from dataclasses import dataclass
from typing import List, Set, Tuple

from sqlalchemy.orm import Session

from app.repositories.threat_intel_repository import (
    OUTBREAK_VOTES_THRESHOLD,
    CBU_REGEX,
    PHONE_CANDIDATE_REGEX,
    URL_CANDIDATE_REGEX,
    ThreatIntelRepository,
    normalize_domain,
    normalize_phone,
)

OUTBREAK_REASON = (
    "Este contacto coincide con un brote activo reportado recientemente por la comunidad en Formosa."
)


@dataclass(frozen=True)
class ThreatMatch:
    """Coincidencia entre un indicador del mensaje y un brote comunitario activo."""
    indicator_type: str  # PHONE | URL | CBU
    value: str
    entity: str
    votes: int


class ThreatIntelService:
    """
    Motor de Inteligencia de Amenazas (FH26-54): extrae indicadores del mensaje
    del usuario (teléfonos, dominios, CBU) y los correlaciona con reportes
    comunitarios con >= 3 votos, descartando los canales oficiales verificados.
    """

    def __init__(self, repo: ThreatIntelRepository | None = None):
        self.repo = repo or ThreatIntelRepository()

    def extract_indicators(self, text: str) -> List[Tuple[str, str]]:
        """Extrae y normaliza indicadores (PHONE, URL, CBU) del texto recibido."""
        text = text or ""
        indicators: List[Tuple[str, str]] = []
        seen: Set[Tuple[str, str]] = set()

        for match in CBU_REGEX.finditer(text):
            pair = ("CBU", match.group(0))
            if pair not in seen:
                seen.add(pair)
                indicators.append(pair)

        text_without_cbu = CBU_REGEX.sub(" ", text)

        for match in URL_CANDIDATE_REGEX.finditer(text_without_cbu):
            domain = normalize_domain(match.group(0))
            if domain:
                pair = ("URL", domain)
                if pair not in seen:
                    seen.add(pair)
                    indicators.append(pair)

        text_without_urls = URL_CANDIDATE_REGEX.sub(" ", text_without_cbu)

        for match in PHONE_CANDIDATE_REGEX.finditer(text_without_urls):
            phone = normalize_phone(match.group(0))
            if phone:
                pair = ("PHONE", phone)
                if pair not in seen:
                    seen.add(pair)
                    indicators.append(pair)

        return indicators

    def match_outbreak_indicators(
        self, db: Session, message: str, min_votes: int = OUTBREAK_VOTES_THRESHOLD
    ) -> List[ThreatMatch]:
        """
        Correlaciona los indicadores del mensaje contra el repositorio de brotes
        comunitarios. Los valores incluidos en official_channels jamás matchean.
        """
        extracted = self.extract_indicators(message)
        if not extracted:
            return []

        whitelist = self.repo.get_whitelisted_values(db)
        active = self.repo.get_active_indicators(db, min_votes=min_votes)

        matches: List[ThreatMatch] = []
        best_by_value = {}
        for record in active:
            if record.value in whitelist:
                continue
            current = best_by_value.get((record.indicator_type, record.value))
            if current is None or record.votes > current.votes:
                best_by_value[(record.indicator_type, record.value)] = record

        for indicator_type, value in extracted:
            record = best_by_value.get((indicator_type, value))
            if record:
                matches.append(ThreatMatch(
                    indicator_type=record.indicator_type,
                    value=record.value,
                    entity=record.entity,
                    votes=record.votes,
                ))
        return matches
