import math
import os
from collections import defaultdict
from typing import Optional

import pandas as pd

LOC_COLORS = {
    "surplus present": "#22c55e",
    "demand gap": "#ef4444",
    "conversion issue": "#eab308",
    "demand + conversion issue": "#f97316",
}


class DataLoader:
    def __init__(self, data_dir: str = "./data"):
        self._data_dir = data_dir
        self._localities: list[dict] = []
        self._projects: list[dict] = []
        self._reclassified: dict[str, str] = {}
        self._loc_np_map: dict[str, Optional[float]] = {}
        self._city_stats: dict[str, dict] = {}
        self._load()

    # ── coordinate conversion ────────────────────────────────────────────────

    @staticmethod
    def merc_to_latlng(x: float, y: float) -> tuple[float, float]:
        lon = (x / 20037508.342789244) * 180
        lat = (math.atan(math.exp((y / 20037508.342789244) * math.pi)) * 360) / math.pi - 90
        return lat, lon

    # ── safe type helpers ────────────────────────────────────────────────────

    @staticmethod
    def _safe_float(val) -> Optional[float]:
        try:
            f = float(val)
            return None if math.isnan(f) or math.isinf(f) else f
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_int(val, default: int = 0) -> int:
        try:
            return int(float(val))
        except (TypeError, ValueError):
            return default

    # ── polygon parsing ──────────────────────────────────────────────────────

    def _parse_polygon(self, wkt: str) -> list[list[float]]:
        if not isinstance(wkt, str) or not wkt.strip().startswith("POLYGON"):
            return []
        inner = wkt[wkt.find("(") + 1:].strip().strip("()")
        coords = []
        for pair in inner.split(","):
            parts = pair.strip().split()
            if len(parts) >= 2:
                try:
                    lat, lon = self.merc_to_latlng(float(parts[0]), float(parts[1]))
                    coords.append([lat, lon])
                except (ValueError, IndexError):
                    pass
        return coords

    # ── reclassification (scoped to locality_id → same city via join) ────────

    @staticmethod
    def _reclassify(loc_id: str, proj_df: pd.DataFrame) -> str:
        ps = proj_df[proj_df["locality_id"] == loc_id]
        ps = ps[~ps["project_demand_status"].isin(["surplus", "data not present"])]
        if ps.empty:
            return "demand + conversion issue"
        total = len(ps)
        demand_pct = len(ps[ps["project_demand_status"] == "demand gap"]) / total
        conv_pct = len(ps[ps["project_demand_status"] == "conversion issue"]) / total
        if demand_pct > 0.60 and conv_pct <= 0.60:
            return "demand gap"
        elif conv_pct > 0.60 and demand_pct <= 0.60:
            return "conversion issue"
        else:
            return "demand + conversion issue"

    # ── lead stats per locality ──────────────────────────────────────────────

    @staticmethod
    def _loc_lead_stats(loc_id: str, proj_df: pd.DataFrame) -> dict:
        ps = proj_df[proj_df["locality_id"] == loc_id]
        surplus_ps = ps[(ps["project_demand_status"] == "surplus") & (ps["gap"] > 0)]
        behind_ps = ps[ps["gap"] < 0]
        surplus_leads = int(surplus_ps["gap"].sum()) if not surplus_ps.empty else 0
        behind_leads = int(abs(behind_ps["gap"].sum())) if not behind_ps.empty else 0
        return {
            "surplus_leads": surplus_leads,
            "behind_leads": behind_leads,
            "surplus_props": len(surplus_ps),
            "behind_props": len(behind_ps),
            "net_score": surplus_leads - behind_leads,
        }

    # ── main load ────────────────────────────────────────────────────────────

    def _load(self):
        proj_df = pd.read_csv(os.path.join(self._data_dir, "project_full.csv"))
        loc_df = pd.read_csv(os.path.join(self._data_dir, "locality_full.csv"))

        proj_df["entity_id"] = proj_df["entity_id"].astype(int)
        proj_df["paid_leads"] = proj_df["paid_leads"].fillna(0).astype(int)
        proj_df["gap"] = proj_df["gap"].fillna(0).astype(int)
        proj_df["avg_price"] = proj_df["avg_price"].fillna(0).astype(int)

        # NP lookup keyed by locality_id (internal join only)
        self._loc_np_map = {
            k: (None if (isinstance(v, float) and math.isnan(v)) else v)
            for k, v in loc_df.drop_duplicates("locality_id")
            .set_index("locality_id")["np_target_not_met"]
            .to_dict()
            .items()
        }

        # Reclassify conversion/demand gap localities (locality_id join keeps city scope)
        for loc_id in loc_df[loc_df["locality_demand_status"] == "conversion/demand gap"]["locality_id"].unique():
            self._reclassified[loc_id] = self._reclassify(loc_id, proj_df)

        # Per-city radius scaling: min/max paid_leads within each city
        city_lead_ranges: dict[str, tuple[int, int]] = {}
        for city, grp in proj_df.groupby("city_name"):
            leads = grp["paid_leads"].astype(int)
            city_lead_ranges[str(city)] = (int(leads.min()), int(leads.max()))

        def radius(paid_leads: int, city: str) -> float:
            mn, mx = city_lead_ranges.get(city, (0, 0))
            if mx == mn:
                return 5.0
            t = (paid_leads - mn) / (mx - mn)
            return 5.0 + t * 12.0

        # Build projects
        self._projects = []
        for _, row in proj_df.iterrows():
            loc_id = str(row.get("locality_id", ""))
            city = str(row.get("city_name", ""))
            loc_np = self._loc_np_map.get(loc_id)

            avg_bhk = self._safe_float(row.get("avg_bhk"))
            avg_price = self._safe_int(row.get("avg_price", 0))
            pdp_sessions = self._safe_float(row.get("sessions"))
            try:
                price_per_bhk = round(avg_price / avg_bhk) if avg_bhk and avg_bhk > 0 else None
            except (TypeError, ZeroDivisionError):
                price_per_bhk = None

            paid_leads = self._safe_int(row.get("paid_leads", 0))
            target_val = self._safe_float(row.get("target"))
            np_not_met = (paid_leads - round(target_val)) if target_val is not None else None

            self._projects.append({
                "entity_id": int(row["entity_id"]),
                "city_name": city,
                "project_name": str(row.get("project_name", "")),
                "locality": str(row.get("locality", "")),
                "locality_id": loc_id,
                "longitude": self._safe_float(row.get("longitude")) or 0.0,
                "lattitude": self._safe_float(row.get("lattitude")) or 0.0,
                "avg_price": avg_price,
                "status": str(row.get("project_demand_status", "")),
                "radius": radius(paid_leads, city),
                "metrics": {
                    "impressions": self._safe_int(row.get("impressions", 0)),
                    "clicks": self._safe_int(row.get("clicks", 0)),
                    "paid_leads": paid_leads,
                    "expected_leads": self._safe_int(row.get("expected_leads", 0)),
                    "project_conversion": f"{float(row['project_conversion'])*100:.2f}%" if pd.notna(row.get("project_conversion")) else None,
                    "avg_conversion": f"{float(row['avg_conversion'])*100:.2f}%" if pd.notna(row.get("avg_conversion")) else None,
                    "avg_sessions": self._safe_float(row.get("avg_sessions")),
                    "pdp_sessions": (
                        int(round(pdp_sessions)) if pdp_sessions is not None else None
                    ),
                    "np_target_not_met": int(np_not_met) if np_not_met is not None else None,
                    "np_target_mtd": target_val,
                    "loc_np_not_met": round(loc_np) if loc_np is not None else None,
                    "avg_bhk": round(avg_bhk, 1) if avg_bhk is not None else None,
                    "price_per_bhk": price_per_bhk,
                },
            })

        # Build localities
        self._localities = []
        for _, row in loc_df.iterrows():
            loc_id = str(row.get("locality_id", ""))
            city = str(row.get("city_name", ""))
            raw_status = str(row.get("locality_demand_status", ""))

            if raw_status == "conversion/demand gap":
                status = self._reclassified.get(loc_id, "demand + conversion issue")
                reclassified = True
            else:
                status = raw_status
                reclassified = False

            coords = self._parse_polygon(str(row.get("boundary_polygon", "")))
            lead_stats = self._loc_lead_stats(loc_id, proj_df)
            np_val = self._safe_float(row.get("np_target_not_met"))
            locality_np_target_mtd = self._safe_float(row.get("locality_np_target_mtd"))

            prices = proj_df[(proj_df["locality_id"] == loc_id) & (proj_df["avg_price"] > 0)]["avg_price"]
            loc_avg_price = int(round(prices.mean())) if not prices.empty else None

            self._localities.append({
                "locality": str(row.get("locality", "")),
                "locality_id": loc_id,
                "city_name": city,
                "status": status,
                "reclassified": reclassified,
                "coords": coords,
                "surplus_leads": lead_stats["surplus_leads"],
                "behind_leads": lead_stats["behind_leads"],
                "surplus_props": lead_stats["surplus_props"],
                "behind_props": lead_stats["behind_props"],
                "net_score": lead_stats["net_score"],
                "np_target_not_met": np_val,
                "locality_np_target_mtd": round(locality_np_target_mtd) if locality_np_target_mtd is not None else None,
                "impressions": self._safe_int(row.get("impressions", 0)),
                "clicks": self._safe_int(row.get("clicks", 0)),
                "paid_leads": self._safe_int(row.get("paid_leads", 0)),
                "expected_leads": self._safe_int(row.get("expected_leads", 0)),
                "conversion": f"{float(row['conversion'])*100:.2f}%" if pd.notna(row.get("conversion")) else None,
                "lead_gap": self._safe_int(row.get("lead_gap", 0)),
                "loc_avg_price": loc_avg_price,
            })

        # Pre-compute city-level aggregates (used in locality detail for benchmarking)
        city_buckets: dict[str, list[dict]] = defaultdict(list)
        for l in self._localities:
            city_buckets[l["city_name"]].append(l)

        for city, locs in city_buckets.items():
            surplus_vals = [l["surplus_leads"] for l in locs]
            behind_vals  = [l["behind_leads"]  for l in locs]
            paid_vals    = [l["paid_leads"]     for l in locs]
            np_vals      = [l["np_target_not_met"] for l in locs if l["np_target_not_met"] is not None]
            conv_vals    = []
            for l in locs:
                if l["conversion"]:
                    try:
                        conv_vals.append(float(l["conversion"].rstrip("%")))
                    except ValueError:
                        pass
            self._city_stats[city] = {
                "total_surplus_leads": int(sum(surplus_vals)),
                "total_behind_leads":  int(sum(behind_vals)),
                "avg_paid_leads":      round(sum(paid_vals) / len(paid_vals)) if paid_vals else 0,
                "avg_conversion":      f"{sum(conv_vals)/len(conv_vals):.2f}%" if conv_vals else None,
                "np_min":              min(np_vals) if np_vals else None,
                "np_max":              max(np_vals) if np_vals else None,
                "total_localities":    len(locs),
            }

    # ── public API methods ───────────────────────────────────────────────────

    def _strip_locality_id(self, loc: dict) -> dict:
        return {k: v for k, v in loc.items() if k != "locality_id"}

    def _strip_project_locality_id(self, proj: dict) -> dict:
        return {k: v for k, v in proj.items() if k != "locality_id"}

    def get_localities(self, statuses: list[str] | None = None) -> dict:
        data = self._localities
        if statuses:
            data = [l for l in data if l["status"] in statuses]
        return {"data": [self._strip_locality_id(l) for l in data], "count": len(data)}

    def get_locality_detail(self, locality_name: str, city_name: str | None = None) -> dict | None:
        def _matches(l: dict) -> bool:
            if l["locality"].lower() != locality_name.lower():
                return False
            if city_name and l["city_name"] != city_name:
                return False
            return True
        loc = next((l for l in self._localities if _matches(l)), None)
        if loc is None:
            return None
        loc_id = loc["locality_id"]
        projects = [self._strip_project_locality_id(p) for p in self._projects if p["locality_id"] == loc_id]
        result = self._strip_locality_id(loc)
        result["projects"] = projects
        result["city_stats"] = self._city_stats.get(loc["city_name"], {})
        return result

    def get_projects(self, statuses: list[str] | None = None, locality: str | None = None, zero_leads: bool = False) -> dict:
        data = self._projects
        if statuses:
            data = [p for p in data if p["status"] in statuses]
        if locality:
            data = [p for p in data if p["locality"].lower() == locality.lower()]
        if zero_leads:
            data = [p for p in data if p["metrics"]["paid_leads"] == 0]
        return {"data": [self._strip_project_locality_id(p) for p in data], "count": len(data)}

    def get_project(self, entity_id: int) -> dict | None:
        p = next((p for p in self._projects if p["entity_id"] == entity_id), None)
        return self._strip_project_locality_id(p) if p else None

    def get_np_target_data(self) -> dict:
        items = [
            {
                "locality": l["locality"],
                "city_name": l["city_name"],
                "status": l["status"],
                "coords": l["coords"],
                "np_target_not_met": l["np_target_not_met"],
            }
            for l in self._localities
            if l["np_target_not_met"] is not None and l["coords"]
        ]

        # Per-city min/max for independent colour scales
        city_vals: dict[str, list[float]] = defaultdict(list)
        for item in items:
            city_vals[item["city_name"]].append(item["np_target_not_met"])

        city_scales = {
            city: {"min_val": min(vals), "max_val": max(vals)}
            for city, vals in city_vals.items()
        }

        return {
            "data": items,
            "city_scales": city_scales,
            "count": len(items),
        }

    def get_zero_leads(self) -> dict:
        data = [
            {
                "entity_id": p["entity_id"],
                "city_name": p["city_name"],
                "project_name": p["project_name"],
                "locality": p["locality"],
                "status": p["status"],
                "avg_price": p["avg_price"],
                "impressions": p["metrics"]["impressions"],
                "clicks": p["metrics"]["clicks"],
                "sessions": 0,
            }
            for p in self._projects if p["metrics"]["paid_leads"] == 0
        ]
        return {"data": data, "count": len(data)}

    def get_summary(self) -> dict:
        sc: dict[str, int] = {}
        for l in self._localities:
            sc[l["status"]] = sc.get(l["status"], 0) + 1
        return {
            "total_localities": len(self._localities),
            "total_projects": len(self._projects),
            "surplus_localities": sc.get("surplus present", 0),
            "demand_gap_localities": sc.get("demand gap", 0),
            "conversion_issue_localities": sc.get("conversion issue", 0),
            "demand_conv_issue_localities": sc.get("demand + conversion issue", 0),
            "zero_lead_projects": sum(1 for p in self._projects if p["metrics"]["paid_leads"] == 0),
        }

    def search(self, q: str) -> dict:
        q_lower = q.lower()
        results = []

        for l in self._localities:
            if q_lower in l["locality"].lower():
                center = None
                if l["coords"]:
                    clat = sum(c[0] for c in l["coords"]) / len(l["coords"])
                    clon = sum(c[1] for c in l["coords"]) / len(l["coords"])
                    center = [clat, clon]
                results.append({"type": "locality", "name": l["locality"], "locality": None,
                                 "city_name": l["city_name"],
                                 "status": l["status"], "entity_id": None, "coords": center})
            if len(results) >= 20:
                break

        if len(results) < 20:
            for p in self._projects:
                if q_lower in p["project_name"].lower():
                    results.append({"type": "project", "name": p["project_name"],
                                    "locality": p["locality"], "status": p["status"],
                                    "entity_id": p["entity_id"],
                                    "coords": [p["lattitude"], p["longitude"]]})
                if len(results) >= 20:
                    break

        return {"results": results, "count": len(results)}
