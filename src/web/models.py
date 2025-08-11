from pydantic import BaseModel
from typing import Dict, Optional, Any
from datetime import datetime

class TeamConfig(BaseModel):
    """Team configuration model"""
    id: int
    name: str
    parameters: Dict[str, Any]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class TeamUpdate(BaseModel):
    """Model for team parameter updates"""
    windturbines: int = 0
    chps: int = 0
    boilers: int = 0
    pv_plants: int = 0
    heat_pumps: int = 0
    pv_area: float = 0.0
    solar_thermal_area: float = 0.0
    electrical_storage: float = 0.0
    thermal_storage: float = 0.0

class SimulationResult(BaseModel):
    """Simulation result model"""
    team_id: int
    energy_cost: float
    co2_emissions: float
    renewable_share: float
    simulation_time: datetime
    charts: Dict[str, str]

class SimulationStatus(BaseModel):
    """Simulation status model"""
    team_id: int
    status: str  # 'idle', 'running', 'completed', 'error'
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
