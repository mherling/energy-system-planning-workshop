#!/usr/bin/env python3
"""
Debug script for timeseries analysis
"""

import os
import sys
sys.path.append('.')

def test_timeseries():
    print("=== Timeseries Debug ===")
    
    # Check if dump files exist
    dump_path = "../../results/optimisation_results/dumps"
    print(f"Checking dump path: {dump_path}")
    
    if os.path.exists(dump_path):
        files = os.listdir(dump_path)
        print(f"Found files: {files}")
        
        # Try to load one file
        try:
            from timeseries_analysis import load_team_timeseries
            print("Loading team 1 data...")
            data = load_team_timeseries(1)
            print(f"Data loaded: {data is not None}")
            if data:
                print(f"Data keys: {list(data.keys())}")
        except Exception as e:
            print(f"Error loading data: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("Dump path does not exist!")
        
    # Check current working directory
    print(f"Current working directory: {os.getcwd()}")
    print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")

if __name__ == "__main__":
    test_timeseries()
