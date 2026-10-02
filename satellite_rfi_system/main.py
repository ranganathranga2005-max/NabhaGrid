#!/usr/bin/env python3
"""
Satellite RFI System — Main Simulation Runner Delegate
Executes the primary main.py simulation runner from the workspace root.
"""
import sys
from pathlib import Path

# Add root directory to sys.path and run root main
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import main

if __name__ == "__main__":
    main.main()
