import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  ShieldCheck, 
  Layers, 
  Server, 
  Search, 
  Plus, 
  Trash2, 
  QrCode, 
  CheckCircle, 
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { api } from './services/api';
import { ConfirmModal } from './components/ui/ConfirmModal';

interface ResourceItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  location: string;
  created_at: string;
}

export function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'auth' | 'architecture'>('dashboard');
  
  // Estado de recursos
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal de confirmación para Soft Delete
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Modal de nuevo recurso
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('salud');
  const [newLocation, setNewLocation] = useState('Formosa Capital');

  // Estado de 2FA
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  // Cargar recursos del Core Service
  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/core/', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          category: category || undefined,
        },
      });
      setResources(res.data.data);
      setTotalPages(res.data.total_pages);
      setTotalItems(res.data.total);
    } catch {
      // Manejado por interceptor de Axios
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [page, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchResources();
  };

  // Crear recurso
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/core/', {
        title: newTitle,
        description: newDesc,
        category: newCategory,
        location: newLocation,
        status: 'active',
      });
      toast.success('Recurso creado exitosamente');
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      fetchResources();
    } catch {
      // Manejado por interceptor
    }
  };

  // Confirmar eliminación lógica
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await api.delete(`/api/core/${itemToDelete}`);
      toast.success('Registro eliminado lógicamente (Soft Delete aplicado)');
      setDeleteModalOpen(false);
      setItemToDelete(null);
      fetchResources();
    } catch {
      // Manejado por interceptor
    }
  };

  // Auth & 2FA
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/register', {
        name: userName,
        email: userEmail,
        password: userPassword,
      });
      toast.success('Usuario registrado con éxito. Ahora inicie sesión.');
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
        toast.success('Inicio de sesión exitoso');
      }
    } catch {}
  };

  const handleSetup2FA = async () => {
    try {
      const res = await api.post('/api/auth/2fa/setup');
      setQrCodeData(res.data.qr_code_base64);
      setTotpSecret(res.data.secret);
      toast.success('Código QR generado. Escanéelo con Google Authenticator.');
    } catch {}
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/auth/2fa/verify', { code: verifyCode });
      toast.success('¡Segundo Factor (2FA) verificado y activado con éxito!');
      setQrCodeData(null);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              FH
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">FormosaHack 2026</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Microservicios + SDD
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('auth')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'auth'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> 2FA & Auth
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4" /> Arquitectura
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Métricas Superiores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-sm">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-sm font-medium">Registros Totales</span>
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white tracking-tight">{totalItems}</div>
                <span className="text-xs text-slate-500 mt-1 block">Con Soft Delete activo</span>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-sm">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-sm font-medium">Arquitectura</span>
                  <Layers className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-white">Repository Pattern</div>
                <span className="text-xs text-emerald-400 mt-1 block">Capas desacopladas</span>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-sm">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-sm font-medium">Seguridad 2FA</span>
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-white">Google Authenticator</div>
                <span className="text-xs text-indigo-300 mt-1 block">TOTP RFC 6238</span>
              </div>

              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-sm">
                <div className="flex justify-between items-center text-slate-400 mb-2">
                  <span className="text-sm font-medium">API Gateway</span>
                  <Server className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-white">Puerto 8000</div>
                <span className="text-xs text-emerald-400 mt-1 block">Rutas unificadas</span>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por título, descripción o localidad en Formosa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  <option value="salud">Salud</option>
                  <option value="educacion">Educación</option>
                  <option value="produccion">Producción</option>
                  <option value="seguridad">Seguridad</option>
                  <option value="economia">Economía</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition-colors"
                >
                  Buscar
                </button>
              </form>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  onClick={fetchResources}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Refrescar lista"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" /> Nuevo Registro
                </button>
              </div>
            </div>

            {/* Tabla Paginada */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-semibold">ID</th>
                      <th className="px-6 py-4 font-semibold">Título / Entidad</th>
                      <th className="px-6 py-4 font-semibold">Categoría</th>
                      <th className="px-6 py-4 font-semibold">Localidad</th>
                      <th className="px-6 py-4 font-semibold">Estado</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-cyan-400" />
                          Cargando datos desde Core Service...
                        </td>
                      </tr>
                    ) : resources.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          No se encontraron registros. Agregue uno nuevo para comenzar.
                        </td>
                      </tr>
                    ) : (
                      resources.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-500">#{item.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{item.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800/60 capitalize">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-300">{item.location}</td>
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 capitalize">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setItemToDelete(item.id);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Borrado lógico (Soft Delete)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación en Servidor */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
                <span>Página {page} de {totalPages || 1} ({totalItems} registros)</span>
                <div className="flex gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'auth' && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                Segundo Factor de Autenticación (2FA TOTP)
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Requisito obligatorio de la guía del profesor con Google Authenticator / Authy.
              </p>

              {!isLoggedIn ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Registro */}
                  <form onSubmit={handleRegister} className="space-y-4">
                    <h3 className="font-semibold text-slate-200 text-sm">Registrar Usuario</h3>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium"
                    >
                      Registrar
                    </button>
                  </form>

                  {/* Login */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    <h3 className="font-semibold text-slate-200 text-sm">Iniciar Sesión</h3>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium"
                    >
                      Iniciar Sesión
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Sesión iniciada correctamente con token JWT.
                  </div>

                  {!qrCodeData ? (
                    <button
                      onClick={handleSetup2FA}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" /> Configurar Segundo Factor (2FA)
                    </button>
                  ) : (
                    <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4">
                      <p className="text-sm text-slate-300">
                        Escanee el código QR con Google Authenticator o ingrese la clave manual:
                      </p>
                      <img src={qrCodeData} alt="Código QR 2FA" className="mx-auto rounded-xl border border-slate-800 p-2 bg-white" />
                      <code className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1.5 rounded-lg inline-block">
                        {totpSecret}
                      </code>

                      <form onSubmit={handleVerify2FA} className="max-w-xs mx-auto flex gap-2 pt-2">
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="000000"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-center font-mono text-lg text-white"
                          required
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm"
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

        {activeTab === 'architecture' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-2">Arquitectura de Microservicios</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Separación en microservicios independientes orquestados por Docker Compose y unificados por un API Gateway.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="http://localhost:8000/api/auth/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-blue-500 transition-all group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                      Swagger: Auth Service
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Endpoints de autenticación, JWT, registro y 2FA TOTP documentados interactivamente con OpenAPI.
                  </p>
                </a>

                <a
                  href="http://localhost:8000/api/core/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-cyan-500 transition-all group"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      Swagger: Core Service
                    </span>
                    <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                  <p className="text-xs text-slate-400">
                    Endpoints de la lógica del desafío con Repository Pattern, filtros y paginación documentados.
                  </p>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Crear Recurso */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Agregar Nuevo Registro</h3>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Ej: Centro de Salud N° 5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descripción</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Detalles del registro..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-300"
                  >
                    <option value="salud">Salud</option>
                    <option value="educacion">Educación</option>
                    <option value="produccion">Producción</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="economia">Economía</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Localidad en Formosa</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para Soft Delete */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="¿Eliminar Registro?"
        message="Esta acción aplicará Soft Delete (borrado lógico). El registro se marcará con fecha de baja sin destruir el historial en la base de datos."
        confirmText="Eliminar (Soft Delete)"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}

export default App;
