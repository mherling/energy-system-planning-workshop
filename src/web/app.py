from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
import pandas as pd
import yaml

# Add parent directory to path to import existing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from model_energy_system import run_model
from basic_analysis import display_results
from detailed_analysis import my_detailed_analysis
from database import Database
from models import TeamConfig, SimulationResult, TeamUpdate
from websocket_manager import ConnectionManager
from timeseries_analysis import load_team_timeseries, get_available_variables, get_timeseries_summary, get_variable_data, get_energy_flows_for_sankey

app = FastAPI(title="Energy System Planning Workshop", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database and WebSocket manager
data_dir = Path(__file__).parent / "data"
data_dir.mkdir(exist_ok=True)
db_path = str(data_dir / "workshop.db")
db = Database(db_path)
manager = ConnectionManager()

# Mount static files
static_path = Path(__file__).parent / "static"
static_path.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await db.init_db()
    # Update team names from config file
    await db.reset_teams_with_config_names()

@app.get("/")
async def read_root():
    """Serve the main application page"""
    return FileResponse(static_path / "index.html")

@app.get("/api/teams")
async def get_teams():
    """Get all teams and their configurations"""
    teams = await db.get_all_teams()
    return {"teams": teams}

@app.get("/api/teams/{team_id}")
async def get_team(team_id: int):
    """Get specific team configuration"""
    team = await db.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@app.post("/api/teams/{team_id}/config")
async def update_team_config(team_id: int, config: TeamUpdate):
    """Update team configuration"""
    success = await db.update_team_config(team_id, config.dict())
    if not success:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Notify all connected clients about the update
    await manager.broadcast({"type": "team_updated", "team_id": team_id, "config": config.dict()})
    
    return {"message": "Team configuration updated"}

@app.post("/api/teams/{team_id}/simulate")
async def run_simulation(team_id: int):
    """Run simulation for a specific team"""
    try:
        # Update simulation status
        await db.update_simulation_status(team_id, "running")
        await manager.broadcast({"type": "simulation_started", "team_id": team_id})
        
        # Run simulation in background using the sync version
        asyncio.create_task(run_team_simulation_sync(team_id))
        
        return {"message": "Simulation started", "team_id": team_id}
    except Exception as e:
        await db.update_simulation_status(team_id, "error")
        await manager.broadcast({"type": "simulation_error", "team_id": team_id, "error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate/all")
async def run_all_simulations():
    """Run simulation for all teams sequentially"""
    try:
        teams = await db.get_all_teams()
        team_ids = [team["id"] for team in teams]
        
        # Start sequential simulation task
        asyncio.create_task(run_sequential_simulations(team_ids))
        
        await manager.broadcast({"type": "bulk_simulation_started", "team_ids": team_ids})
        return {"message": f"Sequential simulation started for {len(team_ids)} teams", "team_ids": team_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/simulate/selected")
async def run_selected_simulations(team_ids: List[int]):
    """Run simulation for selected teams sequentially"""
    try:
        # Validate team IDs
        teams = await db.get_all_teams()
        valid_team_ids = [team["id"] for team in teams]
        invalid_ids = [tid for tid in team_ids if tid not in valid_team_ids]
        
        if invalid_ids:
            raise HTTPException(status_code=400, detail=f"Invalid team IDs: {invalid_ids}")
        
        # Start sequential simulation task
        asyncio.create_task(run_sequential_simulations(team_ids))
        
        await manager.broadcast({"type": "bulk_simulation_started", "team_ids": team_ids})
        return {"message": f"Sequential simulation started for {len(team_ids)} selected teams", "team_ids": team_ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_sequential_simulations(team_ids: List[int]):
    """Run simulations sequentially to avoid database conflicts"""
    for team_id in team_ids:
        try:
            await db.update_simulation_status(team_id, "running")
            await manager.broadcast({"type": "simulation_started", "team_id": team_id})
            
            # Run simulation synchronously (one at a time)
            await run_team_simulation_sync(team_id)
            
        except Exception as e:
            await db.update_simulation_status(team_id, "error")
            await manager.broadcast({"type": "simulation_error", "team_id": team_id, "error": str(e)})
    
    # After all simulations are done, run detailed analysis to generate results.csv
    try:
        await generate_detailed_analysis()
        await manager.broadcast({"type": "detailed_analysis_completed"})
    except Exception as e:
        await manager.broadcast({"type": "detailed_analysis_error", "error": str(e)})

async def generate_detailed_analysis():
    """Generate detailed analysis and results.csv file"""
    # Change to project root directory
    original_cwd = os.getcwd()
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    os.chdir(project_root)
    
    try:
        # Get config file path
        config_file_path = get_config_file_path()
        
        # Get actual number of teams from database
        teams = await db.get_all_teams()
        actual_team_count = len(teams)
        
        # Run custom detailed analysis with correct team count
        await run_detailed_analysis_for_teams(config_file_path, actual_team_count)
    finally:
        # Always restore original working directory
        os.chdir(original_cwd)

async def run_detailed_analysis_for_teams(config_file_path: str, team_count: int):
    """Run detailed analysis for the specified number of teams"""
    # Import the analysis function from detailed_analysis module
    from detailed_analysis import analyse_energy_system
    
    # Read config
    with open(config_file_path, 'r', encoding='utf-8') as ymlfile:
        cfg = yaml.load(ymlfile, Loader=yaml.CLoader)
    
    # Analyze each team
    teamdata = None
    for n in range(team_count):
        if n == 0:
            teamdata = analyse_energy_system(config_path=config_file_path, team_number=n)
        else:
            teamdata_aux = analyse_energy_system(config_path=config_file_path, team_number=n)
            teamdata = pd.concat([teamdata, teamdata_aux])

        if n == team_count - 1:
            print('S i m u l a t i o n  f i n i s h e d !')

    # Create results directory and save CSV
    script_dir = os.path.dirname(os.path.abspath(__file__))
    results_dir = os.path.join(script_dir, '..', '..', 'results', 'optimisation_results', 'tables')
    results_dir = os.path.abspath(results_dir)
    os.makedirs(results_dir, exist_ok=True)
    
    results_file = os.path.join(results_dir, 'results.csv')
    teamdata.to_csv(results_file)

async def update_config_team_count(config_file_path: str, team_count: int):
    """Temporarily update the config file to set the correct number of teams"""
    # Read current config
    with open(config_file_path, 'r', encoding='utf-8') as f:
        cfg = yaml.load(f, Loader=yaml.CLoader)
    
    # Update team count
    cfg['number_of_teams'] = team_count
    
    # Write back to file
    with open(config_file_path, 'w', encoding='utf-8') as f:
        yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True)

async def run_team_simulation_sync(team_id: int):
    """Synchronous version of team simulation to avoid database locks"""
    try:
        # Get team config and save to CSV format
        team_config = await db.get_team(team_id)
        if not team_config:
            raise Exception("Team not found")
        
        # Save team config to CSV file (existing format)
        config_path = save_team_config_to_csv(team_id, team_config["parameters"])
        
        # Change to project root directory for simulation
        original_cwd = os.getcwd()
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        os.chdir(project_root)
        
        try:
            # Run the actual simulation
            config_file_path = get_config_file_path()
            run_model(config_path=config_file_path, team_number=team_id-1)  # 0-indexed
            
            # Generate results and store them
            results = display_results(config_path=config_file_path, team_number=team_id-1)
            
            # Store results in database with built-in retry mechanism
            await db.store_simulation_results(team_id, results)
        finally:
            # Always restore original working directory
            os.chdir(original_cwd)
        
        # Update status and notify clients
        await db.update_simulation_status(team_id, "completed")
        
        # Get results and broadcast
        results = await get_simulation_results(team_id)
        await manager.broadcast({
            "type": "simulation_completed", 
            "team_id": team_id, 
            "results": results
        })
        
        # Check if this was the last team to complete and run detailed analysis
        await check_and_run_detailed_analysis()
        
    except Exception as e:
        await db.update_simulation_status(team_id, "error")
        await manager.broadcast({"type": "simulation_error", "team_id": team_id, "error": str(e)})
        raise e

async def check_and_run_detailed_analysis():
    """Check if all teams have been simulated and run detailed analysis if so"""
    try:
        teams = await db.get_all_teams()
        completed_teams = []
        
        for team in teams:
            status = await db.get_simulation_status(team["id"])
            if status == "completed":
                completed_teams.append(team["id"])
        
        # If all teams are completed, run detailed analysis
        if len(completed_teams) == len(teams) and len(teams) > 0:
            await generate_detailed_analysis()
            await manager.broadcast({"type": "detailed_analysis_completed"})
    except Exception as e:
        print(f"Error in detailed analysis check: {e}")
        # Don't raise error here to avoid disrupting team simulation

@app.get("/api/compare/csv-data")
async def get_comparison_csv_data():
    """Get detailed comparison data from results.csv"""
    try:
        csv_data = get_all_results_from_csv()
        return csv_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading CSV data: {str(e)}")

def get_all_results_from_csv():
    """Get all team results from the results.csv file"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'results', 'optimisation_results', 'tables', 'results.csv')
        csv_path = os.path.abspath(csv_path)
        
        if not os.path.exists(csv_path):
            return []
            
        df = pd.read_csv(csv_path)
        
        # Convert DataFrame to list of dictionaries
        results = []
        for index, row in df.iterrows():
            result = {}
            for column in df.columns:
                result[column] = row[column]
            results.append(result)
        
        return results
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return []

@app.get("/api/parameters")
async def get_parameters():
    """Get general parameters from CSV"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'data', 'general_parameters.csv')
        csv_path = os.path.abspath(csv_path)
        
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="Parameters file not found")
            
        df = pd.read_csv(csv_path)
        
        # Fill NaN values and ensure proper data types
        df = df.fillna('')
        
        # Convert to list of dictionaries with proper handling of data types
        parameters = []
        for index, row in df.iterrows():
            param = {}
            for column in df.columns:
                value = row[column]
                # Handle different data types properly
                if pd.isna(value):
                    param[column] = ''
                elif isinstance(value, (int, float)) and not pd.isna(value):
                    param[column] = float(value) if column == 'value' else str(value)
                else:
                    param[column] = str(value)
            parameters.append(param)
        
        return parameters
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading parameters: {str(e)}")

@app.post("/api/parameters")
async def save_parameters(parameters: List[Dict]):
    """Save general parameters to CSV"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'data', 'general_parameters.csv')
        csv_path = os.path.abspath(csv_path)
        
        # Convert to DataFrame and save
        df = pd.DataFrame(parameters)
        df.to_csv(csv_path, index=False)
        
        return {"message": "Parameters saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving parameters: {str(e)}")

@app.get("/api/timeseries")
async def get_timeseries(variable: str, time_range: str = "week", start: int = 1):
    """Get time series data from DAT CSV"""
    try:
        # Ensure start is an integer (FastAPI query params can sometimes be strings)
        if isinstance(start, str):
            start = int(start)
            
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'data', 'DAT_Energie-Workshop.CSV')
        csv_path = os.path.abspath(csv_path)
        
        if not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="Time series data file not found")
            
        # Calculate range and end points first
        range_hours = {
            "week": 168,
            "month": 720, 
            "season": 2160,
            "year": 8760
        }
        
        hours = range_hours.get(time_range, 168)
        
        # For large datasets, limit to max 1000 points for performance
        if hours > 1000:
            step = max(1, hours // 1000)  # Sample every nth point
        else:
            step = 1
            
        # Read only necessary rows for better performance
        start_idx = max(0, start - 1)  # Convert to 0-based index
        end_idx = start_idx + hours
        
        # Read CSV with specific rows
        df = pd.read_csv(csv_path, skiprows=range(1, start_idx + 1) if start_idx > 0 else None, 
                        nrows=hours)
        
        # Validate variable exists
        if variable not in df.columns:
            raise HTTPException(status_code=400, detail=f"Variable '{variable}' not found")
        
        # Sample data if step > 1
        if step > 1:
            df_sampled = df.iloc[::step].copy()
        else:
            df_sampled = df.copy()
        
        # Clean the data and handle NaN values more efficiently
        values = df_sampled[variable].fillna(0.0)
        
        # Convert to JSON-safe float values
        clean_values = [float(x) if pd.notna(x) and isinstance(x, (int, float)) else 0.0 for x in values]
        
        # Generate hour labels efficiently
        actual_hours = len(clean_values)
        hour_labels = list(range(start, start + actual_hours * step, step))[:actual_hours]
        
        return {
            "variable": variable,
            "range": time_range,
            "start_hour": start,
            "hours": hour_labels,
            "values": clean_values,
            "step": step,
            "total_requested": hours,
            "points_returned": len(clean_values)
        }
    except Exception as e:
        import traceback
        print(f"Error in timeseries: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error reading time series: {str(e)}")

@app.post("/api/teams/reload-from-csv")
async def reload_teams_from_csv():
    """Reload team parameters from existing CSV files"""
    try:
        await db.reset_teams_with_config_names()
        await manager.broadcast({"type": "teams_reloaded"})
        return {"message": "Team parameters reloaded from CSV files"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/teams/{team_id}/results")
async def get_team_results(team_id: int):
    """Get simulation results for a team"""
    results = await get_simulation_results(team_id)
    return results

@app.get("/api/compare")
async def compare_teams():
    """Get enhanced comparison data for all teams"""
    teams = await db.get_all_teams()
    comparison_data = []
    
    for team in teams:
        if team["simulation_status"] == "completed":
            results = await get_simulation_results(team["id"])
            if results and results.get("energy_cost", 0) > 0:  # Only include teams with real results
                comparison_data.append({
                    "team_id": team["id"],
                    "team_name": results.get("team_name", team["name"]),
                    "energy_cost": results.get("energy_cost", 0),
                    "co2_emissions": results.get("co2_emissions", 0),
                    "renewable_share": results.get("renewable_share", 0),
                    "cost_breakdown": results.get("cost_breakdown", {}),
                    "technology_mix": results.get("technology_mix", {}),
                    "self_sufficiency_detailed": results.get("self_sufficiency_detailed", {}),
                    "emissions_breakdown": results.get("emissions_breakdown", {}),
                    "energy_balance": results.get("energy_balance", {})
                })
    
    return {"teams": comparison_data}

@app.get("/api/compare/csv")
async def get_comparison_csv():
    """Get the complete results CSV for download"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'results', 'optimisation_results', 'tables', 'results.csv')
        csv_path = os.path.abspath(csv_path)
        
        if os.path.exists(csv_path):
            return FileResponse(csv_path, filename="team_comparison_results.csv")
        else:
            raise HTTPException(status_code=404, detail="Results CSV not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if needed
            message = json.loads(data)
            # Echo back or process message
            await manager.send_personal_message(json.dumps({"echo": message}), websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def save_team_config_to_csv(team_id: int, parameters: Dict):
    """Save team configuration to CSV file in existing format"""
    # Convert parameters to DataFrame matching existing CSV structure
    data = []
    param_mapping = {
        "windturbines": ("number_of_windturbines", "1", "wind_turb"),
        "chps": ("number_of_chps", "1", "chp"),
        "boilers": ("number_of_boilers", "1", "boiler"),
        "pv_plants": ("number_of_PV_pp", "1", "PV_pp"),
        "heat_pumps": ("number_of_heat_pumps", "1", "heat_pump"),
        "pv_area": ("area_PV", "ha", "PV"),
        "solar_thermal_area": ("area_solar_th", "ha", "solart_th"),
        "electrical_storage": ("capacity_electr_storage", "daily_demand", "storage_el"),
        "thermal_storage": ("capacity_thermal_storage", "daily_demand", "storage_th"),
    }
    
    for i, (key, (var_name, unit, component)) in enumerate(param_mapping.items(), 1):
        value = parameters.get(key, 0)
        data.append({
            "id": i,
            "var_name": var_name,
            "value": value,
            "unit": unit,
            "reference": "",
            "Comment": "",
            "tag_1": "",
            "tag_2": "",
            "component": component
        })
    
    df = pd.DataFrame(data)
    
    # Use absolute path to main data directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '..', '..', 'data')
    data_dir = os.path.abspath(data_dir)
    os.makedirs(data_dir, exist_ok=True)
    
    csv_filename = f"parameters_Team_{team_id:02d}.csv"
    full_path = os.path.join(data_dir, csv_filename)
    df.to_csv(full_path, index=False)
    
    return full_path

def get_config_file_path():
    """Get absolute path to config file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_path = os.path.join(script_dir, '..', '..', 'experiment_config', 'config.yml')
    return os.path.abspath(config_path)

async def get_simulation_results(team_id: int):
    """Extract simulation results for a team from CSV and database"""
    # First try to get results from the comprehensive CSV file
    csv_results = get_results_from_csv(team_id)
    
    if csv_results:
        return csv_results
    
    # Fallback to database results
    results = await db.get_team_results(team_id)
    
    if results and results.get('results_data'):
        data = results['results_data']
        return {
            "energy_cost": round(data.get("total_costs", 0), 2),
            "co2_emissions": round(data.get("co2_emissions", 0), 2), 
            "renewable_share": round(data.get("self_sufficiency", 0), 1),  # Already in %
            "team_name": data.get("team_name", f"Team {team_id}"),
            "charts": {
                "energy_mix": "/api/charts/energy_mix/" + str(team_id),
                "cost_breakdown": "/api/charts/cost_breakdown/" + str(team_id)
            }
        }
    else:
        # Return placeholder data if no results available
        return {
            "energy_cost": 0,
            "co2_emissions": 0,
            "renewable_share": 0,
            "team_name": f"Team {team_id}",
            "charts": {
                "energy_mix": "/api/charts/energy_mix/" + str(team_id),
                "cost_breakdown": "/api/charts/cost_breakdown/" + str(team_id)
            }
        }

def get_results_from_csv(team_id: int):
    """Extract comprehensive results from the results.csv file"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(script_dir, '..', '..', 'results', 'optimisation_results', 'tables', 'results.csv')
        csv_path = os.path.abspath(csv_path)
        
        if not os.path.exists(csv_path):
            return None
            
        df = pd.read_csv(csv_path)
        
        # Find the row for this team (team_id - 1 because CSV is 0-indexed)
        team_row_index = team_id - 1
        if team_row_index >= len(df):
            return None
            
        row = df.iloc[team_row_index]
        
        return {
            "team_name": row.get('team name', f"Team {team_id}"),
            "energy_cost": round(float(row.get('costs', 0)), 2),
            "co2_emissions": round(float(row.get('emissions', 0)), 1),
            "renewable_share": round(float(row.get('selfsufficiency', 0)), 1),  # Already in %
            
            # Detailed breakdown
            "cost_breakdown": {
                "investment": round(float(row.get('cost invest', 0)), 2),
                "operation": round(float(row.get('cost operation', 0)), 2),
            },
            
            "technology_mix": {
                "chps": int(row.get('chps', 0)),
                "boilers": int(row.get('boilers', 0)),
                "windturbines": int(row.get('windturbines', 0)),
                "heat_pumps": int(row.get('heatpumps', 0)),
                "pv_plants": int(row.get('PV', 0)),
                "solar_thermal": int(row.get('solarthermal', 0)),
                "electrical_storage": round(float(row.get('EES', 0)), 1),
                "thermal_storage": round(float(row.get('TES', 0)), 1),
            },
            
            "self_sufficiency_detailed": {
                "total": round(float(row.get('selfsufficiency', 0)), 1),
                "electrical": round(float(row.get('selfsufficiency electric', 0)) * 100, 1),
                "thermal": round(float(row.get('selfsufficiency heat', 0)) * 100, 1),
            },
            
            "emissions_breakdown": {
                "total": round(float(row.get('emissions', 0)), 1),
                "production": round(float(row.get('emissions production', 0)), 1),
                "purchase": round(float(row.get('emissions purchase', 0)), 1),
            },
            
            "energy_balance": {
                "electricity": {
                    "demand": round(float(row.get('total el demand', 0)), 1),
                    "production": round(float(row.get('total el production', 0)), 1),
                    "purchase": round(float(row.get('total el purchase', 0)), 1),
                    "excess": round(float(row.get('total el excess', 0)), 1),
                },
                "heat": {
                    "demand": round(float(row.get('total heat demand', 0)), 1),
                    "production": round(float(row.get('total heat production', 0)), 1),
                    "purchase": round(float(row.get('total heat purchase', 0)), 1),
                    "excess": round(float(row.get('total heat excess', 0)), 1),
                }
            },
            
            "charts": {
                "energy_mix": "/api/charts/energy_mix/" + str(team_id),
                "cost_breakdown": "/api/charts/cost_breakdown/" + str(team_id)
            }
        }
        
    except Exception as e:
        print(f"Error reading results CSV for team {team_id}: {e}")
        return None

@app.get("/api/timeseries/summary")
async def get_timeseries_summary_endpoint():
    """Get summary of available time-series data for all teams"""
    try:
        summary = get_timeseries_summary()
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting timeseries summary: {str(e)}")

@app.get("/api/timeseries/team/{team_id}")
async def get_team_timeseries_endpoint(team_id: int):
    """Get complete time-series data for a specific team"""
    try:
        if team_id < 1 or team_id > 8:
            raise HTTPException(status_code=400, detail="Team ID must be between 1 and 8")
            
        timeseries_data = load_team_timeseries(team_id)
        
        if timeseries_data is None:
            raise HTTPException(status_code=404, detail=f"No timeseries data found for team {team_id}")
            
        return {"team_id": team_id, "data": timeseries_data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading timeseries for team {team_id}: {str(e)}")

@app.get("/api/timeseries/team/{team_id}/variables")
async def get_team_variables_endpoint(team_id: int):
    """Get available time-series variables for a specific team"""
    try:
        if team_id < 1 or team_id > 8:
            raise HTTPException(status_code=400, detail="Team ID must be between 1 and 8")
            
        variables = get_available_variables(team_id)
        
        return {"team_id": team_id, "variables": variables}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting variables for team {team_id}: {str(e)}")

@app.get("/api/timeseries/team/{team_id}/variable/{variable_name}")
async def get_team_variable_data_endpoint(team_id: int, variable_name: str):
    """Get time-series data for a specific variable of a specific team"""
    try:
        if team_id < 1 or team_id > 8:
            raise HTTPException(status_code=400, detail="Team ID must be between 1 and 8")
            
        # Get the time-series data for this variable
        data = get_variable_data(team_id, variable_name)
        
        if not data:
            raise HTTPException(status_code=404, detail=f"No data found for variable '{variable_name}' in team {team_id}")
            
        # Also get time information
        timeseries_data = load_team_timeseries(team_id)
        time_data = timeseries_data.get('time', []) if timeseries_data else []
        hour_data = timeseries_data.get('hour', []) if timeseries_data else []
        
        return {
            "team_id": team_id,
            "variable": variable_name,
            "time": time_data,
            "hour": hour_data,
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting variable data for team {team_id}: {str(e)}")

@app.get("/api/timeseries/team/{team_id}/sankey")
async def get_team_sankey_endpoint(team_id: int, time_period: str = "year"):
    """Get Sankey diagram data for a specific team's energy flows"""
    try:
        if team_id < 1 or team_id > 8:
            raise HTTPException(status_code=400, detail="Team ID must be between 1 and 8")
            
        valid_periods = ["year", "month", "week", "day", "hour"]
        if time_period not in valid_periods:
            raise HTTPException(status_code=400, detail=f"Time period must be one of: {valid_periods}")
            
        sankey_data = get_energy_flows_for_sankey(team_id, time_period)
        
        if not sankey_data:
            raise HTTPException(status_code=404, detail=f"No energy flow data found for team {team_id}")
            
        return sankey_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating Sankey diagram for team {team_id}: {str(e)}")

@app.get("/api/timeseries/compare")
async def get_timeseries_comparison(
    variable: str,
    teams: str = "all",  # Comma-separated team IDs or "all"
    time_range: str = "all",  # "hour", "day", "week", "month", "all"
    start_hour: int = 0
):
    """Compare time-series data across multiple teams"""
    try:
        # Parse team selection
        if teams == "all":
            team_ids = list(range(1, 9))
        else:
            team_ids = [int(t.strip()) for t in teams.split(",") if t.strip().isdigit()]
            
        # Validate team IDs
        team_ids = [t for t in team_ids if 1 <= t <= 8]
        
        if not team_ids:
            raise HTTPException(status_code=400, detail="No valid team IDs provided")
            
        # Define time ranges
        time_ranges = {
            "hour": 1,
            "day": 24,
            "week": 168,
            "month": 744,
            "year": 8760,
            "all": 8760
        }
        
        if time_range not in time_ranges:
            raise HTTPException(status_code=400, detail="Invalid time range")
            
        hours_to_show = time_ranges[time_range]
        end_hour = min(start_hour + hours_to_show, 8760)
        
        # Collect data for comparison
        comparison_data = {
            "variable": variable,
            "time_range": time_range,
            "start_hour": start_hour,
            "end_hour": end_hour,
            "teams": {},
            "time_axis": list(range(start_hour, end_hour))
        }
        
        for team_id in team_ids:
            # Use the new get_variable_data function
            variable_data = get_variable_data(team_id, variable)
            if variable_data:
                # Apply time range filter
                filtered_data = variable_data[start_hour:end_hour]
                comparison_data["teams"][f"Team_{team_id:02d}"] = filtered_data
                    
        return comparison_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in timeseries comparison: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)