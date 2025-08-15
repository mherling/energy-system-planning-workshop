"""
Konfigurationslader für die modulare YAML-Struktur
Lädt und verwaltet alle Konfigurationsdateien zentral
"""

import yaml
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class ConfigurationManager:
    """Zentraler Manager für alle Konfigurationsdateien"""
    
    def __init__(self, config_dir: str = "data"):
        """
        Initialize configuration manager
        
        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = Path(config_dir)
        self.configs = {}
        self._load_all_configs()
    
    def _load_yaml_file(self, filepath: Path) -> Dict[str, Any]:
        """Load a YAML file safely"""
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file) or {}
        except Exception as e:
            logger.error(f"Error loading {filepath}: {e}")
            return {}
    
    def _load_all_configs(self):
        """Load all configuration files"""
        # Main configuration
        main_config_path = self.config_dir / "main_config.yml"
        if main_config_path.exists():
            self.configs['main'] = self._load_yaml_file(main_config_path)
        else:
            logger.warning(f"Main config file not found: {main_config_path}")
            self.configs['main'] = {}
        
        # Load individual configuration files
        config_files = {
            'system': 'system_config.yml',
            'quartiers': 'quarter_config.yml',
            'technologies': 'technology_config.yml',
            'stakeholders': 'stakeholder_config.yml',
            'game': 'game.yml',
            'measures': 'measures_catalog.yml'
        }
        
        for config_key, filename in config_files.items():
            filepath = self.config_dir / filename
            if filepath.exists():
                self.configs[config_key] = self._load_yaml_file(filepath)
                logger.info(f"Loaded {config_key} configuration from {filename}")
            else:
                logger.warning(f"Configuration file not found: {filepath}")
                self.configs[config_key] = {}
    
    def get_config(self, config_type: str) -> Dict[str, Any]:
        """
        Get a specific configuration
        
        Args:
            config_type: Type of configuration ('main', 'stakeholders', 'technologies', 'measures')
            
        Returns:
            Configuration dictionary
        """
        return self.configs.get(config_type, {})
    
    def get_system_parameters(self) -> Dict[str, Any]:
        """Get system parameters from system config"""
        system_config = self.configs.get('system', {})
        return system_config
    
    def get_energy_scenarios(self) -> Dict[str, Any]:
        """Get energy price scenarios"""
        system_config = self.configs.get('system', {})
        return system_config.get('energy_scenarios', {})
    
    def get_quarter_types(self) -> Dict[str, Any]:
        """Get quarter type definitions - returns empty since we only use specific quartiers"""
        # No generic quarter types, only specific Zittau quartiers
        return {}
    
    def get_zittau_quartiers(self) -> Dict[str, Any]:
        """Get Zittau quartier configurations"""
        quartiers_config = self.configs.get('quartiers', {})
        return quartiers_config.get('quartiers', {})
    
    def get_quartier_templates(self) -> Dict[str, Any]:
        """Get quartier district type defaults and templates from quarter_config.yml"""
        quartiers_config = self.configs.get('quartiers', {})
        return {
            'district_type_defaults': quartiers_config.get('district_type_defaults', {}),
            'schema': quartiers_config.get('schema', {})
        }
    
    def get_stakeholder_templates(self) -> Dict[str, Any]:
        """Get stakeholder templates from stakeholder_config.yml"""
        stakeholders_config = self.configs.get('stakeholders', {})
        return stakeholders_config.get('stakeholder_templates', {})
    
    def get_technology_templates(self) -> Dict[str, Any]:
        """Get technology templates from technology_config.yml"""
        technologies_config = self.configs.get('technologies', {})
        return technologies_config.get('technology_templates', {})
    
    def get_game_settings(self) -> Dict[str, Any]:
        """Get game mechanic settings"""
        game_config = self.configs.get('game', {})
        return game_config.get('game_settings', {})
    
    def get_stakeholder_config(self, stakeholder_id: str = None) -> Dict[str, Any]:
        """
        Get stakeholder configuration
        
        Args:
            stakeholder_id: Specific stakeholder ID, if None returns all
            
        Returns:
            Stakeholder configuration
        """
        stakeholders = self.get_stakeholder_templates()
        if stakeholder_id:
            return stakeholders.get(stakeholder_id, {})
        return stakeholders
    
    def get_technology_config(self, category: str = None) -> Dict[str, Any]:
        """
        Get technology configuration
        
        Args:
            category: Technology category filter
            
        Returns:
            Technology configuration
        """
        technologies = self.get_technology_templates()
        if category:
            # Filter technologies by category
            filtered = {k: v for k, v in technologies.items() if v.get('category') == category}
            return filtered
        return technologies
    
    def get_measures_catalog(self) -> Dict[str, Any]:
        """Get complete measures catalog"""
        return self.configs.get('measures', {}).get('measures_catalog', {})
    
    def get_measures_for_quarter(self, quarter_type: str) -> List[Dict[str, Any]]:
        """
        Get suitable measures for a specific quarter type
        
        Args:
            quarter_type: Type of quarter
            
        Returns:
            List of suitable measures with their configurations
        """
        measures_catalog = self.get_measures_catalog()
        suitable_measures = []
        
        for measure_id, measure_config in measures_catalog.items():
            suitable_quarters = measure_config.get('suitable_quarters', {})
            if quarter_type in suitable_quarters:
                quarter_suitability = suitable_quarters[quarter_type]
                
                measure_info = {
                    'id': measure_id,
                    'name': measure_config.get('name', measure_id),
                    'category': measure_config.get('category', 'unknown'),
                    'description': measure_config.get('description', ''),
                    'priority': quarter_suitability.get('priority', 5),
                    'implementation_potential_pct': quarter_suitability.get('implementation_potential_pct', 50),
                    'specific_benefits': quarter_suitability.get('specific_benefits', []),
                    'system_impacts': measure_config.get('system_impacts', {}),
                    'stakeholder_views': measure_config.get('stakeholder_views', {})
                }
                
                suitable_measures.append(measure_info)
        
        # Sort by priority (highest first)
        suitable_measures.sort(key=lambda x: x['priority'], reverse=True)
        return suitable_measures
    
    def get_stakeholder_measure_support(self, stakeholder_id: str, measure_id: str) -> Dict[str, Any]:
        """
        Get stakeholder support level for a specific measure
        
        Args:
            stakeholder_id: ID of the stakeholder
            measure_id: ID of the measure
            
        Returns:
            Support information including level, benefits, and concerns
        """
        measures_catalog = self.get_measures_catalog()
        measure = measures_catalog.get(measure_id, {})
        stakeholder_views = measure.get('stakeholder_views', {})
        
        return stakeholder_views.get(stakeholder_id, {
            'support_level': 5,
            'key_benefits': [],
            'concerns': []
        })
    
    def calculate_measure_consensus(self, measure_id: str, active_stakeholders: List[str]) -> Dict[str, Any]:
        """
        Calculate consensus level for a measure among active stakeholders
        
        Args:
            measure_id: ID of the measure
            active_stakeholders: List of active stakeholder IDs
            
        Returns:
            Consensus analysis including average support and stakeholder breakdown
        """
        measures_catalog = self.get_measures_catalog()
        measure = measures_catalog.get(measure_id, {})
        stakeholder_views = measure.get('stakeholder_views', {})
        
        support_levels = []
        stakeholder_breakdown = {
            'high_support': [],
            'medium_support': [],
            'low_support': [],
            'opposition': []
        }
        
        for stakeholder_id in active_stakeholders:
            support_info = stakeholder_views.get(stakeholder_id, {'support_level': 5})
            support_level = support_info.get('support_level', 5)
            support_levels.append(support_level)
            
            if support_level >= 8:
                stakeholder_breakdown['high_support'].append(stakeholder_id)
            elif support_level >= 6:
                stakeholder_breakdown['medium_support'].append(stakeholder_id)
            elif support_level >= 4:
                stakeholder_breakdown['low_support'].append(stakeholder_id)
            else:
                stakeholder_breakdown['opposition'].append(stakeholder_id)
        
        average_support = sum(support_levels) / len(support_levels) if support_levels else 5
        
        return {
            'average_support': average_support,
            'consensus_level': 'high' if average_support >= 7 else 'medium' if average_support >= 5 else 'low',
            'stakeholder_breakdown': stakeholder_breakdown,
            'total_stakeholders': len(active_stakeholders)
        }
    
    def get_measure_combinations(self) -> Dict[str, Any]:
        """Get pre-defined measure combinations"""
        return self.configs.get('measures', {}).get('measure_combinations', {})
    
    def get_implementation_phases(self) -> Dict[str, Any]:
        """Get implementation phase definitions"""
        return self.configs.get('measures', {}).get('implementation_phases', {})
    
    def validate_configuration(self) -> Dict[str, List[str]]:
        """
        Validate the loaded configuration for completeness and consistency
        
        Returns:
            Dictionary with validation results (errors and warnings)
        """
        errors = []
        warnings = []
        
        # Check if main config exists
        if not self.configs.get('main'):
            errors.append("Main configuration file is missing")
        
        # Check required sections in main config
        main_config = self.configs.get('main', {})
        required_main_sections = ['system_parameters', 'quarter_types', 'game_settings']
        for section in required_main_sections:
            if section not in main_config:
                warnings.append(f"Main config missing section: {section}")
        
        # Check stakeholder configuration
        stakeholders = self.get_stakeholder_config()
        if not stakeholders:
            warnings.append("No stakeholder configurations found")
        
        # Check technology configuration
        technologies = self.get_technology_config()
        if not technologies:
            warnings.append("No technology configurations found")
        
        # Check measures catalog
        measures = self.get_measures_catalog()
        if not measures:
            warnings.append("No measures catalog found")
        
        return {
            'errors': errors,
            'warnings': warnings,
            'is_valid': len(errors) == 0
        }

# Global configuration manager instance
config_manager = None

def get_config_manager(config_dir: str = "data") -> ConfigurationManager:
    """Get or create global configuration manager instance"""
    global config_manager
    if config_manager is None:
        config_manager = ConfigurationManager(config_dir)
    return config_manager

def reload_configurations(config_dir: str = "data"):
    """Reload all configurations"""
    global config_manager
    config_manager = ConfigurationManager(config_dir)
    return config_manager
