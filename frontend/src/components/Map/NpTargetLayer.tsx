import { Polygon, Tooltip } from "react-leaflet";
import type { CityScale, NpTargetLocality } from "../../services/api";
import { npTargetToColor } from "../../utils/colour";
import { formatNpGap } from "../../utils/format";

interface Props {
  data: NpTargetLocality[];
  cityScales: Record<string, CityScale>;
}

export default function NpTargetLayer({ data, cityScales }: Props) {
  return (
    <>
      {data.map((item) => {
        if (!item.coords?.length) return null;
        const scale = cityScales[item.city_name];
        const minVal = scale?.min_val ?? 0;
        const maxVal = scale?.max_val ?? 0;
        const fill = npTargetToColor(item.np_target_not_met, minVal, maxVal);
        return (
          <Polygon
            key={`${item.city_name}::${item.locality}`}
            positions={item.coords as [number, number][]}
            pathOptions={{ color: "#374151", fillColor: fill, fillOpacity: 0.85, weight: 1 }}
          >
            <Tooltip>
              <span className="font-semibold">{item.locality}</span>
              <br />
              <span className="text-xs text-gray-500">{item.city_name}</span>
              <br />
              NP Target Not Met: {formatNpGap(item.np_target_not_met)}
            </Tooltip>
          </Polygon>
        );
      })}

      {/* Per-city legends */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] flex gap-3"
        style={{ pointerEvents: "none" }}
      >
        {Object.entries(cityScales).map(([city, scale]) => (
          <div
            key={city}
            className="bg-gray-800 bg-opacity-90 rounded-lg px-3 py-2 text-xs text-white min-w-[220px]"
          >
            <div className="font-semibold text-gray-300 mb-1">{city}</div>
            <div className="flex justify-between mb-1">
              <span className="text-red-400">{Math.round(scale.min_val)}</span>
              <span className="text-gray-400">0</span>
              <span className="text-green-400">+{Math.round(scale.max_val)}</span>
            </div>
            <div
              className="h-2.5 rounded"
              style={{ background: "linear-gradient(to right, #ef4444, #ffffff, #22c55e)" }}
            />
            <div className="flex justify-between mt-0.5 text-gray-500 text-[10px]">
              <span>Max Deficit</span>
              <span>On Target</span>
              <span>Max Surplus</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
