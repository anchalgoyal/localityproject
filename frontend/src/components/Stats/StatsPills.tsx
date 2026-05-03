import type { Summary } from "../../services/api";

interface Props {
  summary: Summary;
}

const pills = [
  { key: "surplus_localities" as const, label: "Surplus", color: "#22c55e" },
  { key: "demand_gap_localities" as const, label: "Demand Gap", color: "#ef4444" },
  { key: "conversion_issue_localities" as const, label: "Conv. Issue", color: "#eab308" },
  { key: "demand_conv_issue_localities" as const, label: "D+C Issue", color: "#f97316" },
];

export default function StatsPills({ summary }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">{summary.total_localities}L · {summary.total_projects}P</span>
      {pills.map((p) => (
        <span
          key={p.key}
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
          style={{ backgroundColor: p.color + "33", color: p.color, border: `1px solid ${p.color}55` }}
        >
          {summary[p.key]} {p.label}
        </span>
      ))}
    </div>
  );
}
