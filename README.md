# NabhaGrid 🛰️⚡

**Autonomous Satellite Constellation Radio Frequency Interference (RFI) Detection, Localization & Mitigation System**

NabhaGrid is a next-generation orbital mesh mission control and simulation platform designed for autonomous satellite constellations (Walker-Delta LEO constellations). It integrates neuromorphic edge intelligence (Spiking Neural Networks), hyper-accurate RF multilateration (TDOA/FDOA), quantum-inspired route optimization (QUBO/QAOA), and real-time interactive 3D digital-twin visualization with CesiumJS.

---

## 🚀 Key Architectural Pillars

### 1. Orbital Mechanics & Dynamic Mesh Constellation
- **Walker-Delta LEO Simulation**: Analytical Keplerian orbit propagation with WGS84 sidereal Earth rotation and atmospheric occlusion calculations.
- **Dynamic Topology**: Computes time-varying Inter-Satellite Links (ISL) and Satellite-to-Ground Links (SGL) dynamically based on line-of-sight and range thresholds.
- **Telemetry Streaming**: Real-time 5 Hz WebSocket telemetry stream broadcasting satellite ephemeris, link statuses, RFI signatures, and optimized paths.

### 2. Neuromorphic RFI Detection (SNN)
- **Leaky Integrate-and-Fire (LIF)**: Event-driven spiking neuron architecture designed for low-power edge deployment on radiation-hardened satellite payloads.
- **Comparative Baseline**: Includes conventional CNN models for comparative accuracy, latency, and energy benchmark evaluations.

### 3. TDOA / FDOA Hyperbolic Multilateration
- Non-linear solver minimizing Time Difference of Arrival (TDOA) and Frequency Difference of Arrival (FDOA) Doppler shift residuals to accurately geolocate terrestrial interference sources.

### 4. Quantum-Inspired Route Mitigation (QUBO / QAOA)
- **Quadratic Unconstrained Binary Optimization (QUBO)** formulation that penalizes RFI-corrupted nodes, latency, and hop count while maximizing throughput.
- Rapid rerouting through non-interfered orbital neighbors and ground stations to maintain link continuity during severe jamming or interference.

### 5. Mission Control 3D Digital Twin
- Real-time 3D Earth globe visualization built with React, TypeScript, and CesiumJS.
- Dynamic visual representations of orbits, active link beams, interference cones, and mitigated route pathways.

---

## 📁 Repository Structure

```
NabhaGrid/
├── frontend/                     # React + TypeScript + Cesium 3D Mission Control
│   ├── src/                      # UI components, Cesium viewer, WebSocket client
│   ├── package.json
│   └── vite.config.ts
├── satellite_rfi_system/         # Core Research & Algorithmic Modules
│   ├── configs/                  # Simulation and hardware configurations
│   ├── modules/
│   │   ├── detection_snn/        # Neuromorphic Spiking Neural Network detectors
│   │   ├── detection_cnn/        # Baseline CNN detectors
│   │   ├── localization/         # TDOA / FDOA multilateration solver
│   │   └── optimization/         # QUBO & QAOA quantum-inspired routing
│   ├── scenario/                 # RF environment & orbit scenario generators
│   └── simulation/               # Discrete-event simulation runner
├── main.py                       # Unified FastAPI engine & live simulation server
├── requirements.txt              # Python dependencies
├── run_simulation.bat            # Windows 1-click launcher
└── README.md
```

---

## 🛠️ Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ (for building frontend)

### 1. Python Environment Setup
```bash
# Clone the repository
git clone https://github.com/ranganathranga2005-max/NabhaGrid.git
cd NabhaGrid

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Frontend Build (Optional if using dev server)
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Run Simulation & Mission Control
```bash
# On Windows, simply double-click or run:
run_simulation.bat

# Or run directly via Python:
python main.py
```
This automatically launches the FastAPI engine, begins the orbital simulation loop, and opens `http://localhost:8000` in your default browser.

---

## 🛰️ Tech Stack
- **Backend & Physics Engine**: Python, FastAPI, Uvicorn, NumPy, SciPy, NetworkX, WebSockets
- **Frontend & 3D Visualization**: React 19, TypeScript, Vite, CesiumJS, TailwindCSS / Vanilla CSS
- **Algorithmic Modeling**: Spiking Neural Networks (LIF), TDOA/FDOA Solver, QUBO/QAOA formulation

---

## 📄 License
MIT License. See LICENSE for details.
