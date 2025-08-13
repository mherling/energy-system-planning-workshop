"""
Bereinigte Grid-basierte Energiesystemplanung für Zittau
Einfache 4x4 Raster-Struktur mit vordefinierten Daten
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import json
from contextlib import asynccontextmanager
from database import GridPlanningDatabase

# Database instance
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db
    # Initialize database
    db = GridPlanningDatabase("grid_planning.db")
    await db.initialize()
    yield
    # Cleanup
    await db.close()

# Create FastAPI app
app = FastAPI(
    title="Energiesystemplanung Zittau - Grid Edition",
    description="Grid-basierte Energieplanung mit 4x4 Raster",
    version="2.0.0",
    lifespan=lifespan
)

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

# Grid District API
@app.get("/api/districts")
async def get_districts():
    """Get all grid districts with their data"""
    return await db.get_districts()

@app.get("/api/districts/{district_id}/detailed")
async def get_district_detailed(district_id: str):
    """Get detailed district information including all extended data"""
    districts = await db.get_districts()
    district = next((d for d in districts if d['id'] == district_id), None)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    # Parse JSON fields for detailed view
    if isinstance(district.get('energy_demand'), str):
        district['energy_demand'] = json.loads(district['energy_demand'])
    if isinstance(district.get('renewable_potential'), str):
        district['renewable_potential'] = json.loads(district['renewable_potential'])
    if isinstance(district.get('additional_data'), str):
        district['additional_data'] = json.loads(district['additional_data'])
    if isinstance(district.get('building_types'), str):
        district['building_types'] = json.loads(district['building_types'])
    
    return district

@app.get("/api/districts/{district_id}/stakeholders")
async def get_district_stakeholders(district_id: str):
    """Get all stakeholders assigned to a specific district"""
    stakeholders = await db.get_stakeholders()
    district_stakeholders = [s for s in stakeholders if s.get('district_id') == district_id]
    
    return {
        "district_id": district_id,
        "stakeholder_count": len(district_stakeholders),
        "stakeholders": district_stakeholders,
        "influence_distribution": {
            "high": len([s for s in district_stakeholders if s.get('influence_level') == 'high']),
            "medium": len([s for s in district_stakeholders if s.get('influence_level') == 'medium']),
            "low": len([s for s in district_stakeholders if s.get('influence_level') == 'low'])
        }
    }

@app.post("/api/districts/{district_id}/energy-data")
async def update_district_energy_data(district_id: str, energy_data: dict):
    """Update energy consumption/production data for a district"""
    districts = await db.get_districts()
    district = next((d for d in districts if d['id'] == district_id), None)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    # Update district data
    await db.update_district_energy_data(district_id, energy_data)
    return {"message": "Energy data updated successfully"}

# Stakeholder API
@app.get("/api/stakeholders")
async def get_stakeholders():
    """Get all stakeholders"""
    return await db.get_stakeholders()

@app.get("/api/stakeholders/influence-matrix")
async def get_stakeholder_influence():
    """Get stakeholder influence analysis"""
    stakeholders = await db.get_stakeholders()
    
    # Create influence matrix
    matrix = {}
    for stakeholder in stakeholders:
        matrix[stakeholder['id']] = {
            'name': stakeholder['name'],
            'category': stakeholder['category'],
            'influence_level': stakeholder.get('influence_level', 'medium'),
            'participation_willingness': stakeholder.get('participation_willingness', 'medium'),
            'key_interests': stakeholder.get('key_interests', [])
        }
    
    return matrix

# Energy Scenario API
@app.get("/api/energy-scenarios")
async def get_energy_scenarios():
    """Get predefined energy price scenarios"""
    return {
        "base_case": {
            "name": "Basis-Szenario 2025",
            "description": "Aktuelle Marktpreise mit moderater Steigerung",
            "electricity_prices": {"2025": 0.32, "2030": 0.35, "2040": 0.40, "2050": 0.45},
            "gas_prices": {"2025": 0.08, "2030": 0.10, "2040": 0.15, "2050": 0.20},
            "heat_prices": {"2025": 0.09, "2030": 0.11, "2040": 0.14, "2050": 0.18},
            "co2_prices": {"2025": 45, "2030": 65, "2040": 100, "2050": 150}
        },
        "high_prices": {
            "name": "Hohe Energiepreise",
            "description": "Szenario mit deutlich steigenden Energiekosten",
            "electricity_prices": {"2025": 0.38, "2030": 0.45, "2040": 0.55, "2050": 0.65},
            "gas_prices": {"2025": 0.12, "2030": 0.18, "2040": 0.25, "2050": 0.35},
            "heat_prices": {"2025": 0.13, "2030": 0.18, "2040": 0.22, "2050": 0.28},
            "co2_prices": {"2025": 55, "2030": 85, "2040": 130, "2050": 200}
        },
        "green_transition": {
            "name": "Grüne Energiewende",
            "description": "Beschleunigte Dekarbonisierung mit sinkenden EE-Kosten",
            "electricity_prices": {"2025": 0.30, "2030": 0.28, "2040": 0.25, "2050": 0.22},
            "gas_prices": {"2025": 0.10, "2030": 0.15, "2040": 0.25, "2050": 0.40},
            "heat_prices": {"2025": 0.10, "2030": 0.12, "2040": 0.15, "2050": 0.18},
            "co2_prices": {"2025": 50, "2030": 80, "2040": 120, "2050": 180}
        }
    }

# Technology Templates API
@app.get("/api/technology-templates")
async def get_technology_templates():
    """Get available technology templates for districts"""
    return await db.get_technology_templates()

# Analysis API
@app.get("/api/analysis/energy-balance")
async def get_energy_balance():
    """Get overall energy balance for all districts"""
    districts = await db.get_districts()
    
    total_consumption = 0
    total_production = 0
    
    for district in districts:
        # Extract consumption from energy_demand
        energy_demand = district.get('energy_demand', {})
        if isinstance(energy_demand, str):
            energy_demand = json.loads(energy_demand)
        consumption = energy_demand.get('total_annual_mwh', 0)
        total_consumption += consumption
        
        # Extract production from renewable_potential
        renewable_potential = district.get('renewable_potential', {})
        if isinstance(renewable_potential, str):
            renewable_potential = json.loads(renewable_potential)
        production = renewable_potential.get('total_potential_mwh', 0)
        total_production += production
    
    return {
        "total_consumption_mwh": total_consumption,
        "total_production_potential_mwh": total_production,
        "balance_mwh": total_production - total_consumption,
        "self_sufficiency_ratio": min(total_production / total_consumption, 1.0) if total_consumption > 0 else 0,
        "districts_count": len(districts)
    }

@app.get("/api/analysis/co2-emissions")
async def get_co2_analysis():
    """Get CO2 emissions analysis"""
    districts = await db.get_districts()
    
    total_emissions = 0
    for district in districts:
        # Simple calculation: consumption * emission factor
        consumption = district.get('energy_consumption', 0)
        emission_factor = 0.4  # kg CO2/kWh (German grid mix)
        total_emissions += consumption * emission_factor
    
    return {
        "total_emissions_tons": total_emissions / 1000,  # Convert to tons
        "emission_factor_kg_per_kwh": 0.4,
        "districts_analyzed": len(districts)
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
