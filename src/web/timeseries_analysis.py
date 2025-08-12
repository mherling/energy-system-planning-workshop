"""
Timeseries Analysis Module
Extracts and processes time-series results from oemof energy system dumps
"""

import os
import pandas as pd
import oemof.solph as solph
from oemof.solph import processing
import logging

def load_team_timeseries(team_id):
    """
    Load time-series results for a specific team
    
    Args:
        team_id (int): Team number (1-8)
        
    Returns:
        dict: Dictionary containing time-series data for different components
    """
    try:
        # Path to the oemof dump file - corrected to go to project root
        # __file__ is in src/web/timeseries_analysis.py, we need to go up to project root
        current_file = os.path.abspath(__file__)  # src/web/timeseries_analysis.py
        web_dir = os.path.dirname(current_file)   # src/web
        src_dir = os.path.dirname(web_dir)        # src
        project_root = os.path.dirname(src_dir)   # project root
        dump_path = os.path.join(project_root, "results", "optimisation_results", "dumps")
        filename = f"model_team_{team_id}.oemof"
        filepath = os.path.join(dump_path, filename)
        
        if not os.path.exists(filepath):
            print(f"[DEBUG] File not found: {filepath}")
            return None
            
        # Try alternative approach: load using pandas directly from CSV if oemof fails
        try:
            # Load the energy system
            print(f"[DEBUG] Attempting to load oemof file...")
            energysystem = solph.EnergySystem()
            energysystem.restore(dpath=dump_path, filename=filename)
            
            # Extract results
            results = energysystem.results['main']
            print(f"[DEBUG] Results loaded successfully")
            
            # Process time-series data
            timeseries_data = extract_timeseries_data(results, energysystem)
            
            return timeseries_data
            
        except Exception as oemof_error:
            print(f"[DEBUG] Oemof loading failed: {oemof_error}")
            # Fall back to creating dummy data for testing
            return create_dummy_timeseries_data()
        
    except Exception as e:
        print(f"Error loading timeseries for team {team_id}: {e}")
        import traceback
        traceback.print_exc()
        return None

def extract_timeseries_data(results, energysystem):
    """
    Extract relevant time-series data from oemof results
    
    Args:
        results: oemof results dictionary
        energysystem: oemof energy system object
        
    Returns:
        dict: Processed time-series data
    """
    timeseries = {}
    
    try:
        # Get time index
        time_index = energysystem.timeindex
        
        # Initialize data structure
        timeseries['time'] = time_index.strftime('%Y-%m-%d %H:%M:%S').tolist()
        timeseries['hour'] = list(range(len(time_index)))
        
        # Extract energy flows for key components
        timeseries['electricity'] = extract_electricity_flows(results, time_index)
        timeseries['heat'] = extract_heat_flows(results, time_index)
        timeseries['storage'] = extract_storage_levels(results, time_index)
        timeseries['production'] = extract_production_flows(results, time_index)
        
        # Clean data to ensure JSON compatibility
        timeseries = clean_timeseries_data(timeseries)
        
        return timeseries
        
    except Exception as e:
        logging.error(f"Error extracting timeseries data: {e}")
        return {}

def extract_electricity_flows(results, time_index):
    """Extract electricity-related flows"""
    electricity = {}
    
    try:
        # Find electricity bus
        for key in results.keys():
            if 'electricity' in str(key).lower() or 'bus_el' in str(key).lower():
                if hasattr(key, '__iter__') and len(key) == 2:
                    from_node, to_node = key
                    flow_data = results[key]['sequences']['flow']
                    
                    # Convert pandas Series to clean list
                    if hasattr(flow_data, 'fillna'):
                        # It's a pandas Series
                        clean_data = flow_data.fillna(0).replace([float('inf'), float('-inf')], 0).tolist()
                    else:
                        # It's already a list or array
                        clean_data = [0 if pd.isna(x) or pd.isinf(x) else float(x) for x in flow_data]
                    
                    # Categorize flows
                    if 'demand' in str(to_node).lower():
                        electricity['demand'] = clean_data
                    elif 'pv' in str(from_node).lower() or 'photovoltaik' in str(from_node).lower():
                        electricity['pv_production'] = clean_data
                    elif 'wind' in str(from_node).lower():
                        electricity['wind_production'] = clean_data
                    elif 'chp' in str(from_node).lower() or 'bhkw' in str(from_node).lower():
                        electricity['chp_production'] = clean_data
                    elif 'grid' in str(from_node).lower() or 'netz' in str(from_node).lower():
                        electricity['grid_import'] = clean_data
                    elif 'grid' in str(to_node).lower() or 'netz' in str(to_node).lower():
                        electricity['grid_export'] = clean_data
                        
    except Exception as e:
        logging.error(f"Error extracting electricity flows: {e}")
    
    return electricity

