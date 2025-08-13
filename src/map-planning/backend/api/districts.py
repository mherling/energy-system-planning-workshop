"""
API Router für Quartier/District-bezogene Endpunkte
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from ..services.district_service import DistrictService

router = APIRouter(prefix="/api/districts", tags=["districts"])

# Wird von der main app.py importiert
district_service = None

def set_district_service(service: DistrictService):
    global district_service
    district_service = service

@router.get("/")
async def get_districts():
    """Get all districts with their data"""
    if not district_service:
        raise HTTPException(status_code=500, detail="District service not initialized")
    return await district_service.get_all_districts()

@router.get("/{district_id}")
async def get_district(district_id: str):
    """Get specific district by ID"""
    if not district_service:
        raise HTTPException(status_code=500, detail="District service not initialized")
    return await district_service.get_district(district_id)

@router.get("/{district_id}/energy-balance")
async def get_district_energy_balance(district_id: str):
    """Get energy balance for specific district"""
    if not district_service:
        raise HTTPException(status_code=500, detail="District service not initialized")
    return await district_service.get_energy_balance(district_id)

@router.get("/{district_id}/energy-flows")
async def get_district_energy_flows(district_id: str):
    """Get energy flows for specific district"""
    if not district_service:
        raise HTTPException(status_code=500, detail="District service not initialized")
    return await district_service.get_energy_flows(district_id)

@router.put("/{district_id}")
async def update_district(district_id: str, district_data: dict):
    """Update district data"""
    if not district_service:
        raise HTTPException(status_code=500, detail="District service not initialized")
    return await district_service.update_district(district_id, district_data)
