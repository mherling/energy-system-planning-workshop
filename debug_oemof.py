#!/usr/bin/env python3
"""
Debug script to analyze oemof files and understand the available variables
"""

import os
import pickle
import pandas as pd
from oemof import solph

def debug_oemof_file(filepath):
    """Debug a single oemof file"""
    print(f"\n=== Analyzing: {filepath} ===")
    
    try:
        # Load the oemof file
        with open(filepath, 'rb') as f:
            energysystem = pickle.load(f)
        
        print(f"Type: {type(energysystem)}")
        
        # Get results if available
        if hasattr(energysystem, 'results') and energysystem.results:
            results = energysystem.results
            print(f"Results type: {type(results)}")
            print(f"Results keys: {list(results.keys())}")
            
            # Analyze flows
            flows = results.get((list(results.keys())[0], 'flow'), {})
            if flows:
                print(f"Number of flows: {len(flows)}")
                print(f"Flow keys (first 10): {list(flows.keys())[:10]}")
                
                # Get a sample flow to see the structure
                first_flow_key = list(flows.keys())[0]
                first_flow_data = flows[first_flow_key]
                print(f"First flow key: {first_flow_key}")
                print(f"First flow data type: {type(first_flow_data)}")
                if hasattr(first_flow_data, 'head'):
                    print(f"First flow data head:\n{first_flow_data.head()}")
                else:
                    print(f"First flow data: {first_flow_data}")
        
        # Get nodes
        if hasattr(energysystem, 'nodes'):
            nodes = energysystem.nodes
            print(f"Number of nodes: {len(nodes)}")
            node_labels = [str(node.label) for node in nodes]
            print(f"Node labels: {node_labels}")
            
            # Categorize nodes
            sources = [n for n in nodes if hasattr(n, '__class__') and 'Source' in str(n.__class__)]
            sinks = [n for n in nodes if hasattr(n, '__class__') and 'Sink' in str(n.__class__)]
            transformers = [n for n in nodes if hasattr(n, '__class__') and 'Transformer' in str(n.__class__)]
            storages = [n for n in nodes if hasattr(n, '__class__') and 'Storage' in str(n.__class__)]
            
            print(f"Sources: {[str(s.label) for s in sources]}")
            print(f"Sinks: {[str(s.label) for s in sinks]}")
            print(f"Transformers: {[str(t.label) for t in transformers]}")
            print(f"Storages: {[str(s.label) for s in storages]}")
        
    except Exception as e:
        print(f"Error analyzing {filepath}: {e}")

def main():
    print("Starting debug script...")
    
    # Look for oemof files
    dumps_dir = "results/optimisation_results/dumps"
    
    if not os.path.exists(dumps_dir):
        print(f"Directory {dumps_dir} does not exist")
        return
    
    oemof_files = []
    for file in os.listdir(dumps_dir):
        if file.endswith('.oemof'):
            oemof_files.append(os.path.join(dumps_dir, file))
    
    print(f"Found {len(oemof_files)} .oemof files:")
    for f in oemof_files:
        print(f"  - {f}")
    
    if oemof_files:
        # Analyze first file
        print(f"\nAnalyzing first file: {oemof_files[0]}")
        debug_oemof_file(oemof_files[0])
    else:
        print("No oemof files found!")

if __name__ == "__main__":
    main()
