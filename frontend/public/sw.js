// Service worker mínimo de CiberGuardián.
//
// Existe para que la app sea instalable y aparezca en el menú "Compartir" del celular
// (Web Share Target). NO guarda la app en caché a propósito: así cada deploy se ve al
// instante y nunca queda una versión vieja en pantalla durante la demo.
//
// Sin conexión, en lugar de la pantalla de error del navegador, muestra las líneas de
// emergencia: los enlaces tel: funcionan aunque no haya internet.
// Mantener sincronizado con src/components/sos/emergencyContacts.ts.

const EMERGENCY_LINES = [
  ['Banco Formosa (Bloqueo 24hs)', '0800-777-2262'],
  ['Tarjeta Chigüé', '0810-888-2444'],
  ['Red Link (Central de Bloqueos)', '0800-888-5465'],
  ['Banelco', '011-4320-5000'],
  ['Policía de Formosa (Delitos Informáticos)', '911'],
];

const OFFLINE_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CiberGuardián — Sin conexión</title>
<style>
  body { margin: 0; font: 18px/1.5 system-ui, sans-serif; background: #212c37; color: #f5f8fa; }
  main { max-width: 32rem; margin: 0 auto; padding: 1.5rem 1rem; }
  h1 { font-size: 1.4rem; margin: 0 0 .5rem; }
  p { color: #d3dde5; }
  a { display: block; margin: .75rem 0; padding: 1rem; border-radius: 1rem; background: #dc2626; color: #fff;
      font-weight: 700; text-decoration: none; }
  a span { display: block; font-weight: 400; font-family: monospace; }
</style>
</head>
<body>
<main>
  <h1>Sin conexión a internet</h1>
  <p>CiberGuardián necesita internet para analizar mensajes. Si estás en una emergencia, igual podés llamar:</p>
  ${EMERGENCY_LINES.map(([name, phone]) =>
    `<a href="tel:${phone.replace(/[^\d+]/g, '')}">${name}<span>${phone}</span></a>`).join('\n  ')}
</main>
</body>
</html>`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo las navegaciones: los assets y la API van directo a la red, sin pasar por acá.
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request).catch(
      () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    ),
  );
});
