# 🛡️ CiberGuardián — Extensión de Navegador Manifest V3

Extensión de navegador ligera y proactiva diseñada para la protección en tiempo real contra phishing, estafas digitales y suplantación de identidad bancaria e institucional en la Provincia de Formosa. Prototipo desarrollado para **FormosaHack 2026 (Ultra Hackatón de 24 Horas)**.

---

## 🚀 Características Principales

1. **Menú Contextual de 1-Clic (`contextMenus`)**:
   - Audita cualquier fragmento de texto sospechoso (mensajes de WhatsApp Web, correos o publicaciones) o enlaces dudosos con un simple clic derecho: *"Analizar con CiberGuardián"*.
   - Clasifica el nivel de riesgo y actualiza dinámicamente el badge del icono (`ALTO`, `MED`, `BAJO` o `!`).

2. **Popup Reactivo de Diagnóstico (React 19 + Tailwind CSS + Lucide Icons)**:
   - Semáforo visual de alerta (Rojo / Amarillo / Verde).
   - Identificación de entidades suplantadas (*Banco Formosa*, *Tarjeta Chigüé*, *REFSA*, *ANSES*, etc.).
   - Recomendaciones prácticas inmediatas ("Qué hacer" y "Qué no hacer").
   - Botón CTA de Deep-link: *"Abrir investigación completa en CiberGuardián"* redirigiendo a la plataforma central (`http://localhost:8000/?analyze=...`).

3. **Escudo Proactivo contra Phishing (Content Script + Shadow DOM)**:
   - Inspecciona formularios en busca de campos sensibles (`password`, tokens OTP, PIN de cajero, CBU/CVU).
   - **Whitelist Oficial de Formosa e Instituciones**: Verifica dominios legítimos (`bancoformosa.com.ar`, `redlink.com.ar`, `anses.gob.ar`, `formosa.gob.ar`, `bna.com.ar`).
   - Si un dominio desconocido o no listado solicita contraseñas o tokens, inyecta inmediatamente una advertencia flotante encapsulada en **Shadow DOM cerrado** (`mode: "closed"`), garantizando aislamiento absoluto de estilos CSS sin alterar la página anfitriona.
   - Descarte persistente por pestaña activa (`sessionStorage`).

4. **Motor Heurístico con Fallback Offline**:
   - Si el backend de FastAPI no responde o el usuario pierde conectividad, el cliente activa automáticamente un motor heurístico local offline basado en expresiones regulares de vectores de ataque locales, garantizando protección ininterrumpida.

5. **Privacidad y Mínimo Privilegio**:
   - Solo declara los permisos indispensables: `contextMenus`, `activeTab` y `storage`.
   - Cero recolección de historial de navegación o telemetría invasiva.

---

## 📋 Requisitos Previos

- **Node.js**: v20 o superior.
- **npm**: v10 o superior.
- **Navegador Chromium**: Google Chrome, Brave, Microsoft Edge, Opera o Chromium.

---

## 🛠️ Compilación y Empaquetado

Para compilar la extensión y generar el directorio de distribución `dist/`:

```bash
# 1. Posicionarse en el directorio de la extensión
cd extension

# 2. Instalar dependencias (si no se han instalado previamente)
npm install

# 3. Compilar TypeScript y empaquetar con Vite
npm run build
```

El comando generará la carpeta `extension/dist/` conteniendo:
- `manifest.json`: Manifiesto de extensión Manifest V3 configurado.
- `service-worker.js`: Script de fondo del Service Worker.
- `content-script.js`: Script inyectado para detección de phishing y Shadow DOM.
- `popup.html` y bundles en `assets/`: Interfaz compacta en React 19.
- `icons/`: Iconografía institucional en 16x16, 48x48 y 128x128 píxeles.

---

## 🌐 Guía de Carga Local Descomprimida en Navegadores Chromium

Sigue estos sencillos pasos para cargar la extensión en tu navegador:

1. **Abrir la página de Extensiones**:
   - En **Google Chrome**: Ingresa a `chrome://extensions` en la barra de direcciones.
   - En **Brave**: Ingresa a `brave://extensions`.
   - En **Microsoft Edge**: Ingresa a `edge://extensions`.

2. **Habilitar el Modo de Desarrollador**:
   - En la esquina superior derecha, activa el interruptor **"Modo de desarrollador"** (*Developer mode*).

3. **Cargar la Extensión**:
   - Haz clic en el botón **"Cargar descomprimida"** (*Load unpacked*) en la barra superior.
   - En el explorador de archivos, selecciona la carpeta:
     ```text
     /mnt/Datos/Datos/Documentos/FormosaHack/extension/dist
     ```
   - Haz clic en **"Seleccionar carpeta"**.

