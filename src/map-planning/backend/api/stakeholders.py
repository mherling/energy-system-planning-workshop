"""
API Router für Stakeholder-bezogene Endpunkte
"""
from fastapi import APIRouter, HTTPException
from ..services.stakeholder_service import StakeholderService

router = APIRouter(prefix="/api/stakeholders", tags=["stakeholders"])

# Wird von der main app.py importiert
stakeholder_service = None

def set_stakeholder_service(service: StakeholderService):
    global stakeholder_service
    stakeholder_service = service

@router.get("/")
async def get_stakeholders():
    """Get all stakeholders"""
    if not stakeholder_service:
        raise HTTPException(status_code=500, detail="Stakeholder service not initialized")
    return await stakeholder_service.get_all_stakeholders()

@router.post("/")
async def create_stakeholder(stakeholder_data: dict):
    """Create new stakeholder"""
    if not stakeholder_service:
        raise HTTPException(status_code=500, detail="Stakeholder service not initialized")
    return await stakeholder_service.create_stakeholder(stakeholder_data)

@router.put("/{stakeholder_id}")
async def update_stakeholder(stakeholder_id: str, stakeholder_data: dict):
    """Update stakeholder"""
    if not stakeholder_service:
        raise HTTPException(status_code=500, detail="Stakeholder service not initialized")
    return await stakeholder_service.update_stakeholder(stakeholder_id, stakeholder_data)

@router.delete("/{stakeholder_id}")
async def delete_stakeholder(stakeholder_id: str):
    """Delete stakeholder"""
    if not stakeholder_service:
        raise HTTPException(status_code=500, detail="Stakeholder service not initialized")
    return await stakeholder_service.delete_stakeholder(stakeholder_id)
