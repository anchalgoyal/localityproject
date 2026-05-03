import { Polygon, Tooltip } from "react-leaflet";
import type { Locality } from "../../services/api";
import { LOC_COLORS } from "../../utils/constants";

interface Props {
  localities: Locality[];
  onSelect: (name: string, city: string) => void;
}

export default function LocalityLayer({ localities, onSelect }: Props) {
  return (
    <>
      {localities.map((loc) => {
        if (!loc.coords?.length) return null;
        const color = LOC_COLORS[loc.status] ?? "#64748b";
        return (
          <Polygon
            key={`${loc.city_name}::${loc.locality}`}
            positions={loc.coords as [number, number][]}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.35,
              weight: 1.5,
            }}
            eventHandlers={{ click: () => onSelect(loc.locality, loc.city_name) }}
          >
            <Tooltip sticky>{loc.locality}</Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
