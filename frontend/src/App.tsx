import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  House,
  ShieldCheck, 
  Radio, 
  ShieldAlert, 
  Lock, 
  QrCode, 
  CheckCircle,
  LogOut
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThreatRadar } from './components/radar/ThreatRadar';
import { SosModal } from './components/sos/SosModal';
import { LandingPage } from './components/landing/LandingPage';
import type { LandingAction } from './components/landing/types';
import { ElderlyModeToggle } from './components/elderly/ElderlyModeToggle';
import { ElderlyHomeView } from './components/elderly/ElderlyHomeView';
import { useElderlyMode } from './components/elderly/elderlyMode';
import { clearShareParams, readSharedMessage } from './pwa/shareTarget';
import { clearDeepLink, parseRadarDeepLink } from './pwa/deepLink';
import { Button } from './components/ui/Button';
import { Card } from './components/ui/Card';
import { IconBadge } from './components/ui/IconBadge';
import { ChatWidget } from './components/widget/ChatWidget';
import { ChatWidgetProvider } from './components/widget/ChatWidgetProvider';
import { useChatWidget } from './components/widget/chatWidgetContext';
import type { SharedMessage } from './pwa/shareTarget';

const AUTH_INPUT_CLASSES =
  'w-full px-3 py-2 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';

// El asistente no es una pestaña: vive en el widget flotante, disponible en todas las secciones.
type Tab = 'home' | 'radar' | 'auth';

const NAV_ITEMS: { id: Tab; label: string; icon: typeof House }[] = [
  { id: 'home', label: 'Inicio', icon: House },
  { id: 'radar', label: 'Radar Comunitario', icon: Radio },
  { id: 'auth', label: '2FA & Auth', icon: Lock },
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
  // Modo Abuelo: sin la pestaña técnica de 2FA ni el Radar; el inicio pasa a ser la vista de 3 botones.
  // En celular tampoco va "Inicio" (el logo ya lleva ahí): con la letra de 22px no entra junto al logo.
  const navItems = elderlyMode ? NAV_ITEMS.filter(({ id }) => id !== 'auth' && id !== 'radar') : NAV_ITEMS;

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

  // Estado de 2FA & Auth desacoplado en AuthContext
  const {
    user,
    isAuthenticated,
    is2FAPending,
    totpStatus,
    login,
    register,
    logout,
    setup2FA,
    verify2FA,
  } = useAuth();

  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await register(userName, userEmail, userPassword);
    if (ok) {
      setUserName('');
      setUserPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(userEmail, userPassword, totpCode || undefined);
  };

  const handleSetup2FA = async () => {
    await setup2FA();
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verify2FA(verifyCode);
    if (ok) {
      setVerifyCode('');
    }
  };

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

        {activeTab === 'auth' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <Card tone="dark" className="rounded-3xl p-6 sm:p-8 animate-fade-up">
              <div className="flex items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <IconBadge icon={Lock} tone="solid" size="md" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Segundo Factor de Autenticación (2FA TOTP)</h2>
                    <p className="text-xs text-slate-400">
                      Módulo de seguridad perimetral obligatorio para administradores y moderadores del sistema.
                    </p>
                  </div>
                </div>
                {isAuthenticated && (
                  <Button variant="ghost" icon={LogOut} onClick={logout} className="text-xs shrink-0">
                    Cerrar Sesión
                  </Button>
                )}
              </div>

              {!isAuthenticated ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Registro */}
                  <form onSubmit={handleRegister} className="space-y-3">
                    <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Registrar Administrador
                    </h3>
                    <input
                      type="text"
                      aria-label="Nombre completo"
                      placeholder="Nombre completo"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      className={AUTH_INPUT_CLASSES}
                    />
                    <input
                      type="email"
                      aria-label="Correo electrónico"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className={AUTH_INPUT_CLASSES}
                    />
                    <input
                      type="password"
                      aria-label="Contraseña"
                      placeholder="Contraseña"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className={AUTH_INPUT_CLASSES}
                    />
                    <Button type="submit" variant="ghost" className="w-full border border-slate-600">
                      Registrar
                    </Button>
                  </form>

                  {/* Login */}
                  <form onSubmit={handleLogin} className="space-y-3">
                    <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Iniciar Sesión
                    </h3>
                    <input
                      type="email"
                      aria-label="Correo electrónico"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className={AUTH_INPUT_CLASSES}
                    />
                    <input
                      type="password"
                      aria-label="Contraseña"
                      placeholder="Contraseña"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className={AUTH_INPUT_CLASSES}
                    />
                    {is2FAPending && (
                      <input
                        type="text"
                        aria-label="Código 2FA (6 dígitos)"
                        placeholder="Código 2FA (6 dígitos)"
                        maxLength={6}
                        value={totpCode}
                        onChange={(e) => setTotpCode(e.target.value)}
                        required
                        className={`${AUTH_INPUT_CLASSES} border-brand-400 font-mono`}
                      />
                    )}
                    <Button type="submit" className="w-full">
                      {is2FAPending ? 'Validar Código 2FA' : 'Iniciar Sesión'}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/40 text-brand-300 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" aria-hidden="true" />
                      <span>
                        Sesión iniciada como <strong>{user?.name || user?.email || 'Administrador'}</strong> ({user?.role || 'user'}).
                      </span>
                    </div>
                    {totpStatus.enabled && (
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[11px] font-semibold">
                        2FA Activo
                      </span>
                    )}
                  </div>

                  {!totpStatus.qrCode ? (
                    <Button icon={QrCode} onClick={handleSetup2FA}>
                      {totpStatus.enabled ? 'Reconfigurar Segundo Factor (2FA TOTP)' : 'Enrolar Segundo Factor (2FA TOTP)'}
                    </Button>
                  ) : (
                    <Card className="p-5 text-center space-y-4">
                      <p className="text-sm text-slate-600">
                        Escaneá el código QR con Google Authenticator o Authy:
                      </p>
                      <img src={totpStatus.qrCode} alt="Código QR 2FA" className="mx-auto rounded-xl border border-slate-200 p-2 bg-white" />
                      {totpStatus.secret && (
                        <code className="text-[11px] font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                          {totpStatus.secret}
                        </code>
                      )}

                      <form onSubmit={handleVerify2FA} className="max-w-xs mx-auto flex gap-2 pt-2">
                        <input
                          type="text"
                          aria-label="Código de 6 dígitos"
                          maxLength={6}
                          placeholder="000000"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 bg-white border border-slate-300 rounded-xl text-center font-mono text-base text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                          required
                        />
                        <Button type="submit">Verificar</Button>
                      </form>
                    </Card>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
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

      {/* Modal SOS Global (z-50, por encima del widget) */}
      <SosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </div>
  );
}

export default App;
