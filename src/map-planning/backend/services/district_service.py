"""
Service für District/Quartier-bezogene Geschäftslogik
"""
from typing import List, Dict, Optional
from ..models.district_model import District
from ..database import GridPlanningDatabase

class DistrictService:
    def __init__(self, database: GridPlanningDatabase):
        self.db = database
        
    async def get_all_districts(self) -> List[Dict]:
        """Get all districts with their data"""
        return await self.db.get_districts()
        
    async def get_district(self, district_id: str) -> Optional[Dict]:
        """Get specific district by ID"""
        districts = await self.db.get_districts()
        for district in districts:
            if district.get('id') == district_id:
                return district
        return None
        
    async def get_energy_balance(self, district_id: str) -> Dict:
        """Calculate energy balance for district"""
        district = await self.get_district(district_id)
        if not district:
            raise ValueError(f"District {district_id} not found")
            
        # Energy balance calculation logic
        energy_demand = district.get('energy_demand', {})
        renewable_potential = district.get('renewable_potential', {})
        
        total_demand = sum(energy_demand.values()) if isinstance(energy_demand, dict) else 0
        total_potential = sum(renewable_potential.values()) if isinstance(renewable_potential, dict) else 0
        
        return {
            'district_id': district_id,
            'district_name': district.get('name', ''),
            'total_demand_mwh': total_demand,
            'total_potential_mwh': total_potential,
            'balance_mwh': total_potential - total_demand,
            'self_sufficiency_ratio': (total_potential / total_demand) if total_demand > 0 else 0,
            'energy_demand': energy_demand,
            'renewable_potential': renewable_potential
        }
        
    async def get_energy_flows(self, district_id: str) -> Dict:
        """Get energy flows for district"""
        balance = await self.get_energy_balance(district_id)
        district = await self.get_district(district_id)
        
        if not district:
            raise ValueError(f"District {district_id} not found")
            
        # Energy flow analysis
        energy_demand = balance['energy_demand']
        renewable_potential = balance['renewable_potential']
        
        return {
            'district_id': district_id,
            'district_name': district.get('name', ''),
            'energy_balance': balance,
            'primary_energy_mix': self._calculate_primary_energy_mix(energy_demand),
            'renewable_breakdown': renewable_potential,
            'import_export': {
                'import_mwh': max(0, balance['total_demand_mwh'] - balance['total_potential_mwh']),
                'export_mwh': max(0, balance['total_potential_mwh'] - balance['total_demand_mwh'])
            }
        }
        
    async def update_district(self, district_id: str, district_data: dict) -> Dict:
        """Update district data"""
        # Implementation depends on database update methods
        # This is a placeholder
        return {'status': 'updated', 'district_id': district_id}
        
    def _calculate_primary_energy_mix(self, energy_demand: Dict) -> Dict:
        """Calculate primary energy source breakdown"""
        if not energy_demand:
            return {}
            
        total = sum(energy_demand.values())
        if total == 0:
            return {}
            
        return {
            source: {
                'value_mwh': value,
                'percentage': round((value / total) * 100, 1)
            }
            for source, value in energy_demand.items()
        }