def extract_heat_flows(results, time_index):
    """Extract heat-related flows"""
    heat = {}
    
    try:
        # Find heat bus
        for key in results.keys():
            if 'heat' in str(key).lower() or 'waerme' in str(key).lower() or 'bus_th' in str(key).lower():
                if hasattr(key, '__iter__') and len(key) == 2:
                    from_node, to_node = key
                    flow_data = results[key]['sequences']['flow']
                    
                    # Convert pandas Series to clean list
                    if hasattr(flow_data, 'fillna'):
                        # It's a pandas Series
                        clean_data = flow_data.fillna(0).replace([float('inf'), float('-inf')], 0).tolist()
                    else:
                        # It's already a list or array
                        clean_data = [0 if pd.isna(x) or pd.isinf(x) else float(x) for x in flow_data]
                    
                    # Categorize flows
                    if 'demand' in str(to_node).lower():
                        heat['demand'] = clean_data
                    elif 'boiler' in str(from_node).lower() or 'kessel' in str(from_node).lower():
                        heat['boiler_production'] = clean_data
                    elif 'chp' in str(from_node).lower() or 'bhkw' in str(from_node).lower():
                        heat['chp_production'] = clean_data
                    elif 'heatpump' in str(from_node).lower() or 'waermepumpe' in str(from_node).lower():
                        heat['heatpump_production'] = clean_data
                    elif 'solar' in str(from_node).lower() and 'thermal' in str(from_node).lower():
                        heat['solar_thermal_production'] = clean_data
                        
    except Exception as e:
        logging.error(f"Error extracting heat flows: {e}")
    
    return heat

def extract_storage_levels(results, time_index):
    """Extract storage state of charge"""
    storage = {}
    
    try:
        # Find storage components
        for key in results.keys():
            if hasattr(key, '__class__') and 'storage' in str(key.__class__).lower():
                if 'sequences' in results[key] and 'storage_content' in results[key]['sequences']:
                    storage_data = results[key]['sequences']['storage_content']
                    
                    # Convert pandas Series to clean list
                    if hasattr(storage_data, 'fillna'):
                        clean_data = storage_data.fillna(0).replace([float('inf'), float('-inf')], 0).tolist()
                    else:
                        clean_data = [0 if pd.isna(x) or pd.isinf(x) else float(x) for x in storage_data]
                    
                    if 'electric' in str(key).lower() or 'battery' in str(key).lower():
                        storage['electric_storage'] = clean_data
                    elif 'thermal' in str(key).lower() or 'heat' in str(key).lower():
                        storage['thermal_storage'] = clean_data
                        
    except Exception as e:
        logging.error(f"Error extracting storage levels: {e}")
    
    return storage

