"""
Bereinigte Grid-basierte Energiesystemplanung für Zittau
Einfache 4x4 Raster-Struktur mit vordefinierten Daten
Erweitert um modulare Konfigurationsverwaltung
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import json
from contextlib import asynccontextmanager
from database import GridPlanningDatabase
from data_manager import QuartierDataManager
from config_manager import get_config_manager

# Database and Data Manager instances
db = None
data_manager = None
config_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, data_manager, config_manager
    # Initialize database, data manager, and configuration manager
    db = GridPlanningDatabase("grid_planning.db")
    data_manager = QuartierDataManager()
    config_manager = get_config_manager("data")
    await db.initialize()
    
    # Validate configuration
    validation = config_manager.validate_configuration()
    if not validation['is_valid']:
        print("Configuration validation errors:", validation['errors'])
    if validation['warnings']:
        print("Configuration warnings:", validation['warnings'])
    
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

@app.get("/favicon.ico")
async def favicon():
    return FileResponse("static/favicon.ico")

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

# Configuration API - NEW ENDPOINTS
@app.get("/api/config/quartiers")
async def get_quartier_config():
    """Get complete quartier configuration from YAML"""
    if not data_manager.config:
        raise HTTPException(status_code=500, detail="Quartier configuration not loaded")
    
    return {
        "quartiers": data_manager.config.get("quartiers", {}),
        "district_type_defaults": data_manager.config.get("district_type_defaults", {}),
        "schema": data_manager.config.get("schema", {})
    }

@app.get("/api/config/system")
async def get_system_config_detailed():
    """Get complete system configuration from YAML"""
    if not data_manager.system_config:
        raise HTTPException(status_code=500, detail="System configuration not loaded")
    
    return {
        "energy_scenarios": data_manager.system_config.get("energy_scenarios", {}),
        "emission_factors": data_manager.system_config.get("emission_factors", {}),
        "technical_parameters": data_manager.system_config.get("technical_parameters", {}),
        "regional_parameters": data_manager.system_config.get("regional_parameters", {}),
        "analysis_settings": data_manager.system_config.get("analysis_settings", {}),
        "quartier_colors": data_manager.system_config.get("quartier_colors", {})
    }

@app.get("/api/config/quartiers/{quartier_key}")
async def get_quartier_details_config(quartier_key: str):
    """Get detailed configuration for a specific quartier"""
    if not data_manager.config:
        raise HTTPException(status_code=500, detail="Quartier configuration not loaded")
    
    quartiers = data_manager.config.get("quartiers", {})
    if quartier_key not in quartiers:
        raise HTTPException(status_code=404, detail=f"Quartier '{quartier_key}' not found in configuration")
    
    quartier_data = quartiers[quartier_key]
    district_type = quartier_data.get("district_type", "mixed")
    defaults = data_manager.config.get("district_type_defaults", {}).get(district_type, {})
    
    return {
        "key": quartier_key,
        "quartier_data": quartier_data,
        "district_type_defaults": defaults,
        "schema": data_manager.config.get("schema", {})
    }

# =============================================================================
# NEW CONFIGURATION API ENDPOINTS
# =============================================================================

@app.get("/api/config/stakeholders")
async def get_stakeholder_configurations():
    """Get all stakeholder configurations"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    stakeholders = config_manager.get_stakeholder_templates()
    return {
        "stakeholder_templates": stakeholders,
        "stakeholder_count": len(stakeholders)
    }

@app.get("/api/config/stakeholders/{stakeholder_id}")
async def get_stakeholder_config(stakeholder_id: str):
    """Get specific stakeholder configuration"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    stakeholder = config_manager.get_stakeholder_config(stakeholder_id)
    if not stakeholder:
        raise HTTPException(status_code=404, detail=f"Stakeholder {stakeholder_id} not found")
    
    return {
        "stakeholder_id": stakeholder_id,
        "configuration": stakeholder
    }

@app.get("/api/config/technologies")
async def get_technology_configurations():
    """Get all technology configurations"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    technologies = config_manager.get_technology_templates()
    
    # Group by category for backwards compatibility
    categories = {}
    for tech_id, tech_data in technologies.items():
        category = tech_data.get('category', 'other')
        if category not in categories:
            categories[category] = {}
        categories[category][tech_id] = tech_data
    
    return {
        "technology_templates": technologies,
        "technology_categories": categories,
        "technology_count": len(technologies)
    }

@app.get("/api/config/technologies/{category}")
async def get_technology_category(category: str):
    """Get specific technology category"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    tech_category = config_manager.get_technology_config(category)
    if not tech_category:
        raise HTTPException(status_code=404, detail=f"Technology category {category} not found")
    
    return {
        "category": category,
        "technologies": tech_category
    }

@app.get("/api/config/measures")
async def get_measures_catalog():
    """Get complete measures catalog"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    measures = config_manager.get_measures_catalog()
    combinations = config_manager.get_measure_combinations()
    phases = config_manager.get_implementation_phases()
    
    return {
        "measures_catalog": measures,
        "measure_combinations": combinations,
        "implementation_phases": phases,
        "total_measures": len(measures)
    }

