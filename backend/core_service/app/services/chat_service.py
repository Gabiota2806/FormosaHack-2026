import re
from typing import List, Tuple, Optional
from urllib.parse import quote
from sqlalchemy.orm import Session
from app.models.incident import OfficialChannel
from app.schemas.chat import (
    ChatMessageResponse,
    HighlightedPhrase,
    ChatFollowupRequest,
    ChatFollowupResponse,
    EmergencyContact,
)
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
        Orquesta el análisis inteligente de un mensaje:
        1. Capa perimetral: Detección preventiva determinística de Prompt Injection / Jailbreak.
        2. Inferencia con Gemini bajo timeout estricto de 2.5s y delimitación XML.
        3. Si Gemini falla, degrada suavemente hacia analyze_message (heurística regex).
        4. Correlaciona el resultado con los brotes comunitarios activos (FH26-54, Escenario 3).
        """
        # Capa perimetral: Neutralización inmediata de intentos de evasión / Jailbreak
        injection_alert = self.detect_prompt_injection(message)
        if injection_alert is not None:
            return self._apply_community_outbreak(injection_alert, message, db)

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

    PROMPT_INJECTION_PATTERNS = [
        # Anulación imperativa de directivas
        r"ignora\s*(todas\s*las\s*|las\s*)?instrucciones\s*(anteriores|previas)",
        r"ignore\s*(all\s*)?(previous|prior)\s*instructions",
        r"disregard\s*(all\s*)?(previous|prior)\s*instructions",
        r"olvida\s*(todas\s*las\s*|las\s*)?reglas(\s*(anteriores|previas))?",
        r"forget\s*(all\s*)?(previous\s*)?rules",
        # Jailbreak y alteración de identidad
        r"act\s*as\s*(dan|jailbreak|developer|dev|root|admin)",
        r"haz\s*como\s*si\s*fueras\s*(dan|un\s*asistente\s*sin\s*restricciones)",
        r"ahora\s*(sos|eres)\s*(dan|un\s*modelo\s*sin\s*filtros)",
        r"developer\s*mode(\s*(enabled|on))?",
        r"modo\s*desarrollador(\s*(activado|habilitado))?",
        r"\bjailbreak\b",
        # Falsificación coercitiva de clasificación
        r"(clasifica|eval[uú]a|califica)\s*(esto\s*)?como\s*(seguro|safe|low|inofensivo|leg[ií]timo)",
        r"(mark|classify|rate)\s*(this\s*)?as\s*(safe|low|harmless|legitimate)",
        r"(dec[ií]|di)\s*que\s*es\s*seguro",
        # Extracción forzada de system prompt
        r"(revela|muestra|mostrame|imprime|dump)\s*(tu\s*)?(system\s*prompt|instrucciones\s*internas|directivas)",
        r"(reveal|show|print|dump)\s*(your\s*)?(system\s*prompt|initial\s*prompt|instructions)",
        # Cierre malicioso de tags XML
        r"</?mensaje_sospechoso>",
    ]

    def detect_prompt_injection(self, message: str) -> Optional[ChatMessageResponse]:
        """
        Escaneo perimetral heurístico determinístico para detectar intentos de Prompt Injection,
        Jailbreak o anulación de directivas. Retorna ChatMessageResponse con riesgo 100% (HIGH)
        si se detecta una amenaza perimetral, o None si no se detectan patrones.
        """
        text_lower = message.lower()
        matched_phrases: List[str] = []

        for pat in self.PROMPT_INJECTION_PATTERNS:
            for m in re.finditer(pat, text_lower):
                matched_phrases.append(m.group(0))

        if not matched_phrases:
            return None

        unique_matches = list(dict.fromkeys(matched_phrases))
        highlighted = [
            HighlightedPhrase(
                phrase=phrase,
                reason="Intento de manipulación de directivas perimetrales o técnica de Jailbreak (Prompt Injection).",
                category="PROMPT_INJECTION"
            )
            for phrase in unique_matches
        ]

        return ChatMessageResponse(
            risk_level="HIGH",
            risk_percentage=100,
            detected_entity=None,
            detected_vector="WEB",
            summary=(
                "ALERTA MÁXIMA: Se detectó un intento deliberado de evasión perimetral o manipulación de instrucciones "
                "(Prompt Injection / Jailbreak) diseñado para engañar al asistente de ciberseguridad."
            ),
            immediate_action=(
                "¡ATENCIÓN! No sigas ni interactúes con las instrucciones de este mensaje. El contenido fue catalogado "
                "como amenaza perimetral de máxima severidad."
            ),
            what_not_to_do=(
                "NUNCA intentes saltarte los controles perimetrales, anular directivas de seguridad ni ejecutar código "
                "o comandos imperativos en el asistente."
            ),
            highlighted_phrases=highlighted,
            wa_share_text=(
                "Hola, CiberGuardián detectó un intento malicioso de manipulación perimetral (Prompt Injection / Jailbreak) "
                "en este mensaje (Riesgo HIGH 100%). ¡Alerta de seguridad!"
            )
        )

    def analyze_message(self, message: str) -> ChatMessageResponse:
        # Capa perimetral: Detección preventiva de Prompt Injection / Jailbreak
        injection_alert = self.detect_prompt_injection(message)
        if injection_alert is not None:
            return injection_alert

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

    DEFAULT_EMERGENCY_CONTACTS = [
        EmergencyContact(
            name="Policía de Formosa (Delitos Informáticos)",
            phone="911 / 3704-430795",
            channel_type="PHONE",
            url="https://policia.formosa.gob.ar",
            description="Línea de emergencia disponible 24 hs para radicar denuncias por ciberestafas y extorsión."
        ),
        EmergencyContact(
            name="Banco Formosa - Mesa de Ayuda",
            phone="0800-777-2262",
            channel_type="PHONE",
            url="https://www.bancoformosa.com.ar",
            description="Línea gratuita oficial para bloqueo preventivo de cuentas y claves Home Banking."
        ),
        EmergencyContact(
            name="Tarjeta Chigüé",
            phone="0810-888-2444",
            channel_type="PHONE",
            url="https://www.tarjetachigue.com.ar",
            description="Línea oficial de bloqueo preventivo por robo o fraude de tarjeta."
        ),
        EmergencyContact(
            name="Red Link / Banelco (Bloqueo 24hs)",
            phone="0800-888-5465",
            channel_type="PHONE",
            url="https://www.redlink.com.ar",
            description="Bloqueo preventivo de tarjetas de débito a nivel nacional las 24 horas."
        ),
        EmergencyContact(
            name="REFSA Electricidad",
            phone="0800-888-7337",
            channel_type="PHONE",
            url="https://www.refsa.com.ar",
            description="Atención oficial ante engaños de cobro de facturas falsas."
        ),
    ]

    def _get_emergency_contacts_for_context(
        self,
        entity_name: Optional[str],
        question: str,
        db: Optional[Session] = None
    ) -> List[EmergencyContact]:
        """
        Recupera los canales oficiales de auxilio prioritarios para el contexto de la consulta,
        consultando la base de datos o recurriendo al catálogo de contingencia local.
        """
        contacts: List[EmergencyContact] = []
        q_lower = question.lower()

        # Intentar obtener canales desde la base de datos
        db_channels: List[OfficialChannel] = []
        if db is not None:
            try:
                db_channels = db.query(OfficialChannel).filter(OfficialChannel.deleted_at.is_(None)).all()
            except Exception:
                db_channels = []

        if db_channels:
            for ch in db_channels:
                is_match = False
                if entity_name and entity_name.lower() in ch.entity_name.lower():
                    is_match = True
                elif ch.entity_name.lower() in q_lower:
                    is_match = True
                elif "policía" in ch.entity_name.lower() or "delitos" in ch.entity_name.lower():
                    is_match = True
                elif ("link" in ch.entity_name.lower() or "banco" in ch.entity_name.lower()) and any(
                    w in q_lower for w in ["tarjeta", "chigüé", "chigue", "banco", "clave", "cbu", "cuenta", "clic", "link"]
                ):
                    is_match = True

                if is_match:
                    contacts.append(
                        EmergencyContact(
                            name=ch.entity_name,
                            phone=ch.emergency_phone or ch.official_phones,
                            channel_type="PHONE",
                            url=ch.official_domains.split(",")[0].strip() if ch.official_domains else None,
                            description=ch.advice
                        )
                    )

        if not contacts:
            for dc in self.DEFAULT_EMERGENCY_CONTACTS:
                if entity_name and entity_name.lower() in dc.name.lower():
                    contacts.append(dc)
                elif "policía" in dc.name.lower():
                    contacts.append(dc)
                elif ("chigüé" in dc.name.lower() or "banco formosa" in dc.name.lower() or "red link" in dc.name.lower()) and any(
                    w in q_lower for w in ["tarjeta", "chigüé", "chigue", "banco", "clave", "cbu", "cuenta", "clic", "link"]
                ):
                    contacts.append(dc)

        # Si aún no hay contactos, entregar los primeros contactos esenciales
        if not contacts:
            contacts = self.DEFAULT_EMERGENCY_CONTACTS[:3]

        # Deduplicar por nombre
        unique: List[EmergencyContact] = []
        seen = set()
        for c in contacts:
            if c.name not in seen:
                seen.add(c.name)
                unique.append(c)

        return unique

    def _enrich_emergency_contacts(
        self,
        response: ChatFollowupResponse,
        request: ChatFollowupRequest,
        db: Optional[Session] = None
    ) -> ChatFollowupResponse:
        entity = request.context_diagnosis.detected_entity if request.context_diagnosis else None
        if not response.emergency_contacts:
            response.emergency_contacts = self._get_emergency_contacts_for_context(entity, request.question, db)
        return response

    async def followup_with_fallback(
        self, request: ChatFollowupRequest, db: Optional[Session] = None
    ) -> ChatFollowupResponse:
        """
        Orquesta el seguimiento post-diagnóstico:
        1. Capa perimetral anti-inyección / jailbreak.
        2. Inferencia conversacional con Gemini (timeout 2.5s).
        3. Degradación suave a fallback heurístico resiliente ante error o timeout.
        4. Enriquecimiento con canales oficiales verificados.
        """
        # 1. Blindaje perimetral
        if self.detect_prompt_injection(request.question) is not None:
            contacts = self._get_emergency_contacts_for_context(None, request.question, db)
            return ChatFollowupResponse(
                answer=(
                    "Se detectó un patrón de manipulación o intento de evasión de directivas perimetrales (Prompt Injection). "
                    "En CiberGuardián mantenemos inalterables nuestros protocolos de seguridad para proteger a los usuarios. "
                    "Si tenés dudas genuinas sobre cómo actuar ante un mensaje sospechoso, por favor hacé tu consulta sin comandos especiales."
                ),
                suggested_actions=[
                    "No interactúes con remitentes sospechosos que envíen comandos maliciosos.",
                    "Comunicate con los canales oficiales verificados de tu entidad ante dudas legítimas."
                ],
                emergency_contacts=contacts,
                followup_suggestions=[
                    "¿Cómo verifico si un mensaje es oficial?",
                    "¿A dónde denuncio un intento de fraude digital en Formosa?"
                ],
                is_fallback=True
            )

        # 2. Inferencia con Gemini
        if self.gemini_service and self.gemini_service.is_available:
            try:
                gemini_resp = await self.gemini_service.followup(request)
                if gemini_resp is not None:
                    return self._enrich_emergency_contacts(gemini_resp, request, db)
            except Exception:
                pass

        # 3. Fallback Heurístico Resiliente
        return self.generate_heuristic_followup(request, db)

    def generate_heuristic_followup(
        self, request: ChatFollowupRequest, db: Optional[Session] = None
    ) -> ChatFollowupResponse:
        """
        Motor heurístico determinístico y resiliente de contención post-diagnóstico.
        Clasifica intenciones y provee pasos claros de acción, contención y auxilio oficial.
        """
        q_lower = request.question.lower()
        entity = None
        if request.context_diagnosis and request.context_diagnosis.detected_entity:
            entity = request.context_diagnosis.detected_entity
        elif request.initial_message:
            for ent, patterns in self.ENTITIES_PATTERNS.items():
                if any(re.search(pat, request.initial_message.lower()) for pat in patterns):
                    entity = ent
                    break

        banking_keywords = [
            "clic", "click", "enlace", "link", "clave", "token", "transferí", "transferi",
            "transferencia", "plata", "dinero", "tarjeta", "chigüé", "chigue", "banco",
            "homebanking", "home banking", "cbu", "cvu", "bloquear", "bloqueo", "datos", "cuenta"
        ]
        malware_keywords = [
            "descargué", "descargue", "instalé", "instale", "app", "aplicación", "aplicacion",
            "anydesk", "teamviewer", "apk", "archivo", "formatear", "virus", "control remoto",
            "pantalla"
        ]
        report_keywords = [
            "denuncia", "denunciar", "policía", "policia", "comisaría", "comisaria",
            "fiscalía", "fiscalia", "delito", "justicia", "penal", "donde denuncio",
            "dónde denuncio"
        ]
        comfort_keywords = [
            "miedo", "asustado", "asustada", "angustia", "desesperado", "desesperada",
            "culpa", "tonto", "tonta", "estúpido", "estúpida", "vergüenza", "verguenza",
            "me siento mal", "caí", "cai", "llorar", "perdón", "perdon"
        ]
        whatsapp_keywords = [
            "whatsapp", "clonaron", "código de 6 dígitos", "sms", "me robaron el whatsapp"
        ]

        if any(kw in q_lower for kw in comfort_keywords):
            answer = (
                "Por favor, respirá hondo y no te sientas culpable ni avergonzado/a. Los fraudes digitales son realizados "
                "por organizaciones con guiones psicológicos diseñados profesionalmente para presionar y manipular a personas "
                "de cualquier edad o profesión. Lo más valioso ahora es que frenaste a tiempo para buscar ayuda y tomar las "
                "medidas de protección necesarias."
            )
            suggested_actions = [
                "Hablalo con un familiar o persona de confianza: compartir lo sucedido alivia la angustia y evita actuar con desesperación.",
                "Enfocate en los pasos prácticos: bloquear accesos bancarios preventivamente y resguardar la evidencia.",
                "Recordá que vos sos la víctima de un delito, no el culpable: las autoridades e instituciones están para ayudarte."
            ]
            followup_suggestions = [
                "¿Cuáles son los primeros pasos si entregué datos bancarios?",
                "¿Cómo radico la denuncia policial en Formosa?",
                "¿Dónde puedo verificar los canales oficiales?"
            ]

        elif any(kw in q_lower for kw in malware_keywords):
            answer = (
                "Si instalaste una aplicación que te enviaron o te solicitaron por llamada (como AnyDesk, TeamViewer o un archivo APK), "
                "los atacantes podrían intentar controlar tu teléfono o visualizar tus claves en pantalla:"
            )
            suggested_actions = [
                "Activá inmediatamente el 'Modo Avión' en tu celular y desconectá el Wi-Fi para cortar de raíz el acceso remoto.",
                "Desinstalá de inmediato la aplicación sospechosa desde Ajustes > Aplicaciones.",
                "Desde otro dispositivo seguro de tu hogar, cambiá las contraseñas de tus correos y billeteras virtuales vinculadas.",
                "Si el teléfono continúa comportándose de forma extraña, realizá una restauración a valores de fábrica respaldando solo fotos y documentos imprescindibles."
            ]
            followup_suggestions = [
                "¿Cómo sé si tienen acceso a mi WhatsApp o redes?",
                "¿Qué hago si ya vieron mis contraseñas bancarias?",
                "¿A dónde llamo para denunciar el hecho en Formosa?"
            ]

        elif any(kw in q_lower for kw in banking_keywords):
            entity_hint = f" de {entity}" if entity else ""
            answer = (
                f"Si ingresaste a un enlace dudoso o compartiste claves{entity_hint}, lo prioritario es actuar rápido para cortar "
                "el acceso de los estafadores a tus fondos:"
            )
            suggested_actions = [
                f"Llamá inmediatamente a tu banco o emisor ({entity or 'Banco Formosa / Tarjeta Chigüé / Red Link'}) solicitando el bloqueo preventivo urgente de tarjetas y claves de Home Banking.",
                "Cerrá todas las sesiones bancarias y cambiá las contraseñas desde un dispositivo seguro y confiable.",
                "Revisá los últimos movimientos de tu cuenta y descargá o capturá los comprobantes de cualquier transferencia no autorizada.",
                "NO borres las conversaciones ni mensajes recibidos: son la prueba digital fundamental para la denuncia judicial."
            ]
            followup_suggestions = [
                "¿Cómo bloqueo mi tarjeta Chigüé o débito Link por teléfono?",
                "¿A dónde radico la denuncia policial en Formosa?",
                "¿Qué datos necesita el banco para desconocer una transferencia?"
            ]

        elif any(kw in q_lower for kw in whatsapp_keywords):
            answer = (
                "Si sospechás que intentaron o lograron apoderarse de tu cuenta de WhatsApp, podés recuperarla de inmediato:"
            )
            suggested_actions = [
                "Abrí WhatsApp e ingresá tu número de teléfono para solicitar el código de activación por SMS de 6 dígitos.",
                "Al ingresar el nuevo código, la sesión de los atacantes se cerrará automáticamente en su dispositivo.",
                "Activá de inmediato la 'Verificación en dos pasos' con un PIN de 6 dígitos dentro de Ajustes > Cuenta en WhatsApp.",
                "Avisá a tus familiares por llamada o mensaje normal que no atiendan pedidos de dinero desde tu número."
            ]
            followup_suggestions = [
                "¿Qué hago si los estafadores activaron la verificación en dos pasos?",
                "¿Cómo aviso a mis contactos de forma segura?",
                "¿A dónde reporto este número en CiberGuardián?"
            ]

        elif any(kw in q_lower for kw in report_keywords):
            answer = (
                "Para radicar una denuncia penal efectiva en la Provincia de Formosa ante una ciberestafa o intento de fraude digital, "
                "es fundamental preservar la evidencia digital intacta:"
            )
            suggested_actions = [
                "NO borres los mensajes, audios ni números sospechosos: tomá capturas de pantalla donde figure el remitente y la hora exacta.",
                "Si realizaste una transferencia, solicitá en tu banco el comprobante oficial con código de operación y CBU/CVU de destino.",
                "Acudí a la Comisaría más cercana o a la División Delitos Complejos de la Policía de Formosa (911 o 3704-430795).",
                "Presentá la constancia de denuncia en tu entidad financiera para respaldar el trámite de desconocimiento de operaciones."
            ]
            followup_suggestions = [
                "¿Cuáles son los teléfonos de la Policía de Formosa?",
                "¿El banco me reintegra los fondos con la denuncia policial?",
                "¿Cómo registro el reporte en el radar comunitario de CiberGuardián?"
            ]

        else:
            entity_hint = f" relacionado con {entity}" if entity else ""
            answer = (
                f"En base al diagnóstico de seguridad emitido para este mensaje{entity_hint}, lo más prudente es que nunca "
                "actúes bajo presión ni compartas datos personales o financieros:"
            )
            suggested_actions = [
                "No respondas al remitente ni abras enlaces acortados o dudosos.",
                "Comunicate únicamente con los números oficiales de la entidad por tu propia cuenta.",
                "Utilizá la función de compartir por WhatsApp de CiberGuardián para alertar a tus seres queridos y prevenir nuevos engaños."
            ]
            followup_suggestions = [
                "¿Qué hago si ya hice clic en el enlace?",
                "¿Cómo bloqueo mis tarjetas de forma preventiva?",
                "¿A dónde denuncio este caso en Formosa?"
            ]

        contacts = self._get_emergency_contacts_for_context(entity, request.question, db)

        return ChatFollowupResponse(
            answer=answer,
            suggested_actions=suggested_actions,
            emergency_contacts=contacts,
            followup_suggestions=followup_suggestions,
            is_fallback=True
        )