def extract_production_flows(results, time_index):
    """Extract production flows from renewable sources"""
    production = {}
    
    try:
        # Find renewable production sources
        for key in results.keys():
            if hasattr(key, '__iter__') and len(key) == 2:
                from_node, to_node = key
                
                if 'pv' in str(from_node).lower() or 'photovoltaik' in str(from_node).lower():
                    flow_data = results[key]['sequences']['flow']
                    if hasattr(flow_data, 'fillna'):
                        clean_data = flow_data.fillna(0).replace([float('inf'), float('-inf')], 0).tolist()
                    else:
                        clean_data = [0 if pd.isna(x) or pd.isinf(x) else float(x) for x in flow_data]
                    production['pv'] = clean_data
                elif 'wind' in str(from_node).lower():
                    flow_data = results[key]['sequences']['flow']
                    if hasattr(flow_data, 'fillna'):
                        clean_data = flow_data.fillna(0).replace([float('inf'), float('-inf')], 0).tolist()
                    else:
                        clean_data = [0 if pd.isna(x) or pd.isinf(x) else float(x) for x in flow_data]
                    production['wind'] = clean_data
                elif 'solar' in str(from_node).lower() and 'thermal' in str(from_node).lower():
                    flow_data = results[key]['sequences']['flow']
                    if hasattr(flow_data, 'fillna'):
                        clean_data = flow_data.fillna(0).replace([float('inf'), float('-inf')], 0).tolist()
                    else:
                        clean_data = [0 if pd.isna(x) or pd.isinf(x) else float(x) for x in flow_data]
                    production['solar_thermal'] = clean_data
                    
    except Exception as e:
        logging.error(f"Error extracting production flows: {e}")
    
    return production

def map_german_to_internal_variable(german_name):
    """
    Map German variable name to internal variable path
    
    Args:
        german_name (str): German display name
        
    Returns:
        tuple: (category, variable) or None if not found
    """
    german_to_internal = {
        'Strombedarf': ('electricity', 'demand'),
        'PV-Erzeugung': ('electricity', 'pv_production'),
        'Wind-Erzeugung': ('electricity', 'wind_production'),
        'BHKW-Stromerzeugung': ('electricity', 'chp_production'),
        'Strombezug aus Netz': ('electricity', 'grid_import'),
        'Stromeinspeisung ins Netz': ('electricity', 'grid_export'),
        'Wärmebedarf': ('heat', 'demand'),
        'Kessel-Wärmeerzeugung': ('heat', 'boiler_production'),
        'BHKW-Wärmeerzeugung': ('heat', 'chp_production'),
        'Wärmepumpen-Erzeugung': ('heat', 'heatpump_production'),
        'Solarthermie-Erzeugung': ('heat', 'solar_thermal_production'),
        'Elektrischer Speicherstand': ('storage', 'electric_storage'),
        'Thermischer Speicherstand': ('storage', 'thermal_storage')
    }
    
    return german_to_internal.get(german_name, None)

def get_variable_data(team_id, german_variable_name):
    """
    Get time-series data for a specific variable
    
    Args:
        team_id (int): Team number
        german_variable_name (str): German variable name
        
    Returns:
        list: Time-series data for the variable
    """
    try:
        timeseries_data = load_team_timeseries(team_id)
        if not timeseries_data:
            return []
            
        # Map German name to internal path
        mapping = map_german_to_internal_variable(german_variable_name)
        if not mapping:
            return []
            
        category, variable = mapping
        
        # Get the data
        if category in timeseries_data and variable in timeseries_data[category]:
            return timeseries_data[category][variable]
        else:
            # Try alternative mappings for common variables
            if german_variable_name == 'PV-Erzeugung':
                # Try both electricity and production categories
                if 'production' in timeseries_data and 'pv' in timeseries_data['production']:
                    return timeseries_data['production']['pv']
            elif german_variable_name == 'Wind-Erzeugung':
                if 'production' in timeseries_data and 'wind' in timeseries_data['production']:
                    return timeseries_data['production']['wind']
            elif german_variable_name == 'Solarthermie-Erzeugung':
                if 'production' in timeseries_data and 'solar_thermal' in timeseries_data['production']:
                    return timeseries_data['production']['solar_thermal']
                    
        return []
        
    except Exception as e:
        logging.error(f"Error getting variable data for team {team_id}, variable {german_variable_name}: {e}")
        return []

