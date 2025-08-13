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
        self.populate_quartier_data()  # Changed from populate_grid_data
        
    def init_database(self):
        """Initialize database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Districts table (based on GeoJSON quartiers)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS districts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    geometry TEXT NOT NULL,  -- JSON GeoJSON geometry
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

    def populate_quartier_data(self):
        """Populate database with quartier data from GeoJSON"""
        import json
        from pathlib import Path
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Clear existing data
            cursor.execute("DELETE FROM scenarios")
            cursor.execute("DELETE FROM stakeholders") 
            cursor.execute("DELETE FROM districts")
            cursor.execute("DELETE FROM technology_templates")
            
            # Load GeoJSON data
            geojson_path = Path(__file__).parent / "data" / "Stadtteile_Zittau.geojson"
            with open(geojson_path, 'r', encoding='utf-8') as f:
                geojson_data = json.load(f)
            
            districts_data = []
            for feature in geojson_data['features']:
                props = feature['properties']
                geom = feature['geometry']
                
                district_id = f"quartier_{props['id']}"
                district_name = props['Stadtteil']
                
                # Calculate center from geometry
                coords = geom['coordinates'][0][0]  # Get first polygon ring
                lats = [coord[1] for coord in coords]
                lons = [coord[0] for coord in coords]
                center_lat = sum(lats) / len(lats)
                center_lon = sum(lons) / len(lons)
                
                # Estimate area (rough calculation)
                area_km2 = 0.5 + (props['id'] * 0.2)  # Mock data for now
                
                # Generate realistic data based on quartier name
                if district_name == "Zentrum":
                    district_type, pop, elec, heat = 'mixed', 2500, 6500, 4800
                    buildings = {"residential": 180, "commercial": 95, "public": 12, "office": 45, "retail": 50}
                    pv_pot, solar_th, wind_pot = 850, 400, 180
                elif district_name == "Süd":
                    district_type, pop, elec, heat = 'residential', 1800, 4200, 3600
                    buildings = {"residential": 220, "commercial": 15, "public": 4, "single_family": 140, "multi_family": 80}
                    pv_pot, solar_th, wind_pot = 950, 520, 220
                elif district_name == "Ost":
                    district_type, pop, elec, heat = 'industrial', 800, 8500, 3200
                    buildings = {"industrial": 35, "commercial": 25, "residential": 60, "warehouses": 20}
                    pv_pot, solar_th, wind_pot = 1200, 180, 350
                elif district_name == "Weinau":
                    district_type, pop, elec, heat = 'residential', 1200, 3200, 2800
                    buildings = {"residential": 150, "commercial": 8, "public": 3, "single_family": 120, "multi_family": 30}
                    pv_pot, solar_th, wind_pot = 750, 450, 200
                elif district_name == "Nord":
                    district_type, pop, elec, heat = 'mixed', 1600, 4800, 3400
                    buildings = {"residential": 170, "commercial": 35, "public": 6, "office": 20, "retail": 15}
                    pv_pot, solar_th, wind_pot = 820, 380, 250
                elif district_name == "Vorstadt":
                    district_type, pop, elec, heat = 'residential', 2200, 5200, 4200
                    buildings = {"residential": 280, "commercial": 20, "public": 5, "single_family": 180, "multi_family": 100}
                    pv_pot, solar_th, wind_pot = 1100, 650, 280
                elif district_name == "West":
                    district_type, pop, elec, heat = 'mixed', 1400, 4000, 3000
                    buildings = {"residential": 160, "commercial": 30, "public": 4, "office": 15, "retail": 15}
                    pv_pot, solar_th, wind_pot = 780, 420, 220
                elif district_name == "Pethau":
                    district_type, pop, elec, heat = 'residential', 900, 2400, 2000
                    buildings = {"residential": 110, "commercial": 8, "public": 2, "single_family": 85, "multi_family": 25}
                    pv_pot, solar_th, wind_pot = 650, 350, 180
                else:
                    district_type, pop, elec, heat = 'mixed', 1000, 3000, 2500
                    buildings = {"residential": 120, "commercial": 15, "public": 3}
                    pv_pot, solar_th, wind_pot = 600, 300, 150
                
                # Additional data
                energy_demand = {
                    "electricity_mwh": elec,
                    "heating_mwh": heat,
                    "cooling_mwh": heat * 0.15,
                    "total_annual_mwh": elec + heat,
                    "peak_demand_mw": (elec + heat) * 0.0002
                }
                
                renewable_potential = {
                    "solar_pv_mwh": pv_pot,
                    "solar_thermal_mwh": solar_th,
                    "small_wind_mwh": wind_pot,
                    "total_potential_mwh": pv_pot + solar_th + wind_pot
                }
                
                additional_data = {
                    "demographics": {"avg_age": 40, "households": int(pop / 2.2)},
                    "transport": {"cars": int(pop * 0.65), "bikes": int(pop * 1.1)},
                    "infrastructure": {"schools": max(1, pop // 800), "medical": max(1, pop // 1500)}
                }
                
                districts_data.append((
                    district_id,
                    district_name,
                    json.dumps(geom),
                    json.dumps([center_lat, center_lon]),
                    district_type,
                    pop,
                    area_km2,
                    json.dumps(buildings),
                    json.dumps(energy_demand),
                    json.dumps(renewable_potential),
                    json.dumps(additional_data)
                ))
            
            # Insert district data
            cursor.executemany('''
                INSERT INTO districts (
                    id, name, geometry, center, district_type, population, area_km2,
                    building_types, energy_demand, renewable_potential, additional_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', districts_data)
            
            # Add stakeholder data for quartiers
            stakeholders_data = [
                # Government/Public Sector
                ('stadt_zittau', 'Stadt Zittau - Stadtplanung', 'municipality',
                 json.dumps({"email": "stadtplanung@zittau.de", "phone": "+49 3583 752-200", "address": "Markt 1, 02763 Zittau", "contact_person": "Dr. Müller"}),
                 json.dumps(["Stadtplanung", "Klimaschutz", "Bürgerbeteiligung", "Genehmigungen", "Flächennutzung"]), 
                 'quartier_1', 'high', 'high'),
                
                ('energieversorger_zittau', 'Stadtwerke Zittau', 'utility',
                 json.dumps({"email": "info@stadtwerke-zittau.de", "phone": "+49 3583 540-0", "address": "Äußere Weberstraße 8, 02763 Zittau"}),
                 json.dumps(["Energieversorgung", "Netzausbau", "Digitalisierung", "Kosteneffizienz"]),
                 'quartier_3', 'high', 'high'),
                
                # Citizen Groups
                ('buergerenergie_zittau', 'Bürgerenergie Zittau e.V.', 'citizen_group',
                 json.dumps({"email": "kontakt@buergerenergie-zittau.de", "website": "www.buergerenergie-zittau.de"}),
                 json.dumps(["Erneuerbare Energien", "Bürgerbeteiligung", "lokale Wertschöpfung"]),
                 'quartier_2', 'medium', 'high'),
                
                # Business/Industry
                ('gewerbe_zentrum', 'Gewerbeverein Zittau Zentrum', 'business',
                 json.dumps({"email": "info@gewerbe-zittau.de", "phone": "+49 3583 123456"}),
                 json.dumps(["Wirtschaftsförderung", "Energiekosten", "Standortattraktivität"]),
                 'quartier_1', 'medium', 'medium'),
                
                ('industrie_ost', 'Industriepark Ost', 'business',
                 json.dumps({"email": "verwaltung@industriepark-zittau.de"}),
                 json.dumps(["Energieversorgung", "Prozesswärme", "Standortsicherung"]),
                 'quartier_3', 'high', 'medium'),
            ]
            
            cursor.executemany('''
                INSERT INTO stakeholders (id, name, type, contact, interests, district_id, influence_level, participation_willingness)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', stakeholders_data)
            
            # Technology templates
            tech_templates = [
                ('pv_rooftop_small', 'PV-Dachanlage Klein (< 30 kWp)', 'generation', 'pv',
                 json.dumps({"capacity_kw": 10, "efficiency": 0.20, "lifetime_years": 25}),
                 json.dumps({"capex_eur_per_kw": 1200, "opex_eur_per_kw_year": 25}),
                 json.dumps({"co2_kg_per_mwh": 45}), 'available'),
                
                ('wind_small', 'Kleinwindanlage', 'generation', 'wind',
                 json.dumps({"capacity_kw": 30, "efficiency": 0.35, "lifetime_years": 20}),
                 json.dumps({"capex_eur_per_kw": 2800, "opex_eur_per_kw_year": 80}),
                 json.dumps({"co2_kg_per_mwh": 25}), 'available'),
                
                ('battery_home', 'Heimspeicher', 'storage', 'battery',
                 json.dumps({"capacity_kwh": 10, "efficiency": 0.92, "cycles": 6000}),
                 json.dumps({"capex_eur_per_kwh": 800, "opex_eur_per_kwh_year": 15}),
                 json.dumps({"co2_kg_per_mwh": 120}), 'available'),
                
                ('heat_pump_air', 'Luft-Wasser-Wärmepumpe', 'conversion', 'heat_pump',
                 json.dumps({"capacity_kw": 12, "cop_nominal": 3.8, "lifetime_years": 18}),
                 json.dumps({"capex_eur_per_kw": 1400, "opex_eur_per_kw_year": 60}),
                 json.dumps({"co2_kg_per_mwh": 150}), 'available'),
            ]
            
            cursor.executemany('''
                INSERT INTO technology_templates (id, name, category, technology_type, 
                                                parameters, cost_data, environmental_data, availability)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', tech_templates)
            
            conn.commit()
            print("Database populated with quartier data successfully")

    async def get_districts(self) -> List[Dict]:
        """Get all quartier districts"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT id, name, geometry, center, district_type, population, area_km2, 
                       building_types, energy_demand, renewable_potential, additional_data
                FROM districts ORDER BY id
            """)
            rows = await cursor.fetchall()
            
            districts = []
            for row in rows:
                district = {
                    'id': row[0], 'name': row[1], 
                    'geometry': json.loads(row[2]), 'center': json.loads(row[3]),
                    'district_type': row[4], 'population': row[5], 'area_km2': row[6],
                    'building_types': json.loads(row[7]),
                    'energy_demand': json.loads(row[8]),
                    'renewable_potential': json.loads(row[9]),
                    'additional_data': json.loads(row[10]) if row[10] else {}
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
                    'id': row[0], 'name': row[1], 'category': row[2],
                    'contact': json.loads(row[3]), 'key_interests': json.loads(row[4]),
                    'district_id': row[5], 'influence_level': row[6],
                    'participation_willingness': row[7]
                }
                stakeholders.append(stakeholder)
            
            return stakeholders

    async def get_technology_templates(self) -> List[Dict]:
        """Get available technology templates"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT id, name, category, technology_type, parameters, cost_data, 
                       environmental_data, availability
                FROM technology_templates
            """)
            rows = await cursor.fetchall()
            
            templates = []
            for row in rows:
                template = {
                    'id': row[0], 'name': row[1], 'category': row[2], 'type': row[3],
                    'parameters': json.loads(row[4]),
                    'cost_data': json.loads(row[5]),
                    'environmental_data': json.loads(row[6]),
                    'availability': row[7]
                }
                templates.append(template)
            
            return templates

    async def update_district_energy_data(self, district_id: str, energy_data: dict):
        """Update energy data for a district"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                'UPDATE districts SET energy_demand = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                (json.dumps(energy_data), district_id)
            )
            await db.commit()

    async def close(self):
        """Close database connection"""
        pass
