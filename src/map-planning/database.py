"""
New grid-based database setup for Zittau energy planning
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import aiosqlite

class GridPlanningDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        
    async def initialize(self):
        """Initialize database with required tables and data"""
        self.init_database()
        self.populate_grid_data()
        
    def init_database(self):
        """Initialize database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Districts table (now grid-based)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS districts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    grid_row INTEGER NOT NULL,
                    grid_col INTEGER NOT NULL,
                    bounds TEXT NOT NULL,  -- JSON polygon coordinates
                    center TEXT NOT NULL,  -- JSON [lat, lng]
                    district_type TEXT NOT NULL,  -- residential, commercial, industrial, mixed
                    population INTEGER NOT NULL,
                    area_km2 REAL NOT NULL,
                    building_types TEXT NOT NULL,  -- JSON object
                    energy_demand TEXT NOT NULL,   -- JSON object  
                    renewable_potential TEXT NOT NULL,  -- JSON object
                    additional_data TEXT DEFAULT '{}',  -- JSON object for extended data
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Extended stakeholders table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS stakeholders (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,  -- municipality, utility, citizen_group, business, research, ngo, housing
                    contact TEXT NOT NULL,  -- JSON object
                    interests TEXT NOT NULL,  -- JSON array
                    district_id TEXT NOT NULL,
                    influence_level TEXT DEFAULT 'medium',  -- high, medium, low
                    participation_willingness TEXT DEFAULT 'medium',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (district_id) REFERENCES districts (id)
                )
            ''')
            
            # Scenarios table with energy prices
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS scenarios (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    base_year INTEGER DEFAULT 2025,
                    target_year INTEGER DEFAULT 2045,
                    energy_prices TEXT NOT NULL,  -- JSON with electricity, gas, heat prices
                    co2_prices TEXT NOT NULL,     -- JSON with CO2 price trajectory
                    policy_framework TEXT,        -- JSON with policies/subsidies
                    district_id TEXT,
                    technologies TEXT,            -- JSON array of selected technologies
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (district_id) REFERENCES districts (id)
                )
            ''')
            
            # Technology templates (enhanced)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS technology_templates (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,      -- generation, storage, conversion, consumption
                    technology_type TEXT NOT NULL,
                    parameters TEXT NOT NULL,    -- JSON with technical parameters
                    cost_data TEXT NOT NULL,     -- JSON with cost information
                    environmental_data TEXT,    -- JSON with CO2, etc.
                    availability TEXT DEFAULT 'available',  -- available, future, restricted
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()

    def populate_grid_data(self):
        """Populate database with 4x4 grid for Zittau"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Clear existing data
            cursor.execute("DELETE FROM scenarios")
            cursor.execute("DELETE FROM stakeholders") 
            cursor.execute("DELETE FROM districts")
            cursor.execute("DELETE FROM technology_templates")
            
            # Create 4x4 grid
            grid_size = 4
            base_lat = 51.0000  # Zittau center
            base_lon = 14.8100
            cell_size = 0.008   # roughly 800m per cell
            
            district_types = ['residential', 'commercial', 'industrial', 'mixed']
            
            districts_data = []
            for row in range(grid_size):
                for col in range(grid_size):
                    grid_id = f"grid_{row+1}_{col+1}"
                    grid_name = f"Raster {row+1}-{col+1}"
                    
                    # Calculate coordinates
                    lat_offset = (row - 1.5) * cell_size  # center the grid
                    lon_offset = (col - 1.5) * cell_size
                    
                    center_lat = base_lat + lat_offset
                    center_lon = base_lon + lon_offset
                    
                    lat_min = center_lat - cell_size/2
                    lat_max = center_lat + cell_size/2
                    lon_min = center_lon - cell_size/2
                    lon_max = center_lon + cell_size/2
                    
                    bounds = [
                        [lon_min, lat_min], [lon_max, lat_min],
                        [lon_max, lat_max], [lon_min, lat_max],
                        [lon_min, lat_min]
                    ]
                    
                    # Determine district type based on position
                    if row <= 1 and col <= 1:
                        district_type = 'residential'
                    elif row <= 1 and col >= 2:
                        district_type = 'commercial'
                    elif row >= 2 and col <= 1:
                        district_type = 'industrial'
                    else:
                        district_type = 'mixed'
                    
                    # Generate realistic data based on type
                    if district_type == 'residential':
                        pop = 1200 + (row * col * 150)
                        buildings = {
                            "residential": 150 + row*20, 
                            "commercial": 8, 
                            "public": 3,
                            "single_family": 90 + row*15,
                            "multi_family": 60 + row*5,
                            "total_units": 280 + row*25
                        }
                        elec = 2800 + pop
                        heat = 2200 + int(pop * 0.8)
                        transport = {"cars": int(pop * 0.6), "bikes": int(pop * 1.2), "ev_charging": row*5 + 8}
                        pv_pot = 700 + col*100
                        solar_th = 450 + col*60
                        wind_pot = 150
                        demographics = {
                            "avg_age": 42 + row*2,
                            "households": int(pop / 2.1),
                            "avg_income": 32000 + col*2000,
                            "education_high": 0.35 + col*0.05
                        }
                        infrastructure = {
                            "schools": 2 + row,
                            "kindergartens": 1 + col,
                            "medical": 1,
                            "shopping": 3 + col*2,
                            "green_space_pct": 0.25 + col*0.05
                        }
                        
                    elif district_type == 'commercial':
                        pop = 400 + (row * col * 80)
                        buildings = {
                            "commercial": 60 + col*15, 
                            "residential": 80, 
                            "public": 12,
                            "office": 35 + col*8,
                            "retail": 25 + col*7,
                            "total_floor_area": 45000 + col*8000
                        }
                        elec = 4500 + pop*2
                        heat = 3200 + int(pop * 1.2)
                        transport = {"cars": int(pop * 0.8), "commercial_vehicles": 120 + col*20, "ev_charging": col*8 + 15}
                        pv_pot = 1200 + col*180
                        solar_th = 280
                        wind_pot = 200
                        demographics = {
                            "avg_age": 38 + row,
                            "households": int(pop / 2.3),
                            "avg_income": 38000 + col*3000,
                            "education_high": 0.45 + col*0.05
                        }
                        infrastructure = {
                            "offices": 15 + col*3,
                            "shops": 25 + col*5,
                            "restaurants": 8 + col*2,
                            "parking_spaces": 450 + col*80,
                            "public_transport": "excellent" if col >= 2 else "good"
                        }
                        
                    elif district_type == 'industrial':
                        pop = 200 + (row * col * 40)
                        buildings = {
                            "industrial": 25 + row*5, 
                            "commercial": 15, 
                            "residential": 45,
                            "factory_halls": 18 + row*3,
                            "warehouses": 12 + row*2,
                            "total_industrial_area": 85000 + row*15000
                        }
                        elec = 8500 + pop*4
                        heat = 6800 + int(pop * 2.5)
                        transport = {"cars": int(pop * 0.9), "trucks": 80 + row*15, "logistics": "high", "ev_charging": row*6 + 10}
                        pv_pot = 1800 + row*250
                        solar_th = 150
                        wind_pot = 950 + row*120
                        demographics = {
                            "avg_age": 41 + row,
                            "households": int(pop / 2.4),
                            "avg_income": 45000 + row*3000,
                            "education_technical": 0.65 + row*0.05
                        }
                        infrastructure = {
                            "companies": 12 + row*2,
                            "employees": 850 + row*200,
                            "industrial_sectors": ["automotive", "machinery", "textiles", "logistics"],
                            "rail_access": True if row >= 2 else False,
                            "waste_facilities": 2 + row
                        }
                        
                    else:  # mixed
                        pop = 850 + (row * col * 110)
                        buildings = {
                            "residential": 110, 
                            "commercial": 35, 
                            "industrial": 12, 
                            "public": 8,
                            "mixed_use": 25 + (row+col)*3,
                            "cultural": 4 + row,
                            "total_diversity_index": 0.8 + (row+col)*0.05
                        }
                        elec = 3800 + pop*1.5
                        heat = 3000 + int(pop * 1.1)
                        transport = {"cars": int(pop * 0.7), "bikes": int(pop * 1.5), "public_transport_usage": 0.4, "ev_charging": (row+col)*4 + 12}
                        pv_pot = 950 + (row+col)*80
                        solar_th = 380
                        wind_pot = 420 + (row+col)*60
                        demographics = {
                            "avg_age": 40 + (row+col),
                            "households": int(pop / 2.2),
                            "avg_income": 35000 + (row+col)*2500,
                            "diversity_index": 0.6 + (row+col)*0.08,
                            "education_mix": 0.42 + (row+col)*0.03
                        }
                        infrastructure = {
                            "mixed_facilities": 15 + (row+col)*2,
                            "cultural_venues": 3 + row,
                            "community_centers": 2,
                            "parks": 4 + col,
                            "startups": 8 + (row+col)*2,
                            "flexibility_index": 0.85 + (row+col)*0.05
                        }
                    
                    # Enhanced energy data with detailed breakdown
                    energy_demand = {
                        "electricity": {
                            "total_annual_mwh": elec,
                            "residential_mwh": int(elec * 0.4),
                            "commercial_mwh": int(elec * 0.35),
                            "industrial_mwh": int(elec * 0.25),
                            "peak_demand_mw": round(elec / 8760 * 2.2, 2),
                            "load_profile": f"profile_type_{district_type}",
                            "smart_meter_penetration": 0.15 + col*0.1
                        },
                        "heat": {
                            "total_annual_mwh": heat,
                            "space_heating_mwh": int(heat * 0.75),
                            "hot_water_mwh": int(heat * 0.25),
                            "peak_demand_mw": round(heat / 2000, 2),
                            "grid_connection": 0.6 + col*0.1,
                            "insulation_standard": f"standard_{min(3, row+1)}"
                        },
                        "transport": transport,
                        "efficiency_potential": {
                            "electricity_savings_pct": 0.15 + row*0.05,
                            "heat_savings_pct": 0.25 + row*0.08,
                            "investment_needed_euro": (elec + heat) * 150
                        }
                    }
                    
                    # Enhanced renewable potential with economics
                    renewable_potential = {
                        "solar_pv": {
                            "rooftop_potential_mwh": pv_pot,
                            "ground_mounted_potential_mwh": pv_pot * 0.3 if district_type in ['industrial', 'mixed'] else 0,
                            "investment_cost_euro_per_kwp": 1200 - col*50,
                            "payback_years": 8 + row*0.5,
                            "suitable_roof_area_m2": pv_pot * 8,
                            "co2_savings_tons_per_year": pv_pot * 0.4
                        },
                        "solar_thermal": {
                            "potential_mwh": solar_th,
                            "suitable_buildings": int(buildings.get("residential", 0) * 0.7),
                            "investment_cost_euro_per_m2": 400 + row*25,
                            "co2_savings_tons_per_year": solar_th * 0.2
                        },
                        "wind": {
                            "small_wind_potential_mwh": wind_pot,
                            "feasibility": "high" if wind_pot > 500 else "medium" if wind_pot > 200 else "low",
                            "investment_cost_euro_per_kw": 3500 + row*200,
                            "noise_constraints": "strict" if district_type == 'residential' else "moderate"
                        },
                        "biomass": {
                            "potential_mwh": 200 + row*50 if district_type in ['mixed', 'industrial'] else 100,
                            "local_feedstock": ["agricultural_waste", "wood_chips"] if row >= 2 else ["wood_chips"],
                            "chp_potential": True if district_type == 'industrial' else False
                        },
                        "geothermal": {
                            "shallow_potential_mwh": 300 + col*100,
                            "deep_potential_feasible": row >= 2,
                            "heat_pump_suitable_buildings": int(buildings.get("residential", 0) * 0.6)
                        },
                        "total_potential_mwh": pv_pot + solar_th + wind_pot + (200 + row*50),
                        "grid_integration_capacity": "high" if col >= 2 else "medium",
                        "storage_needs_mwh": (pv_pot + wind_pot) * 0.15
                    }
                    
                    # Additional district characteristics
                    additional_data = {
                        "demographics": demographics,
                        "infrastructure": infrastructure,
                        "economic_indicators": {
                            "gdp_per_capita": demographics.get("avg_income", 35000) * 1.2,
                            "unemployment_rate": max(0.05, 0.12 - col*0.02),
                            "business_density": infrastructure.get("companies", 10) / (pop/1000),
                            "innovation_index": 0.3 + col*0.15
                        },
                        "environmental": {
                            "air_quality_index": 85 - (district_type == 'industrial') * 15,
                            "noise_level_db": 45 + (district_type == 'industrial') * 15 + (district_type == 'commercial') * 8,
                            "green_coverage_pct": infrastructure.get("green_space_pct", 0.2),
                            "co2_emissions_tons_per_year": (elec + heat) * 0.4,
                            "waste_generation_tons_per_year": pop * 0.5
                        },
                        "planning_constraints": {
                            "heritage_protection": row <= 1 and col <= 2,
                            "flood_risk": "low" if row >= 2 else "medium",
                            "soil_quality": "good" if col >= 2 else "moderate",
                            "development_restrictions": [],
                            "priority_development_area": district_type == 'mixed' and row >= 2
                        }
                    }
                    
                    districts_data.append((
                        grid_id, grid_name, row+1, col+1,
                        json.dumps(bounds),
                        json.dumps([center_lat, center_lon]),
                        district_type, pop, 0.64,  # 0.8km x 0.8km = 0.64 km²
                        json.dumps(buildings),
                        json.dumps(energy_demand),
                        json.dumps(renewable_potential),
                        json.dumps(additional_data)
                    ))
            
            cursor.executemany('''
                INSERT INTO districts (id, name, grid_row, grid_col, bounds, center, 
                                     district_type, population, area_km2, building_types, 
                                     energy_demand, renewable_potential, additional_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', districts_data)
            
            # Extended stakeholder list with detailed district assignments
            stakeholders_data = [
                # Government/Public Sector - Assigned to central/administrative areas
                ('stadt_zittau', 'Stadt Zittau - Stadtplanung', 'municipality',
                 json.dumps({"email": "stadtplanung@zittau.de", "phone": "+49 3583 752-200", "address": "Markt 1, 02763 Zittau", "contact_person": "Dr. Müller"}),
                 json.dumps(["Stadtplanung", "Klimaschutz", "Bürgerbeteiligung", "Genehmigungen", "Flächennutzung"]), 
                 'grid_2_2', 'high', 'high'),
                
                ('stadt_zittau_umwelt', 'Stadt Zittau - Umweltamt', 'municipality',
                 json.dumps({"email": "umwelt@zittau.de", "phone": "+49 3583 752-300", "contact_person": "Frau Schmidt"}),
                 json.dumps(["Umweltschutz", "Lärmschutz", "Luftreinhaltung", "Naturschutz"]), 
                 'grid_2_2', 'high', 'high'),
                
                ('landkreis_gr', 'Landkreis Görlitz - Regionalplanung', 'municipality',
                 json.dumps({"email": "regionalplanung@kreis-gr.de", "phone": "+49 3581 663-2500", "contact_person": "Herr Wagner"}),
                 json.dumps(["Regionalplanung", "Energiewende", "LEADER-Förderung", "Verkehrsplanung"]), 
                 'grid_1_1', 'high', 'medium'),
                
                ('regierung_dresden', 'Landesdirektion Sachsen', 'government',
                 json.dumps({"email": "energiewende@lds.sachsen.de", "phone": "+49 351 825-3400", "contact_person": "Dr. Weber"}),
                 json.dumps(["Genehmigungen", "Landesplanung", "Fördermittel", "Energierecht"]), 
                 'grid_1_2', 'medium', 'low'),
                
                # Utilities & Energy Companies - Distributed across suitable districts
                ('stadtwerke_zittau', 'Stadtwerke Zittau GmbH', 'utility',
                 json.dumps({"email": "info@stadtwerke-zittau.de", "phone": "+49 3583 540-100", "address": "Äußere Weberstraße 47", "contact_person": "Herr Richter"}),
                 json.dumps(["Stromversorgung", "Fernwärme", "Netzausbau", "Elektromobilität", "Smart Grid"]), 
                 'grid_2_3', 'high', 'high'),
                
                ('enso_energie', 'ENSO Energie Sachsen Ost AG', 'utility',
                 json.dumps({"email": "netzplanung@enso.de", "phone": "+49 351 468-2500", "contact_person": "Ing. Hoffmann"}),
                 json.dumps(["Stromnetz", "Erneuerbare Energien", "Smart Grid", "Netzintegration"]), 
                 'grid_3_2', 'high', 'medium'),
                
                ('gasag_zittau', 'GASAG Zittau Netze', 'utility',
                 json.dumps({"email": "netze@gasag.de", "phone": "+49 30 7872-1500", "contact_person": "Herr Klein"}),
                 json.dumps(["Erdgas", "Wasserstoff", "Wärmenetze", "Power-to-Gas"]), 
                 'grid_3_3', 'medium', 'medium'),
                
                ('windpark_olbersdorf', 'Windpark Olbersdorf GmbH', 'business',
                 json.dumps({"email": "info@windpark-olbersdorf.de", "phone": "+49 3583 123456", "contact_person": "Frau Vogel"}),
                 json.dumps(["Windenergie", "Direktvermarktung", "Bürgerbeteiligung"]), 
                 'grid_4_1', 'medium', 'high'),
                
                # Citizen Groups & NGOs - Community-focused areas
                ('buergerenergie_zittau', 'Bürgerenergie Zittau e.V.', 'citizen_group',
                 json.dumps({"email": "vorstand@buergerenergie-zittau.de", "phone": "+49 3583 987654", "contact_person": "Herr Neumann"}),
                 json.dumps(["Photovoltaik", "Bürgerstrom", "Energiegemeinschaft", "Partizipation", "Energieberatung"]), 
                 'grid_1_3', 'medium', 'high'),
                
                ('energiegenossenschaft_ol', 'Energiegenossenschaft Oberlausitz eG', 'citizen_group',
                 json.dumps({"email": "info@energie-ol.de", "phone": "+49 3583 555123", "contact_person": "Frau Berger"}),
                 json.dumps(["Genossenschaftsmodell", "Bürgerstrom", "regionale Wertschöpfung"]), 
                 'grid_2_4', 'medium', 'high'),
                
                ('solarverein_zittau', 'Solarverein Zittau e.V.', 'citizen_group',
                 json.dumps({"email": "kontakt@solarverein-zittau.de", "phone": "+49 3583 777888", "contact_person": "Dr. Lange"}),
                 json.dumps(["Solarenergie", "Dachbörse", "Technikberatung", "Selbstbau"]), 
                 'grid_3_1', 'low', 'high'),
                
                ('nabu_zittau', 'NABU Kreisverband Zittau', 'ngo',
                 json.dumps({"email": "zittau@nabu-sachsen.de", "phone": "+49 3583 789012", "contact_person": "Frau Fischer"}),
                 json.dumps(["Naturschutz", "Windenergie", "Biodiversität", "Nachhaltigkeit", "Umweltbildung"]), 
                 'grid_4_1', 'medium', 'medium'),
                
                ('klimabuendnis_ol', 'Klimabündnis Oberlausitz', 'ngo',
                 json.dumps({"email": "info@klimabuendnis-ol.de", "phone": "+49 3583 456789", "contact_person": "Herr Scholz"}),
                 json.dumps(["Klimaschutz", "Energiewende", "Bildung", "lokale Agenda 21"]), 
                 'grid_1_4', 'medium', 'high'),
                
                # Business & Industry - Industrial and commercial districts
                ('ihk_dresden', 'IHK Dresden - Geschäftsstelle Zittau', 'business',
                 json.dumps({"email": "zittau@dresden.ihk.de", "phone": "+49 3583 5515-0", "contact_person": "Herr Krause"}),
                 json.dumps(["Wirtschaftsförderung", "Energieeffizienz", "Betriebsberatung", "Innovation"]), 
                 'grid_2_3', 'high', 'medium'),
                
                ('hwk_dresden', 'Handwerkskammer Dresden - Kreishandwerkerschaft Zittau', 'business',
                 json.dumps({"email": "info@kh-zittau.de", "phone": "+49 3583 5208-0", "contact_person": "Meister Bauer"}),
                 json.dumps(["Handwerk", "Ausbildung", "Energietechnik", "Sanierung"]), 
                 'grid_3_2', 'medium', 'high'),
                
                ('gewerbepark_zittau', 'Gewerbepark Zittau-Süd', 'business',
                 json.dumps({"email": "verwaltung@gewerbepark-zittau.de", "phone": "+49 3583 654321", "contact_person": "Frau Herrmann"}),
                 json.dumps(["Gewerbeansiedlung", "Infrastruktur", "Energieversorgung", "Logistik"]), 
                 'grid_3_4', 'medium', 'medium'),
                
                ('automotive_cluster_ol', 'Automotive Cluster Oberlausitz', 'business',
                 json.dumps({"email": "cluster@automotive-ol.de", "phone": "+49 3583 111222", "contact_person": "Dr. Automotive"}),
                 json.dumps(["Automotive", "Elektromobilität", "Batterietechnik", "Wasserstoff"]), 
                 'grid_4_3', 'medium', 'medium'),
                
                ('textil_museum', 'Deutsches Damast- und Frottiermuseum (Textilunternehmen)', 'business',
                 json.dumps({"email": "info@damaseum.de", "phone": "+49 3583 554700", "contact_person": "Herr Textil"}),
                 json.dumps(["Textilwirtschaft", "Industriegeschichte", "Energieeffizienz", "Tourismus"]), 
                 'grid_4_2', 'low', 'medium'),
                
                # Research & Education - Mixed and knowledge districts
                ('hs_zittau_goerlitz', 'Hochschule Zittau/Görlitz', 'research',
                 json.dumps({"email": "energie@hszg.de", "phone": "+49 3583 612-3000", "contact_person": "Prof. Dr. Energie"}),
                 json.dumps(["Forschung", "Energietechnik", "Ausbildung", "Innovation", "Modellprojekte"]), 
                 'grid_1_2', 'high', 'high'),
                
                ('tu_dresden_zittau', 'TU Dresden - Außenstelle Zittau', 'research',
                 json.dumps({"email": "zittau@tu-dresden.de", "phone": "+49 3583 612-4000", "contact_person": "Prof. Dr. Forschung"}),
                 json.dumps(["Grundlagenforschung", "Energiesysteme", "Digitalisierung", "KI"]), 
                 'grid_1_3', 'medium', 'high'),
                
                ('berufsschule_zittau', 'BSZ für Technik und Wirtschaft Zittau', 'education',
                 json.dumps({"email": "info@bsz-zittau.de", "phone": "+49 3583 7802-0", "contact_person": "Herr Bildung"}),
                 json.dumps(["Berufsausbildung", "Energietechnik", "Elektronik", "Nachwuchsförderung"]), 
                 'grid_2_1', 'medium', 'high'),
                
                # Housing Associations - Residential areas
                ('wbg_zittau', 'Wohnungsbaugenossenschaft Zittau eG', 'housing',
                 json.dumps({"email": "info@wbg-zittau.de", "phone": "+49 3583 7755-0", "contact_person": "Herr Wohnung"}),
                 json.dumps(["Wohnungsbau", "Sanierung", "Mieterinteressen", "Energieeffizienz", "bezahlbares Wohnen"]), 
                 'grid_1_1', 'high', 'high'),
                
                ('vonovia_zittau', 'Vonovia SE - Regionalcenter Ost', 'housing',
                 json.dumps({"email": "ost@vonovia.de", "phone": "+49 234 314-0", "contact_person": "Frau Vermietung"}),
                 json.dumps(["Wohnungsmanagement", "Modernisierung", "Klimaschutz", "Smart Home"]), 
                 'grid_1_4', 'medium', 'medium'),
                
                ('kleingartenverein_zittau', 'Stadtverband der Kleingärtner Zittau', 'citizen_group',
                 json.dumps({"email": "info@kleingarten-zittau.de", "phone": "+49 3583 333444", "contact_person": "Herr Garten"}),
                 json.dumps(["Kleingartenwesen", "Naturschutz", "Selbstversorgung", "Gemeinschaft"]), 
                 'grid_4_4', 'low', 'medium'),
                
                # Transportation & Mobility
                ('zvon', 'Zweckverband Verkehrsverbund Oberlausitz-Niederschlesien', 'utility',
                 json.dumps({"email": "info@zvon.de", "phone": "+49 3581 382600", "contact_person": "Herr Verkehr"}),
                 json.dumps(["ÖPNV", "Elektrobusse", "Mobilität", "Verkehrswende"]), 
                 'grid_2_2', 'medium', 'medium'),
                
                ('db_netz_zittau', 'DB Netz AG - Außenstelle Zittau', 'utility',
                 json.dumps({"email": "zittau@dbnetz.de", "phone": "+49 3583 505160", "contact_person": "Herr Bahn"}),
                 json.dumps(["Bahninfrastruktur", "Elektrifizierung", "Güterverkehr", "Bahnstrom"]), 
                 'grid_3_1', 'medium', 'low'),
                
                # Additional Local Stakeholders
                ('feuerwehr_zittau', 'Freiwillige Feuerwehr Zittau', 'public_safety',
                 json.dumps({"email": "info@feuerwehr-zittau.de", "phone": "+49 3583 774422", "contact_person": "Hauptmann Brand"}),
                 json.dumps(["Brandschutz", "Notfallplanung", "technische Hilfeleistung", "Umweltschutz"]), 
                 'grid_2_1', 'medium', 'medium'),
                
                ('awo_zittau', 'AWO Kreisverband Zittau', 'social',
                 json.dumps({"email": "info@awo-zittau.de", "phone": "+49 3583 683300", "contact_person": "Frau Sozial"}),
                 json.dumps(["Sozialarbeit", "Energiearmut", "Beratung", "Integration"]), 
                 'grid_1_1', 'low', 'high'),
                
                ('volksbank_zittau', 'Volksbank Löbau-Zittau eG', 'financial',
                 json.dumps({"email": "info@vb-loebau-zittau.de", "phone": "+49 3583 7791-0", "contact_person": "Herr Bank"}),
                 json.dumps(["Finanzierung", "Kredite", "Investitionen", "regionale Förderung"]), 
                 'grid_2_3', 'medium', 'medium'),
                
                ('sparkasse_olnl', 'Sparkasse Oberlausitz-Niederschlesien', 'financial',
                 json.dumps({"email": "info@sparkasse-on.de", "phone": "+49 3583 8501-0", "contact_person": "Frau Sparkasse"}),
                 json.dumps(["Finanzierung", "Förderkredite", "Beratung", "kommunale Unterstützung"]), 
                 'grid_2_4', 'medium', 'medium'),
                
                # Tourism & Culture
                ('tourismus_zittau', 'Zittauer Tourismusverein', 'tourism',
                 json.dumps({"email": "info@zittauer-gebirge.com", "phone": "+49 3583 752200", "contact_person": "Frau Tourismus"}),
                 json.dumps(["Tourismus", "nachhaltiger Tourismus", "Regionalmarketing", "Elektromobilität"]), 
                 'grid_4_2', 'low', 'medium'),
                
                ('kulturzentrum_zittau', 'Kultur- und Bildungszentrum Zittau', 'cultural',
                 json.dumps({"email": "info@kubiz-zittau.de", "phone": "+49 3583 702299", "contact_person": "Herr Kultur"}),
                 json.dumps(["Kultur", "Bildung", "Veranstaltungen", "Energieeffizienz"]), 
                 'grid_2_2', 'low', 'medium'),
                
                # Agricultural & Rural
                ('bauernverband_gl', 'Kreisbauernverband Görlitz e.V.', 'agriculture',
                 json.dumps({"email": "info@kbv-goerlitz.de", "phone": "+49 3581 735600", "contact_person": "Herr Bauer"}),
                 json.dumps(["Landwirtschaft", "Biogas", "Agri-PV", "ländliche Entwicklung"]), 
                 'grid_4_4', 'medium', 'medium')
            ]
            
            cursor.executemany('''
                INSERT INTO stakeholders (id, name, type, contact, interests, district_id, 
                                        influence_level, participation_willingness)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', stakeholders_data)
            
            # Enhanced technology templates
            tech_templates = [
                # Generation
                ('pv_rooftop_small', 'PV-Dachanlage Klein (< 30 kWp)', 'generation', 'pv',
                 json.dumps({"capacity_kw": 10, "efficiency": 0.20, "lifetime_years": 25, "degradation_per_year": 0.005}),
                 json.dumps({"capex_eur_per_kw": 1200, "opex_eur_per_kw_year": 25, "financing_rate": 0.04}),
                 json.dumps({"co2_kg_per_mwh": 45, "recyclability": 0.95}), 'available'),
                
                ('pv_rooftop_large', 'PV-Dachanlage Groß (> 100 kWp)', 'generation', 'pv',
                 json.dumps({"capacity_kw": 250, "efficiency": 0.22, "lifetime_years": 25, "degradation_per_year": 0.004}),
                 json.dumps({"capex_eur_per_kw": 950, "opex_eur_per_kw_year": 20, "financing_rate": 0.035}),
                 json.dumps({"co2_kg_per_mwh": 40, "recyclability": 0.95}), 'available'),
                
                ('wind_small', 'Kleinwindanlage', 'generation', 'wind',
                 json.dumps({"capacity_kw": 30, "efficiency": 0.35, "lifetime_years": 20, "noise_db": 45}),
                 json.dumps({"capex_eur_per_kw": 2800, "opex_eur_per_kw_year": 80, "financing_rate": 0.05}),
                 json.dumps({"co2_kg_per_mwh": 25, "recyclability": 0.90}), 'available'),
                
                # Storage
                ('battery_home', 'Heimspeicher', 'storage', 'battery',
                 json.dumps({"capacity_kwh": 10, "efficiency": 0.92, "cycles": 6000, "dod": 0.9}),
                 json.dumps({"capex_eur_per_kwh": 800, "opex_eur_per_kwh_year": 15, "replacement_after_cycles": 6000}),
                 json.dumps({"co2_kg_per_mwh": 120, "recyclability": 0.85}), 'available'),
                
                ('battery_commercial', 'Gewerbespeicher', 'storage', 'battery',
                 json.dumps({"capacity_kwh": 100, "efficiency": 0.94, "cycles": 8000, "dod": 0.95}),
                 json.dumps({"capex_eur_per_kwh": 650, "opex_eur_per_kwh_year": 12, "replacement_after_cycles": 8000}),
                 json.dumps({"co2_kg_per_mwh": 100, "recyclability": 0.90}), 'available'),
                
                # Heat
                ('heat_pump_air', 'Luft-Wasser-Wärmepumpe', 'conversion', 'heat_pump',
                 json.dumps({"capacity_kw": 12, "cop_nominal": 3.8, "lifetime_years": 18, "min_temp_c": -20}),
                 json.dumps({"capex_eur_per_kw": 1400, "opex_eur_per_kw_year": 60, "maintenance_interval_years": 2}),
                 json.dumps({"co2_kg_per_mwh": 150, "refrigerant_gwp": 675}), 'available'),
                
                ('heat_pump_geo', 'Sole-Wasser-Wärmepumpe', 'conversion', 'heat_pump',
                 json.dumps({"capacity_kw": 15, "cop_nominal": 4.5, "lifetime_years": 25, "drilling_depth_m": 100}),
                 json.dumps({"capex_eur_per_kw": 2200, "opex_eur_per_kw_year": 45, "drilling_cost_eur": 8000}),
                 json.dumps({"co2_kg_per_mwh": 130, "refrigerant_gwp": 675}), 'available'),
                
                # Future technologies
                ('hydrogen_fuel_cell', 'Brennstoffzelle', 'conversion', 'hydrogen',
                 json.dumps({"capacity_kw": 50, "efficiency": 0.55, "lifetime_years": 15, "startup_time_min": 5}),
                 json.dumps({"capex_eur_per_kw": 4500, "opex_eur_per_kw_year": 180, "hydrogen_price_eur_per_kg": 8}),
                 json.dumps({"co2_kg_per_mwh": 0, "water_production_l_per_mwh": 110}), 'future'),
                
                ('pv_agri', 'Agri-Photovoltaik', 'generation', 'pv',
                 json.dumps({"capacity_kw": 500, "efficiency": 0.18, "lifetime_years": 25, "land_use_factor": 0.6}),
                 json.dumps({"capex_eur_per_kw": 1100, "opex_eur_per_kw_year": 22, "land_lease_eur_per_ha": 800}),
                 json.dumps({"co2_kg_per_mwh": 50, "biodiversity_impact": "positive"}), 'future')
            ]
            
            cursor.executemany('''
                INSERT INTO technology_templates (id, name, category, technology_type, 
                                                parameters, cost_data, environmental_data, availability)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', tech_templates)
            
            conn.commit()
            print("✅ Grid-based data with extended stakeholders populated successfully")
    
    # Async methods for API access
    async def get_districts(self) -> List[Dict]:
        """Get all grid districts"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT id, name, grid_row, grid_col, bounds, center, district_type,
                       population, area_km2, building_types, energy_demand, renewable_potential, additional_data
                FROM districts ORDER BY grid_row, grid_col
            """)
            rows = await cursor.fetchall()
            
            districts = []
            for row in rows:
                district = {
                    'id': row[0], 'name': row[1], 'grid_row': row[2], 'grid_col': row[3],
                    'bounds': json.loads(row[4]), 'center': json.loads(row[5]),
                    'district_type': row[6], 'population': row[7], 'area_km2': row[8],
                    'building_types': json.loads(row[9]),
                    'energy_demand': json.loads(row[10]),
                    'renewable_potential': json.loads(row[11]),
                    'additional_data': json.loads(row[12]) if row[12] else {}
                }
                districts.append(district)
            
            return districts

    async def get_stakeholders(self, district_id: str = None) -> List[Dict]:
        """Get stakeholders, optionally filtered by district"""
        async with aiosqlite.connect(self.db_path) as db:
            if district_id:
                cursor = await db.execute("""
                    SELECT id, name, type, contact, interests, district_id, 
                           influence_level, participation_willingness
                    FROM stakeholders WHERE district_id = ?
                """, (district_id,))
            else:
                cursor = await db.execute("""
                    SELECT id, name, type, contact, interests, district_id,
                           influence_level, participation_willingness  
                    FROM stakeholders ORDER BY influence_level DESC, name
                """)
            
            rows = await cursor.fetchall()
            stakeholders = []
            for row in rows:
                stakeholder = {
                    'id': row[0], 'name': row[1], 'type': row[2],
                    'contact': json.loads(row[3]), 'interests': json.loads(row[4]),
                    'district_id': row[5], 'influence_level': row[6],
                    'participation_willingness': row[7]
                }
                stakeholders.append(stakeholder)
            
            return stakeholders

    async def create_scenario(self, scenario_data: dict) -> str:
        """Create a new energy scenario"""
        scenario_id = f"scenario_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute('''
                INSERT INTO scenarios (id, name, description, base_year, target_year,
                                     energy_prices, co2_prices, policy_framework, 
                                     district_id, technologies)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                scenario_id,
                scenario_data.get('name', 'Neues Szenario'),
                scenario_data.get('description', ''),
                scenario_data.get('base_year', 2025),
                scenario_data.get('target_year', 2045),
                json.dumps(scenario_data.get('energy_prices', {})),
                json.dumps(scenario_data.get('co2_prices', {})),
                json.dumps(scenario_data.get('policy_framework', {})),
                scenario_data.get('district_id'),
                json.dumps(scenario_data.get('technologies', []))
            ))
            
            await db.commit()
            return scenario_id
    
    async def close(self):
        """Close database connection (for consistency with async pattern)"""
        pass  # SQLite connections are handled per-operation
    
    async def update_district_energy_data(self, district_id: str, energy_data: dict):
        """Update energy data for a district"""
        async with aiosqlite.connect(self.db_path) as db:
            # Get current district data
            async with db.execute('SELECT energy_demand FROM districts WHERE id = ?', (district_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    raise ValueError(f"District {district_id} not found")
                
                current_demand = json.loads(row[0])
                
                # Update with new data
                current_demand.update(energy_data)
                
                # Save back to database
                await db.execute(
                    'UPDATE districts SET energy_demand = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    (json.dumps(current_demand), district_id)
                )
                await db.commit()
    
    async def get_district_scenarios(self, district_id: str):
        """Get all scenarios for a specific district"""
        async with aiosqlite.connect(self.db_path) as db:
            async with db.execute(
                'SELECT * FROM scenarios WHERE district_id = ? OR district_id IS NULL',
                (district_id,)
            ) as cursor:
                rows = await cursor.fetchall()
                
                scenarios = []
                for row in rows:
                    scenario = {
                        'id': row[0],
                        'name': row[1],
                        'description': row[2],
                        'base_year': row[3],
                        'target_year': row[4],
                        'energy_prices': json.loads(row[5]) if row[5] else {},
                        'co2_prices': json.loads(row[6]) if row[6] else {},
                        'policy_framework': json.loads(row[7]) if row[7] else {},
                        'district_id': row[8],
                        'technologies': json.loads(row[9]) if row[9] else []
                    }
                    scenarios.append(scenario)
                
                return scenarios