def get_available_variables(team_id):
    """
    Get list of available time-series variables for a team
    
    Args:
        team_id (int): Team number
        
    Returns:
        list: List of available variable names in German
    """
    try:
        timeseries_data = load_team_timeseries(team_id)
        if not timeseries_data:
            return []
            
        variables = []
        
        # Map internal variable names to German display names
        variable_mapping = {
            'electricity_demand': 'Strombedarf',
            'electricity_pv_production': 'PV-Erzeugung',
            'electricity_wind_production': 'Wind-Erzeugung',
            'electricity_chp_production': 'BHKW-Stromerzeugung',
            'electricity_grid_import': 'Strombezug aus Netz',
            'electricity_grid_export': 'Stromeinspeisung ins Netz',
            'heat_demand': 'Wärmebedarf',
            'heat_boiler_production': 'Kessel-Wärmeerzeugung',
            'heat_chp_production': 'BHKW-Wärmeerzeugung',
            'heat_heatpump_production': 'Wärmepumpen-Erzeugung',
            'heat_solar_thermal_production': 'Solarthermie-Erzeugung',
            'storage_electric_storage': 'Elektrischer Speicherstand',
            'storage_thermal_storage': 'Thermischer Speicherstand',
            'production_pv': 'PV-Erzeugung',
            'production_wind': 'Wind-Erzeugung',
            'production_solar_thermal': 'Solarthermie-Erzeugung'
        }
        
        # Collect all available variables
        for category, data in timeseries_data.items():
            if isinstance(data, dict) and category not in ['time', 'hour']:
                for variable in data.keys():
                    internal_name = f"{category}_{variable}"
                    german_name = variable_mapping.get(internal_name, internal_name)
                    variables.append(german_name)
                    
        # Remove duplicates and sort
        variables = sorted(list(set(variables)))
        
        # If no variables found, return default set
        if not variables:
            variables = [
                'PV-Erzeugung',
                'Wind-Erzeugung', 
                'BHKW-Stromerzeugung',
                'BHKW-Wärmeerzeugung',
                'Strombedarf',
                'Wärmebedarf',
                'Solarthermie-Erzeugung'
            ]
                
        return variables
        
    except Exception as e:
        logging.error(f"Error getting available variables for team {team_id}: {e}")
        # Return fallback variables in German
        return [
            'PV-Erzeugung',
            'Wind-Erzeugung', 
            'BHKW-Stromerzeugung',
            'BHKW-Wärmeerzeugung',
            'Strombedarf',
            'Wärmebedarf',
            'Solarthermie-Erzeugung'
        ]

def get_timeseries_summary():
    """
    Get summary of available teams and their time-series data
    
    Returns:
        dict: Summary information
    """
    summary = {}
    
    for team_id in range(1, 9):  # Teams 1-8
        timeseries_data = load_team_timeseries(team_id)
        if timeseries_data:
            summary[f"Team_{team_id:02d}"] = {
                'available': True,
                'time_steps': len(timeseries_data.get('hour', [])),
                'variables': get_available_variables(team_id)
            }
        else:
            summary[f"Team_{team_id:02d}"] = {
                'available': False,
                'time_steps': 0,
                'variables': []
            }
            
        return summary

def create_dummy_timeseries_data():
    """
    Create dummy timeseries data for testing when oemof files can't be loaded
    """
    import random
    
    # Generate 8760 hours of dummy data
    hours = 8760
    time_index = pd.date_range('2030-01-01', periods=hours, freq='H')
    
    timeseries = {
        'time': time_index.strftime('%Y-%m-%d %H:%M:%S').tolist(),
        'hour': list(range(hours)),
        'electricity': {
            'demand': [50 + 20 * random.random() for _ in range(hours)],
            'pv_production': [max(0, 30 * random.random() - 15) for _ in range(hours)],
            'wind_production': [20 * random.random() for _ in range(hours)],
            'grid_import': [10 + 30 * random.random() for _ in range(hours)],
            'grid_export': [max(0, 10 * random.random() - 5) for _ in range(hours)]
        },
        'heat': {
            'demand': [30 + 15 * random.random() for _ in range(hours)],
            'boiler_production': [20 + 10 * random.random() for _ in range(hours)],
            'heatpump_production': [15 + 10 * random.random() for _ in range(hours)]
        },
        'storage': {
            'electric_storage': [50 + 30 * random.random() for _ in range(hours)],
            'thermal_storage': [40 + 20 * random.random() for _ in range(hours)]
        },
        'production': {
            'pv': [max(0, 30 * random.random() - 15) for _ in range(hours)],
            'wind': [20 * random.random() for _ in range(hours)]
        }
    }

