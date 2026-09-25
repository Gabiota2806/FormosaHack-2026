import { useEffect, useId, useState } from 'react';
import { X, LogIn, UserPlus, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { TotpSection } from './TotpSection';

export type AuthTab = 'login' | 'register' | 'security';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: AuthTab;
}

const INPUT_CLASSES =
  'w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';

export function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const titleId = useId();
  const { isAuthenticated, is2FAPending, login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincronizar tab inicial cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Completá tu correo y contraseña.');
      return;
    }
    if (is2FAPending && !totpCode.trim()) {
      toast.error('Ingresá el código 2FA de 6 dígitos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password, totpCode.trim() || undefined);
      if (res.success) {
        setEmail('');
        setPassword('');
        setTotpCode('');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Completá todos los campos para registrarte.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await register(name.trim(), email.trim(), password);
      if (ok) {
        setPassword('');
        setActiveTab('login');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl shadow-black/60 text-slate-100 animate-fade-up"
      >
        {/* Botón de cierre */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-brand-400"
          aria-label="Cerrar ventana de autenticación"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id={titleId} className="text-lg font-bold text-white">
              {activeTab === 'security'
                ? 'Segundo Factor (2FA)'
                : activeTab === 'register'
                ? 'Crear Cuenta'
                : 'Iniciar Sesión'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'security'
                ? 'Protección con Google Authenticator o Authy'
                : 'CiberGuardián · Acceso y seguridad'}
            </p>
          </div>
        </div>

        {/* Pestañas (Tabs) */}
        {!isAuthenticated ? (
          <div className="flex border-b border-slate-800 mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'login'}
              onClick={() => setActiveTab('login')}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'border-brand-400 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'register'}
              onClick={() => setActiveTab('register')}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'border-brand-400 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Registrarse</span>
            </button>
          </div>
        ) : (
          <div className="flex border-b border-slate-800 mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'security'}
              onClick={() => setActiveTab('security')}
              className="flex-1 pb-3 text-sm font-semibold text-center border-b-2 border-brand-400 text-brand-400 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>Configuración 2FA TOTP</span>
            </button>
          </div>
        )}

        {/* Contenido según pestaña */}
        {activeTab === 'security' && (
          <TotpSection onSuccess={() => toast.success('Configuración 2FA actualizada')} />
        )}

        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-login-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="auth-login-email"
                type="email"
                autoComplete="email"
                aria-label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="auth-login-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="auth-login-password"
                type="password"
                autoComplete="current-password"
                aria-label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            {is2FAPending && (
              <div className="pt-2 animate-fade-in space-y-1.5">
                <label htmlFor="auth-login-totp" className="block text-xs font-semibold text-brand-300">
                  Código 2FA de 6 dígitos (Google Authenticator):
                </label>
                <input
                  id="auth-login-totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  aria-label="Código 2FA (6 dígitos)"
                  placeholder="000000"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className={`${INPUT_CLASSES} border-brand-400 font-mono tracking-widest text-center text-lg`}
                />
                <p className="text-[11px] text-slate-400">
                  Tu cuenta requiere verificación de segundo factor para ingresar.
                </p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" icon={LogIn} disabled={isSubmitting} className="w-full">
                {isSubmitting
                  ? 'Verificando...'
                  : is2FAPending
                  ? 'Validar Código 2FA'
                  : 'Iniciar Sesión'}
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-reg-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nombre completo
              </label>
              <input
                id="auth-reg-name"
                type="text"
                autoComplete="name"
                aria-label="Nombre completo"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="auth-reg-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="auth-reg-email"
                type="email"
                autoComplete="email"
                aria-label="Correo electrónico"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            <div>
              <label htmlFor="auth-reg-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Contraseña
              </label>
              <input
                id="auth-reg-password"
                type="password"
                autoComplete="new-password"
                aria-label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASSES}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" icon={UserPlus} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
