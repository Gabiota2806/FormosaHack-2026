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
  Calendar,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { incidentApi } from '../../services/api';
import type { IncidentPaginationResponse } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import { cn } from '../ui/cn';

const FIELD_CLASSES =
  'w-full py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';

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
        <div className="p-4 sm:p-5 rounded-3xl bg-red-600 text-white shadow-xl shadow-red-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 motion-safe:animate-bounce" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-white text-red-700">
                  Alerta Comunitaria
                </span>
                <span className="text-xs font-semibold text-red-50">
                  Brote activo en las últimas horas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-0.5">
                Campaña masiva de suplantación detectada: {data.outbreak_entity}
              </h3>
            </div>
          </div>
          <Button
            onClick={() => setEntityFilter(data.outbreak_entity || '')}
            className="bg-white hover:bg-red-50 text-red-700 shadow-none"
          >
            Filtrar este Brote
          </Button>
        </div>
      )}

      {/* Cabecera y Filtros */}
      <Card tone="dark" className="rounded-3xl p-6 animate-fade-up">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <IconBadge icon={Radio} tone="solid" size="md" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 motion-safe:animate-pulse" aria-hidden="true" />
                Radar Comunitario en Vivo
              </p>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Amenazas Reportadas y Validadas por la Comunidad
              </h2>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={fetchIncidents}
            aria-label="Refrescar feed"
            title="Refrescar feed"
            className="p-2.5 border border-slate-600"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} aria-hidden="true" />
          </Button>
        </div>

        {/* Barra de Búsqueda y Selectores */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              aria-label="Buscar amenazas"
              placeholder="Buscar por texto, banco o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(FIELD_CLASSES, 'pl-10 pr-4')}
            />
          </div>

          <div>
            <select
              aria-label="Filtrar por entidad"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className={cn(FIELD_CLASSES, 'px-3')}
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
              aria-label="Filtrar por vector de ataque"
              value={vectorFilter}
              onChange={(e) => {
                setVectorFilter(e.target.value);
                setPage(1);
              }}
              className={cn(FIELD_CLASSES, 'px-3')}
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
      </Card>

      {/* Grid de Amenazas */}
      {loading ? (
        <div className="py-16 text-center text-slate-300">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-brand-400" aria-hidden="true" />
          Actualizando radar de amenazas en tiempo real...
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card tone="dark" className="py-16 text-center rounded-3xl text-slate-300">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-400" aria-hidden="true" />
          No se encontraron amenazas con los filtros seleccionados.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((item) => (
            <Card key={item.id} className="flex flex-col animate-fade-up">
              <div className={cn('h-1.5', item.is_outbreak_spike ? 'bg-red-500' : 'bg-brand-500')} />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-100">
                        {item.impersonated_entity}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.attack_vector}
                      </span>
                      {item.is_outbreak_spike && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white motion-safe:animate-pulse">
                          En Brote
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {new Date(item.created_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mb-1.5">{item.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
                    {item.description}
                  </p>

                  {item.evidence_text && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900 mb-3 flex items-center gap-1.5 min-w-0">
                      <MessageCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                      <span className="truncate">"{item.evidence_text}"</span>
                    </div>
                  )}
                </div>

                {/* Pie de la Tarjeta con Votos */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    {item.votes_count} personas validaron esto
                  </span>

                  <Button
                    size="sm"
                    variant={votedMap[item.id] ? 'secondary' : 'primary'}
                    icon={ThumbsUp}
                    onClick={() => handleVote(item.id)}
                    disabled={votedMap[item.id]}
                  >
                    {votedMap[item.id] ? 'Validado' : 'A mí también me llegó'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginación en Servidor */}
      {data && data.total_pages > 1 && (
        <Card tone="dark" className="flex items-center justify-between gap-3 p-4 text-xs text-slate-300">
          <span>
            Página {data.page} de {data.total_pages} ({data.total} amenazas registradas)
          </span>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border border-slate-600"
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={data.page >= data.total_pages}
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              className="border border-slate-600"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
