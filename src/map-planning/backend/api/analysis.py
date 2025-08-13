"""
API Router für Analyse-bezogene Endpunkte
"""
from fastapi import APIRouter, HTTPException
from ..services.analysis_service import AnalysisService

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

# Wird von der main app.py importiert
analysis_service = None

def set_analysis_service(service: AnalysisService):
    global analysis_service
    analysis_service = service

@router.get("/energy-balance")
async def get_energy_balance():
    """Get overall energy balance"""
    if not analysis_service:
        raise HTTPException(status_code=500, detail="Analysis service not initialized")
    return await analysis_service.get_energy_balance()

@router.get("/co2-emissions")
async def get_co2_emissions():
    """Get CO2 emissions analysis"""
    if not analysis_service:
        raise HTTPException(status_code=500, detail="Analysis service not initialized")
    return await analysis_service.get_co2_emissions()

@router.get("/renewable-potential")
async def get_renewable_potential():
    """Get renewable energy potential"""
    if not analysis_service:
        raise HTTPException(status_code=500, detail="Analysis service not initialized")
    return await analysis_service.get_renewable_potential()

@router.get("/detailed-analysis")
async def get_detailed_analysis():
    """Get detailed energy analysis"""
    if not analysis_service:
        raise HTTPException(status_code=500, detail="Analysis service not initialized")
    return await analysis_service.get_detailed_analysis()
