import { useAsync } from "../../hooks/useMapData";
import { api } from "../../services/api";
import { PROJ_COLORS, PROJ_STATUS_LABELS } from "../../utils/constants";
import { formatNpGapColored, formatNumber, formatPrice, formatPricePerBhk, parseConversionFloat } from "../../utils/format";

interface Props {
  entityId: number;
  onClose: () => void;
}

function ProgressBar({ fill, color }: { fill: number; color: string }) {
  const pct = Math.min(Math.max(fill * 100, 0), 100);
  return (
    <div className="h-1 bg-gray-700 rounded overflow-hidden mt-1">
      <div className="h-full rounded transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

interface TileProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  progress?: { fill: number; color: string };
}

function Tile({ label, value, sub, progress }: TileProps) {
  return (
    <div className="bg-gray-700 rounded-lg p-2.5 flex flex-col gap-0.5">
      <span className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      <span className="text-white text-sm font-bold">{value}</span>
      {sub && <span className="text-gray-400 text-[10px]">{sub}</span>}
      {progress && <ProgressBar fill={progress.fill} color={progress.color} />}
    </div>
  );
}

export default function ProjectCard({ entityId, onClose }: Props) {
  const { data: p, loading, error } = useAsync(() => api.getProject(entityId), [entityId]);

  if (loading) return <div className="p-4 text-gray-400 text-sm">Loading…</div>;
  if (error || !p) return <div className="p-4 text-red-400 text-sm">Failed to load</div>;

  const m = p.metrics;
  const statusColor = PROJ_COLORS[p.status] ?? "#64748b";
  const npFormatted = formatNpGapColored(m.np_target_not_met);
  const locNpFormatted = formatNpGapColored(m.loc_np_not_met);

  const projConvFloat = parseConversionFloat(m.project_conversion);
  const avgConvFloat = parseConversionFloat(m.avg_conversion);
  const leadFill = m.expected_leads > 0 ? m.paid_leads / m.expected_leads : 0;
  const leadColor = p.status === "surplus" ? "#22c55e" : p.status === "demand gap" ? "#ef4444" : "#eab308";
  const convFill = projConvFloat != null && avgConvFloat != null && avgConvFloat > 0
    ? projConvFloat / avgConvFloat : 0;
  const convColor = projConvFloat != null && avgConvFloat != null && projConvFloat >= avgConvFloat
    ? "#22c55e" : "#6b7280";

  const hasBhk = m.avg_bhk && m.avg_bhk > 0;
  const hasPrice = p.avg_price > 0;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium text-white mb-1 inline-block"
            style={{ backgroundColor: statusColor }}
          >
            {PROJ_STATUS_LABELS[p.status] ?? p.status}
          </span>
          <h2 className="text-sm font-bold text-white leading-tight mt-1">{p.project_name}</h2>
          <p className="text-gray-400 text-xs mt-0.5">📍 {p.locality}</p>
          {hasPrice && (
            <p className="text-gray-300 text-xs mt-0.5">
              {formatPrice(p.avg_price)}
              {hasBhk && ` · ${m.avg_bhk} BHK · ${formatPricePerBhk(p.avg_price, m.avg_bhk)}/BHK`}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none ml-2">✕</button>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Impressions" value={formatNumber(m.impressions)} sub="total views" />
        <Tile label="Clicks" value={formatNumber(m.clicks)} sub="click-throughs" />
        <Tile
          label="Paid Leads"
          value={formatNumber(m.paid_leads)}
          sub={`of ${m.expected_leads} expected`}
          progress={{ fill: leadFill, color: leadColor }}
        />
        <Tile
          label="NP Not Met"
          value={<span className={npFormatted.className}>{npFormatted.text}</span>}
          sub={m.np_target_mtd != null ? `target: ${m.np_target_mtd} NPs` : undefined}
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-2">
        <Tile
          label="Proj Conv"
          value={m.project_conversion ?? "—"}
          sub="conversion rate"
          progress={{ fill: convFill, color: convColor }}
        />
        <Tile
          label="Avg Conv (Similar)"
          value={m.avg_conversion ?? "—"}
          sub="similar price band avg"
          progress={{ fill: 1, color: "#6b7280" }}
        />
        <Tile
          label="Avg Sessions"
          value={formatNumber(m.avg_sessions != null ? Math.round(m.avg_sessions) : null)}
          sub="similar price band avg"
        />
        <Tile
          label="Loc NP Not Met"
          value={<span className={locNpFormatted.className}>{locNpFormatted.text}</span>}
          sub="locality level gap"
        />
      </div>
    </div>
  );
}
