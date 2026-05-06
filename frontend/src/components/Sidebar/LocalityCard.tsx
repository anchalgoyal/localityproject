import { useAsync } from "../../hooks/useMapData";
import { api } from "../../services/api";
import type { CityStats } from "../../services/api";
import { LOC_COLORS, LOC_STATUS_LABELS } from "../../utils/constants";
import { formatNumber, formatNpGapColored, formatPrice } from "../../utils/format";

interface Props {
  locality: string;
  city: string;
  onClose: () => void;
}

function CityBar({
  value,
  cityTotal,
  color,
}: {
  value: number;
  cityTotal: number;
  color: "green" | "red";
}) {
  const pct = cityTotal > 0 ? Math.min((value / cityTotal) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-gray-700 rounded overflow-hidden">
        <div
          className={`h-full rounded ${color === "green" ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-500 text-[10px] w-8 text-right flex-shrink-0">
        {pct < 1 ? "<1%" : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

function ConvComparison({
  locConv,
  cityAvgConv,
}: {
  locConv: string | null;
  cityAvgConv: string | null;
}) {
  if (!locConv || !cityAvgConv) return null;
  const loc = parseFloat(locConv);
  const city = parseFloat(cityAvgConv);
  const diff = loc - city;
  const diffStr = diff >= 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;
  const diffClass = diff >= 0 ? "text-green-400" : "text-red-400";
  return (
    <div className="flex items-center justify-between text-xs mt-0.5">
      <span className="text-gray-500 pl-2">vs city avg {cityAvgConv}</span>
      <span className={`font-medium ${diffClass}`}>{diffStr}</span>
    </div>
  );
}

function NpContext({
  value,
  cityStats,
}: {
  value: number | null;
  cityStats: CityStats;
}) {
  if (value == null || cityStats.np_min == null || cityStats.np_max == null) return null;
  const range = cityStats.np_max - cityStats.np_min;
  if (range === 0) return null;
  const pct = Math.round(((value - cityStats.np_min) / range) * 100);
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
        <span>{Math.round(cityStats.np_min)}</span>
        <span className="text-gray-400">City NP range</span>
        <span>+{Math.round(cityStats.np_max)}</span>
      </div>
      <div className="relative h-1.5 bg-gray-700 rounded overflow-hidden">
        <div
          className="h-full bg-white/30 rounded"
          style={{ background: "linear-gradient(to right, #ef4444, #ffffff, #22c55e)" }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-white"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function LocalityCard({ locality, city, onClose }: Props) {
  const { data, loading, error } = useAsync(() => api.getLocality(locality, city), [locality, city]);

  if (loading) return <div className="p-4 text-gray-400 text-sm">Loading…</div>;
  if (error || !data) return <div className="p-4 text-red-400 text-sm">Failed to load</div>;

  const cs = data.city_stats;
  const npFormatted = formatNpGapColored(data.np_target_not_met);
  const statusColor = LOC_COLORS[data.status] ?? "#64748b";

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
              {data.city_name}
            </span>
            <span className="text-[10px] text-gray-500">
              {cs.total_localities} localities
            </span>
          </div>
          <h2 className="text-base font-bold text-white">{data.locality}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
              style={{ backgroundColor: statusColor }}
            >
              {LOC_STATUS_LABELS[data.status] ?? data.status}
            </span>
            {data.reclassified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-600 text-white">
                reclassified
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none ml-2">✕</button>
      </div>

      {/* Metrics */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Impressions</span>
          <span className="text-white font-medium">{formatNumber(data.impressions)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Clicks</span>
          <span className="text-white font-medium">{formatNumber(data.clicks)}</span>
        </div>

        {/* Paid leads with city avg benchmark */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Paid Leads</span>
          <span className="text-white font-medium">{formatNumber(data.paid_leads)}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-0.5">
          <span className="text-gray-500 pl-2">city avg {formatNumber(cs.avg_paid_leads)}</span>
          <span className={data.paid_leads >= cs.avg_paid_leads ? "text-green-400" : "text-red-400"}>
            {data.paid_leads >= cs.avg_paid_leads ? "above avg" : "below avg"}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Locality Target</span>
          <span className="text-white font-medium">
            {formatNumber(data.locality_np_target_mtd)}
          </span>
        </div>

        {/* Conversion with city avg diff */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Conversion</span>
          <span className="text-white font-medium">{data.conversion ?? "—"}</span>
        </div>
        <ConvComparison locConv={data.conversion} cityAvgConv={cs.avg_conversion} />

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Avg Price</span>
          <span className="text-white font-medium">{formatPrice(data.loc_avg_price)}</span>
        </div>

        {/* NP Target with city range context */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">NP Target Not Met</span>
          <span className={`font-medium ${npFormatted.className}`}>{npFormatted.text}</span>
        </div>
        <NpContext value={data.np_target_not_met} cityStats={cs} />
      </div>

      <div className="border-t border-gray-700" />

      {/* Lead health — bars scaled against city totals */}
      <div>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
          Lead health · % of {data.city_name} total
        </p>
        {data.surplus_leads === 0 && data.behind_leads === 0 ? (
          <p className="text-xs text-gray-500">No lead gap data</p>
        ) : (
          <div className="space-y-3">
            {data.surplus_leads > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-400 text-xs">↑ surplus</span>
                  <span className="text-green-400 text-xs font-semibold">
                    {formatNumber(data.surplus_leads)} leads
                  </span>
                </div>
                <CityBar
                  value={data.surplus_leads}
                  cityTotal={cs.total_surplus_leads}
                  color="green"
                />
                <p className="text-green-700 text-[10px] mt-0.5">
                  {data.surplus_props} surplus properties · city total {formatNumber(cs.total_surplus_leads)}
                </p>
              </div>
            )}
            {data.behind_leads > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-red-400 text-xs">↓ behind</span>
                  <span className="text-red-400 text-xs font-semibold">
                    {formatNumber(data.behind_leads)} leads needed
                  </span>
                </div>
                <CityBar
                  value={data.behind_leads}
                  cityTotal={cs.total_behind_leads}
                  color="red"
                />
                <p className="text-red-800 text-[10px] mt-0.5">
                  {data.behind_props} properties behind · city total {formatNumber(cs.total_behind_leads)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
