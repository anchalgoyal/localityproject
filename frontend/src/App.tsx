import { useState } from "react";
import MapView from "./components/Map/MapView";
import StatsPills from "./components/Stats/StatsPills";
import SearchBar from "./components/Search/SearchBar";
import FilterPanel from "./components/Sidebar/FilterPanel";
import LocalityCard from "./components/Sidebar/LocalityCard";
import ProjectCard from "./components/Sidebar/ProjectCard";
import { useSummary, useFilterState } from "./hooks/useMapData";

export type Tab = "map" | "zero-leads" | "np-target";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [selectedLocality, setSelectedLocality] = useState<{ name: string; city: string } | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  const { data: summary } = useSummary();
  const filterState = useFilterState();

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "map", label: "Map View" },
    { id: "zero-leads", label: "Zero Leads", badge: summary?.zero_lead_projects },
    { id: "np-target", label: "NP Target" },
  ];

  const handleSelectLocality = (name: string, city: string) => {
    setSelectedLocality({ name, city });
    setSelectedProject(null);
    if (activeTab !== "map") setActiveTab("map");
  };

  const handleSelectProject = (id: number, coords?: [number, number]) => {
    setSelectedProject(id);
    setSelectedLocality(null);
    if (activeTab !== "map") setActiveTab("map");
    if (coords) setFlyTo(coords);
  };

  const handleSearchSelect = (
    coords: [number, number] | null,
    type: "locality" | "project",
    name: string,
    entityId?: number,
    cityName?: string
  ) => {
    if (coords) setFlyTo(coords);
    if (type === "locality") handleSelectLocality(name, cityName ?? "");
    else if (entityId != null) handleSelectProject(entityId, coords ?? undefined);
  };

  const showSidebar = activeTab === "map";

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-base font-bold whitespace-nowrap text-white">Demand Intelligence</h1>
        {summary && <StatsPills summary={summary} />}
        <div className="flex-1" />
        <SearchBar onSelect={handleSearchSelect} />
        <div className="flex gap-1 ml-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium relative transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && (
          <div className="w-72 bg-gray-800 border-r border-gray-700 overflow-y-auto flex-shrink-0">
            {selectedProject != null ? (
              <ProjectCard entityId={selectedProject} onClose={() => setSelectedProject(null)} />
            ) : selectedLocality != null ? (
              <LocalityCard locality={selectedLocality.name} city={selectedLocality.city} onClose={() => setSelectedLocality(null)} />
            ) : (
              <FilterPanel filterState={filterState} />
            )}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <MapView
            activeTab={activeTab}
            filterState={filterState}
            flyTo={flyTo}
            onFlyToConsumed={() => setFlyTo(null)}
            onSelectLocality={(name, city) => handleSelectLocality(name, city)}
            onSelectProject={handleSelectProject}
          />
        </div>
      </div>
    </div>
  );
}
