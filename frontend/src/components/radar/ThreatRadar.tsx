import { useEffect, useState, type FormEvent } from 'react';
import {
  Radio,
  Flame,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  WifiOff,
  FilterX,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { incidentApi } from '../../services/api';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { IconBadge } from '../ui/IconBadge';
import { cn } from '../ui/cn';
import { IncidentCard, IncidentCardSkeleton } from './IncidentCard';
import { ENTITY_OPTIONS, VECTOR_LABELS } from './radarLabels';
import { useIncidents } from './useIncidents';
import { getFingerprint, loadVotedIds, saveVotedIds } from './votes';

const FIELD_CLASSES =
  'w-full py-2.5 bg-slate-950/70 border border-slate-700 rounded-xl text-base sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition';

const PAGE_SIZE = 6;
const SEARCH_DEBOUNCE_MS = 400;

export function ThreatRadar() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [vectorFilter, setVectorFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [votedIds, setVotedIds] = useState<Set<number>>(loadVotedIds);
  const [votingIds, setVotingIds] = useState<Set<number>>(() => new Set());

  const { data, status, reload, updateItem } = useIncidents({
    page,
    limit: PAGE_SIZE,
    entity: entityFilter,
    vector: vectorFilter,
    search,
  });

  // Búsqueda mientras se escribe, con debounce.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Enter busca al instante, sin esperar el debounce.
    setSearch(searchInput.trim());
    setPage(1);
  };

  const applyEntity = (entity: string) => {
    setEntityFilter(entity);
    setPage(1);
  };

  const clearFilters = () => {
    setEntityFilter('');
    setVectorFilter('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleVote = async (incidentId: number) => {
    if (votedIds.has(incidentId) || votingIds.has(incidentId)) return;

    setVotingIds((prev) => new Set(prev).add(incidentId));
    try {
      const res = await incidentApi.voteIncident(incidentId, getFingerprint());
      if (res.success) {
        toast.success('¡Gracias! Tu aviso alerta a más vecinos sobre esta amenaza.');
      } else {
        toast.info(res.message);
      }
      // En ambos casos el backend devuelve el contador real y el voto de este dispositivo ya existe.
      updateItem(incidentId, { votes_count: res.votes_count });
      setVotedIds((prev) => {
        const next = new Set(prev).add(incidentId);
        saveVotedIds(next);
        return next;
      });
    } catch (err) {
      // Los errores HTTP ya los avisa el interceptor de api.ts; cualquier otro quedaría en silencio.
      if (!axios.isAxiosError(err)) {
        toast.error('No pudimos registrar tu aviso. Intentá de nuevo.');
      }
    } finally {
      setVotingIds((prev) => {
        const next = new Set(prev);
        next.delete(incidentId);
        return next;
      });
    }
  };

  const isLoading = status === 'loading';
  const hasFilters = Boolean(entityFilter || vectorFilter || search);
  // Si el brote (o un filtro previo) no está en la lista fija, se agrega para que el selector no quede en blanco.
  const entityOptions =
    entityFilter && !ENTITY_OPTIONS.includes(entityFilter) ? [...ENTITY_OPTIONS, entityFilter] : ENTITY_OPTIONS;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Banner de Brote Activo (Spike) */}
      {data?.has_active_outbreak && data.outbreak_entity && (
        <div
          role="alert"
          className="p-4 sm:p-5 rounded-3xl bg-red-600 text-white shadow-xl shadow-red-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 motion-safe:animate-bounce" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-extrabold px-2 py-0.5 rounded-full bg-white text-red-700">
                  Alerta Comunitaria
                </span>
                <span className="text-xs font-semibold text-red-50">Brote activo en las últimas horas</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-0.5">
                Campaña masiva de suplantación detectada: {data.outbreak_entity}
              </h3>
            </div>
          </div>
          <Button
            onClick={() => applyEntity(data.outbreak_entity ?? '')}
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
            onClick={reload}
            disabled={isLoading}
            aria-label="Refrescar radar"
            title="Refrescar radar"
            className="p-2.5 border border-slate-600"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'motion-safe:animate-spin')} aria-hidden="true" />
          </Button>
        </div>

        {/* Barra de Búsqueda y Selectores */}
        <form
          onSubmit={handleSearchSubmit}
          role="search"
          className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3"
        >
          <div className="relative sm:col-span-2">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Buscar amenazas"
              placeholder="Buscar por texto, banco o mensaje..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className={cn(FIELD_CLASSES, 'pl-10 pr-4')}
            />
          </div>

          <select
            aria-label="Filtrar por entidad"
            value={entityFilter}
            onChange={(e) => applyEntity(e.target.value)}
            className={cn(FIELD_CLASSES, 'px-3')}
          >
            <option value="">Todas las Entidades</option>
            {entityOptions.map((entity) => (
              <option key={entity} value={entity}>
                {entity}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por canal de contacto"
            value={vectorFilter}
            onChange={(e) => {
              setVectorFilter(e.target.value);
              setPage(1);
            }}
            className={cn(FIELD_CLASSES, 'px-3')}
          >
            <option value="">Todos los Canales</option>
            {Object.entries(VECTOR_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </form>
      </Card>

      {/* Anuncio para lectores de pantalla */}
      <p className="sr-only" role="status" aria-live="polite">
        {isLoading
          ? 'Cargando amenazas...'
          : status === 'success' && data
            ? `${data.total} ${data.total === 1 ? 'amenaza encontrada' : 'amenazas encontradas'}.`
            : ''}
      </p>

      {/* Grid de Amenazas */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <IncidentCardSkeleton key={i} />
          ))}
        </div>
      ) : status === 'error' ? (
        <Card tone="dark" className="py-12 px-6 text-center rounded-3xl text-slate-300 space-y-4">
          <WifiOff className="w-8 h-8 mx-auto text-slate-400" aria-hidden="true" />
          <p>No pudimos cargar el radar. Revisá tu conexión e intentá de nuevo.</p>
          <Button icon={RefreshCw} onClick={reload}>
            Reintentar
          </Button>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <Card tone="dark" className="py-12 px-6 text-center rounded-3xl text-slate-300 space-y-4">
          <AlertTriangle className="w-8 h-8 mx-auto text-slate-400" aria-hidden="true" />
          <p>
            {hasFilters
              ? 'No se encontraron amenazas con los filtros seleccionados.'
              : 'Todavía no hay amenazas reportadas en el radar.'}
          </p>
          {hasFilters && (
            <Button variant="ghost" icon={FilterX} onClick={clearFilters} className="border border-slate-600">
              Limpiar filtros
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((item) => (
            <IncidentCard
              key={item.id}
              item={item}
              voted={votedIds.has(item.id)}
              voting={votingIds.has(item.id)}
              onVote={handleVote}
            />
          ))}
        </div>
      )}

      {/* Paginación en Servidor */}
      {data && data.total_pages > 1 && status !== 'error' && (
        <Card
          tone="dark"
          className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 text-xs text-slate-300"
        >
          <span>
            Página {data.page} de {data.total_pages} ({data.total} amenazas registradas)
          </span>

          <nav aria-label="Paginación del radar" className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              disabled={isLoading || data.page <= 1}
              onClick={() => setPage(data.page - 1)}
              className="border border-slate-600"
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading || data.page >= data.total_pages}
              onClick={() => setPage(data.page + 1)}
              className="border border-slate-600"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </nav>
        </Card>
      )}
    </div>
  );
}
