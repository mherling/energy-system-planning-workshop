"""
Bereinigte Grid-basierte Datenbank für Zittau Energiesystemplanung
Verwendet QuartierDataManager für strukturierte Datenverwaltung
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import aiosqlite
from data_manager import QuartierDataManager

class GridPlanningDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.data_manager = QuartierDataManager()
        
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
        """Populate database with quartier data from data manager"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Clear existing data
            cursor.execute("DELETE FROM scenarios")
            cursor.execute("DELETE FROM stakeholders") 
            cursor.execute("DELETE FROM districts")
            cursor.execute("DELETE FROM technology_templates")
            
            # Generate data using data manager
            quartiers = self.data_manager.generate_quartier_data()
            stakeholders = self.data_manager.generate_stakeholder_data()
            technologies = self.data_manager.generate_technology_data()
            
            # Insert quartier data
            districts_data = []
            for quartier in quartiers:
                districts_data.append((
                    quartier.id,
                    quartier.name,
                    json.dumps(quartier.geometry),
                    json.dumps(quartier.additional_data.get('center', [50.8994, 14.8076])),
                    quartier.district_type,
                    quartier.population,
                    quartier.area_km2,
                    json.dumps(quartier.building_types),
                    json.dumps(quartier.energy_demand),
                    json.dumps(quartier.renewable_potential),
                    json.dumps({
                        'demographics': quartier.demographics,
                        'infrastructure': quartier.infrastructure,
                        'description': quartier.additional_data.get('description', ''),
                        'priority_level': quartier.additional_data.get('priority_level', 'medium'),
                        'special_factors': quartier.additional_data.get('special_factors', {})
                    })
                ))
            
            cursor.executemany('''
                INSERT INTO districts (
                    id, name, geometry, center, district_type, population, area_km2,
                    building_types, energy_demand, renewable_potential, additional_data
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', districts_data)
            
            # Insert stakeholder data
            stakeholders_data = []
            for stakeholder in stakeholders:
                stakeholders_data.append((
                    stakeholder.id,
                    stakeholder.name,
                    stakeholder.category,
                    json.dumps(stakeholder.contact),
                    json.dumps(stakeholder.interests),
                    stakeholder.district_id
                ))
            
            cursor.executemany('''
                INSERT INTO stakeholders (id, name, type, contact, interests, district_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', stakeholders_data)
            
            # Insert technology templates
            tech_data = []
            for tech in technologies:
                tech_data.append((
                    tech.id,
                    tech.name,
                    tech.category,
                    tech.technology_type,
                    json.dumps(tech.parameters),
                    json.dumps(tech.costs),
                    json.dumps(tech.environmental),
                    tech.availability
                ))
            
            cursor.executemany('''
                INSERT INTO technology_templates (id, name, category, technology_type, 
                                                parameters, cost_data, environmental_data, availability)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', tech_data)
            
            conn.commit()
            print(f"Database populated with {len(quartiers)} quartiers, {len(stakeholders)} stakeholders, {len(technologies)} technologies")

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
