import { useCallback, useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  House,
  ShieldCheck, 
  Radio, 
  ShieldAlert, 
  Lock, 
  QrCode, 
  CheckCircle
} from 'lucide-react';
import { api } from './services/api';
import { ThreatRadar } from './components/radar/ThreatRadar';
import { SosModal } from './components/sos/SosModal';
import { LandingPage } from './components/landing/LandingPage';
import type { LandingAction } from './components/landing/types';
import { ElderlyModeToggle } from './components/elderly/ElderlyModeToggle';
import { ElderlyHomeView } from './components/elderly/ElderlyHomeView';
import { useElderlyMode } from './components/elderly/elderlyMode';
import { clearShareParams, readSharedMessage } from './pwa/shareTarget';
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
    <ChatWidgetProvider initialMessage={sharedMessage?.text}>
      <AppShell sharedMessage={sharedMessage} />
    </ChatWidgetProvider>
  );
}

function AppShell({ sharedMessage }: { sharedMessage: SharedMessage | null }) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const openSos = useCallback(() => setSosModalOpen(true), []);
  const { openChat, closeChat } = useChatWidget();

  const { enabled: elderlyMode } = useElderlyMode();
  // Modo Abuelo: sin la pestaña técnica de 2FA ni el Radar; el inicio pasa a ser la vista de 3 botones.
  // En celular tampoco va "Inicio" (el logo ya lleva ahí): con la letra de 22px no entra junto al logo.
  const navItems = elderlyMode ? NAV_ITEMS.filter(({ id }) => id !== 'auth' && id !== 'radar') : NAV_ITEMS;

  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    // La landing es larga: al cambiar de sección se arranca desde arriba.
    window.scrollTo({ top: 0 });
  };

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

  // Estado de 2FA & Auth
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', {
        name: userName,
        email: userEmail,
        password: userPassword,
      });
      toast.success('Usuario registrado con éxito. Ahora podés iniciar sesión.');
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/auth/login', {
        email: userEmail,
        password: userPassword,
      });
      if (res.data.access_token) {
        localStorage.setItem('access_token', res.data.access_token);
        setIsLoggedIn(true);
        toast.success('Sesión iniciada correctamente');
      }
    } catch {}
  };

  const handleSetup2FA = async () => {
    try {
      const res = await api.post('/api/auth/2fa/setup');
      setQrCodeData(res.data.qr_code_base64);
      setTotpSecret(res.data.secret);
      toast.success('Código QR generado. Escanealo con Google Authenticator.');
    } catch {}
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/2fa/verify', { code: verifyCode });
      toast.success('¡Segundo Factor (2FA) activado exitosamente!');
      setQrCodeData(null);
    } catch {}
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
            <span className="font-extrabold text-base sm:text-lg tracking-tight uppercase truncate">
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

        {activeTab === 'radar' && <ThreatRadar />}

        {activeTab === 'auth' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <Card tone="dark" className="rounded-3xl p-6 sm:p-8 animate-fade-up">
              <div className="flex items-center gap-3 mb-6">
                <IconBadge icon={Lock} tone="solid" size="md" />
                <div>
                  <h2 className="text-xl font-bold text-white">Segundo Factor de Autenticación (2FA TOTP)</h2>
                  <p className="text-xs text-slate-400">
                    Módulo de seguridad perimetral obligatorio para administradores y moderadores del sistema.
                  </p>
                </div>
              </div>

              {!isLoggedIn ? (
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
                    <Button type="submit" className="w-full">
                      Iniciar Sesión
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/40 text-brand-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" aria-hidden="true" />
                    Sesión iniciada correctamente con token JWT asimétrico.
                  </div>

                  {!qrCodeData ? (
                    <Button icon={QrCode} onClick={handleSetup2FA}>
                      Enrolar Segundo Factor (2FA TOTP)
                    </Button>
                  ) : (
                    <Card className="p-5 text-center space-y-4">
                      <p className="text-sm text-slate-600">
                        Escaneá el código QR con Google Authenticator o Authy:
                      </p>
                      <img src={qrCodeData} alt="Código QR 2FA" className="mx-auto rounded-xl border border-slate-200 p-2 bg-white" />
                      <code className="text-[11px] font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block">
                        {totpSecret}
                      </code>

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
