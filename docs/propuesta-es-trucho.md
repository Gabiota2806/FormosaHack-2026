# Propuesta: "¿Es trucho?" 🕵️

> **Autor:** Mati
> **Desafío:** Seguridad – Dificultad para reconocer engaños y riesgos en entornos digitales
> **Formato:** Hackatón de 24 horas · Equipo de 4 · Entrega: sistema desplegado y funcionando

---

## 1. Cómo leo el problema

El enunciado no dice "existen estafas", dice que a las personas les cuesta **reconocer** los engaños **a tiempo**. El foco está en la persona y en el momento en que duda, no en bloquear ataques a nivel técnico.

Por eso la propuesta no es "un antivirus", sino una herramienta que:

- ayuda **en el momento** en que alguien recibe algo sospechoso,
- **explica por qué** algo es sospechoso, para que la persona aprenda a detectarlo sola,
- y le da **alguien a quién preguntar** si todavía tiene dudas.

### Aterrizado a Argentina

Mostrar que conocemos las estafas reales de acá le da peso a la solución frente al jurado:

- "Hola ma, cambié de número" por WhatsApp
- Mensajes falsos de Mercado Pago, bancos o ARCA (ex AFIP)
- Robo de WhatsApp pidiendo "el código de 6 dígitos que te llegó"
- Sorteos falsos en Instagram ("ganaste, pagá el envío")
- Falso soporte de banco por llamada o chat
- Estafas en Marketplace con comprobantes de transferencia falsos

---

## 2. La propuesta

Una web app con **cuatro funciones** que comparten un mismo corazón: un **catálogo de señales de alerta**.

### 2.1 Analizador que explica (núcleo)

La persona pega un mensaje sospechoso y recibe:

- **Nivel de riesgo** (bajo / medio / alto), nunca un "es estafa sí/no"
- **Las frases sospechosas resaltadas dentro del mismo mensaje**
- Qué señal representa cada frase y por qué es peligrosa
- Qué conviene hacer (y qué no)

Ejemplo:

> "Tu cuenta de ~~Mercado Pago~~ **será bloqueada en 2 horas** 🟥 urgencia artificial. **Ingresá acá para verificar tus datos** 🟥 pedido de datos: bit.ly/xxxx 🟥 link acortado"

Resaltar las frases en el propio mensaje es lo más fuerte para la demo: se entiende en 3 segundos.

### 2.2 Verificador de links

Si el mensaje tiene links (o la persona pega uno suelto), se analiza:

- Dominios que imitan a otros: `rnercadopago.com` ("rn" parece "m"), `mercadopago-seguro.com`, etc.
- Acortadores que esconden el destino real (bit.ly, tinyurl…)
- Comparación contra una lista de dominios oficiales (bancos, billeteras, organismos)

Se hace con lógica propia, **sin depender de APIs externas**.

### 2.3 Pausa antes de actuar

Para situaciones donde no hay un mensaje para pegar (por ejemplo, una llamada). Arranca con una pregunta:

> **¿Qué te están pidiendo?** 💸 Plata · 🔢 Un código · 🪪 Tus datos · 🔗 Hacer clic en algo

Según la respuesta, 3 o 4 preguntas rápidas ("¿te apuran?", "¿te contactaron ellos a vos?") y un **semáforo** con qué hacer.

- Ataca la **urgencia**, que es el arma principal del estafador.
- Es un árbol de decisiones en un JSON: **no necesita IA**, cero riesgo técnico.

### 2.4 Red de confianza

Después de cualquier análisis, un botón: **"Consultar con mi persona de confianza"**.

- La persona guarda el número de un familiar o amigo (ej: el nieto de una abuela).
- El botón abre WhatsApp con el mensaje sospechoso y el resultado del análisis, listo para enviar.
- Se implementa con un link `https://wa.me/<número>?text=<mensaje>`: **sin backend, sin cuentas, sin base de datos**. El número se guarda solo en el navegador de la persona.

La herramienta no reemplaza a la gente: la conecta con alguien de confianza. Muy potente para adultos mayores.

### 2.5 Extra (si sobra tiempo): análisis de capturas

Subir una captura de pantalla en vez de pegar texto. Los modelos de IA con visión pueden leer la imagen directamente.

---

## 3. El corazón: catálogo de señales

Un único archivo (JSON) con todas las señales de alerta. Lo usan el analizador, el verificador de links y la pausa antes de actuar para explicar.

```json
{
  "id": "urgencia",
  "nombre": "Urgencia artificial",
  "ejemplos": ["tu cuenta se bloquea en 24hs", "último aviso", "respondé ya"],
  "explicacion": "Los estafadores te apuran para que no te detengas a pensar.",
  "consejo": "Ninguna entidad seria te bloquea la cuenta por no responder un mensaje. Tomate tu tiempo."
}
```

Se define una vez y se reutiliza en todo, como un sistema de diseño.

