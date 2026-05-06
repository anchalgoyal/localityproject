from typing import Optional, List, Dict
from pydantic import BaseModel


class ProjectMetrics(BaseModel):
    impressions: int
    clicks: int
    paid_leads: int
    expected_leads: int
    project_conversion: Optional[str]
    avg_conversion: Optional[str]
    avg_sessions: Optional[float]
    # sessions for the specific project (from projects.csv `sessions`)
    pdp_sessions: Optional[int]
    np_target_not_met: Optional[int]
    np_target_mtd: Optional[float]
    loc_np_not_met: Optional[int]
    avg_bhk: Optional[float]
    price_per_bhk: Optional[int]


class Project(BaseModel):
    entity_id: int
    city_name: str
    project_name: str
    locality: str
    longitude: float
    lattitude: float
    avg_price: int
    status: str
    radius: float
    metrics: ProjectMetrics


class Locality(BaseModel):
    locality: str
    city_name: str
    status: str
    coords: List[List[float]]
    reclassified: bool
    surplus_leads: int
    behind_leads: int
    surplus_props: int
    behind_props: int
    net_score: int
    np_target_not_met: Optional[float]
    locality_np_target_mtd: Optional[int]
    impressions: int
    clicks: int
    paid_leads: int
    expected_leads: int
    conversion: Optional[str]
    lead_gap: Optional[int]
    loc_avg_price: Optional[int]


class CityStats(BaseModel):
    total_surplus_leads: int
    total_behind_leads: int
    avg_paid_leads: int
    avg_conversion: Optional[str]
    np_min: Optional[float]
    np_max: Optional[float]
    total_localities: int


class LocalityDetail(Locality):
    projects: List[Project]
    city_stats: CityStats


class LocalitiesResponse(BaseModel):
    data: List[Locality]
    count: int


class ProjectsResponse(BaseModel):
    data: List[Project]
    count: int


class CityScale(BaseModel):
    min_val: float
    max_val: float


class NpTargetLocality(BaseModel):
    locality: str
    city_name: str
    status: str
    coords: List[List[float]]
    np_target_not_met: float


class NpTargetResponse(BaseModel):
    data: List[NpTargetLocality]
    city_scales: Dict[str, CityScale]
    count: int


class ZeroLeadProject(BaseModel):
    entity_id: int
    city_name: str
    project_name: str
    locality: str
    status: str
    avg_price: int
    impressions: int
    clicks: int
    sessions: int


class ZeroLeadsResponse(BaseModel):
    data: List[ZeroLeadProject]
    count: int


class SummaryResponse(BaseModel):
    total_localities: int
    total_projects: int
    surplus_localities: int
    demand_gap_localities: int
    conversion_issue_localities: int
    demand_conv_issue_localities: int
    zero_lead_projects: int


class SearchResult(BaseModel):
    type: str
    name: str
    locality: Optional[str]
    city_name: Optional[str]
    status: str
    entity_id: Optional[int]
    coords: Optional[List[float]]


class SearchResponse(BaseModel):
    results: List[SearchResult]
    count: int
