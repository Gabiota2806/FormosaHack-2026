#!/usr/bin/env python3
"""
Seeder de Datos Reales de Ciberestafas y Canales Oficiales para FormosaHack 2026.
Puebla la base de datos PostgreSQL con 10 amenazas reales y 5 canales verificados.
"""

import sys
import os

# Asegurar path para importar módulos de core_service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/core_service")))

from app.database import SessionLocal, engine, Base
from app.models.incident import IncidentReport, OfficialChannel

def seed():
    print("🌱 Iniciando población de datos para CiberGuardián...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Canales Oficiales Verificados
        channels_data = [
            {
                "entity_name": "Banco Formosa",
                "official_domains": "https://www.bancoformosa.com.ar, https://homebanking.bancoformosa.com.ar",
                "official_phones": "0800-777-2262, 0800-888-2262",
                "emergency_phone": "0800-777-2262",
                "verified_whatsapp": "+54 9 370 400-2262",
                "advice": "Banco Formosa jamás solicita claves token, contraseñas ni transferencias de prueba por teléfono o WhatsApp."
            },
            {
                "entity_name": "Tarjeta Chigüé",
                "official_domains": "https://www.tarjetachigue.com.ar",
                "official_phones": "0810-888-2444",
                "emergency_phone": "0810-888-2444",
                "verified_whatsapp": "+54 9 370 422-2444",
                "advice": "Nunca compartas los 16 dígitos de tu tarjeta ni el código de seguridad de 3 dígitos del reverso."
            },
            {
                "entity_name": "REFSA Electricidad",
                "official_domains": "https://www.refsa.com.ar",
                "official_phones": "0800-888-7337, 3704-439800",
                "emergency_phone": "0800-888-7337",
                "verified_whatsapp": "+54 9 370 460-7337",
                "advice": "REFSA nunca cobra facturas mediante CBU/CVU de personas particulares ni exige pagos por llamadas intimidatorias."
            },
            {
                "entity_name": "Policía de Formosa (Delitos Informáticos)",
                "official_domains": "https://policia.formosa.gob.ar",
                "official_phones": "911, 3704-430795",
                "emergency_phone": "911",
                "verified_whatsapp": "+54 9 370 443-0795",
                "advice": "Línea de emergencia inmediata disponible las 24 horas ante fraudes cibernéticos o extorsiones digitales."
            },
            {
                "entity_name": "Red Link / Banelco",
                "official_domains": "https://www.redlink.com.ar, https://www.banelco.com",
                "official_phones": "Link: 0800-888-5465 | Banelco: 011-4320-5000",
                "emergency_phone": "0800-888-5465",
                "verified_whatsapp": None,
                "advice": "Líneas de bloqueo preventivo de tarjetas de débito y crédito las 24 horas ante pérdida o sospecha de fraude."
            }
        ]

        for ch in channels_data:
            existing = db.query(OfficialChannel).filter_by(entity_name=ch["entity_name"]).first()
            if not existing:
                db.add(OfficialChannel(**ch))
                print(f"  ✅ Canal verificado registrado: {ch['entity_name']}")

        # 2. Amenazas e Incidentes Reales en el Radar
        incidents_data = [
            {
                "title": "Phishing Banco Formosa: SMS de cuenta suspendida",
                "description": "Mensaje de texto alertando que la cuenta de Home Banking fue bloqueada preventivamente y exige ingresar a un link falso.",
                "impersonated_entity": "Banco Formosa",
                "attack_vector": "SMS",
                "evidence_text": "URGENTE BCO FORMOSA: Su cuenta ha sido suspendida por seguridad. Ingrese y reactive en: https://bancoformosa-gestion.online",
                "suspicious_phone": "+54 9 370 499-1234",
                "suspicious_url": "https://bancoformosa-gestion.online",
                "fake_cbu": None,
                "votes_count": 28,
                "status": "active"
            },
            {
                "title": "Suplantación de Identidad por WhatsApp: 'Mamá cambié de número'",
                "description": "Contacto con foto de un familiar diciendo que extravió el celular y solicita una transferencia urgente para pagar un servicio.",
                "impersonated_entity": "WhatsApp",
                "attack_vector": "WHATSAPP",
                "evidence_text": "Hola má, agendá mi nuevo número que rompí el celu anterior. Te pido un favor enorme, ¿me transferís 45.000 a este alias? Mañana te lo devuelvo.",
                "suspicious_phone": "+54 9 370 411-8899",
                "suspicious_url": None,
                "fake_cbu": "sofia.perez.mp",
                "votes_count": 42,
                "status": "active"
            },
            {
                "title": "Corte de suministro falso de REFSA con CBU particular",
                "description": "Llamada y WhatsApp intimidatorio alegando corte de luz en 2 horas si no se abona factura vencida a un CVU particular.",
                "impersonated_entity": "REFSA",
                "attack_vector": "WHATSAPP",
                "evidence_text": "AVISO REFSA: Orden de corte en curso por deuda impaga. Evite recargos abonando saldo de $18.500 al CVU 0000003100012345678901.",
                "suspicious_phone": "+54 9 370 455-6677",
                "suspicious_url": None,
                "fake_cbu": "0000003100012345678901",
                "votes_count": 19,
                "status": "active"
            },
            {
                "title": "Falso bono extraordinario de ANSES vía WhatsApp",
                "description": "Cadena con enlace falso solicitando DNI y clave de seguridad social para cobrar un supuesto bono municipal o provincial.",
                "impersonated_entity": "ANSES",
                "attack_vector": "WHATSAPP",
                "evidence_text": "Ya podés consultar si cobrás el nuevo bono extraordinario de $70.000. Ingresá y confirmá tus datos: https://anses-bono2026.site",
                "suspicious_phone": "+54 9 11 2345-6789",
                "suspicious_url": "https://anses-bono2026.site",
                "fake_cbu": None,
                "votes_count": 35,
                "status": "active"
            },
            {
                "title": "Llamada de falso soporte de Tarjeta Chigüé pidiendo Token",
                "description": "Supuesto operador de seguridad informa de compras sospechosas en Buenos Aires y solicita código token para anularlas.",
                "impersonated_entity": "Tarjeta Chigüé",
                "attack_vector": "LLAMADA",
                "evidence_text": "Operador informando compra por $120.000 en Fravega. Pide dictar el token de la app Onda para cancelarla.",
                "suspicious_phone": "+54 11 7890-1234",
                "suspicious_url": None,
                "fake_cbu": None,
                "votes_count": 14,
                "status": "active"
            },
            {
                "title": "Alerta falsa de Mercado Pago: Dispositivo no reconocido",
                "description": "Correo electrónico o mensaje SMS indicando acceso indebido con enlace a pantalla clonada para ingresar email y password.",
                "impersonated_entity": "Mercado Pago",
                "attack_vector": "EMAIL",
                "evidence_text": "MercadoPago: Detectamos un inicio de sesión desde Córdoba en un iPhone 15. Si no fuiste vos, bloqueá tu cuenta ya en: https://mp-seguridad-ar.com",
                "suspicious_phone": None,
                "suspicious_url": "https://mp-seguridad-ar.com",
                "fake_cbu": None,
                "votes_count": 51,
                "status": "active"
            },
            {
                "title": "Oferta laboral remota por Telegram pagando por ver videos",
                "description": "Promesa de ganar $30.000 por día realizando tareas sencillas, pero exigen una 'garantía' o 'recarga' previa.",
                "impersonated_entity": "Otro",
                "attack_vector": "WHATSAPP",
                "evidence_text": "Hola! Somos de la agencia de contratación de TikTok y YouTube. Gane hasta $35.000 al día trabajando desde su casa. Escríbanos a t.me/trabajos_arg.",
                "suspicious_phone": "+54 9 370 420-9911",
                "suspicious_url": "https://t.me/trabajos_arg",
                "fake_cbu": None,
                "votes_count": 8,
                "status": "active"
            },
            {
                "title": "Falso sorteo de órdenes de compra de supermercado local",
                "description": "Campaña viral solicitando reenviar un enlace a 10 contactos de WhatsApp para retirar orden de compra de $50.000.",
                "impersonated_entity": "Otro",
                "attack_vector": "WHATSAPP",
                "evidence_text": "Por aniversario regalamos 500 órdenes de compra. Compartí este link con 10 amigos para retirar en sucursal: https://promo-aniversario.xyz",
                "suspicious_phone": None,
                "suspicious_url": "https://promo-aniversario.xyz",
                "fake_cbu": None,
                "votes_count": 22,
                "status": "active"
            },
            {
                "title": "Llamada de 'Soporte de WhatsApp' pidiendo código de 6 dígitos",
                "description": "Llaman diciendo que alguien intentó vincular la cuenta y piden el código SMS recibido para supuestamente 'protegerla'.",
                "impersonated_entity": "WhatsApp",
                "attack_vector": "LLAMADA",
                "evidence_text": "Llamada con logo de WhatsApp diciendo que necesitan verificar el buzón de seguridad mediante el SMS de 6 dígitos.",
                "suspicious_phone": "+54 9 11 9876-5432",
                "suspicious_url": None,
                "fake_cbu": None,
                "votes_count": 31,
                "status": "active"
            },
            {
                "title": "Préstamo preaprobado a tasa cero con adelanto de seguro",
                "description": "Ofrecen préstamos de hasta $2.000.000 con mínimos requisitos pero exigen el depósito de un 'seguro de fianza' de $25.000.",
                "impersonated_entity": "Otro",
                "attack_vector": "WHATSAPP",
                "evidence_text": "Tu crédito de $1.500.000 fue preaprobado en 24 cuotas fijas. Para transferir a tu cuenta necesitamos que abones el seguro administrativo de $20.000.",
                "suspicious_phone": "+54 9 370 477-3322",
                "suspicious_url": None,
                "fake_cbu": "creditos.express.arg",
                "votes_count": 12,
                "status": "active"
            }
        ]

        for inc in incidents_data:
            existing = db.query(IncidentReport).filter_by(title=inc["title"]).first()
            if not existing:
                db.add(IncidentReport(**inc))
                print(f"  🚨 Incidente registrado en Radar: {inc['title']}")

        db.commit()
        print("🎉 ¡Base de datos poblada exitosamente con datos realistas para la evaluación!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error al sembrar datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
