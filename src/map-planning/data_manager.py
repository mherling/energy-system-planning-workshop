"""
Datenmanagement für Quartier-Konfiguration
Lädt und verwaltet Quartier-Daten aus YAML-Konfiguration
"""

import yaml
import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)

@dataclass
class QuartierData:
    """Datenklasse für ein Quartier mit allen relevanten Informationen"""
    id: str
    name: str
    district_type: str
    area_km2: float
    population: int
    geometry: Dict[str, Any]
    energy_demand: Dict[str, Any] = field(default_factory=dict)
    renewable_potential: Dict[str, Any] = field(default_factory=dict)
    building_types: Dict[str, Any] = field(default_factory=dict)
    demographics: Dict[str, Any] = field(default_factory=dict)
    infrastructure: Dict[str, Any] = field(default_factory=dict)
    additional_data: Dict[str, Any] = field(default_factory=dict)

@dataclass
class StakeholderData:
    """Datenklasse für Stakeholder"""
    id: str
    name: str
    category: str
    contact: Dict[str, str]
    interests: List[str]
    district_id: str
    influence_level: str
    participation_willingness: str

@dataclass
class TechnologyData:
    """Datenklasse für Technologie-Templates"""
    id: str
    name: str
    category: str
    technology_type: str
    parameters: Dict[str, Any]
    costs: Dict[str, Any]
    environmental: Dict[str, Any]
    availability: str
    constraints: List[str] = field(default_factory=list)