Señales iniciales a cubrir: urgencia, pedido de datos o claves, pedido de códigos, pedido de dinero, premios o sorteos inesperados, suplantación de identidad (familiar, banco, organismo), links sospechosos, errores de ortografía o tono raro, cambio de número, presión emocional.

---

## 4. Arquitectura

```
[ Frontend (web) ] ──► [ Función serverless ] ──► [ API de IA ]
        │                        │
        │                        └─► si falla: motor de reglas propio
        │
        ├─► Verificador de links (lógica local)
        ├─► Pausa antes de actuar (árbol en JSON)
        └─► Red de confianza (link a WhatsApp)
```

### Análisis doble: IA + reglas

- **IA vía API:** entiende mensajes redactados de mil formas distintas. Le pedimos que responda en **JSON** con las frases sospechosas y el id de la señal del catálogo.
- **Reglas propias** (palabras clave y patrones): rápidas, predecibles y funcionan si la API falla.

Si la API se cae en plena demo (el wifi de las hackatones es un clásico), **el sistema sigue respondiendo con las reglas**.

### Stack sugerido

- **Frontend:** lo que el equipo maneje mejor (HTML/CSS/JS alcanza; React/Vite si lo dominamos)
- **Backend:** función serverless en Vercel o Netlify
- **IA:** cualquier API con buen manejo de español y salida JSON (revisar cuál tiene créditos gratis)
- **Deploy:** Vercel o Netlify

### Seguridad y privacidad (el jurado lo va a mirar)

- **La API key nunca va en el frontend** (se ve con F12). Por eso existe la función serverless.
- **No guardamos los mensajes analizados**: pueden tener datos personales.
- El número de la persona de confianza queda solo en el navegador del usuario.
- Mensaje claro en la interfaz: *"Esto es una ayuda, no un veredicto. Ante la duda, no actúes."*

---

## 5. Prioridades

Si el tiempo aprieta, se corta de abajo para arriba:

| # | Función | Riesgo técnico | ¿Obligatoria? |
|---|---|---|---|
| 1 | Analizador que explica | Medio | ✅ Sí o sí |
| 2 | Verificador de links | Bajo | ✅ |
| 3 | Pausa antes de actuar | Muy bajo | ✅ |
| 4 | Red de confianza | Muy bajo | ✅ |
| 5 | Análisis de capturas | Medio | ⭐ Extra |

---

## 6. División del equipo (a ajustar según perfiles)

| Persona | Rol | Tareas |
|---|---|---|
| A | Frontend y diseño | Interfaz, resaltado de frases, semáforo, responsive, red de confianza |
| B | Backend e IA | Función serverless, prompt, respuesta en JSON, capturas (extra) |
| C | Reglas y links | Motor de reglas (plan B), verificador de links, lógica del árbol de la pausa |
| D | Contenido y pitch | Catálogo de señales, preguntas de la pausa, mensajes de ejemplo, presentación |

---

## 7. Plan de 24 horas

| Horas | Qué hacemos |
|---|---|
| 0–2 | Cerrar alcance, crear repo, **desplegar un "hola mundo" ya** para que el deploy no nos sorprenda. D arranca el catálogo de señales. |
| 2–10 | Cada uno arma su parte: analizador (A+B), reglas y links (C), catálogo y árbol de la pausa (D). |
| 10–14 | Integración y pruebas con mensajes reales de estafas argentinas. |
| 14–18 | Pausa antes de actuar + red de confianza. Capturas si vamos bien. |
| 18–21 | Pulido, pruebas en celular, bugs. |
| 21–24 | **Código congelado.** Ensayo de pitch y demo. |

Congelar el código 3 horas antes duele, pero el cambio "rapidito" de último momento es el que rompe la demo.

---

## 8. Riesgos y cómo los manejamos

| Riesgo | Cómo lo manejamos |
|---|---|
| Falsos positivos (marca como estafa algo legítimo) | Hablar de "nivel de riesgo", no de veredicto. Explicar siempre el porqué. |
| La API falla o no hay internet | Motor de reglas como plan B. |
| Costo de la API | Créditos gratis; para la demo alcanza con muy poco. |
| No llegamos con todo | Prioridades claras (sección 5). |
| API key expuesta | Solo en variables de entorno del serverless. |

---

## 9. La demo

1. Arrancar con una historia corta: *"A la abuela de alguien le llega esto…"* y mostrar un "Hola ma, cambié de número".
2. Pegarlo en el analizador → frases resaltadas + explicación.
3. Tocar "Consultar con mi persona de confianza" → se abre WhatsApp listo para enviar.
4. Mostrar un link trucho de Mercado Pago en el verificador.
5. Mostrar la pausa antes de actuar con el caso de una llamada del "banco".
6. **Invitar al jurado a pegar un mensaje propio.** Eso impresiona.

Tener mensajes de ejemplo preparados por si algo falla.
