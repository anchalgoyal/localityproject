const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ── types ────────────────────────────────────────────────────────────────────

export type LocalityStatus =
  | "surplus present"
  | "demand gap"
  | "conversion issue"
  | "demand + conversion issue";

export type ProjectStatus =
  | "surplus"
  | "demand gap"
  | "conversion issue"
  | "demand + conversion issue"
  | "data not present";

export interface ProjectMetrics {
  impressions: number;
  clicks: number;
  paid_leads: number;
  expected_leads: number;
  project_conversion: string | null;
  avg_conversion: string | null;
  avg_sessions: number | null;
  pdp_sessions: number | null;
  np_target_not_met: number | null;
  np_target_mtd: number | null;
  loc_np_not_met: number | null;
  avg_bhk: number | null;
  price_per_bhk: number | null;
}

export interface Project {
  entity_id: number;
  city_name: string;
  project_name: string;
  locality: string;
  longitude: number;
  lattitude: number;
  avg_price: number;
  status: ProjectStatus;
  radius: number;
  metrics: ProjectMetrics;
}

export interface Locality {
  locality: string;
  city_name: string;
  status: LocalityStatus;
  coords: [number, number][];
  reclassified: boolean;
  surplus_leads: number;
  behind_leads: number;
  surplus_props: number;
  behind_props: number;
  net_score: number;
  np_target_not_met: number | null;
  locality_np_target_mtd: number | null;
  impressions: number;
  clicks: number;
  paid_leads: number;
  expected_leads: number;
  conversion: string | null;
  lead_gap: number | null;
  loc_avg_price: number | null;
}

export interface CityStats {
  total_surplus_leads: number;
  total_behind_leads: number;
  avg_paid_leads: number;
  avg_conversion: string | null;
  np_min: number | null;
  np_max: number | null;
  total_localities: number;
}

export interface LocalityDetail extends Locality {
  projects: Project[];
  city_stats: CityStats;
}

export interface CityScale {
  min_val: number;
  max_val: number;
}

export interface NpTargetLocality {
  locality: string;
  city_name: string;
  status: LocalityStatus;
  coords: [number, number][];
  np_target_not_met: number;
}

export interface ZeroLeadProject {
  entity_id: number;
  city_name: string;
  project_name: string;
  locality: string;
  status: ProjectStatus;
  avg_price: number;
  impressions: number;
  clicks: number;
  sessions: number;
}

export interface Summary {
  total_localities: number;
  total_projects: number;
  surplus_localities: number;
  demand_gap_localities: number;
  conversion_issue_localities: number;
  demand_conv_issue_localities: number;
  zero_lead_projects: number;
}

export interface SearchResult {
  type: "locality" | "project";
  name: string;
  locality: string | null;
  city_name: string | null;
  status: string;
  entity_id: number | null;
  coords: [number, number] | null;
}

// ── API object ────────────────────────────────────────────────────────────────

export const api = {
  getLocalities: (statuses?: string[]) => {
    const qs = statuses?.length
      ? "?" + statuses.map((s) => `status=${encodeURIComponent(s)}`).join("&")
      : "";
    return get<{ data: Locality[]; count: number }>(`/api/localities${qs}`);
  },
  getLocality: (name: string, city?: string) =>
    get<LocalityDetail>(
      `/api/localities/${encodeURIComponent(name)}${city ? `?city=${encodeURIComponent(city)}` : ""}`
    ),
  getProjects: (statuses?: string[], locality?: string, zero_leads?: boolean) => {
    const params: string[] = [];
    statuses?.forEach((s) => params.push(`status=${encodeURIComponent(s)}`));
    if (locality) params.push(`locality=${encodeURIComponent(locality)}`);
    if (zero_leads) params.push("zero_leads=true");
    const qs = params.length ? "?" + params.join("&") : "";
    return get<{ data: Project[]; count: number }>(`/api/projects${qs}`);
  },
  getProject: (id: number) => get<Project>(`/api/projects/${id}`),
  getNpTarget: () =>
    get<{ data: NpTargetLocality[]; city_scales: Record<string, CityScale>; count: number }>(
      "/api/np-target"
    ),
  getZeroLeads: () => get<{ data: ZeroLeadProject[]; count: number }>("/api/zero-leads"),
  getSummary: () => get<Summary>("/api/summary"),
  search: (q: string) =>
    get<{ results: SearchResult[]; count: number }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ),
};
