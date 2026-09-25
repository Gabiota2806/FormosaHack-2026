import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { incidentApi } from '../../services/api';
import type { IncidentItem, IncidentPaginationResponse } from '../../types';

export interface IncidentQuery {
  page: number;
  limit: number;
  entity: string;
  vector: string;
  search: string;
}

interface FetchState {
  key: string | null; // consulta a la que corresponde el último resultado
  data: IncidentPaginationResponse | null;
  error: boolean;
}

/**
 * Trae el feed paginado del radar. Cancela el pedido anterior al cambiar la consulta,
 * así una respuesta vieja nunca pisa a la nueva.
 */
export function useIncidents({ page, limit, entity, vector, search }: IncidentQuery) {
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<FetchState>({ key: null, data: null, error: false });

  const key = JSON.stringify([page, limit, entity, vector, search, reloadCount]);

  useEffect(() => {
    const controller = new AbortController();
    incidentApi
      .getIncidents(
        {
          page,
          limit,
          entity: entity || undefined,
          vector: vector || undefined,
          search: search || undefined,
        },
        controller.signal,
      )
      .then((data) => setState({ key, data, error: false }))
      .catch((err: unknown) => {
        if (axios.isCancel(err)) return;
        // El interceptor de api.ts ya mostró el toast; se conservan los datos anteriores.
        setState((prev) => ({ key, data: prev.data, error: true }));
      });
    return () => controller.abort();
  }, [key, page, limit, entity, vector, search]);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);

  const updateItem = useCallback((id: number, patch: Partial<IncidentItem>) => {
    setState((prev) =>
      prev.data
        ? {
            ...prev,
            data: {
              ...prev.data,
              items: prev.data.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
            },
          }
        : prev,
    );
  }, []);

  const status: 'loading' | 'error' | 'success' =
    state.key !== key ? 'loading' : state.error ? 'error' : 'success';

  return { data: state.data, status, reload, updateItem };
}
