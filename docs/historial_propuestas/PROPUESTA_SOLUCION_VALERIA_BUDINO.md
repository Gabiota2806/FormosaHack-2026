# Propuesta de Solución — ESCUDO (nombre provisorio)

> **Autor:** Valeria Budiño  
> **Competencia:** FormosaHack 2026 — Ultra Hackatón de 24 Horas  
> **Eje temático:** Seguridad y Sociedad  
> **Estado:** Propuesta inicial (previa a la especificación formal en `docs/SDD.md`)

---

## 1. Problemática

Las personas interactúan diariamente con mensajes, sitios web, redes sociales y otros servicios digitales donde pueden encontrarse con intentos de fraude, suplantaciones de identidad, información engañosa u otras situaciones de riesgo. Reconocer estas situaciones a tiempo continúa siendo un desafío y puede afectar la seguridad de las personas y de su información.

### 1.1 Problema que abordamos

Las personas reciben diariamente comunicaciones digitales que pueden contener intentos de **fraude**, **suplantación** o **manipulación**. Muchas soluciones existentes detectan amenazas técnicas (malware, dominios en listas negras), pero **el usuario sigue necesitando interpretar el contexto y decidir qué hacer**.

---

## 2. Solución Propuesta

**ESCUDO** es una **extensión de navegador** que analiza señales de riesgo presentes en emails, sitios web y comunicaciones digitales, y las traduce en:

1. **Alertas comprensibles:** un nivel de riesgo claro y visible.
2. **Explicaciones:** por qué el contenido es sospechoso, en lenguaje simple.
3. **Recomendaciones de acción:** qué hacer (y qué no hacer) a continuación.

---

## 3. Diferencial

| Pilar | Descripción |
| :--- | :--- |
| **Análisis contextual** | No solo evalúa indicadores técnicos, sino el contenido y la intención del mensaje (urgencia, pedido de datos, promesas, amenazas). |
| **Educación** | Cada alerta explica la señal detectada para que la persona aprenda a reconocerla por sí misma. |
| **Conocimiento local** | Base de conocimiento sobre modalidades de fraude y entidades argentinas (bancos, billeteras virtuales, organismos públicos, etc.). |

---

## 4. Alcance del MVP

### 4.1 Plataforma
- **Chrome Extension** como punto de entrada.

### 4.2 Fuentes analizadas
- **Gmail** (contenido de correos abiertos).
- **Páginas web** visitadas.

### 4.3 Flujo de análisis

```text
┌──────────────────────────────┐
│       Chrome Extension       │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│     Gmail + páginas web      │  Captura del contenido a analizar
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│      Motor de análisis       │  Extracción de señales de riesgo
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ Base de conocimiento argentina│  Modalidades y entidades locales
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│              IA              │  Interpretación contextual
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│       Nivel de riesgo        │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│         Explicación          │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│      Acción recomendada      │
└──────────────────────────────┘
```

### 4.4 Resultado entregado al usuario

Cada análisis devuelve tres elementos:

| Elemento | Ejemplo |
| :--- | :--- |
| **Nivel de riesgo** | Bajo / Medio / Alto |
| **Explicación** | "El remitente dice ser tu banco, pero el dominio del correo no coincide con el oficial y te pide tu clave con urgencia." |
| **Acción recomendada** | "No hagas clic en el enlace. Ingresá a tu banco escribiendo la dirección oficial o comunicate por sus canales oficiales." |

---

## 5. Próximos Pasos

1. Formalizar requisitos funcionales y no funcionales en `docs/SDD.md`.
2. Definir el catálogo inicial de señales de riesgo y la estructura de la base de conocimiento argentina.
3. Diseñar el contrato de la API de análisis en `docs/design/API_ENDPOINTS_PLANNER.md`.
4. Desglosar el trabajo en tareas con DoD en `docs/TASKS.md`.
