#!/usr/bin/env python3
"""
Start the Energy System Planning Workshop Web Application

This script starts the web server for the interactive workshop interface.
"""

import sys
import os
import uvicorn
from pathlib import Path

# Add the src directory to Python path
src_dir = Path(__file__).parent.parent
sys.path.insert(0, str(src_dir))

if __name__ == "__main__":
    print("🌟 Starting Energy System Planning Workshop Web Application")
    print("📱 Access the application at: http://localhost:8000")
    print("🔄 The application will automatically reload when files change")
    print("⚡ Press Ctrl+C to stop the server")
    print("-" * 60)
    
    # Change to web directory
    web_dir = Path(__file__).parent
    os.chdir(web_dir)
    
    # Start the FastAPI application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(web_dir), str(src_dir)]
    )