@app.get("/api/config/measures/quarter/{quarter_type}")
async def get_measures_for_quarter(quarter_type: str):
    """Get suitable measures for a specific quarter type"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    quarter_types = config_manager.get_quarter_types()
    if quarter_type not in quarter_types:
        raise HTTPException(status_code=404, detail=f"Quarter type {quarter_type} not found")
    
    suitable_measures = config_manager.get_measures_for_quarter(quarter_type)
    
    return {
        "quarter_type": quarter_type,
        "quarter_info": quarter_types[quarter_type],
        "suitable_measures": suitable_measures,
        "measure_count": len(suitable_measures)
    }

@app.get("/api/config/quarters")
async def get_quarter_types():
    """Get quarter type definitions - returns empty since we only use specific quartiers"""
    return {
        "quarter_types": {},
        "quarter_count": 0,
        "message": "Using specific Zittau quartiers instead of generic quarter types"
    }

@app.get("/api/config/quartiers")
async def get_zittau_quartiers():
    """Get Zittau quartier configurations"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    quartiers = config_manager.get_zittau_quartiers()
    templates = config_manager.get_quartier_templates()
    
    return {
        "quartiers": quartiers,
        "quartier_count": len(quartiers),
        "district_type_defaults": templates.get('district_type_defaults', {}),
        "stakeholder_templates": config_manager.get_stakeholder_templates(),
        "technology_templates": config_manager.get_technology_templates(),
        "schema": templates.get('schema', {})
    }

@app.get("/api/config/system")
async def get_system_parameters():
    """Get system parameters and game settings"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    system_params = config_manager.get_system_parameters()
    game_settings = config_manager.get_game_settings()
    energy_scenarios = config_manager.get_energy_scenarios()
    
    return {
        "system_parameters": system_params,
        "game_settings": game_settings,
        "energy_scenarios": energy_scenarios
    }

@app.post("/api/game/consensus/{measure_id}")
async def calculate_measure_consensus(measure_id: str, stakeholder_data: dict):
    """Calculate consensus for a measure among active stakeholders"""
    global config_manager
    if not config_manager:
        raise HTTPException(status_code=500, detail="Configuration manager not initialized")
    
    active_stakeholders = stakeholder_data.get('active_stakeholders', [])
    if not active_stakeholders:
        raise HTTPException(status_code=400, detail="No active stakeholders provided")
    
    # Verify measure exists
    measures = config_manager.get_measures_catalog()
    if measure_id not in measures:
        raise HTTPException(status_code=404, detail=f"Measure {measure_id} not found")
    
    consensus = config_manager.calculate_measure_consensus(measure_id, active_stakeholders)
    
    # Add detailed stakeholder positions
    stakeholder_details = {}
    for stakeholder_id in active_stakeholders:
        support_info = config_manager.get_stakeholder_measure_support(stakeholder_id, measure_id)
        stakeholder_details[stakeholder_id] = support_info
    
    return {
        "measure_id": measure_id,
        "consensus_analysis": consensus,
        "stakeholder_positions": stakeholder_details
    }

@app.get("/api/config/technology-templates")
async def get_technology_templates_config():
    """Get technology templates from configuration (legacy endpoint)"""
    global config_manager
    if config_manager:
        # Use new configuration system
        try:
            technologies = config_manager.get_technology_templates()
            
            # Group by categories for old format compatibility
            categories = set()
            for tech_data in technologies.values():
                categories.add(tech_data.get('category', 'other'))
            
            return {
                "technology_templates": technologies,
                "categories": list(categories),
                "schema": {}
            }
        except Exception as e:
            print(f"Error in new config system: {e}")
            # Fallback to old system
            pass
    
    # Fallback to old system
    if not data_manager or not data_manager.config:
        # Return minimal structure to prevent frontend errors
        return {
            "technology_templates": {},
            "categories": ["generation", "storage", "conversion", "efficiency"],
            "schema": {}
        }
    
    return {
        "technology_templates": data_manager.config.get("technology_templates", {}),
        "categories": ["generation", "storage", "conversion", "efficiency"],
        "schema": data_manager.config.get("schema", {})
    }

@app.get("/api/config/stakeholder-templates")
async def get_stakeholder_templates_config():
    """Get stakeholder templates from configuration (legacy endpoint)"""
    global config_manager
    if config_manager:
        # Try new configuration system first
        try:
            stakeholder_templates = config_manager.get_stakeholder_templates()
            if stakeholder_templates:
                return {
                    "stakeholder_templates": stakeholder_templates,
                    "schema": {}
                }
        except Exception as e:
            print(f"Error accessing new stakeholder templates: {e}")
    
    # Fallback to old system
    if not data_manager or not data_manager.config:
        return {
            "stakeholder_templates": {},
            "schema": {}
        }
    
    return {
        "stakeholder_templates": data_manager.config.get("stakeholder_templates", {}),
        "schema": data_manager.config.get("schema", {})
    }

@app.get("/api/config/energy-scenarios")
async def get_energy_scenarios_detailed():
    """Get detailed energy price scenarios"""
    global config_manager
    if config_manager:
        # Use new configuration system
        try:
            energy_scenarios = config_manager.get_energy_scenarios()
            if energy_scenarios:
                return {
                    "scenarios": energy_scenarios,
                    "scenario_count": len(energy_scenarios),
                    "years": [2025, 2030, 2040, 2050],
                    "price_types": ["electricity_prices", "gas_prices", "heat_prices", "co2_prices"]
                }
        except Exception as e:
            print(f"Error accessing energy scenarios: {e}")
    
    # Fallback to old system
    if not data_manager or not data_manager.system_config:
        return {
            "scenarios": {},
            "scenario_count": 0,
            "years": [2025, 2030, 2040, 2050],
            "price_types": ["electricity_prices", "gas_prices", "heat_prices", "co2_prices"]
        }
    
    scenarios = data_manager.system_config.get("energy_scenarios", {})
    return {
        "scenarios": scenarios,
        "scenario_count": len(scenarios),
        "years": [2025, 2030, 2040, 2050],
        "price_types": ["electricity_prices", "gas_prices", "heat_prices", "co2_prices"]
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8001,
        reload=True,
        log_level="info"
    )
