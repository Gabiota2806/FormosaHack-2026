import { useEffect, useRef, useState } from 'react';
import { 
  LogIn, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  LogOut, 
  KeyRound, 
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChatWidget } from '../widget/chatWidgetContext';

interface UserDropdownProps {
  onOpenAuth: () => void;
  onOpenSecurity: () => void;
}

export function UserDropdown({ onOpenAuth, onOpenSecurity }: UserDropdownProps) {
  const { user, isAuthenticated, totpStatus, logout } = useAuth();
  const { openChat } = useChatWidget();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Si no está autenticado, renderizar el botón de acceso dinámico
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={onOpenAuth}
        aria-label="Ingresar al sistema"
        className="px-3 sm:px-3.5 py-1.5 min-h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-brand-400"
      >
        <LogIn className="w-4 h-4 text-brand-400" aria-hidden="true" />
        <span>Ingresar</span>
      </button>
    );
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : 'U';

  const handleOpenHistory = () => {
    setIsOpen(false);
    openChat({ view: 'history' });
  };

  const handleOpenSecurity = () => {
    setIsOpen(false);
    onOpenSecurity();
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Botón píldora con avatar y nombre */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menú de usuario: ${user?.name || user?.email || 'Mi cuenta'}`}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 min-h-9 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-slate-200 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-brand-400"
      >
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-sky-600 flex items-center justify-center text-white text-[11px] font-bold shadow-sm shrink-0">
          {initials || <UserIcon className="w-3.5 h-3.5" aria-hidden="true" />}
        </div>
        <span className="text-xs font-semibold max-w-[100px] sm:max-w-[130px] truncate hidden sm:inline text-left">
          {user?.name || user?.email || 'Mi Cuenta'}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl shadow-black/60 p-2 z-50 animate-fade-up text-slate-200"
        >
          {/* Cabecera del usuario */}
          <div className="px-3 py-2.5 border-b border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-xs text-white truncate">{user?.name || 'Usuario'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-brand-300 border border-brand-500/20">
                {user?.role || 'user'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>

            {/* Badge de estado 2FA */}
            <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/80">
              <span className="text-slate-400">Segundo factor (2FA):</span>
              {totpStatus.enabled ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  2FA Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  2FA Inactivo
                </span>
              )}
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleOpenHistory}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <History className="w-4 h-4 text-brand-400 shrink-0" aria-hidden="true" />
              <span>Mis Consultas Guardadas</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleOpenSecurity}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition-colors text-left"
            >
              <KeyRound className="w-4 h-4 text-brand-400 shrink-0" aria-hidden="true" />
              <span>Seguridad y 2FA TOTP</span>
            </button>
          </div>

          {/* Separador y Cerrar Sesión */}
          <div className="pt-1 border-t border-slate-800">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
