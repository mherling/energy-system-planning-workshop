import sqlite3
import aiosqlite
import asyncio
import json
from datetime import datetime
from typing import List, Dict, Optional
import os

class Database:
    """Database manager for the energy system workshop"""
    
    def __init__(self, db_path: str = "workshop.db"):
        self.db_path = db_path
    
    async def init_db(self):
        """Initialize database with required tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Teams table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS teams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    parameters TEXT NOT NULL,
                    simulation_status TEXT DEFAULT 'idle',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Simulation results table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS simulation_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    team_id INTEGER,
                    energy_cost REAL,
                    co2_emissions REAL,
                    renewable_share REAL,
                    results_data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (team_id) REFERENCES teams (id)
                )
            """)
            
            await db.commit()
            
            # Initialize default teams if database is empty
            await self._init_default_teams(db)
    
    async def _init_default_teams(self, db):
        """Initialize default teams if none exist"""
        cursor = await db.execute("SELECT COUNT(*) FROM teams")
        count = (await cursor.fetchone())[0]
        
        if count == 0:
            # Load team names from config file
            import yaml
            script_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(script_dir, '..', '..', 'experiment_config', 'config.yml')
            config_path = os.path.abspath(config_path)
            
            try:
                with open(config_path, 'r', encoding='utf-8') as ymlfile:
                    cfg = yaml.load(ymlfile, Loader=yaml.SafeLoader)
                team_names = cfg.get('team_names', [])
            except:
                # Fallback to default names if config loading fails
                team_names = ['Moabit', 'Kreuzberg', 'Frohnau', 'Adlershof', 'Wedding', 'Tegel', 'Pankow', 'Treptow']
            
            # Load parameters from existing CSV files for each team
            for i, team_name in enumerate(team_names, 1):
                parameters = self._load_team_parameters_from_csv(i)
                await db.execute("""
                    INSERT INTO teams (name, parameters) 
                    VALUES (?, ?)
                """, (team_name, json.dumps(parameters)))
            
            await db.commit()

    def _load_team_parameters_from_csv(self, team_number):
        """Load team parameters from existing CSV file"""
        import pandas as pd
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'data', f'parameters_Team_{team_number:02d}.csv')
        csv_path = os.path.abspath(csv_path)
        
        # Default parameters as fallback
        default_parameters = {
            "windturbines": 2,
            "chps": 1,
            "boilers": 0,
            "pv_plants": 1,
            "heat_pumps": 1,
            "pv_area": 1.0,
            "solar_thermal_area": 0.5,
            "electrical_storage": 0.5,
            "thermal_storage": 1.0
        }
        
        try:
            if os.path.exists(csv_path):
                df = pd.read_csv(csv_path)
                # Map CSV parameters to web app format
                parameter_mapping = {
                    'number_of_windturbines': 'windturbines',
                    'number_of_chps': 'chps', 
                    'number_of_boilers': 'boilers',
                    'number_of_heat_pumps': 'heat_pumps',
                    'number_of_PV_pp': 'pv_plants',
                    'area_PV': 'pv_area',
                    'area_solar_th': 'solar_thermal_area',
                    'capacity_electr_storage': 'electrical_storage',
                    'capacity_thermal_storage': 'thermal_storage'
                }
                
                parameters = {}
                for _, row in df.iterrows():
                    var_name = row['var_name']
                    if var_name in parameter_mapping:
                        web_key = parameter_mapping[var_name]
                        parameters[web_key] = float(row['value'])
                
                # Fill in any missing parameters with defaults
                for key, default_value in default_parameters.items():
                    if key not in parameters:
                        parameters[key] = default_value
                        
                return parameters
            else:
                return default_parameters
        except Exception as e:
            print(f"Error loading CSV for team {team_number}: {e}")
            return default_parameters

    async def reset_teams_with_config_names(self):
        """Reset teams table with names from config file and reload parameters from CSV"""
        # Load team names from config file
        import yaml
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, '..', '..', 'experiment_config', 'config.yml')
        config_path = os.path.abspath(config_path)
        
        try:
            with open(config_path, 'r', encoding='utf-8') as ymlfile:
                cfg = yaml.load(ymlfile, Loader=yaml.SafeLoader)
            team_names = cfg.get('team_names', [])
        except:
            # Fallback to default names if config loading fails
            team_names = ['Moabit', 'Kreuzberg', 'Frohnau', 'Adlershof', 'Wedding', 'Tegel', 'Pankow', 'Treptow']
        
        async with aiosqlite.connect(self.db_path) as db:
            # Update existing teams with correct names and parameters from CSV
            for i, team_name in enumerate(team_names, 1):
                parameters = self._load_team_parameters_from_csv(i)
                await db.execute("""
                    UPDATE teams SET name = ?, parameters = ? WHERE id = ?
                """, (team_name, json.dumps(parameters), i))
            
            await db.commit()
    
    async def get_all_teams(self) -> List[Dict]:
        """Get all teams with their configurations"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT id, name, parameters, simulation_status, 
                       created_at, updated_at FROM teams 
                ORDER BY id
            """)
            rows = await cursor.fetchall()
            
            teams = []
            for row in rows:
                team = dict(row)
                team['parameters'] = json.loads(team['parameters'])
                teams.append(team)
            
            return teams
    
    async def get_team(self, team_id: int) -> Optional[Dict]:
        """Get specific team by ID"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT id, name, parameters, simulation_status,
                       created_at, updated_at FROM teams 
                WHERE id = ?
            """, (team_id,))
            row = await cursor.fetchone()
            
            if row:
                team = dict(row)
                team['parameters'] = json.loads(team['parameters'])
                return team
            
            return None
    
    async def update_team_config(self, team_id: int, parameters: Dict) -> bool:
        """Update team configuration"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                UPDATE teams 
                SET parameters = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (json.dumps(parameters), team_id))
            
            await db.commit()
            return cursor.rowcount > 0
    
    async def update_simulation_status(self, team_id: int, status: str):
        """Update simulation status for a team"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                UPDATE teams 
                SET simulation_status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (status, team_id))
            await db.commit()
    
    async def get_simulation_status(self, team_id: int) -> str:
        """Get simulation status for a team"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("""
                SELECT simulation_status FROM teams WHERE id = ?
            """, (team_id,))
            row = await cursor.fetchone()
            return row[0] if row else "idle"
    
    async def save_simulation_results(self, team_id: int, results: Dict):
        """Save simulation results for a team"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("""
                INSERT INTO simulation_results 
                (team_id, energy_cost, co2_emissions, renewable_share, results_data)
                VALUES (?, ?, ?, ?, ?)
            """, (
                team_id,
                results.get('energy_cost', 0),
                results.get('co2_emissions', 0),
                results.get('renewable_share', 0),
                json.dumps(results)
            ))
            await db.commit()
    
    async def get_team_results(self, team_id: int) -> Optional[Dict]:
        """Get latest simulation results for a team"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("""
                SELECT * FROM simulation_results 
                WHERE team_id = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            """, (team_id,))
            row = await cursor.fetchone()
            
            if row:
                result = dict(row)
                result['results_data'] = json.loads(result['results_data'])
                return result
            
            return None

    async def store_simulation_results(self, team_id: int, results: dict):
        """Store simulation results for a team with retry mechanism"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with aiosqlite.connect(self.db_path, timeout=10.0) as db:
                    await db.execute("""
                        INSERT INTO simulation_results 
                        (team_id, energy_cost, co2_emissions, renewable_share, results_data) 
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        team_id,
                        results.get("total_costs", 0),
                        results.get("co2_emissions", 0), 
                        results.get("self_sufficiency", 0),
                        json.dumps(results)
                    ))
                    await db.commit()
                return  # Success
            except Exception as e:
                if "database is locked" in str(e).lower() and attempt < max_retries - 1:
                    await asyncio.sleep(1 + attempt)  # Exponential backoff
                    continue
                else:
                    raise e
