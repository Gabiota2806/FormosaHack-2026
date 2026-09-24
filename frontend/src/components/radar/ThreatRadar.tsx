import { useState, useEffect } from 'react';
import { 
  Radio, 
  Flame, 
  Search, 
  ThumbsUp, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { incidentApi } from '../../services/api';
import type { IncidentPaginationResponse } from '../../types';

export function ThreatRadar() {
  const [data, setData] = useState<IncidentPaginationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [vectorFilter, setVectorFilter] = useState('');
  const [search, setSearch] = useState('');
  const [votedMap, setVotedMap] = useState<Record<number, boolean>>({});

  // Huella de dispositivo simple en localStorage para evitar doble voto local
  const getFingerprint = () => {
    let fp = localStorage.getItem('user_fingerprint');
    if (!fp) {
      fp = 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('user_fingerprint', fp);
    }
    return fp;
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await incidentApi.getIncidents({
        page,
        limit: 6,
        entity: entityFilter || undefined,
        vector: vectorFilter || undefined,
        search: search || undefined,
      });
      setData(res);
    } catch {
      // Manejado por interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [page, entityFilter, vectorFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchIncidents();
  };

  const handleVote = async (incidentId: number) => {
    if (votedMap[incidentId]) {
      toast.info('Ya has validado esta amenaza anteriormente.');
      return;
    }

    try {
      const fp = getFingerprint();
      const res = await incidentApi.voteIncident(incidentId, fp);
      if (res.success) {
        toast.success('¡Gracias! Tu validación alerta a más vecinos sobre esta amenaza.');
        setVotedMap((prev) => ({ ...prev, [incidentId]: true }));
        // Actualizar contador localmente
        if (data) {
          setData({
            ...data,
            items: data.items.map((it) =>
              it.id === incidentId ? { ...it, votes_count: res.votes_count } : it
            ),
          });
        }
      } else {
        toast.info(res.message);
        setVotedMap((prev) => ({ ...prev, [incidentId]: true }));
      }
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner de Brote Activo (Spike) */}
      {data?.has_active_outbreak && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950/80 via-orange-950/60 to-red-950/80 border border-red-700/80 shadow-xl shadow-red-900/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-600/30">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-red-600 text-white">
                  Alerta Comunitaria
                </span>
                <span className="text-xs font-semibold text-red-300">
                  Brote activo en las últimas horas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Campaña masiva de suplantación detectada: {data.outbreak_entity}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setEntityFilter(data.outbreak_entity || '')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0"
          >
            Filtrar este Brote
          </button>
        </div>
      )}

      {/* Cabecera y Filtros */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-md backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-semibold mb-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Radar Comunitario en Vivo
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Amenazas Reportadas y Validadas por la Comunidad
            </h2>
          </div>

          <button
            onClick={fetchIncidents}
            className="p-2 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
            title="Refrescar feed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Barra de Búsqueda y Selectores */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por texto, banco o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todas las Entidades</option>
              <option value="Banco Formosa">Banco Formosa</option>
              <option value="Tarjeta Chigüé">Tarjeta Chigüé</option>
              <option value="REFSA">REFSA</option>
              <option value="Mercado Pago">Mercado Pago</option>
              <option value="ANSES">ANSES</option>
              <option value="WhatsApp">WhatsApp</option>
            </select>
          </div>

          <div>
            <select
              value={vectorFilter}
              onChange={(e) => {
                setVectorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los Vectores</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="LLAMADA">Llamada Telefónica</option>
              <option value="WEB">Sitio Web / Enlace</option>
              <option value="EMAIL">Correo Electrónico</option>
            </select>
          </div>
        </form>
      </div>

      {/* Grid de Amenazas */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
          Actualizando radar de amenazas en tiempo real...
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-500" />
          No se encontraron amenazas con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                item.is_outbreak_spike
                  ? 'bg-red-950/20 border-red-800/80 shadow-lg shadow-red-950/20'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                      {item.impersonated_entity}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {item.attack_vector}
                    </span>
                    {item.is_outbreak_spike && (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                        En Brote
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.created_at).toLocaleDateString('es-AR')}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-300 line-clamp-3 mb-3 leading-relaxed">
                  {item.description}
                </p>

                {item.evidence_text && (
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-amber-300/90 mb-3 truncate">
                    💬 "{item.evidence_text}"
                  </div>
                )}
              </div>

              {/* Pie de la Tarjeta con Votos */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {item.votes_count} personas validaron esto
                </span>

                <button
                  onClick={() => handleVote(item.id)}
                  disabled={votedMap[item.id]}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    votedMap[item.id]
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  {votedMap[item.id] ? 'Validado' : 'A mí también me llegó'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación en Servidor */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
          <span>
            Página {data.page} de {data.total_pages} ({data.total} amenazas registradas)
          </span>

          <div className="flex gap-2">
            <button
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              disabled={data.page >= data.total_pages}
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-200 transition-colors flex items-center gap-1"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
