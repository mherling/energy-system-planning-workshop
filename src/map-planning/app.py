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
from data_manager import QuartierDataManager

# Database and Data Manager instances
db = None
data_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, data_manager
    # Initialize database and data manager
    db = GridPlanningDatabase("grid_planning.db")
    data_manager = QuartierDataManager()
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

@app.get("/api/districts/{district_id}/energy-flows")
async def get_district_energy_flows(district_id: str):
    """Get detailed energy flow data for a specific district"""
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
    
    # Generate extended data using data manager
    quartier_data = data_manager.generate_quartier_data()
    target_quartier = next((q for q in quartier_data if q.id == district_id), None)
    
    if target_quartier:
        return {
            "district_id": district_id,
            "name": target_quartier.name,
            "district_type": target_quartier.district_type,
            "population": target_quartier.population,
            "area_km2": target_quartier.area_km2,
            "energy_demand": target_quartier.energy_demand,
            "primary_energy": target_quartier.primary_energy,
            "renewable_potential": target_quartier.renewable_potential,
            "current_generation": target_quartier.current_generation,
            "energy_flows": target_quartier.energy_flows,
            "building_types": target_quartier.building_types,
            "demographics": target_quartier.demographics,
            "additional_data": target_quartier.additional_data
        }
    else:
        # Fallback to basic district data
        return district

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
    """Get predefined energy price scenarios from configuration"""
    return data_manager.get_energy_scenarios()

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
    district_details = []
    
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
        
        # Add district details for overview
        district_details.append({
            'id': district['id'],
            'name': district['name'],
            'consumption_mwh': consumption,
            'production_potential_mwh': production,
            'balance_mwh': production - consumption,
            'color': data_manager.get_quartier_color(district['id'])
        })
    
    return {
        "total_consumption_mwh": round(total_consumption, 1),
        "total_production_potential_mwh": round(total_production, 1),
        "balance_mwh": round(total_production - total_consumption, 1),
        "self_sufficiency_ratio": min(total_production / total_consumption, 1.0) if total_consumption > 0 else 0,
        "districts_count": len(districts),
        "district_details": district_details
    }

@app.get("/api/analysis/co2-emissions")
async def get_co2_analysis():
    """Get CO2 emissions analysis using configured emission factors"""
    districts = await db.get_districts()
    emission_factors = data_manager.get_emission_factors()
    
    total_emissions = 0
    district_emissions = []
    
    for district in districts:
        # Extract energy demand
        energy_demand = district.get('energy_demand', {})
        if isinstance(energy_demand, str):
            energy_demand = json.loads(energy_demand)
        
        # Calculate emissions based on energy types
        electricity_emissions = energy_demand.get('electricity_mwh', 0) * 1000 * emission_factors.get('electricity_grid_kg_co2_per_kwh', 0.4)
        heating_emissions = energy_demand.get('heating_mwh', 0) * 1000 * emission_factors.get('gas_kg_co2_per_kwh', 0.2)
        
        district_total = electricity_emissions + heating_emissions
        total_emissions += district_total
        
        district_emissions.append({
            'id': district['id'],
            'name': district['name'],
            'emissions_tons': round(district_total / 1000, 1),
            'color': data_manager.get_quartier_color(district['id'])
        })
    
    return {
        "total_emissions_tons": round(total_emissions / 1000, 1),
        "emission_factors": emission_factors,
        "districts_analyzed": len(districts),
        "district_emissions": district_emissions
    }

