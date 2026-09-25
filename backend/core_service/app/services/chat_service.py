import re
from typing import List, Tuple, Optional
from urllib.parse import quote
from sqlalchemy.orm import Session
from app.schemas.chat import ChatMessageResponse, HighlightedPhrase
from app.services.gemini_service import GeminiService
from app.services.threat_intel_service import OUTBREAK_REASON, ThreatIntelService, ThreatMatch

class ChatService:
    """
    Motor híbrido de análisis de engaños y manipulación psicológica
    para CiberGuardián con inferencia IA (Gemini) y fallback heurístico resiliente,
    correlacionado con el Repositorio de Inteligencia de Amenazas (brotes >= 3 votos).
    """

    def __init__(
        self,
        gemini_service: Optional[GeminiService] = None,
        threat_intel_service: Optional[ThreatIntelService] = None
    ):
        self.gemini_service = gemini_service or GeminiService()
        self.threat_intel_service = threat_intel_service or ThreatIntelService()

    async def analyze_message_with_fallback(
        self, message: str, db: Optional[Session] = None
    ) -> ChatMessageResponse:
        """
        Orquesta el análisis inteligente de un mensaje: intenta inferencia con Gemini
        bajo timeout estricto de 2.5s. Si Gemini falla (timeout, 429, red, sin API key),
        degrada suavemente hacia analyze_message (heurística regex). Luego correlaciona
        el resultado con los brotes comunitarios activos (FH26-54, Escenario 3).
        """
        response: Optional[ChatMessageResponse] = None
        try:
            if self.gemini_service and self.gemini_service.is_available:
                response = await self.gemini_service.analyze(message)
        except Exception:
            response = None

        if response is None:
            response = self.analyze_message(message)

        return self._apply_community_outbreak(response, message, db)

    def _apply_community_outbreak(
        self, response: ChatMessageResponse, message: str, db: Optional[Session]
    ) -> ChatMessageResponse:
        """
        Si el mensaje contiene un teléfono, dominio o CBU con >= 3 votos comunitarios
        (y no oficial), eleva el riesgo al 100% (ALERTA ROJA). Ante cualquier falla
        de la base de datos degrada en silencio sin romper el diagnóstico.
        """
        if db is None:
            return response

        try:
            matches: List[ThreatMatch] = self.threat_intel_service.match_outbreak_indicators(db, message)
        except Exception:
            return response

        if not matches:
            return response

        best = max(matches, key=lambda m: m.votes)
        label = {"PHONE": "número de teléfono", "URL": "enlace", "CBU": "CBU"}.get(best.indicator_type, "contacto")
        entity_hint = f" suplantando a {best.entity}" if best.entity else ""

        response.risk_level = "HIGH"
        response.risk_percentage = 100
        response.summary = (
            f"ALERTA ROJA: {OUTBREAK_REASON} "
            f"El {label} detectado fue reportado {best.votes} veces{entity_hint}."
        )
        response.immediate_action = (
            "¡FRENÁ INMEDIATAMENTE! Bloqueá y denunciá este contacto: la comunidad de Formosa "
            "ya confirmó que se trata de una estafa activa."
        )
        response.what_not_to_do = (
            "NUNCA respondas, no abras enlaces ni transfieras dinero a este contacto reportado como brote activo."
        )
        entity_wa = f" que suplanta a {best.entity}" if best.entity else ""
        response.wa_share_text = (
            f"Hola, recibí este mensaje{entity_wa} y antes de hacer nada lo analicé con CiberGuardián. "
            f"Me marcó riesgo HIGH (100%): el contacto coincide con un brote de estafas reportado por la "
            f"comunidad en Formosa. ¡No lo abras ni respondas, reenvialo para alertar a más vecinos!"
        )

        for match in matches:
            response.highlighted_phrases.append(HighlightedPhrase(
                phrase=match.value,
                reason=OUTBREAK_REASON,
                category="COMMUNITY_OUTBREAK"
            ))

        return response


    ENTITIES_PATTERNS = {
        "Banco Formosa": [r"banco\s*formosa", r"formosa\s*banco", r"onda\s*siempre\s*pod", r"chig[uü]e"],
        "Tarjeta Chigüé": [r"chig[uü][eé]", r"tarjeta\s*chig"],
        "REFSA": [r"refsa", r"recurso\s*energ[eé]tico", r"corte\s*de\s*luz", r"factura\s*de\s*luz"],
        "Mercado Pago": [r"mercado\s*pago", r"mercadopago", r"mercado\s*libre", r"mp\s*argentina"],
        "ANSES": [r"anses", r"bono\s*extraordinario", r"ife", r"refuerzo\s*de\s*ingreso", r"mi\s*anses"],
        "WhatsApp": [r"soporte\s*de\s*whatsapp", r"c[oó]digo\s*de\s*verificaci[oó]n", r"buz[oó]n\s*de\s*voz"],
        "Policía / Poder Judicial": [r"polic[ií]a", r"fiscal[ií]a", r"orden\s*de\s*detenci[oó]n", r"citaci[oó]n\s*judicial"]
    }

    URGENCY_KEYWORDS = [
        "urgente", "inmediato", "24 horas", "suspensi[oó]n", "bloquead[oa]", "embargo",
        "caduca", "en las pr[oó]ximas", "alerta roja", "cierre definitivo", "antes de las",
        "ultim[ao] aviso", "evit[aá] el corte"
    ]

    CREDENTIAL_KEYWORDS = [
        "token", "clave", "cbu", "cvu", "contrase[ñn]a", "c[oó]digo de 6 d[ií]gitos",
        "foto de tu dni", "transfer[ií]", "acredita", "valid[aá] tus datos",
        "ingres[aá] tu pin", "descarg[aá] esta app", "anydesk", "teamviewer"
    ]

    FAMILY_IMPERSONATION_PATTERNS = [
        r"hola\s*m[aá][,\s]",
        r"hola\s*p[aá][,\s]",
        r"cambi[eé]\s*de\s*n[uú]mero",
        r"n[uú]mero\s*nuevo",
        r"se\s*rompi[oó]\s*(mi\s*)?(celular|tel[eé]fono)",
        r"se\s*moj[oó]\s*(el\s*)?(celular|tel[eé]fono)",
        r"c[oó]digo\s*que\s*te\s*lleg[oó]\s*por\s*(sms|whatsapp)",
    ]
    FAMILY_IMPERSONATION_WEIGHT = 45

    GREED_KEYWORDS = [
        "ganaste", "premio", "sorteo", "beneficiario", "acreditaci[oó]n pendiente",
        "subsidio", "felicidades", "fuiste seleccionad[oa]"
    ]

    URL_REGEX = r"(https?://\S+|www\.\S+|bit\.ly/\S+|tinyurl\.com/\S+|t\.me/\S+)"

    def analyze_message(self, message: str) -> ChatMessageResponse:
        text_lower = message.lower()
        text_clean = re.sub(self.URL_REGEX, " ", text_lower)
        score = 0
        highlighted: List[HighlightedPhrase] = []
        detected_entity = None

        # 1. Detección de entidad suplantada
        for entity, patterns in self.ENTITIES_PATTERNS.items():
            for pat in patterns:
                match = re.search(pat, text_lower)
                if match:
                    detected_entity = entity
                    score += 25
                    highlighted.append(HighlightedPhrase(
                        phrase=match.group(0),
                        reason=f"Se menciona a '{entity}'. Los estafadores suelen suplantar instituciones reconocidas para generar falsa confianza.",
                        category="AUTHORITY"
                    ))
                    break
            if detected_entity:
                break

        # 2. Detección de urgencia psicológica
        for kw in self.URGENCY_KEYWORDS:
            matches = list(re.finditer(kw, text_lower))
            for m in matches:
                score += 20
                highlighted.append(HighlightedPhrase(
                    phrase=m.group(0),
                    reason="Táctica de presión psicológica: generan desesperación para que actúes sin pensar ni consultar.",
                    category="URGENCE"
                ))

        # 3. Pedido de credenciales o acciones peligrosas
        for kw in self.CREDENTIAL_KEYWORDS:
            matches = list(re.finditer(kw, text_clean))
            for m in matches:
                score += 35
                highlighted.append(HighlightedPhrase(
                    phrase=m.group(0),
                    reason="¡ALERTA MÁXIMA! Ninguna entidad bancaria o empresa oficial solicita jamás transferencias, claves, tokens ni descargar apps remotas.",
                    category="CREDENTIALS"
                ))

        # 3b. Detección de estafa familiar "Hola má, cambié de número" (peso alto por sí sola)
        for pat in self.FAMILY_IMPERSONATION_PATTERNS:
            match = re.search(pat, text_clean)
            if match:
                score += self.FAMILY_IMPERSONATION_WEIGHT
                highlighted.append(HighlightedPhrase(
                    phrase=match.group(0),
                    reason="Patrón típico de estafa familiar en WhatsApp: suplantan a un hijo/familiar cambiando de número y piden códigos de verificación.",
                    category="FAMILY_IMPERSONATION"
                ))
                break

        # 4. Promesas de dinero fácil o premios falsos
        for kw in self.GREED_KEYWORDS:
            matches = list(re.finditer(kw, text_clean))
            for m in matches:
                score += 20
                highlighted.append(HighlightedPhrase(
                    phrase=m.group(0),
                    reason="Cebo de codicia o ilusión: prometen premios inesperados para robar datos o pedir dinero de gastos de gestión.",
                    category="GREED"
                ))

        # 5. Detección de enlaces sospechosos o acortados
        url_matches = list(re.finditer(self.URL_REGEX, message, re.IGNORECASE))
        for m in url_matches:
            url_str = m.group(0)
            score += 30
            highlighted.append(HighlightedPhrase(
                phrase=url_str,
                reason="Enlace dudoso. Puede ser un clon de sitio web para robar claves de acceso bancario.",
                category="FAKE_LINK"
            ))

        # Normalizar puntuación de riesgo (0 - 100)
        risk_percentage = min(score, 100)
        if risk_percentage == 0 and len(message.strip()) > 10:
            risk_percentage = 15  # Riesgo base mínimo preventivo

        # Clasificación del Semáforo
        if risk_percentage >= 60:
            risk_level = "HIGH"
            summary = (
                f"ALERTA ROJA: Este mensaje presenta señales inequívocas de INTENTO DE ESTAFA "
                f"{f'suplantando a {detected_entity}' if detected_entity else ''}."
            )
            immediate_action = "¡FRENÁ INMEDIATAMENTE! No abras ningún enlace, no respondas y no transfieras dinero."
            what_not_to_do = "NUNCA compartas claves token, números de tarjeta ni códigos de WhatsApp que te lleguen por SMS."
        elif risk_percentage >= 30:
            risk_level = "MEDIUM"
            summary = (
                "PRECAUCIÓN: El mensaje contiene elementos sospechosos o lenguaje manipulativo de urgencia. "
                "No actúes bajo presión."
            )
            immediate_action = "Verificá la información comunicándote con los números oficiales de la entidad por tu cuenta."
            what_not_to_do = "No utilices los enlaces ni los números de teléfono incluidos dentro de este mensaje."
        else:
            risk_level = "LOW"
            summary = "RIESGO BAJO: No se detectan patrones evidentes de estafa ni pedidos de información confidencial."
            immediate_action = "Podés continuar con normalidad, recordando siempre no compartir contraseñas."
            what_not_to_do = "No compartas datos bancarios si en un próximo mensaje te lo solicitan."

        # Texto amigable y empático para reenviar por WhatsApp al familiar (wa.me)
        entity_hint = f" de {detected_entity}" if detected_entity else ""
        wa_text = (
            f"Hola, recibí este mensaje{entity_hint} y antes de hacer nada lo analicé con CiberGuardián. "
            f"Me marcó un nivel de riesgo {risk_level} ({risk_percentage}%). "
            f"¿Me das una mano mirando esto para estar seguros? Gracias!"
        )

        return ChatMessageResponse(
            risk_level=risk_level,
            risk_percentage=risk_percentage,
            detected_entity=detected_entity,
            detected_vector="WHATSAPP" if "whatsapp" in text_lower or not url_matches else "WEB",
            summary=summary,
            immediate_action=immediate_action,
            what_not_to_do=what_not_to_do,
            highlighted_phrases=highlighted,
            wa_share_text=wa_text
        )
