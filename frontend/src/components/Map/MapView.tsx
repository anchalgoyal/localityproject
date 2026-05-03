import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Tab } from "../../App";
import type { FilterState } from "../../hooks/useMapData";
import { useLocalities, useNpTarget, useProjects } from "../../hooks/useMapData";
import LocalityLayer from "./LocalityLayer";
import ProjectLayer from "./ProjectLayer";
import NpTargetLayer from "./NpTargetLayer";
import ZeroLeadsTable from "../ZeroLeads/ZeroLeadsTable";

interface FlyToControllerProps {
  flyTo: [number, number] | null;
  onConsumed: () => void;
}

function FlyToController({ flyTo, onConsumed }: FlyToControllerProps) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo(flyTo, 14, { duration: 1.2 });
      onConsumed();
    }
  }, [flyTo, map, onConsumed]);
  return null;
}

interface Props {
  activeTab: Tab;
  filterState: FilterState;
  flyTo: [number, number] | null;
  onFlyToConsumed: () => void;
  onSelectLocality: (name: string, city: string) => void;
  onSelectProject: (id: number, coords?: [number, number]) => void;
}

export default function MapView({
  activeTab,
  filterState,
  flyTo,
  onFlyToConsumed,
  onSelectLocality,
  onSelectProject,
}: Props) {
  const { data: locData } = useLocalities(filterState.localityStatuses);
  const { data: projData } = useProjects(filterState.projectStatuses);
  const { data: npData } = useNpTarget();

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[28.52, 77.19]}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToController flyTo={flyTo} onConsumed={onFlyToConsumed} />

        {activeTab === "map" && filterState.showLocalities && locData && (
          <LocalityLayer localities={locData.data} onSelect={onSelectLocality} />
        )}
        {activeTab === "map" && filterState.showProjects && projData && (
          <ProjectLayer projects={projData.data} onSelect={onSelectProject} />
        )}
        {activeTab === "np-target" && npData && (
          <NpTargetLayer
            data={npData.data}
            cityScales={npData.city_scales}
          />
        )}
      </MapContainer>

      {activeTab === "zero-leads" && (
        <div className="absolute inset-0 bg-gray-900 overflow-auto z-[1000]">
          <ZeroLeadsTable />
        </div>
      )}
    </div>
  );
}
