import os
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backend.data_loader import DataLoader


@asynccontextmanager
async def lifespan(app: FastAPI):
    data_dir = os.environ.get("DATA_DIR", "./data")
    app.state.loader = DataLoader(data_dir)
    yield


app = FastAPI(title="Demand Intelligence API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/localities")
async def get_localities(status: List[str] = Query(default=[])):
    return app.state.loader.get_localities(statuses=status or None)


@app.get("/api/localities/{locality_name}")
async def get_locality(locality_name: str, city: Optional[str] = None):
    result = app.state.loader.get_locality_detail(locality_name, city_name=city)
    if result is None:
        raise HTTPException(status_code=404, detail="Locality not found")
    return result


@app.get("/api/projects")
async def get_projects(
    status: List[str] = Query(default=[]),
    locality: Optional[str] = None,
    zero_leads: bool = False,
):
    return app.state.loader.get_projects(
        statuses=status or None,
        locality=locality,
        zero_leads=zero_leads,
    )


@app.get("/api/projects/{entity_id}")
async def get_project(entity_id: int):
    result = app.state.loader.get_project(entity_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return result


@app.get("/api/np-target")
async def get_np_target():
    return app.state.loader.get_np_target_data()


@app.get("/api/zero-leads")
async def get_zero_leads():
    return app.state.loader.get_zero_leads()


@app.get("/api/summary")
async def get_summary():
    return app.state.loader.get_summary()


@app.get("/api/search")
async def search(q: str = Query(...)):
    return app.state.loader.search(q)
