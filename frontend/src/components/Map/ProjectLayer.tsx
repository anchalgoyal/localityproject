import { CircleMarker, Tooltip } from "react-leaflet";
import type { Project } from "../../services/api";
import { PROJ_COLORS } from "../../utils/constants";

interface Props {
  projects: Project[];
  onSelect: (id: number, coords?: [number, number]) => void;
}

export default function ProjectLayer({ projects, onSelect }: Props) {
  return (
    <>
      {projects.map((p) => {
        if (!p.lattitude || !p.longitude) return null;
        const color = PROJ_COLORS[p.status] ?? "#64748b";
        return (
          <CircleMarker
            key={p.entity_id}
            center={[p.lattitude, p.longitude]}
            radius={p.radius}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 1 }}
            eventHandlers={{
              click: () => onSelect(p.entity_id, [p.lattitude, p.longitude]),
            }}
          >
            <Tooltip>{p.project_name}</Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