@app.get("/api/districts/{district_id}/energy-flow")
async def get_district_energy_flow(district_id: str):
    """Get detailed energy flow data for a specific district"""
    districts = await db.get_districts()
    district = next((d for d in districts if d['id'] == district_id), None)
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    
    # Parse JSON fields for detailed view
    energy_demand = district.get('energy_demand', {})
    if isinstance(energy_demand, str):
        energy_demand = json.loads(energy_demand)
    
    primary_energy_mix = district.get('primary_energy_mix', {})
    if isinstance(primary_energy_mix, str):
        primary_energy_mix = json.loads(primary_energy_mix)
    
    renewable_potential = district.get('renewable_potential', {})
    if isinstance(renewable_potential, str):
        renewable_potential = json.loads(renewable_potential)
    
    current_generation = district.get('current_generation', {})
    if isinstance(current_generation, str):
        current_generation = json.loads(current_generation)
    
    utilized_potential = district.get('utilized_potential', {})
    if isinstance(utilized_potential, str):
        utilized_potential = json.loads(utilized_potential)
    
    # Calculate energy flows
    heating_demand = energy_demand.get('heating_mwh', 0)
    heating_mix = primary_energy_mix.get('heating', {})
    
    electricity_demand = energy_demand.get('electricity_mwh', 0)
    electricity_mix = primary_energy_mix.get('electricity', {})
    
    transport_demand = energy_demand.get('transport_mwh', 0)
    transport_mix = primary_energy_mix.get('transport', {})
    
    # Calculate primary energy consumption by carrier
    primary_energy_flows = {
        'heating': {
            'gas_mwh': round(heating_demand * heating_mix.get('gas_pct', 0) / 100, 1),
            'oil_mwh': round(heating_demand * heating_mix.get('oil_pct', 0) / 100, 1),
            'heat_pump_mwh': round(heating_demand * heating_mix.get('heat_pump_pct', 0) / 100, 1),
            'biomass_mwh': round(heating_demand * heating_mix.get('biomass_pct', 0) / 100, 1),
            'district_heating_mwh': round(heating_demand * heating_mix.get('district_heating_pct', 0) / 100, 1),
            'direct_electric_mwh': round(heating_demand * heating_mix.get('direct_electric_pct', 0) / 100, 1)
        },
        'electricity': {
            'grid_import_mwh': round(electricity_demand * electricity_mix.get('grid_import_pct', 0) / 100, 1),
            'local_pv_mwh': round(electricity_demand * electricity_mix.get('local_pv_pct', 0) / 100, 1),
            'local_wind_mwh': round(electricity_demand * electricity_mix.get('local_wind_pct', 0) / 100, 1),
            'local_chp_mwh': round(electricity_demand * electricity_mix.get('local_chp_pct', 0) / 100, 1)
        },
        'transport': {
            'gasoline_mwh': round(transport_demand * transport_mix.get('gasoline_pct', 0) / 100, 1),
            'diesel_mwh': round(transport_demand * transport_mix.get('diesel_pct', 0) / 100, 1),
            'electric_mwh': round(transport_demand * transport_mix.get('electric_pct', 0) / 100, 1),
            'public_transport_mwh': round(transport_demand * transport_mix.get('public_transport_pct', 0) / 100, 1),
            'cycling_walking_mwh': round(transport_demand * transport_mix.get('cycling_walking_pct', 0) / 100, 1)
        }
    }
    
    return {
        'district_id': district_id,
        'district_name': district['name'],
        'energy_demand': energy_demand,
        'primary_energy_mix': primary_energy_mix,
        'primary_energy_flows': primary_energy_flows,
        'renewable_potential': renewable_potential,
        'current_generation': current_generation,
        'utilized_potential': utilized_potential,
        'total_renewable_generation': sum(current_generation.values()) if current_generation else 0,
        'renewable_share_pct': round(sum(current_generation.values()) / energy_demand.get('total_annual_mwh', 1) * 100, 1) if current_generation and energy_demand.get('total_annual_mwh', 0) > 0 else 0
    }

@app.get("/api/system-config")
async def get_system_config():
    """Get system configuration parameters"""
    return {
        "regional_parameters": data_manager.get_regional_parameters(),
        "emission_factors": data_manager.get_emission_factors(),
        "quartier_colors": {f"quartier_{i}": data_manager.get_quartier_color(f"quartier_{i}") for i in range(1, 9)}
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )
