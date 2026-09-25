import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  House,
  ShieldCheck, 
  Radio, 
  ShieldAlert, 
} from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ThreatRadar } from './components/radar/ThreatRadar';
import { SosModal } from './components/sos/SosModal';
import { LandingPage } from './components/landing/LandingPage';
import type { LandingAction } from './components/landing/types';
import { ElderlyModeToggle } from './components/elderly/ElderlyModeToggle';
import { ElderlyHomeView } from './components/elderly/ElderlyHomeView';
import { useElderlyMode } from './components/elderly/elderlyMode';
import { clearShareParams, readSharedMessage } from './pwa/shareTarget';
import { clearDeepLink, parseRadarDeepLink } from './pwa/deepLink';
import { ChatWidget } from './components/widget/ChatWidget';
import { ChatWidgetProvider } from './components/widget/ChatWidgetProvider';
import { useChatWidget } from './components/widget/chatWidgetContext';
import { AuthModal, type AuthTab } from './components/auth/AuthModal';
import { UserDropdown } from './components/auth/UserDropdown';
import type { SharedMessage } from './pwa/shareTarget';

// El asistente no es una pestaña: vive en el widget flotante, disponible en todas las secciones.
type Tab = 'home' | 'radar';

const NAV_ITEMS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Inicio', icon: House },
  { id: 'radar', label: 'Radar Comunitario', icon: Radio },
];

export function App() {
  // Mensaje compartido desde WhatsApp u otra app (Web Share Target, ver manifest.webmanifest):
  // el widget arranca abierto analizándolo.
  const [sharedMessage] = useState(() => readSharedMessage(window.location.search));

  return (
    <AuthProvider>
      <ChatWidgetProvider initialMessage={sharedMessage?.text}>
        <AppShell sharedMessage={sharedMessage} />
      </ChatWidgetProvider>
    </AuthProvider>
  );
}

