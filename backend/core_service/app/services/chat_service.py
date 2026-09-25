import re
from typing import List, Tuple
from urllib.parse import quote
from app.schemas.chat import ChatMessageResponse, HighlightedPhrase

class ChatService:
    """
    Motor heurístico de análisis de engaños y manipulación psicológica
    para CiberGuardián con semáforo de 3 niveles y sugerencia de contención familiar.
    """

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

    GREED_KEYWORDS = [
        "ganaste", "premio", "sorteo", "beneficiario", "acreditaci[oó]n pendiente",
        "subsidio", "felicidades", "fuiste seleccionad[oa]"
    ]

    URL_REGEX = r"(https?://\S+|www\.\S+|bit\.ly/\S+|tinyurl\.com/\S+|t\.me/\S+)"

    def analyze_message(self, message: str) -> ChatMessageResponse:
        text_lower = message.lower()
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
            matches = list(re.finditer(kw, text_lower))
            for m in matches:
                score += 35
                highlighted.append(HighlightedPhrase(
                    phrase=m.group(0),
                    reason="¡ALERTA MÁXIMA! Ninguna entidad bancaria o empresa oficial solicita jamás transferencias, claves, tokens ni descargar apps remotas.",
                    category="CREDENTIALS"
                ))

        # 4. Promesas de dinero fácil o premios falsos
        for kw in self.GREED_KEYWORDS:
            matches = list(re.finditer(kw, text_lower))
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
                f"🚨 ALERTA ROJA: Este mensaje presenta señales inequívocas de INTENTO DE ESTAFA "
                f"{f'suplantando a {detected_entity}' if detected_entity else ''}."
            )
            immediate_action = "¡FRENÁ INMEDIATAMENTE! No abras ningún enlace, no respondas y no transfieras dinero."
            what_not_to_do = "NUNCA compartas claves token, números de tarjeta ni códigos de WhatsApp que te lleguen por SMS."
        elif risk_percentage >= 30:
            risk_level = "MEDIUM"
            summary = (
                "⚠️ PRECAUCIÓN: El mensaje contiene elementos sospechosos o lenguaje manipulativo de urgencia. "
                "No actúes bajo presión."
            )
            immediate_action = "Verificá la información comunicándote con los números oficiales de la entidad por tu cuenta."
            what_not_to_do = "No utilices los enlaces ni los números de teléfono incluidos dentro de este mensaje."
        else:
            risk_level = "LOW"
            summary = "✅ RIESGO BAJO: No se detectan patrones evidentes de estafa ni pedidos de información confidencial."
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
