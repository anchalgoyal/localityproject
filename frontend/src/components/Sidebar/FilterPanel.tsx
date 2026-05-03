import type { FilterState } from "../../hooks/useMapData";
import { LOC_COLORS, LOC_STATUS_LABELS, PROJ_COLORS, PROJ_STATUS_LABELS, ALL_LOCALITY_STATUSES, ALL_PROJECT_STATUSES } from "../../utils/constants";

interface Props {
  filterState: FilterState;
}

export default function FilterPanel({ filterState }: Props) {
  const { localityStatuses, projectStatuses, showLocalities, showProjects,
          toggleLocality, toggleProject, toggleShowLocalities, toggleShowProjects } = filterState;

  return (
    <div className="p-4 space-y-5">
      {/* Localities */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Localities</span>
          <button
            onClick={toggleShowLocalities}
            className={`text-xs px-2 py-0.5 rounded ${showLocalities ? "bg-blue-600" : "bg-gray-600"}`}
          >
            {showLocalities ? "Visible" : "Hidden"}
          </button>
        </div>
        <div className="space-y-1">
          {ALL_LOCALITY_STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localityStatuses.has(s)}
                onChange={() => toggleLocality(s)}
                className="rounded"
              />
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: LOC_COLORS[s] }}
              />
              <span className="text-xs text-gray-300">{LOC_STATUS_LABELS[s]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-700" />

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Projects</span>
          <button
            onClick={toggleShowProjects}
            className={`text-xs px-2 py-0.5 rounded ${showProjects ? "bg-blue-600" : "bg-gray-600"}`}
          >
            {showProjects ? "Visible" : "Hidden"}
          </button>
        </div>
        <div className="space-y-1">
          {ALL_PROJECT_STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={projectStatuses.has(s)}
                onChange={() => toggleProject(s)}
                className="rounded"
              />
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: PROJ_COLORS[s] }}
              />
              <span className="text-xs text-gray-300">{PROJ_STATUS_LABELS[s]}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
