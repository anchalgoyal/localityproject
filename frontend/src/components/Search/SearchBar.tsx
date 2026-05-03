import { useEffect, useRef, useState } from "react";
import type { SearchResult } from "../../services/api";
import { useSearch } from "../../hooks/useMapData";
import { LOC_COLORS, PROJ_COLORS } from "../../utils/constants";

interface Props {
  onSelect: (coords: [number, number] | null, type: "locality" | "project", name: string, entityId?: number, cityName?: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setOpen(debouncedQuery.length >= 2);
  }, [debouncedQuery]);

  const { data } = useSearch(debouncedQuery);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(r: SearchResult) {
    setQuery("");
    setOpen(false);
    onSelect(r.coords, r.type, r.name, r.entity_id ?? undefined, r.city_name ?? undefined);
  }

  const colorMap = (r: SearchResult) =>
    r.type === "locality" ? LOC_COLORS[r.status] : PROJ_COLORS[r.status];

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => debouncedQuery.length >= 2 && setOpen(true)}
        placeholder="Search localities or projects…"
        className="bg-gray-700 text-white text-xs rounded px-3 py-1.5 w-56 outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
      />
      {open && data && data.results.length > 0 && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-[2000] max-h-72 overflow-y-auto">
          {data.results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 hover:bg-gray-700 flex items-center gap-2 text-xs"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${r.type === "locality" ? "rounded-sm" : ""}`}
                style={{ backgroundColor: colorMap(r) ?? "#64748b" }}
              />
              <div className="min-w-0">
                <div className="text-white truncate font-medium">{r.name}</div>
                {r.type === "locality" && r.city_name && (
                  <div className="text-gray-400 truncate">{r.city_name}</div>
                )}
                {r.locality && <div className="text-gray-400 truncate">{r.locality}</div>}
              </div>
              <span className="ml-auto text-gray-500 flex-shrink-0">{r.type === "locality" ? "Locality" : "Project"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