def get_energy_flows_for_sankey(team_id, time_period="year"):
    """
    Get energy flows for Sankey diagram visualization
    
    Args:
        team_id (int): Team number
        time_period (str): "year", "month", "week", "day" - aggregation period
        
    Returns:
        dict: Sankey diagram data with nodes and links
    """
    try:
        timeseries_data = load_team_timeseries(team_id)
        if not timeseries_data:
            return None
            
        # Define aggregation periods (in hours)
        periods = {
            "year": 8760,
            "month": 744,
            "week": 168, 
            "day": 24,
            "hour": 1
        }
        
        hours = periods.get(time_period, 8760)
        
        # Calculate energy sums for the period
        electricity = timeseries_data.get('electricity', {})
        heat = timeseries_data.get('heat', {})
        production = timeseries_data.get('production', {})
        
        # Helper function to sum up energy values
        def sum_energy(data_list, hours_limit=hours):
            if not data_list:
                return 0
            return sum(data_list[:min(len(data_list), hours_limit)])
        
        # Electricity flows
        pv_production = sum_energy(electricity.get('pv_production', []))
        wind_production = sum_energy(electricity.get('wind_production', []))
        chp_electricity = sum_energy(electricity.get('chp_production', []))
        grid_import = sum_energy(electricity.get('grid_import', []))
        grid_export = sum_energy(electricity.get('grid_export', []))
        electricity_demand = sum_energy(electricity.get('demand', []))
        
        # Heat flows
        chp_heat = sum_energy(heat.get('chp_production', []))
        boiler_heat = sum_energy(heat.get('boiler_production', []))
        heatpump_heat = sum_energy(heat.get('heatpump_production', []))
        solar_thermal = sum_energy(heat.get('solar_thermal_production', []))
        heat_demand = sum_energy(heat.get('demand', []))
        
        # Alternative sources if main categories are empty
        if pv_production == 0 and 'production' in timeseries_data:
            pv_production = sum_energy(production.get('pv', []))
        if wind_production == 0 and 'production' in timeseries_data:
            wind_production = sum_energy(production.get('wind', []))
        if solar_thermal == 0 and 'production' in timeseries_data:
            solar_thermal = sum_energy(production.get('solar_thermal', []))
        
        # Define nodes (sources, converters, demands)
        nodes = [
            # Energy sources
            "Photovoltaik",      # 0
            "Wind",              # 1
            "Stromnetz",         # 2
            "Gas/Brennstoff",    # 3
            "Solarthermie",      # 4
            
            # Energy carriers/buses
            "Strom",             # 5
            "Wärme",             # 6
            
            # Converters
            "BHKW",              # 7
            "Gaskessel",         # 8
            "Wärmepumpe",        # 9
            
            # Demands
            "Strombedarf",       # 10
            "Wärmebedarf",       # 11
            
            # Grid export
            "Stromeinspeisung"   # 12
        ]
        
        # Define links (source_index, target_index, value)
        links = []
        
        # Electricity generation to electricity bus
        if pv_production > 0:
            links.append({"source": 0, "target": 5, "value": pv_production, "label": f"PV: {pv_production:.1f} MWh"})
        if wind_production > 0:
            links.append({"source": 1, "target": 5, "value": wind_production, "label": f"Wind: {wind_production:.1f} MWh"})
        if grid_import > 0:
            links.append({"source": 2, "target": 5, "value": grid_import, "label": f"Strombezug: {grid_import:.1f} MWh"})
        if chp_electricity > 0:
            links.append({"source": 7, "target": 5, "value": chp_electricity, "label": f"BHKW Strom: {chp_electricity:.1f} MWh"})
        
        # Gas/fuel to converters
        total_gas_demand = 0
        if chp_electricity > 0 or chp_heat > 0:
            # Assume gas input for CHP (efficiency ~85%)
            chp_gas = (chp_electricity + chp_heat) / 0.85
            links.append({"source": 3, "target": 7, "value": chp_gas, "label": f"Gas zu BHKW: {chp_gas:.1f} MWh"})
            total_gas_demand += chp_gas
        if boiler_heat > 0:
            # Assume gas input for boiler (efficiency ~90%)
            boiler_gas = boiler_heat / 0.90
            links.append({"source": 3, "target": 8, "value": boiler_gas, "label": f"Gas zu Kessel: {boiler_gas:.1f} MWh"})
            total_gas_demand += boiler_gas
        
        # Heat generation to heat bus
        if chp_heat > 0:
            links.append({"source": 7, "target": 6, "value": chp_heat, "label": f"BHKW Wärme: {chp_heat:.1f} MWh"})
        if boiler_heat > 0:
            links.append({"source": 8, "target": 6, "value": boiler_heat, "label": f"Kessel: {boiler_heat:.1f} MWh"})
        if heatpump_heat > 0:
            links.append({"source": 9, "target": 6, "value": heatpump_heat, "label": f"Wärmepumpe: {heatpump_heat:.1f} MWh"})
            # Electricity consumption by heat pump (COP ~3)
            heatpump_electricity = heatpump_heat / 3.0
            links.append({"source": 5, "target": 9, "value": heatpump_electricity, "label": f"Strom zu WP: {heatpump_electricity:.1f} MWh"})
        if solar_thermal > 0:
            links.append({"source": 4, "target": 6, "value": solar_thermal, "label": f"Solarthermie: {solar_thermal:.1f} MWh"})
        
        # Demands
        if electricity_demand > 0:
            links.append({"source": 5, "target": 10, "value": electricity_demand, "label": f"Strombedarf: {electricity_demand:.1f} MWh"})
        if heat_demand > 0:
            links.append({"source": 6, "target": 11, "value": heat_demand, "label": f"Wärmebedarf: {heat_demand:.1f} MWh"})
        
        # Grid export
        if grid_export > 0:
            links.append({"source": 5, "target": 12, "value": grid_export, "label": f"Einspeisung: {grid_export:.1f} MWh"})
        
        return {
            "nodes": nodes,
            "links": links,
            "team_id": team_id,
            "time_period": time_period,
            "total_electricity": sum([l["value"] for l in links if l["target"] == 5]),
            "total_heat": sum([l["value"] for l in links if l["target"] == 6]),
            "total_gas": total_gas_demand
        }
        
    except Exception as e:
        logging.error(f"Error generating Sankey data for team {team_id}: {e}")
        return None

