# Autonomous Satellite Constellation RFI Detection, Source Localization & Mitigation System

This repository contains the software and mathematical skeleton for a B.Tech research prototype.

## 1. Project Objective
To develop a pipeline for detecting Radio Frequency Interference (RFI) using Spiking Neural Networks (SNN), estimating the interference source using TDOA/FDOA, and mitigating it by optimizing satellite communication paths using QUBO-based quantum-inspired optimization.

## 2. Research Pipeline
RF/IQ Data -> Preprocessing -> Detection (SNN vs CNN Baseline) -> TDOA/FDOA Localization -> Candidate Path Generation -> QUBO Optimization -> Best Feasible Path.

## 3. Module Responsibilities
- `scenario/`: Generates or models the RF environment, satellites, and receivers.
- `modules/detection_snn/`: Proposed RFI detection using energy-efficient/neuromorphic principles.
- `modules/detection_cnn/`: Conventional baseline detector for comparative analysis.
- `modules/localization/`: Mathematical estimation of RFI source using time/frequency differences.
- `modules/optimization/`: Formulation of the mitigation strategy as a QUBO problem to be solved classically or via quantum simulation.

## 4. Mathematical Abstractions
- **SNN**: Leaky Integrate-and-Fire (LIF) model with explicit reset.
- **CNN**: Standard spatial convolutions on time-frequency data.
- **Localization**: Abstract nonlinear objective minimizing TDOA/FDOA residuals.
- **Optimization**: Generic QUBO formulation `Q(x) = x^T Q x + c^T x` incorporating multiple weighted objectives and penalties.

## 5. Folder Structure
See the repository directory tree. Clean interfaces are established in `integration/data_structures.py`.

## 6. Current Assumptions
- RFI detection processes feature-extracted (e.g., spectrogram) data, not raw IQ directly (though this is flexible).
- Candidate routes are generated prior to optimization to avoid enumerating all paths.
- Perfect synchronization is NOT assumed; error margins are configurable parameters.

## 7. Unknown Parameters
The parameters located in `configs/config.yaml` are strictly marked as `TODO`. They must be determined via experimental testing or literature review.

## 8. What requires real data
- Training the SNN and CNN requires an actual labeled dataset.
- Localization requires realistic satellite ephemeris and signal traces.

## 9. What has NOT yet been experimentally validated
- SNN accuracy vs CNN accuracy.
- SNN energy efficiency vs CNN energy efficiency.
- Convergence/Accuracy of the Localization solver.
- Optimality and speedup (if any) of the QUBO solvers over conventional methods.
- **This codebase is currently a Skeleton.**

---
*Note: All TODO markers indicate areas requiring actual scientific effort, experimental determination, or dataset integration. No data or results are fabricated in this skeleton.*
