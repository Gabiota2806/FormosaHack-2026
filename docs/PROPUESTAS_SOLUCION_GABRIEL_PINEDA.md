# Propuestas de Solución — Gabriel Pineda
**FormosaHack 2026**  
**Eje Temático:** Seguridad  
**Desafío Asignado:** Dificultad para reconocer engaños y riesgos en entornos digitales (Fraude, Phishing, Suplantación de Identidad, Falsas Noticias y Estafas).

---

## Comparativa Rápida para el Equipo

| Criterio | Opción 1: CiberAlerta Formosa (Radar & Detector) | Opción 2: FormosaVerifica (Directorio Oficial & Reputación) | Opción 3: EscudoDigital (Triaje de Emergencia & Denuncias) |
| :--- | :--- | :--- | :--- |
| **Enfoque Principal** | Detección temprana comunitaria + Escáner heurístico | Prevención proactiva basada en canales oficiales certificados | Respuesta rápida a incidentes + Asistente de contención |
| **Público Objetivo** | Ciudadanos de a pie, adultos mayores, familias | Clientes de bancos, usuarios de servicios públicos, comercios | Personas que sospechan o ya fueron víctimas de un engaño |
| **Impacto Visual en Demo** | ⭐⭐⭐⭐⭐ (Escáner en vivo con mensajes de WhatsApp reales) | ⭐⭐⭐⭐ (Buscador rápido con sellos de verificación oficial) | ⭐⭐⭐⭐ (Flujo de emergencia guiado + reporte formal) |
| **Complejidad de Desarrollo (24h)** | Media-Alta (Perfectamente modular y paralelizable) | Media (Rápido de terminar, riesgo de quedar corto) | Media (Muy útil pero requiere bastante lógica de flujos) |
| **Encaje con Nuestro Stack** | **100%** (Core Service: reportes/score; Auth: 2FA moderador) | **100%** (Core Service: canales; Auth: 2FA instituciones) | **100%** (Core Service: incidentes; Auth: 2FA auditores) |

---

## Opción 1: "CiberAlerta Formosa" (Plataforma Comunitaria de Detección Temprana y Radar de Fraudes) — *RECOMENDADA*

### 💡 La Idea en 1 Frase
Una plataforma ciudadana donde cualquier persona puede pegar un mensaje, link o SMS sospechoso para saber al instante si es una estafa, y consultar un radar en tiempo real de engaños activos reportados en las localidades de Formosa.

### 🧩 Módulos Principales
1. **Analizador Heurístico "¿Es una Estafa?" (Instant Scanner):**
   - El usuario pega un texto de WhatsApp, SMS, correo o enlace web.
   - El motor evalúa indicadores de fraude:
     - Sentido de urgencia extrema (*"Su cuenta será bloqueada en 2 horas"*).
     - Solicitud de claves, tokens o transferencias inmediatas.
     - Suplantación de entidades conocidas (Banco Formosa, REFSA, ANSES, Correo Argentino).
     - Enlaces acortados o dominios engañosos (`bancoformosa-soporte.xyz` vs `bancoformosa.com.ar`).
   - Devuelve un **Semáforo de Riesgo** (Verde / Amarillo / Rojo), porcentaje de riesgo, los motivos explicados en lenguaje sencillo y recomendaciones claras (*"Nunca compartas tu clave token", "Llama al número oficial"*).

2. **Radar de Alertas Comunitarias en Tiempo Real (Feed Provincial):**
   - Listado paginado de alertas reportadas por vecinos de Formosa.
   - Filtros por:
     - **Localidad:** Formosa Capital, Clorinda, Pirané, El Colorado, Las Lomitas, etc.
     - **Tipo:** Bancario, Servicios Públicos (REFSA/Agua), Hackeo de WhatsApp, Compras falsas en Marketplace.
     - **Estado:** En verificación, Confirmada por moderador, Descartada.
   - Botón *"A mí también me llegó"* que incrementa el nivel de alerta comunitario.

3. **Módulo Educativo Interactivo ("Simulador Anti-Engaños"):**
   - Desafío interactivo de 4 preguntas con capturas simuladas de mensajes reales.
   - El usuario desliza o elige *"¿Legítimo o Fraude?"* y recibe feedback educativo al instante.