class QuartierDataManager:
    """Verwaltet Quartier-Konfiguration und generiert Daten"""
    
    def __init__(self, config_file: str = "quartier_config.yml"):
        self.config_file = Path(__file__).parent / "data" / config_file
        self.config = None
        self.geojson_data = None
        self.load_config()
        self.load_geojson()
    
    def load_config(self):
        """Lädt die YAML-Konfiguration"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            logger.info(f"Konfiguration geladen aus {self.config_file}")
        except FileNotFoundError:
            logger.error(f"Konfigurationsdatei nicht gefunden: {self.config_file}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"Fehler beim Laden der YAML-Konfiguration: {e}")
            raise
    
    def load_geojson(self):
        """Lädt die GeoJSON-Daten"""
        geojson_file = Path(__file__).parent / "data" / "Stadtteile_Zittau.geojson"
        try:
            with open(geojson_file, 'r', encoding='utf-8') as f:
                self.geojson_data = json.load(f)
            logger.info(f"GeoJSON-Daten geladen aus {geojson_file}")
        except FileNotFoundError:
            logger.error(f"GeoJSON-Datei nicht gefunden: {geojson_file}")
            raise
    
    def calculate_energy_demand(self, quartier_config: Dict, population: int, area_km2: float) -> Dict[str, Any]:
        """Berechnet Energiebedarf - nutzt absolute Werte wenn vorhanden, sonst Faktoren"""
        
        # Prüfe ob absolute Werte definiert sind
        if 'energy_demand' in quartier_config:
            return quartier_config['energy_demand']
        
        # Fallback auf Faktor-basierte Berechnung
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type]['energy_demand']
        
        # Basis-Berechnung
        electricity_mwh = population * defaults['electricity_factor']
        heating_mwh = population * defaults['heating_factor']
        cooling_mwh = population * defaults['cooling_factor']
        transport_mwh = population * defaults['transport_factor']
        
        # Spezialfaktoren anwenden
        special_factors = quartier_config.get('special_factors', {})
        if 'energy_demand' in special_factors:
            for key, factor in special_factors['energy_demand'].items():
                if key == 'electricity_factor':
                    electricity_mwh = population * factor
                elif key == 'heating_factor':
                    heating_mwh = population * factor
        
        return {
            'electricity_mwh': round(electricity_mwh, 1),
            'heating_mwh': round(heating_mwh, 1),
            'cooling_mwh': round(cooling_mwh, 1),
            'transport_mwh': round(transport_mwh, 1),
            'total_annual_mwh': round(electricity_mwh + heating_mwh + cooling_mwh, 1),
            'peak_demand_mw': round((electricity_mwh + heating_mwh) * 0.0002, 2)
        }
    
    def calculate_renewable_potential(self, quartier_config: Dict, population: int, area_km2: float) -> Dict[str, Any]:
        """Berechnet erneuerbares Energiepotential - nutzt absolute Werte wenn vorhanden, sonst Faktoren"""
        
        # Prüfe ob absolute Werte definiert sind
        if 'renewable_potential' in quartier_config:
            return quartier_config['renewable_potential']
        
        # Fallback auf Faktor-basierte Berechnung
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type]['renewable_potential']
        
        # Basis-Berechnung
        solar_pv_mwh = population * defaults['solar_pv_factor']
        solar_thermal_mwh = population * defaults['solar_thermal_factor']
        small_wind_mwh = population * defaults['small_wind_factor']
        
        # Spezialfaktoren anwenden
        special_factors = quartier_config.get('special_factors', {})
        if 'renewable_potential' in special_factors:
            for key, factor in special_factors['renewable_potential'].items():
                if key == 'solar_pv_factor':
                    solar_pv_mwh = population * factor
                elif key == 'solar_thermal_factor':
                    solar_thermal_mwh = population * factor
                elif key == 'biomass_mwh':
                    # Direkte Angabe für Biomasse
                    pass
        
        # Biomasse-Potential (falls vorhanden)
        biomass_mwh = special_factors.get('renewable_potential', {}).get('biomass_mwh', 0)
        
        return {
            'solar_pv_mwh': round(solar_pv_mwh, 1),
            'solar_thermal_mwh': round(solar_thermal_mwh, 1),
            'small_wind_mwh': round(small_wind_mwh, 1),
            'biomass_mwh': biomass_mwh,
            'geothermal_mwh': round(area_km2 * 100, 1),  # Grobe Schätzung
            'total_potential_mwh': round(solar_pv_mwh + solar_thermal_mwh + small_wind_mwh + biomass_mwh, 1)
        }
    
    def calculate_building_types(self, quartier_config: Dict, population: int) -> Dict[str, Any]:
        """Berechnet Gebäudetypen-Verteilung"""
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type]['buildings']
        
        # Geschätzte Gesamtgebäudezahl
        total_buildings = int(population / 2.2)  # Durchschnittliche Haushaltsgröße
        
        return {
            'residential': int(total_buildings * defaults['residential_pct'] / 100),
            'commercial': int(total_buildings * defaults['commercial_pct'] / 100),
            'industrial': int(total_buildings * defaults.get('industrial_pct', 0) / 100),
            'public': int(total_buildings * defaults['public_pct'] / 100),
            'mixed_use': int(total_buildings * defaults.get('mixed_use_pct', 0) / 100),
            'total_buildings': total_buildings
        }
    
    def calculate_demographics(self, quartier_config: Dict, population: int) -> Dict[str, Any]:
        """Berechnet demographische Daten"""
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type]['demographics']
        
        # Spezialfaktoren berücksichtigen
        special_factors = quartier_config.get('special_factors', {})
        demographics_override = special_factors.get('demographics', {})
        
        return {
            'avg_age': demographics_override.get('avg_age', defaults['avg_age']),
            'households': int(population / 2.2),
            'avg_income_eur': demographics_override.get('avg_income_eur', defaults['avg_income_eur']),
            'education_high_pct': demographics_override.get('education_high_pct', defaults['education_high_pct']),
            'unemployment_rate_pct': defaults['unemployment_rate_pct']
        }
    
    def calculate_infrastructure(self, quartier_config: Dict, population: int) -> Dict[str, Any]:
        """Berechnet Infrastruktur-Kennzahlen"""
        return {
            'schools': max(1, population // 800),
            'kindergartens': max(1, population // 600),
            'medical_facilities': max(1, population // 1500),
            'shopping_centers': max(1, population // 1000),
            'public_transport_quality': "gut" if population > 1500 else "befriedigend",
            'green_space_pct': 25 + (quartier_config.get('special_factors', {}).get('rural_character', False) * 15)
        }
    
    def get_quartier_center(self, quartier_id: str) -> List[float]:
        """Berechnet Zentrum eines Quartiers aus GeoJSON-Daten"""
        quartier_num = int(quartier_id.split('_')[1])
        
        for feature in self.geojson_data['features']:
            if feature['properties']['id'] == quartier_num:
                coords = feature['geometry']['coordinates'][0][0]
                lats = [coord[1] for coord in coords]
                lons = [coord[0] for coord in coords]
                return [sum(lats) / len(lats), sum(lons) / len(lons)]
        
        return [50.8994, 14.8076]  # Fallback: Zittau Zentrum
    
    def generate_quartier_data(self) -> List[QuartierData]:
        """Generiert alle Quartier-Daten basierend auf Konfiguration"""
        quartiers = []
        
        for quartier_id, quartier_config in self.config['quartiers'].items():
            # Population berechnen oder überschreiben
            if 'population_override' in quartier_config:
                population = quartier_config['population_override']
            else:
                district_type = quartier_config['district_type']
                density = self.config['district_type_defaults'][district_type]['base_population_density']
                population = int(quartier_config['area_km2'] * density)
            
            # GeoJSON-Geometrie finden
            quartier_num = int(quartier_id.split('_')[1])
            geometry = None
            for feature in self.geojson_data['features']:
                if feature['properties']['id'] == quartier_num:
                    geometry = feature['geometry']
                    break
            
            if not geometry:
                logger.warning(f"Keine Geometrie für {quartier_id} gefunden")
                continue
            
            # Daten berechnen
            quartier_data = QuartierData(
                id=quartier_id,
                name=quartier_config['name'],
                district_type=quartier_config['district_type'],
                area_km2=quartier_config['area_km2'],
                population=population,
                geometry=geometry,
                energy_demand=self.calculate_energy_demand(quartier_config, population, quartier_config['area_km2']),
                renewable_potential=self.calculate_renewable_potential(quartier_config, population, quartier_config['area_km2']),
                building_types=self.calculate_building_types(quartier_config, population),
                demographics=self.calculate_demographics(quartier_config, population),
                infrastructure=self.calculate_infrastructure(quartier_config, population),
                additional_data={
                    'description': quartier_config.get('description', ''),
                    'priority_level': quartier_config.get('priority_level', 'medium'),
                    'special_factors': quartier_config.get('special_factors', {}),
                    'center': self.get_quartier_center(quartier_id)
                }
            )
            
            quartiers.append(quartier_data)
        
        return quartiers
    
    def generate_stakeholder_data(self) -> List[StakeholderData]:
        """Generiert Stakeholder-Daten"""
        stakeholders = []
        
        # Beispiel-Stakeholder basierend auf Templates
        stakeholder_configs = [
            {
                'id': 'stadt_zittau',
                'name': 'Stadt Zittau - Stadtplanung',
                'category': 'municipality',
                'contact': {'email': 'stadtplanung@zittau.de', 'phone': '+49 3583 752-200'},
                'district_id': 'quartier_1'
            },
            {
                'id': 'stadtwerke_zittau',
                'name': 'Stadtwerke Zittau',
                'category': 'utility',
                'contact': {'email': 'info@stadtwerke-zittau.de', 'phone': '+49 3583 540-0'},
                'district_id': 'quartier_3'
            },
            {
                'id': 'buergerenergie_zittau',
                'name': 'Bürgerenergie Zittau e.V.',
                'category': 'citizen_group',
                'contact': {'email': 'kontakt@buergerenergie-zittau.de'},
                'district_id': 'quartier_2'
            },
            {
                'id': 'gewerbe_zentrum',
                'name': 'Gewerbeverein Zittau Zentrum',
                'category': 'business',
                'contact': {'email': 'info@gewerbe-zittau.de'},
                'district_id': 'quartier_1'
            }
        ]
        
        for config in stakeholder_configs:
            template = self.config['stakeholder_templates'][config['category']]
            
            stakeholder = StakeholderData(
                id=config['id'],
                name=config['name'],
                category=config['category'],
                contact=config['contact'],
                interests=template['typical_interests'],
                district_id=config['district_id'],
                influence_level=template['default_influence'],
                participation_willingness=template['default_participation']
            )
            
            stakeholders.append(stakeholder)
        
        return stakeholders
    
    def generate_technology_data(self) -> List[TechnologyData]:
        """Generiert Technologie-Template-Daten"""
        technologies = []
        
        for tech_id, tech_config in self.config['technology_templates'].items():
            technology = TechnologyData(
                id=tech_id,
                name=tech_config['name'],
                category=tech_config['category'],
                technology_type=tech_config['technology_type'],
                parameters=tech_config['parameters'],
                costs=tech_config['costs'],
                environmental=tech_config['environmental'],
                availability=tech_config['availability'],
                constraints=tech_config.get('constraints', [])
            )
            
            technologies.append(technology)
        
        return technologies
    
    def validate_data(self, data_type: str, data: Dict[str, Any]) -> bool:
        """Validiert Daten gegen Schema"""
        if data_type not in self.config['schema']:
            return False
        
        schema = self.config['schema'][data_type]
        
        # Prüfe erforderliche Felder
        if 'required_fields' in schema:
            for field in schema['required_fields']:
                if field not in data:
                    logger.error(f"Erforderliches Feld '{field}' fehlt in {data_type}")
                    return False
        
        return True
    
    def export_to_json(self, output_file: str = "generated_data.json"):
        """Exportiert alle generierten Daten als JSON"""
        import datetime
        data = {
            'quartiers': [q.__dict__ for q in self.generate_quartier_data()],
            'stakeholders': [s.__dict__ for s in self.generate_stakeholder_data()],
            'technologies': [t.__dict__ for t in self.generate_technology_data()],
            'metadata': {
                'generated_at': str(datetime.datetime.now()),
                'config_file': str(self.config_file),
                'total_quartiers': len(self.config['quartiers'])
            }
        }
        
        output_path = Path(__file__).parent / "data" / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Daten exportiert nach {output_path}")
        return output_path
    
    def load_system_config(self):
        """Lädt die System-Konfiguration aus YAML"""
        system_config_file = Path(__file__).parent / "data" / "system_config.yml"
        try:
            with open(system_config_file, 'r', encoding='utf-8') as f:
                self.system_config = yaml.safe_load(f)
            logger.info(f"System-Konfiguration geladen aus {system_config_file}")
        except FileNotFoundError:
            logger.warning(f"System-Konfigurationsdatei nicht gefunden: {system_config_file}")
            self.system_config = {}
        except yaml.YAMLError as e:
            logger.error(f"Fehler beim Laden der System-YAML-Konfiguration: {e}")
            self.system_config = {}
    
    def get_quartier_color(self, quartier_id: str) -> str:
        """Gibt die Farbe für ein Quartier zurück"""
        if not hasattr(self, 'system_config'):
            self.load_system_config()
        return self.system_config.get('quartier_colors', {}).get(quartier_id, '#3388ff')
    
    def get_energy_scenarios(self) -> Dict[str, Any]:
        """Gibt alle Energiepreis-Szenarien zurück"""
        if not hasattr(self, 'system_config'):
            self.load_system_config()
        return self.system_config.get('energy_scenarios', {})
    
    def get_emission_factors(self) -> Dict[str, float]:
        """Gibt Emissionsfaktoren zurück"""
        if not hasattr(self, 'system_config'):
            self.load_system_config()
        return self.system_config.get('emission_factors', {})
    
    def get_regional_parameters(self) -> Dict[str, Any]:
        """Gibt regionale Parameter zurück"""
        if not hasattr(self, 'system_config'):
            self.load_system_config()
        return self.system_config.get('regional_parameters', {})

if __name__ == "__main__":
    # Test der Datenmanagement-Klasse
    import datetime
    
    logging.basicConfig(level=logging.INFO)
    
    manager = QuartierDataManager()
    
    # Generiere alle Daten
    quartiers = manager.generate_quartier_data()
    stakeholders = manager.generate_stakeholder_data()
    technologies = manager.generate_technology_data()
    
    print(f"Generiert: {len(quartiers)} Quartiere, {len(stakeholders)} Stakeholder, {len(technologies)} Technologien")
    
    # Exportiere Daten
    manager.export_to_json()