4. **Fijar en la Barra de Herramientas**:
   - Haz clic en el icono de rompecabezas (Extensiones) junto a la barra de direcciones del navegador y presiona el pin 📌 junto a **CiberGuardián - Seguridad Formosa** para tener acceso rápido al popup.

---

## 🎯 Guion de Demostración para el Pitch ante el Jurado (Demo en Vivo)

### Caso de Prueba 1: Menú Contextual en 1-Clic
1. Abre cualquier página web (o WhatsApp Web).
2. Selecciona un texto simulando una estafa típica de la zona:
   > *"Banco Formosa: Detectamos un acceso sospechoso a su cuenta. Ingrese su clave y token inmediatamente para evitar el bloqueo definitivo."*
3. Haz clic derecho sobre el texto seleccionado y presiona **"Analizar con CiberGuardián"**.
4. **Resultado**: El badge de la extensión en la barra del navegador cambiará instantáneamente a color rojo con el texto **`ALTO`**.

### Caso de Prueba 2: Diagnóstico en Popup y Deep-link al Webapp
1. Haz clic en el icono de CiberGuardián en la barra de navegación.
2. Observa el popup:
   - Nivel de riesgo calculado (95% - Riesgo Alto).
   - Entidad suplantada identificada: **Banco Formosa**.
   - Vector detectado: **WHATSAPP**.
   - Acciones inmediatas y qué evitar.
3. Haz clic en el botón **"Abrir investigación completa en CiberGuardián"**.
4. **Resultado**: Se abrirá una nueva pestaña redirigiendo a la plataforma web (`http://localhost:8000/?analyze=...`) precargando el análisis detallado y el mapa de calor de incidentes.

### Caso de Prueba 3: Escudo Proactivo de Phishing (Shadow DOM)
1. Abre un archivo HTML o sitio simulado local que no pertenezca a la whitelist oficial (por ejemplo, `http://localhost:8000` o cualquier dominio ajeno a `bancoformosa.com.ar`).
2. Agrega o inspecciona un formulario que solicite una contraseña (`<input type="password">`) o token.
3. **Resultado**: Inmediatamente aparecerá un banner flotante superior con borde rojo advirtiendo:
   > *"⚠️ Advertencia de Seguridad CiberGuardián: Este sitio web no pertenece a la lista de entidades oficiales verificadas de Formosa ni a bancos autorizados. Evite ingresar contraseñas, PIN o tokens bancarios."*
4. Haz clic en **"Entendido, continuar"**: la advertencia se ocultará y no volverá a molestar durante la sesión actual.

---

## 🧪 Pruebas Automatizadas

La extensión cuenta con una suite integral de 9 suites y 90 pruebas unitarias en **Vitest** con simulación completa de las Chrome APIs (`chrome.contextMenus`, `chrome.storage.local`, `chrome.tabs`, `chrome.runtime`, `chrome.action`):

```bash
# Ejecutar la suite completa de pruebas
cd extension
npm test

# Verificación de tipos con TypeScript (modo estricto)
npm run type-check
```

---

## 📁 Arquitectura del Código

```text
extension/
├── manifest.json              # Configuración Manifest V3
├── package.json               # Scripts y dependencias (React 19, Lucide, Vitest)
├── vite.config.ts             # Configuración Rollup para SW, Content Script y Popup
├── tsconfig.json              # TypeScript estricto ES2022
├── public/                    # Iconografía institucional
├── src/
│   ├── background/            # Service Worker de fondo y contextMenus
│   ├── content/               # Detección de phishing, Whitelist y Shadow DOM
│   ├── popup/                 # UI de diagnóstico en React 19 + Tailwind CSS
│   ├── services/              # Cliente API Core con fallback offline
│   ├── types/                 # Interfaces TypeScript y tipados de Chrome
│   └── utils/                 # Validaciones y sanitización de entradas
└── test/                      # Suite completa Vitest
    ├── mocks/chrome.ts        # Mock tipado de Chrome Extension APIs
    ├── background.test.ts     # Pruebas de Service Worker y contextMenus
    ├── content.test.ts        # Pruebas de detección de formularios y Whitelist
    ├── api-client.test.ts     # Pruebas de API client y motor offline
    ├── form-detector.test.ts  # Pruebas del detector reactivo
    ├── popup.test.tsx         # Pruebas de componentes React UI
    ├── service-worker.test.ts # Pruebas del ciclo de vida de fondo
    ├── validation.test.ts     # Pruebas de validación de caracteres
    ├── warning-banner.test.ts # Pruebas de Shadow DOM y dismiss
    └── whitelist.test.ts      # Pruebas de verificación de dominios
```
