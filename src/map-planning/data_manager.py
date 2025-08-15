"""
Erweiterter Datenmanager für Quartier-Energieplanung
Verwaltet Endenergie, Primärenergie, EE-Potentiale und Energieflüsse
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
    primary_energy: Dict[str, Any] = field(default_factory=dict)
    renewable_potential: Dict[str, Any] = field(default_factory=dict)
    current_generation: Dict[str, Any] = field(default_factory=dict)
    utilized_potential: Dict[str, Any] = field(default_factory=dict)
    energy_flows: Dict[str, Any] = field(default_factory=dict)
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
    """Erweiterter Datenmanager für komplexe Energiefluss-Analyse"""
    
    def __init__(self, config_file: str = "quartier_config.yml", system_config_file: str = "system_config.yml"):
        self.config_file = Path(__file__).parent / "data" / config_file
        self.system_config_file = Path(__file__).parent / "data" / system_config_file
        self.config = None
        self.system_config = None
        self.geojson_data = None
        self.load_config()
        self.load_system_config()
        self.load_geojson()
    
    def load_config(self):
        """Lädt die YAML-Konfiguration"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                self.config = yaml.safe_load(f)
            logger.info(f"Quartier-Konfiguration geladen aus {self.config_file}")
        except FileNotFoundError:
            logger.error(f"Quartier-Konfigurationsdatei nicht gefunden: {self.config_file}")
            raise
        except yaml.YAMLError as e:
            logger.error(f"Fehler beim Laden der Quartier-YAML-Konfiguration: {e}")
            raise
    
    def load_system_config(self):
        """Lädt die System-Konfiguration"""
        try:
            with open(self.system_config_file, 'r', encoding='utf-8') as f:
                self.system_config = yaml.safe_load(f)
            logger.info(f"System-Konfiguration geladen aus {self.system_config_file}")
        except FileNotFoundError:
            logger.warning(f"System-Konfigurationsdatei nicht gefunden: {self.system_config_file}")
            self.system_config = {}
        except yaml.YAMLError as e:
            logger.error(f"Fehler beim Laden der System-YAML-Konfiguration: {e}")
            self.system_config = {}
    
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
    
    def calculate_primary_energy(self, quartier_config: Dict, energy_demand: Dict) -> Dict[str, Any]:
        """Berechnet Primärenergiebedarf basierend auf Energieträger-Mix"""
        
        # Prüfe ob absolute Werte definiert sind
        if 'primary_energy' in quartier_config:
            return quartier_config['primary_energy']
        
        # Fallback auf district_type defaults
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type].get('primary_energy', {})
        
        heating_demand = energy_demand.get('heating_mwh', 0)
        electricity_demand = energy_demand.get('electricity_mwh', 0)
        
        # Wärme-Mix berechnen
        heating_mix = defaults.get('heating_mix', {
            'gas_pct': 60, 'oil_pct': 10, 'heat_pump_pct': 5,
            'biomass_pct': 15, 'district_heating_pct': 10
        })
        
        # Strom-Mix berechnen
        electricity_mix = defaults.get('electricity_mix', {
            'grid_pct': 85, 'solar_pv_pct': 10, 'other_renewables_pct': 5
        })
        
        return {
            'heating': {
                'gas_mwh': round(heating_demand * heating_mix['gas_pct'] / 100, 1),
                'oil_mwh': round(heating_demand * heating_mix['oil_pct'] / 100, 1),
                'heat_pump_mwh': round(heating_demand * heating_mix['heat_pump_pct'] / 100, 1),
                'biomass_mwh': round(heating_demand * heating_mix['biomass_pct'] / 100, 1),
                'district_heating_mwh': round(heating_demand * heating_mix['district_heating_pct'] / 100, 1),
                'total_mwh': heating_demand
            },
            'electricity': {
                'grid_mwh': round(electricity_demand * electricity_mix['grid_pct'] / 100, 1),
                'solar_pv_mwh': round(electricity_demand * electricity_mix['solar_pv_pct'] / 100, 1),
                'other_renewables_mwh': round(electricity_demand * electricity_mix['other_renewables_pct'] / 100, 1),
                'total_mwh': electricity_demand
            }
        }
    
    def calculate_renewable_potential(self, quartier_config: Dict, population: int, area_km2: float) -> Dict[str, Any]:
        """Berechnet erneuerbares Energiepotential - nutzt absolute Werte wenn vorhanden"""
        
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
            'biomass_mwh': round(biomass_mwh, 1),
            'geothermal_mwh': round(area_km2 * 100, 1),  # Grober Schätzwert
            'total_potential_mwh': round(solar_pv_mwh + solar_thermal_mwh + small_wind_mwh + biomass_mwh, 1)
        }
    
    def calculate_current_generation(self, quartier_config: Dict, renewable_potential: Dict) -> Dict[str, Any]:
        """Berechnet derzeitige EE-Erzeugung (genutztes Potential)"""
        
        # Prüfe ob absolute Werte definiert sind
        if 'current_generation' in quartier_config:
            return quartier_config['current_generation']
        
        # Fallback: Annahme, dass nur ein Teil des Potentials genutzt wird
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type].get('utilization_factors', {
            'solar_pv': 0.15,  # 15% des Potentials genutzt
            'solar_thermal': 0.20,
            'small_wind': 0.05,
            'biomass': 0.30,
            'geothermal': 0.01
        })
        
        return {
            'solar_pv_mwh': round(renewable_potential['solar_pv_mwh'] * defaults['solar_pv'], 1),
            'solar_thermal_mwh': round(renewable_potential['solar_thermal_mwh'] * defaults['solar_thermal'], 1),
            'small_wind_mwh': round(renewable_potential['small_wind_mwh'] * defaults['small_wind'], 1),
            'biomass_mwh': round(renewable_potential['biomass_mwh'] * defaults['biomass'], 1),
            'geothermal_mwh': round(renewable_potential['geothermal_mwh'] * defaults['geothermal'], 1),
            'total_generation_mwh': round(
                renewable_potential['solar_pv_mwh'] * defaults['solar_pv'] +
                renewable_potential['solar_thermal_mwh'] * defaults['solar_thermal'] +
                renewable_potential['small_wind_mwh'] * defaults['small_wind'] +
                renewable_potential['biomass_mwh'] * defaults['biomass'] +
                renewable_potential['geothermal_mwh'] * defaults['geothermal'], 1
            )
        }
    
    def calculate_energy_flows(self, energy_demand: Dict, primary_energy: Dict, current_generation: Dict) -> Dict[str, Any]:
        """Berechnet Energieflüsse für Sankey-Diagramm"""
        
        flows = {
            'sources': [
                {'name': 'Netz (Strom)', 'value': primary_energy['electricity']['grid_mwh']},
                {'name': 'Erdgas', 'value': primary_energy['heating']['gas_mwh']},
                {'name': 'Heizöl', 'value': primary_energy['heating']['oil_mwh']},
                {'name': 'Biomasse', 'value': primary_energy['heating']['biomass_mwh']},
                {'name': 'Fernwärme', 'value': primary_energy['heating']['district_heating_mwh']},
                {'name': 'Solar PV (lokal)', 'value': current_generation['solar_pv_mwh']},
                {'name': 'Solar Thermal (lokal)', 'value': current_generation['solar_thermal_mwh']},
                {'name': 'Kleinwind (lokal)', 'value': current_generation['small_wind_mwh']}
            ],
            'targets': [
                {'name': 'Strom', 'value': energy_demand['electricity_mwh']},
                {'name': 'Wärme', 'value': energy_demand['heating_mwh']},
                {'name': 'Kühlung', 'value': energy_demand['cooling_mwh']},
                {'name': 'Transport', 'value': energy_demand['transport_mwh']}
            ],
            'links': [
                # Strom-Flüsse
                {'source': 'Netz (Strom)', 'target': 'Strom', 'value': primary_energy['electricity']['grid_mwh']},
                {'source': 'Solar PV (lokal)', 'target': 'Strom', 'value': current_generation['solar_pv_mwh']},
                {'source': 'Kleinwind (lokal)', 'target': 'Strom', 'value': current_generation['small_wind_mwh']},
                
                # Wärme-Flüsse
                {'source': 'Erdgas', 'target': 'Wärme', 'value': primary_energy['heating']['gas_mwh']},
                {'source': 'Heizöl', 'target': 'Wärme', 'value': primary_energy['heating']['oil_mwh']},
                {'source': 'Biomasse', 'target': 'Wärme', 'value': primary_energy['heating']['biomass_mwh']},
                {'source': 'Fernwärme', 'target': 'Wärme', 'value': primary_energy['heating']['district_heating_mwh']},
                {'source': 'Solar Thermal (lokal)', 'target': 'Wärme', 'value': current_generation['solar_thermal_mwh']},
                
                # Wärmepumpe: Strom -> Wärme
                {'source': 'Strom', 'target': 'Wärme', 'value': primary_energy['heating']['heat_pump_mwh'] / 3.5}  # COP 3.5
            ]
        }
        
        return flows
    
    def calculate_building_types(self, quartier_config: Dict, area_km2: float) -> Dict[str, Any]:
        """Berechnet Gebäudetypen-Verteilung"""
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type]['buildings']
        
        return {
            'residential_pct': defaults['residential_pct'],
            'commercial_pct': defaults['commercial_pct'],
            'industrial_pct': defaults.get('industrial_pct', 0),
            'public_pct': defaults['public_pct'],
            'total_area_km2': area_km2
        }
    
    def calculate_demographics(self, quartier_config: Dict, population: int) -> Dict[str, Any]:
        """Berechnet demografische Daten"""
        district_type = quartier_config['district_type']
        defaults = self.config['district_type_defaults'][district_type]['demographics']
        
        # Spezielle demografische Überschreibungen
        special_demographics = quartier_config.get('demographics', {})
        
        return {
            'avg_age': special_demographics.get('avg_age', defaults['avg_age']),
            'households': round(population / 2.1),  # Durchschnittliche Haushaltsgröße
            'avg_income_eur': special_demographics.get('avg_income_eur', defaults['avg_income_eur']),
            'education_level_high_pct': special_demographics.get('education_high_pct', defaults['education_high_pct']),
            'unemployment_rate_pct': defaults['unemployment_rate_pct']
        }
    
    def generate_quartier_data(self) -> List[QuartierData]:
        """Generiert alle Quartier-Daten"""
        quartiers = []
        
        for quartier_id, quartier_config in self.config['quartiers'].items():
            # Basis-Daten
            area_km2 = quartier_config['area_km2']
            population = quartier_config.get('population_override')
            
            if population is None:
                # Berechne Population basierend auf Dichte
                district_type = quartier_config['district_type']
                density = self.config['district_type_defaults'][district_type]['base_population_density']
                population = int(area_km2 * density)
            
            # Finde entsprechende Geometrie
            geometry = None
            if self.geojson_data:
                # Mapping zwischen quartier_id und GeoJSON
                quartier_mapping = {
                    'quartier_1': {'id': 1, 'name': 'Zentrum'},
                    'quartier_2': {'id': 2, 'name': 'Süd'},
                    'quartier_3': {'id': 3, 'name': 'Ost'},
                    'quartier_4': {'id': 4, 'name': 'Weinau'},
                    'quartier_5': {'id': 5, 'name': 'Nord'},
                    'quartier_6': {'id': 6, 'name': 'Vorstadt'},
                    'quartier_7': {'id': 7, 'name': 'West'},
                    'quartier_8': {'id': 8, 'name': 'Pethau'}
                }
                
                if quartier_id in quartier_mapping:
                    expected_id = quartier_mapping[quartier_id]['id']
                    expected_name = quartier_mapping[quartier_id]['name']
                    
                    for feature in self.geojson_data['features']:
                        feature_id = feature['properties'].get('id')
                        feature_name = feature['properties'].get('Stadtteil')
                        
                        if feature_id == expected_id or feature_name == expected_name:
                            geometry = feature['geometry']
                            logger.info(f"Geometrie für {quartier_id} ({expected_name}) gefunden")
                            break
            
            if geometry is None:
                logger.warning(f"Keine Geometrie für {quartier_id} gefunden")
                geometry = {'type': 'Polygon', 'coordinates': [[]]}
            
            # Berechnungen
            energy_demand = self.calculate_energy_demand(quartier_config, population, area_km2)
            primary_energy = self.calculate_primary_energy(quartier_config, energy_demand)
            renewable_potential = self.calculate_renewable_potential(quartier_config, population, area_km2)
            current_generation = self.calculate_current_generation(quartier_config, renewable_potential)
            energy_flows = self.calculate_energy_flows(energy_demand, primary_energy, current_generation)
            building_types = self.calculate_building_types(quartier_config, area_km2)
            demographics = self.calculate_demographics(quartier_config, population)
            
            # Zusätzliche Daten
            additional_data = {
                'priority_level': quartier_config.get('priority_level', 'medium'),
                'description': quartier_config.get('description', ''),
                'special_factors': quartier_config.get('special_factors', {})
            }
            
            # Erstelle QuartierData-Objekt
            quartier = QuartierData(
                id=quartier_id,
                name=quartier_config['name'],
                district_type=quartier_config['district_type'],
                area_km2=area_km2,
                population=population,
                geometry=geometry,
                energy_demand=energy_demand,
                primary_energy=primary_energy,
                renewable_potential=renewable_potential,
                current_generation=current_generation,
                utilized_potential=current_generation,  # Alias
                energy_flows=energy_flows,
                building_types=building_types,
                demographics=demographics,
                additional_data=additional_data
            )
            
            quartiers.append(quartier)
        
        return quartiers
    
    def generate_stakeholder_data(self) -> List[StakeholderData]:
        """Generiert Stakeholder-Daten"""
        stakeholders = []
        quartier_ids = list(self.config['quartiers'].keys())
        
        for i, (template_id, template) in enumerate(self.config['stakeholder_templates'].items()):
            stakeholder = StakeholderData(
                id=f"stakeholder_{i+1}",
                name=f"{template_id.replace('_', ' ').title()}",
                category=template_id,
                contact={'email': f"kontakt@{template_id}.de", 'phone': '+49 123 456789'},
                interests=template['typical_interests'],
                district_id=quartier_ids[i % len(quartier_ids)],
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
    
    def get_quartier_color(self, quartier_id: str) -> str:
        """Gibt die Farbe für ein Quartier zurück"""
        return self.system_config.get('quartier_colors', {}).get(quartier_id, '#3388ff')
    
    def get_energy_scenarios(self) -> Dict[str, Any]:
        """Gibt alle Energiepreis-Szenarien zurück"""
        return self.system_config.get('energy_scenarios', {})
    
    def get_emission_factors(self) -> Dict[str, float]:
        """Gibt Emissionsfaktoren zurück"""
        return self.system_config.get('emission_factors', {})
    
    def get_regional_parameters(self) -> Dict[str, Any]:
        """Gibt regionale Parameter zurück"""
        return self.system_config.get('regional_parameters', {})
    
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

if __name__ == "__main__":
    # Test der Datenmanagement-Klasse
    import datetime
    
    logging.basicConfig(level=logging.INFO)
    
    try:
        manager = QuartierDataManager()
        
        # Teste Datengeneration
        quartiers = manager.generate_quartier_data()
        print(f"✓ {len(quartiers)} Quartiere generiert")
        
        for quartier in quartiers[:2]:  # Zeige nur die ersten 2
            print(f"  - {quartier.name}: {quartier.energy_demand['total_annual_mwh']} MWh/Jahr")
            print(f"    Primärenergie Wärme: {quartier.primary_energy['heating']['total_mwh']} MWh")
            print(f"    EE-Potential: {quartier.renewable_potential['total_potential_mwh']} MWh")
            print(f"    Derzeitige EE-Erzeugung: {quartier.current_generation['total_generation_mwh']} MWh")
        
        stakeholders = manager.generate_stakeholder_data()
        print(f"✓ {len(stakeholders)} Stakeholder generiert")
        
        technologies = manager.generate_technology_data()
        print(f"✓ {len(technologies)} Technologien generiert")
        
        print("✓ Datenmanager erfolgreich getestet")
        
    except Exception as e:
        print(f"✗ Fehler beim Testen: {e}")
        raise
