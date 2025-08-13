"""
Pydantic Modelle für District/Quartier Datenstrukturen
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime

class EnergyDemand(BaseModel):
    electricity_mwh: float = Field(ge=0, description="Electrical energy demand in MWh")
    heating_mwh: float = Field(ge=0, description="Heating energy demand in MWh")
    cooling_mwh: float = Field(default=0, ge=0, description="Cooling energy demand in MWh")
    total_mwh: float = Field(description="Total energy demand in MWh")

class RenewablePotential(BaseModel):
    solar_pv_mwh: float = Field(default=0, ge=0, description="Solar PV potential in MWh")
    wind_mwh: float = Field(default=0, ge=0, description="Wind energy potential in MWh")
    biomass_mwh: float = Field(default=0, ge=0, description="Biomass potential in MWh")
    geothermal_mwh: float = Field(default=0, ge=0, description="Geothermal potential in MWh")
    total_mwh: float = Field(description="Total renewable potential in MWh")

class BuildingTypes(BaseModel):
    residential: int = Field(default=0, ge=0, description="Number of residential buildings")
    commercial: int = Field(default=0, ge=0, description="Number of commercial buildings")
    industrial: int = Field(default=0, ge=0, description="Number of industrial buildings")
    public: int = Field(default=0, ge=0, description="Number of public buildings")

class District(BaseModel):
    id: str = Field(description="Unique district identifier")
    name: str = Field(description="District name")
    geometry: Dict = Field(description="GeoJSON geometry")
    center: List[float] = Field(description="Center coordinates [lat, lng]")
    district_type: str = Field(description="Type: residential, commercial, industrial, mixed")
    population: int = Field(ge=0, description="Population count")
    area_km2: float = Field(gt=0, description="Area in square kilometers")
    building_types: BuildingTypes = Field(description="Building type breakdown")
    energy_demand: EnergyDemand = Field(description="Energy demand data")
    renewable_potential: RenewablePotential = Field(description="Renewable energy potential")
    additional_data: Optional[Dict] = Field(default={}, description="Additional data")
    created_at: Optional[datetime] = Field(default=None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(default=None, description="Last update timestamp")

class DistrictCreate(BaseModel):
    name: str
    geometry: Dict
    center: List[float]
    district_type: str
    population: int = Field(ge=0)
    area_km2: float = Field(gt=0)
    building_types: BuildingTypes
    energy_demand: EnergyDemand
    renewable_potential: RenewablePotential
    additional_data: Optional[Dict] = {}

class DistrictUpdate(BaseModel):
    name: Optional[str] = None
    district_type: Optional[str] = None
    population: Optional[int] = Field(default=None, ge=0)
    building_types: Optional[BuildingTypes] = None
    energy_demand: Optional[EnergyDemand] = None
    renewable_potential: Optional[RenewablePotential] = None
    additional_data: Optional[Dict] = None
