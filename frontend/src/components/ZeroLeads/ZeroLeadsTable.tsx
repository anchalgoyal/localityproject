import { useState } from "react";
import { useZeroLeads } from "../../hooks/useMapData";
import { PROJ_COLORS, PROJ_STATUS_LABELS } from "../../utils/constants";
import { formatNumber, formatPrice } from "../../utils/format";
import type { ZeroLeadProject } from "../../services/api";

type SortKey = keyof ZeroLeadProject;

export default function ZeroLeadsTable() {
  const { data, loading } = useZeroLeads();
  const [sortKey, setSortKey] = useState<SortKey>("project_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  if (loading) return <div className="p-8 text-gray-400 text-sm text-center">Loading…</div>;
  if (!data || data.count === 0)
    return <div className="p-8 text-gray-400 text-sm text-center">No projects with 0 paid leads.</div>;

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sorted = [...data.data].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string")
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    if (typeof av === "number" && typeof bv === "number")
      return sortDir === "asc" ? av - bv : bv - av;
    return 0;
  });

  const cols: { key: SortKey; label: string; render: (r: ZeroLeadProject) => React.ReactNode }[] = [
    { key: "project_name", label: "Project", render: (r) => <span className="font-medium text-white">{r.project_name}</span> },
    { key: "locality", label: "Locality", render: (r) => r.locality },
    {
      key: "status", label: "Status", render: (r) => (
        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: PROJ_COLORS[r.status] ?? "#64748b" }}>
          {PROJ_STATUS_LABELS[r.status] ?? r.status}
        </span>
      )
    },
    { key: "avg_price", label: "Price", render: (r) => formatPrice(r.avg_price) },
    { key: "impressions", label: "Impressions", render: (r) => formatNumber(r.impressions) },
    { key: "clicks", label: "Clicks", render: (r) => formatNumber(r.clicks) },
  ];

  function SortIcon({ k }: { k: SortKey }) {
    if (k !== sortKey) return <span className="text-gray-600 ml-1">↕</span>;
    return <span className="text-blue-400 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-white mb-1">Zero Leads Audit</h2>
      <p className="text-gray-400 text-sm mb-4">{data.count} project{data.count !== 1 ? "s" : ""} with 0 paid leads</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              {cols.map((c) => (
                <th
                  key={c.key}
                  onClick={() => handleSort(c.key)}
                  className="text-left py-2 px-3 text-gray-400 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:text-white whitespace-nowrap"
                >
                  {c.label}<SortIcon k={c.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.entity_id} className="border-b border-gray-800 hover:bg-gray-800">
                {cols.map((c) => (
                  <td key={c.key} className="py-2.5 px-3 text-gray-300">
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