### 🏆 Por qué impresiona al jurado:
- **Demostración en vivo contundente:** Durante la defensa, pegas un mensaje típico de estafa de WhatsApp ante los ojos del jurado y el sistema lo detecta en vivo con explicaciones claras.
- **Arraigo local total:** Utiliza nombres reales (Banco Formosa, REFSA, comercios de Clorinda, etc.).
- **Accesibilidad para adultos mayores:** Tipografías grandes, semáforos de color visuales y lenguaje sin tecnicismos complejos.

---

## Opción 2: "FormosaVerifica" (Directorio de Canales Oficiales y Reputación Digital)

### 💡 La Idea en 1 Frase
Un verificador colaborativo y registro unificado de confianza donde cualquier formoseño puede comprobar en 5 segundos si un número de WhatsApp, cuenta bancaria, alias o enlace web pertenece verdaderamente a una institución o comercio legítimo.

### 🧩 Módulos Principales
1. **Buscador de Reputación y Validación Oficial:**
   - Buscador rápido: se ingresa un número de teléfono, alias CBU/CVU o enlace.
   - Resultados:
     - 🟢 **Canal Oficial Verificado:** Sello verde que certifica que el canal pertenece a REFSA, Banco Formosa, Ministerio o comercio registrado.
     - 🔴 **Reportado como Fraude:** Muestra advertencias de la comunidad con fecha y motivo.
     - 🟡 **Canal Desconocido:** Advierte precaución y sugiere no transferir dinero.
2. **Directorio Seguro Provincial:**
   - Catálogo ordenado de los canales oficiales de contacto y pago autorizados de toda la provincia.
3. **Gestión Institucional con 2FA:**
   - Organismos y comercios verificados acceden con autenticación de dos factores (2FA TOTP) para dar de alta y actualizar sus canales legítimos.

### 🏆 Por qué impresiona al jurado:
- Ataca la causa raíz de la suplantación de identidad.
- Excelente estructura arquitectónica para mostrar el microservicio de autenticación segura (2FA).

---

## Opción 3: "EscudoDigital Formosa" (Triaje de Emergencia y Asistente de Incidentes Digitales)

### 💡 La Idea en 1 Frase
Una herramienta de contención y primeros auxilios digitales que guía a las personas en los primeros minutos críticos tras sospechar o haber caído en un engaño, evitando que el daño económico o de datos sea mayor.

### 🧩 Módulos Principales
1. **Asistente de Primeros Auxilios Digitales ("SOS Ciberseguridad"):**
   - Preguntas rápidas: *"¿Diste tus claves bancarias?", "¿Pasaste el código de 6 dígitos de WhatsApp?", "¿Hiciste una transferencia a un desconocido?"*
   - Protocolo de acción inmediata en 3 pasos con números de contacto directos de emergencia (bloqueo de tarjetas, recuperación de cuenta).
2. **Generador de Acta/Reporte Digital para Denuncia:**
   - Formulario estructurado para cargar capturas, datos del estafador (CBU destino, alias, teléfono) y cronología.
   - Genera una ficha resumen en PDF lista para presentar ante la Policía Informática o Fiscalía provincial.
3. **Mapa de Calor y Estadísticas de Ciberdelito:**
   - Dashboard analítico con gráficos que muestran las modalidades de estafa predominantes por departamento de la provincia.

### 🏆 Por qué impresiona al jurado:
- Enfoque muy empático y humano ante una situación de angustia de la víctima.
- Gran solidez en el backend (procesamiento de datos, métricas y reportes estructurados).

---

## Distribución de Roles Sugerida para el Equipo de 4

Para no pisarse entre integrantes y trabajar en paralelo de forma óptima:

1. **Integrante 1 — Líder Frontend & UI/UX:**
   - Componentes React: Semáforo de riesgo, analizador de texto, tarjetas de alertas y modales accesibles (Sonner toasts + ConfirmModal).
2. **Integrante 2 — Frontend & Vistas / Simulador:**
   - Filtros por localidad, paginación en servidor, integración con el cliente Axios (`api.ts`) y módulo educativo o estadísticas.
3. **Integrante 3 — Líder Backend & Core Service:**
   - Modelos SQLAlchemy con Soft Delete (`deleted_at`), Repository Pattern (`Router -> Service -> Repository`), validación con Pydantic v2 y endpoints paginados (`page`, `limit`).
4. **Integrante 4 — Backend Auth, Motor de Detección & Seeders:**
   - Microservicio de Auth & 2FA TOTP, motor heurístico de scoring de riesgos en FastAPI y script `seed.py` con localidades e instituciones de Formosa.
