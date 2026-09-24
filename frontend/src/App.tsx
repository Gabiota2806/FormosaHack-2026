import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  ShieldCheck, 
  MessageSquare, 
  Radio, 
  ShieldAlert, 
  Lock, 
  QrCode, 
  CheckCircle
} from 'lucide-react';
import { api } from './services/api';
import { ChatAssistant } from './components/chat/ChatAssistant';
import { ThreatRadar } from './components/radar/ThreatRadar';
import { SosModal } from './components/sos/SosModal';

export function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'radar' | 'auth'>('chat');
  const [sosModalOpen, setSosModalOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Toaster position="top-right" richColors />

      {/* Header de Navegación */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              CG
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">CiberGuardián</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono hidden sm:inline-block">
                FormosaHack 2026
              </span>
            </div>
          </div>

          {/* Selector de Vistas y Botón de Pánico */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Asistente
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-4 h-4" /> Radar Comunitario
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'auth'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> 2FA & Auth
            </button>

            <button
              onClick={() => setSosModalOpen(true)}
              className="ml-1 sm:ml-3 px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5 animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              SOS
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'chat' && (
          <ChatAssistant
            onOpenSos={() => setSosModalOpen(true)}
            onReportIncident={() => {
              setActiveTab('radar');
              toast.info('Navegando al Radar para visualizar las amenazas reportadas.');
            }}
          />
        )}

        {activeTab === 'radar' && <ThreatRadar />}

        {activeTab === 'auth' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                Segundo Factor de Autenticación (2FA TOTP)
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Módulo de seguridad perimetral obligatorio para administradores y moderadores del sistema.
              </p>

              {!isLoggedIn ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Registro */}
                  <form onSubmit={handleRegister} className="space-y-3">
                    <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Registrar Administrador
                    </h3>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                    >
                      Registrar
                    </button>
                  </form>

                  {/* Login */}
                  <form onSubmit={handleLogin} className="space-y-3">
                    <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      Iniciar Sesión
                    </h3>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md"
                    >
                      Iniciar Sesión
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    Sesión iniciada correctamente con token JWT asimétrico.
                  </div>

                  {!qrCodeData ? (
                    <button
                      onClick={handleSetup2FA}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md"
                    >
                      <QrCode className="w-4 h-4" /> Enrolar Segundo Factor (2FA TOTP)
                    </button>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                      <p className="text-xs text-slate-300">
                        Escaneá el código QR con Google Authenticator o Authy:
                      </p>
                      <img src={qrCodeData} alt="Código QR 2FA" className="mx-auto rounded-xl border border-slate-800 p-2 bg-white" />
                      <code className="text-[11px] font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-lg inline-block">
                        {totpSecret}
                      </code>

                      <form onSubmit={handleVerify2FA} className="max-w-xs mx-auto flex gap-2 pt-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-base text-white"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs"
                        >
                          Verificar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal SOS Global */}
      <SosModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />
    </div>
  );
}

export default App;
