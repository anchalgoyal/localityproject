import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { ALL_LOCALITY_STATUSES, ALL_PROJECT_STATUSES } from "../utils/constants";

// ── generic async hook ───────────────────────────────────────────────────────

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    setState({ data: null, loading: true, error: null });
    fn()
      .then((data) => { if (mountedRef.current) setState({ data, loading: false, error: null }); })
      .catch((e) => { if (mountedRef.current) setState({ data: null, loading: false, error: String(e) }); });
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// ── filter state ─────────────────────────────────────────────────────────────

export interface FilterState {
  localityStatuses: Set<string>;
  projectStatuses: Set<string>;
  showLocalities: boolean;
  showProjects: boolean;
  toggleLocality: (s: string) => void;
  toggleProject: (s: string) => void;
  toggleShowLocalities: () => void;
  toggleShowProjects: () => void;
}

export function useFilterState(): FilterState {
  const [localityStatuses, setLocalityStatuses] = useState<Set<string>>(
    new Set(ALL_LOCALITY_STATUSES)
  );
  const [projectStatuses, setProjectStatuses] = useState<Set<string>>(
    new Set(ALL_PROJECT_STATUSES)
  );
  const [showLocalities, setShowLocalities] = useState(true);
  const [showProjects, setShowProjects] = useState(true);

  const toggleLocality = useCallback((s: string) => {
    setLocalityStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }, []);

  const toggleProject = useCallback((s: string) => {
    setProjectStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }, []);

  return {
    localityStatuses,
    projectStatuses,
    showLocalities,
    showProjects,
    toggleLocality,
    toggleProject,
    toggleShowLocalities: () => setShowLocalities((v) => !v),
    toggleShowProjects: () => setShowProjects((v) => !v),
  };
}

// ── data hooks ────────────────────────────────────────────────────────────────

export function useSummary() {
  return useAsync(() => api.getSummary());
}

export function useLocalities(statuses: Set<string>) {
  const raw = useAsync(() => api.getLocalities(), []);
  const data = useMemo(() => {
    if (!raw.data) return null;
    const filtered = raw.data.data.filter((l) => statuses.has(l.status));
    return { data: filtered, count: filtered.length };
  }, [raw.data, statuses]);
  return { ...raw, data };
}

export function useProjects(statuses: Set<string>) {
  const raw = useAsync(() => api.getProjects(), []);
  const data = useMemo(() => {
    if (!raw.data) return null;
    const filtered = raw.data.data.filter((p) => statuses.has(p.status));
    return { data: filtered, count: filtered.length };
  }, [raw.data, statuses]);
  return { ...raw, data };
}

export function useNpTarget() {
  return useAsync(() => api.getNpTarget());
}

export function useZeroLeads() {
  return useAsync(() => api.getZeroLeads());
}

export function useSearch(query: string) {
  return useAsync(
    () =>
      query.trim().length >= 2
        ? api.search(query)
        : Promise.resolve({ results: [], count: 0 }),
    [query]
  );
}