function AppShell({ sharedMessage }: { sharedMessage: SharedMessage | null }) {
  // Enlace profundo de una notificación push ("/#radar?incident_id=15"): abre el Radar destacándola.
  const [initialLink] = useState(() => parseRadarDeepLink(window.location.hash));
  const [activeTab, setActiveTab] = useState<Tab>(() => (initialLink ? 'radar' : 'home'));
  const [radarHighlight, setRadarHighlight] = useState<number | null>(() => initialLink?.incidentId ?? null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const openSos = useCallback(() => setSosModalOpen(true), []);
  const { openChat, closeChat } = useChatWidget();

  const { enabled: elderlyMode } = useElderlyMode();
  // Modo Abuelo: sin el Radar; el inicio pasa a ser la vista de 3 botones.
  // En celular tampoco va "Inicio" (el logo ya lleva ahí): con la letra de 22px no entra junto al logo.
  const navItems = elderlyMode ? NAV_ITEMS.filter(({ id }) => id !== 'radar') : NAV_ITEMS;

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    setRadarHighlight(null);
    // La landing es larga: al cambiar de sección se arranca desde arriba.
    window.scrollTo({ top: 0 });
  };

  // El hash ya procesado se saca de la URL: así la misma alerta vuelve a funcionar si llega de nuevo.
  useEffect(() => {
    if (initialLink) clearDeepLink();
  }, [initialLink]);

  // Notificación tocada con la app ya abierta: el service worker solo cambia el hash.
  useEffect(() => {
    const onHashChange = () => {
      const link = parseRadarDeepLink(window.location.hash);
      if (!link) return;
      clearDeepLink();
      setActiveTab('radar');
      setRadarHighlight(link.incidentId);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleLandingAction = (action: LandingAction) => {
    switch (action) {
      case 'ANALYZE':
        openChat({ entry: 'PREVENCION' });
        break;
      case 'DURING_CALL':
        openChat({ entry: 'DURANTE' });
        break;
      case 'SOS':
        openSos();
        break;
      case 'RADAR':
        navigate('radar');
        break;
    }
  };

  useEffect(() => {
    if (!sharedMessage) return;
    clearShareParams();
    toast.info(
      sharedMessage.truncated
        ? 'Recibimos el mensaje que compartiste. Era muy largo: analizamos la primera parte.'
        : 'Recibimos el mensaje que compartiste. Lo estamos analizando.',
      // id fijo: si el efecto corre dos veces (StrictMode), Sonner no duplica el aviso.
      { id: 'shared-message' },
    );
  }, [sharedMessage]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthTab>('login');

  const openAuth = useCallback((tab: AuthTab = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-brand-500/30">
      {/* Debajo del header (h-16 = 4rem): así los avisos no tapan la navegación ni el SOS.
          En rem para que acompañe al header cuando el Modo Abuelo lo agranda. */}
      <Toaster
        position="top-right"
        richColors
        offset={{ top: '4.75rem', right: '1rem' }}
        mobileOffset={{ top: '4.75rem', right: '0.75rem', left: '0.75rem' }}
      />

      {/* Header de Navegación */}
      <header className="border-b border-slate-800 bg-slate-900/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('home')}
            aria-label="CiberGuardián: ir al inicio"
            title="Ir al inicio"
            className="group flex items-center gap-2.5 min-w-0 rounded-xl -m-1 p-1 focus-visible:outline-2 focus-visible:outline-brand-400"
          >
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-sky-500 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            {/* En Modo Abuelo, en celular, el nombre no entra junto a la navegación: queda el logo solo. */}
            <span
              className={`font-extrabold text-base sm:text-lg tracking-tight uppercase truncate${
                elderlyMode ? ' max-sm:sr-only' : ''
              }`}
            >
              <span className="text-white">Ciber</span>
              <span className="text-brand-400 transition-colors group-hover:text-brand-300">Guardián</span>
            </span>
          </button>

          {/* Selector de Vistas y Botón de Pánico */}
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Secciones">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                aria-label={label}
                title={label}
                className={`relative px-2.5 sm:px-3 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 after:absolute after:inset-x-2 after:-bottom-[13px] after:h-0.5 after:rounded-full after:transition-colors ${
                  elderlyMode && id === 'home' ? 'max-sm:hidden ' : ''
                }${
                  activeTab === id
                    ? 'text-brand-400 after:bg-brand-400'
                    : 'text-slate-300 hover:text-white after:bg-transparent'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}

            <ElderlyModeToggle />

            <UserDropdown
              onOpenAuth={() => openAuth('login')}
              onOpenSecurity={() => openAuth('security')}
            />

            <button
              type="button"
              onClick={openSos}
              aria-haspopup="dialog"
              aria-expanded={sosModalOpen}
              aria-label="SOS: abrir protocolo de emergencia y llamadas a bancos"
              className="ml-1 sm:ml-2 px-4 py-2 min-h-9 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-red-600/25 transition-colors flex items-center gap-1.5 motion-safe:animate-pulse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
            >
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              SOS
            </button>
          </nav>
        </div>
      </header>

      {/* Contenido Principal */}
      {/* pb-28: que el botón flotante del asistente no tape el final de la página */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28">
        {activeTab === 'home' &&
          (elderlyMode ? (
            <ElderlyHomeView onAction={handleLandingAction} />
          ) : (
            <LandingPage onAction={handleLandingAction} />
          ))}

        {activeTab === 'radar' && <ThreatRadar highlightId={radarHighlight} />}
      </main>

      {/* Asistente flotante (z-40), disponible en todas las secciones */}
      <ChatWidget
        onOpenSos={openSos}
        onReportIncident={() => {
          closeChat();
          navigate('radar');
          toast.info('Navegando al Radar para visualizar las amenazas reportadas.');
        }}
      />

      {/* Modal de Autenticación y Seguridad (z-50) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authModalTab}
      />

      {/* Modal SOS Global (z-50, por encima del widget) */}
      <SosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </div>
  );
}

export default App;