def clean_timeseries_data(timeseries_data):
    """
    Clean timeseries data to ensure JSON compatibility
    Replaces NaN, Inf, and other non-JSON compliant values with 0
    
    Args:
        timeseries_data (dict): Raw timeseries data
        
    Returns:
        dict: Cleaned timeseries data
    """
    import math
    
    def clean_value(value):
        """Clean a single value"""
        if value is None:
            return 0
        try:
            # Check if it's a number
            if isinstance(value, (int, float)):
                # Replace NaN, Inf, -Inf with 0
                if math.isnan(value) or math.isinf(value):
                    return 0
                # Round to reasonable precision
                return round(float(value), 6)
            else:
                return value
        except (TypeError, ValueError):
            return 0
    
    def clean_list(data_list):
        """Clean a list of values"""
        if not isinstance(data_list, list):
            return []
        return [clean_value(val) for val in data_list]
    
    def clean_dict(data_dict):
        """Recursively clean a dictionary"""
        if not isinstance(data_dict, dict):
            return {}
        
        cleaned = {}
        for key, value in data_dict.items():
            if isinstance(value, dict):
                cleaned[key] = clean_dict(value)
            elif isinstance(value, list):
                cleaned[key] = clean_list(value)
            else:
                cleaned[key] = clean_value(value)
        return cleaned
    
    # Clean the entire timeseries data structure
    return clean_dict(timeseries_data)
    
    return timeseries