/**
 * Registra public/sw.js, necesario para instalar la app y recibir mensajes compartidos.
 * Solo en el build de producción: en desarrollo interferiría con la recarga de Vite.
 * Los navegadores solo aceptan service workers en contextos seguros (HTTPS o localhost).
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la app funciona igual; solo no se puede instalar.
    });
  });
}
