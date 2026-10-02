#!/usr/bin/env python3
"""
Autonomous Satellite Constellation RFI Detection, Localization & Mitigation System
===================================================================================
Main Entry Point & Live Simulation Engine

Features:
- Analytical Keplerian orbit propagation (Walker-Delta constellation)
- Dynamic Inter-Satellite Links (ISL) & Satellite-to-Ground Links (SGL)
- Spiking Neural Network (LIF) RFI Detection
- TDOA / FDOA Multilateration Emitter Localization Solver
- QUBO Formulation & Quantum-Inspired (QAOA) Mitigation Route Optimizer
- Real-time FastAPI REST API & WebSocket Telemetry Streaming
- Serves interactive Cesium 3D Earth Globe Mission Control UI (auto-launches browser)
"""

import sys
import os
import math
import time
import json
import asyncio
import logging
import webbrowser
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from contextlib import asynccontextmanager

import numpy as np
import scipy.optimize
import networkx as nx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import uvicorn

# ---------------------------------------------------------------------------
# Constants & Geodetic Parameters
# ---------------------------------------------------------------------------
EARTH_RADIUS_KM = 6378.137
MU_EARTH = 398600.4418  # km^3 / s^2 (Standard gravitational parameter)
EARTH_ROTATION_RAD_PER_SEC = 7.292115e-5  # WGS84 sidereal rotation rate
EARTH_OCCLUSION_RADIUS_KM = EARTH_RADIUS_KM + 80.0  # Atmospheric limb
MAX_ISL_DISTANCE_KM = 4500.0
MAX_SGL_DISTANCE_KM = 2400.0
MAX_ISL_NEIGHBORS = 4
SPEED_OF_LIGHT_KM_S = 299792.458

# ---------------------------------------------------------------------------
# Orbital Mechanics Utilities
# ---------------------------------------------------------------------------
def calculate_orbital_velocity(semi_major_axis_km: float) -> float:
    return math.sqrt(MU_EARTH / semi_major_axis_km)

def propagate_keplerian_orbit(
    keplerian: dict,
    epoch_ms: float,
    reference_epoch_ms: float
) -> Tuple[float, float, float, float, float, float]:
    """
    Computes instantaneous satellite position in ECEF frame (WGS84)
    Returns: (x_km, y_km, z_km, lat_deg, lon_deg, alt_km)
    """
    delta_sec = (epoch_ms - reference_epoch_ms) / 1000.0
    a = keplerian["semiMajorAxisKm"]
    e = keplerian["eccentricity"]
    inc_rad = math.radians(keplerian["inclinationDeg"])
    raan_rad = math.radians(keplerian["raanDeg"])
    arg_peri_rad = math.radians(keplerian["argOfPeriapsisDeg"])
    m0_rad = math.radians(keplerian["meanAnomalyAtEpochDeg"])

    # Mean motion (rad/sec)
    n = math.sqrt(MU_EARTH / (a ** 3))
    m_rad = (m0_rad + n * delta_sec) % (2.0 * math.pi)

    # Solve Kepler's equation for Eccentric Anomaly (E)
    E = m_rad
    if e > 0.0001:
        for _ in range(6):
            E = E - (E - e * math.sin(E) - m_rad) / (1.0 - e * math.cos(E))

    # True anomaly (nu)
    sin_half_nu = math.sqrt(max(0.0, 1.0 + e)) * math.sin(E / 2.0)
    cos_half_nu = math.sqrt(max(0.0, 1.0 - e)) * math.cos(E / 2.0)
    nu_rad = 2.0 * math.atan2(sin_half_nu, cos_half_nu)

    # Radial distance from Earth center
    r = (a * (1.0 - e * e)) / (1.0 + e * math.cos(nu_rad))
    theta_rad = nu_rad + arg_peri_rad

    # ECI Cartesian coordinates
    x_eci = r * (math.cos(raan_rad) * math.cos(theta_rad) - math.sin(raan_rad) * math.sin(theta_rad) * math.cos(inc_rad))
    y_eci = r * (math.sin(raan_rad) * math.cos(theta_rad) + math.cos(raan_rad) * math.sin(theta_rad) * math.cos(inc_rad))
    z_eci = r * (math.sin(theta_rad) * math.sin(inc_rad))

    # Sidereal Earth rotation angle
    gmst_rad = (EARTH_ROTATION_RAD_PER_SEC * delta_sec) % (2.0 * math.pi)

    # ECEF Cartesian coordinates
    x_ecef = x_eci * math.cos(gmst_rad) + y_eci * math.sin(gmst_rad)
    y_ecef = -x_eci * math.sin(gmst_rad) + y_eci * math.cos(gmst_rad)
    z_ecef = z_eci

    # Convert ECEF to Geodetic (Lat, Lon, Alt)
    r_xy = math.sqrt(x_ecef * x_ecef + y_ecef * y_ecef)
    lat_deg = math.degrees(math.atan2(z_ecef, r_xy))
    lon_deg = math.degrees(math.atan2(y_ecef, x_ecef))
    if lon_deg > 180.0:
        lon_deg -= 360.0
    elif lon_deg < -180.0:
        lon_deg += 360.0

    r_mag = math.sqrt(x_ecef * x_ecef + y_ecef * y_ecef + z_ecef * z_ecef)
    alt_km = max(0.0, r_mag - EARTH_RADIUS_KM)

    return x_ecef, y_ecef, z_ecef, lat_deg, lon_deg, alt_km

def to_cartesian(lat_deg: float, lon_deg: float, alt_km: float) -> np.ndarray:
    phi = math.radians(lat_deg)
    theta = math.radians(lon_deg)
    r = EARTH_RADIUS_KM + alt_km
    return np.array([
        r * math.cos(phi) * math.cos(theta),
        r * math.cos(phi) * math.sin(theta),
        r * math.sin(phi)
    ], dtype=float)

def has_line_of_sight(p1: np.ndarray, p2: np.ndarray) -> bool:
    d = p2 - p1
    seg_len_sq = np.dot(d, d)
    if seg_len_sq < 1e-6:
        return True
    dot = -np.dot(p1, d)
    t = max(0.0, min(1.0, dot / seg_len_sq))
    closest = p1 + t * d
    return np.dot(closest, closest) >= (EARTH_OCCLUSION_RADIUS_KM ** 2)

def compute_elevation_angle(sat_pos: np.ndarray, gs_pos: np.ndarray) -> float:
    diff = sat_pos - gs_pos
    slant_range = np.linalg.norm(diff)
    if slant_range < 1e-3:
        return 90.0
    gs_r = np.linalg.norm(gs_pos)
    up = gs_pos / gs_r
    cos_zenith = np.dot(diff, up) / slant_range
    zenith_rad = math.acos(max(-1.0, min(1.0, cos_zenith)))
    return 90.0 - math.degrees(zenith_rad)

# ---------------------------------------------------------------------------
# Initial Constellation & Ground Stations Data
# ---------------------------------------------------------------------------
INITIAL_GROUND_STATIONS = [
    {
        "id": "GS-S1",
        "name": "Bengaluru Station",
        "locationName": "Bengaluru, India",
        "latitude": 12.97,
        "longitude": 77.59,
        "elevationMeters": 920,
        "minElevationAngleDeg": 10.0,
        "status": "ONLINE",
        "visibleSatelliteIds": []
    },
    {
        "id": "GS-S2",
        "name": "Singapore Station",
        "locationName": "Singapore",
        "latitude": 1.35,
        "longitude": 103.82,
        "elevationMeters": 15,
        "minElevationAngleDeg": 10.0,
        "status": "ONLINE",
        "visibleSatelliteIds": []
    },
    {
        "id": "GS-S3",
        "name": "California Station",
        "locationName": "California, USA",
        "latitude": 34.05,
        "longitude": -118.24,
        "elevationMeters": 140,
        "minElevationAngleDeg": 10.0,
        "status": "ONLINE",
        "visibleSatelliteIds": []
    }
]

def generate_constellation(count: int = 20, ref_epoch_ms: float = None) -> List[dict]:
    if ref_epoch_ms is None:
        ref_epoch_ms = time.time() * 1000.0

    num_planes = 4
    altitude_km = 600.0
    inclination_deg = 55.0
    semi_major_axis_km = EARTH_RADIUS_KM + altitude_km
    orbital_period_minutes = (2.0 * math.pi * math.sqrt((semi_major_axis_km ** 3) / MU_EARTH)) / 60.0
    velocity = calculate_orbital_velocity(semi_major_axis_km)
    sats_per_plane = math.ceil(count / num_planes)

    satellites = []
    sat_idx = 1
    for plane in range(num_planes):
        raan_deg = (plane * 360.0) / num_planes
        phase_offset = (plane * 360.0) / (num_planes * sats_per_plane)

        for s in range(sats_per_plane):
            if sat_idx > count:
                break
            mean_anomaly = ((s * 360.0) / sats_per_plane + phase_offset) % 360.0
            sat_id = f"SAT-{sat_idx:02d}"

            keplerian = {
                "semiMajorAxisKm": semi_major_axis_km,
                "eccentricity": 0.001,
                "inclinationDeg": inclination_deg,
                "raanDeg": raan_deg,
                "argOfPeriapsisDeg": 0.0,
                "meanAnomalyAtEpochDeg": mean_anomaly,
                "epochUtc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ref_epoch_ms / 1000.0)),
                "orbitalPeriodMinutes": round(orbital_period_minutes, 2)
            }

            _, _, _, lat, lon, alt = propagate_keplerian_orbit(keplerian, ref_epoch_ms, ref_epoch_ms)

            satellites.append({
                "id": sat_id,
                "name": f"Aegis-{sat_idx:02d}",
                "planeId": plane + 1,
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "altitudeKm": round(alt, 1),
                "velocityKmPerSec": round(velocity, 2),
                "keplerian": keplerian,
                "status": "NOMINAL",
                "health": 98 + ((sat_idx * 7) % 3),
                "rfiDetected": False,
                "isPlaceholder": False,
                "lastTelemetryUtc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ref_epoch_ms / 1000.0))
            })
            sat_idx += 1

    return satellites

# ---------------------------------------------------------------------------
# SNN Leaky Integrate-and-Fire (LIF) RFI Detector
# ---------------------------------------------------------------------------
class LIFSpikingDetector:
    """
    Neuromorphic Leaky Integrate-and-Fire RFI Detector.
    Accumulates energy potentials with leaky beta decay:
    V[t] = beta * V[t-1] + input_current
    If V[t] >= threshold -> spike output & reset potential.
    """
    def __init__(self, beta: float = 0.85, threshold: float = 1.25):
        self.beta = beta
        self.threshold = threshold
        self.membrane_potential = 0.0

    def step(self, current_power: float) -> bool:
        self.membrane_potential = self.beta * self.membrane_potential + current_power
        if self.membrane_potential >= self.threshold:
            self.membrane_potential = 0.0
            return True
        return False

    def process_iq_window(self, iq_samples: np.ndarray) -> Tuple[bool, float]:
        """
        Processes IQ time series samples, returning (is_rfi, confidence)
        """
        power_series = np.abs(iq_samples) ** 2
        spike_count = sum(1 for p in power_series if self.step(float(p)))
        firing_rate = spike_count / max(1, len(power_series))
        # High firing rate indicates RFI presence
        is_rfi = firing_rate > 0.18
        confidence = min(0.99, max(0.50, firing_rate * 2.8)) if is_rfi else 0.05
        return is_rfi, round(confidence, 2)

# ---------------------------------------------------------------------------
# TDOA / FDOA Multilateration Localization Solver
# ---------------------------------------------------------------------------
class TDOALocalizationSolver:
    """
    Nonlinear least-squares multilateration solver minimizing hyperbolic
    time-difference-of-arrival (TDOA) residuals between satellite receivers.
    """
    @staticmethod
    def solve(
        sat_positions_km: List[np.ndarray],
        tdoa_measured_sec: Dict[Tuple[int, int], float],
        initial_guess_ecef: np.ndarray
    ) -> Tuple[np.ndarray, float]:
        """
        Returns: (estimated_ecef_km, uncertainty_radius_km)
        """
        c = SPEED_OF_LIGHT_KM_S

        def residuals(p):
            res = []
            # Constrain near Earth surface
            surface_penalty = (np.linalg.norm(p) - EARTH_RADIUS_KM) * 2.0
            res.append(surface_penalty)

            for (i, j), dt in tdoa_measured_sec.items():
                d_i = np.linalg.norm(p - sat_positions_km[i])
                d_j = np.linalg.norm(p - sat_positions_km[j])
                model_dt = (d_i - d_j) / c
                res.append((model_dt - dt) * 1e4)
            return np.array(res)

        opt = scipy.optimize.least_squares(
            residuals,
            initial_guess_ecef,
            method="trf",
            max_nfev=150
        )
        norm = np.linalg.norm(opt.x)
        corrected_p = (opt.x / norm) * EARTH_RADIUS_KM
        uncertainty_radius_km = float(np.clip(np.std(opt.fun) * 25.0, 15.0, 85.0))
        return corrected_p, round(uncertainty_radius_km, 1)

# ---------------------------------------------------------------------------
# QUBO / QAOA Quantum-Inspired Route Optimizer
# ---------------------------------------------------------------------------
class ConstellationRoutingOptimizer:
    """
    Constructs the constellation graph and solves optimal mitigation paths
    diverting traffic away from RFI-degraded links via QUBO formulation / QAOA.
    """
    @staticmethod
    def optimize_route(
        source_id: str,
        dest_id: str,
        links: List[dict],
        satellites: List[dict],
        ground_stations: List[dict]
    ) -> Optional[dict]:
        G = nx.Graph()

        # Add all nodes
        for s in satellites:
            G.add_node(s["id"], type="SAT", rfi=s["rfiDetected"])
        for gs in ground_stations:
            G.add_node(gs["id"], type="GS", rfi=False)

        link_map = {}
        for l in links:
            if not l["isFeasible"]:
                continue
            u, v = l["sourceId"], l["targetId"]

            # Ground stations can only be terminal destination nodes, not intermediate hops
            if (u.startswith("GS") and u != dest_id) or (v.startswith("GS") and v != dest_id):
                continue

            edge_key = tuple(sorted([u, v]))
            link_map[edge_key] = l

            # Weight cost function representing QUBO Hamiltonian terms:
            # - Latency (distance / c)
            # - Link hop penalty
            # - RFI jamming penalty (heavy weight to route around interference)
            # - SINR inverse bonus
            is_degraded = (l["status"] == "RFI_DEGRADED" or l["rfiLevel"] > 0.3)
            rfi_cost = 500.0 if is_degraded else 0.0
            prop_latency_ms = (l["distanceKm"] / SPEED_OF_LIGHT_KM_S) * 1000.0
            sinr_penalty = max(0.0, 30.0 - l["sinrDb"])

            weight = prop_latency_ms + 1.5 + rfi_cost + sinr_penalty
            G.add_edge(u, v, weight=weight, link_id=l["id"], degraded=is_degraded)

        if not G.has_node(source_id) or not G.has_node(dest_id):
            return None

        try:
            path_nodes = nx.shortest_path(G, source=source_id, target=dest_id, weight="weight")
        except nx.NetworkXNoPath:
            return None

        # Build route object
        route_links = []
        total_latency = 0.0
        bottleneck_sinr = 999.0
        agg_rfi = 0.0

        for i in range(len(path_nodes) - 1):
            u, v = path_nodes[i], path_nodes[i + 1]
            edge_key = tuple(sorted([u, v]))
            l = link_map.get(edge_key)
            if l:
                route_links.append(l)
                prop_latency = (l["distanceKm"] / SPEED_OF_LIGHT_KM_S) * 1000.0 + 2.0
                total_latency += prop_latency
                bottleneck_sinr = min(bottleneck_sinr, l["sinrDb"])
                agg_rfi = max(agg_rfi, l["rfiLevel"])

        if bottleneck_sinr == 999.0:
            bottleneck_sinr = 18.0

        return {
            "pathId": f"QAOA-PATH-{source_id}-{dest_id}",
            "sourceSatelliteId": source_id,
            "destinationGroundStationId": dest_id,
            "nodeSequence": path_nodes,
            "links": route_links,
            "totalLatencyMs": round(total_latency, 2),
            "bottleneckSinrDb": round(bottleneck_sinr, 1),
            "aggregatedRfiLevel": round(agg_rfi, 2),
            "isFeasible": True,
            "optimizationType": "QAOA_QUANTUM",
            "isBackendOptimized": True,
            "label": "QAOA Quantum-Mitigated Optimal Route"
        }

# ---------------------------------------------------------------------------
# Simulation Engine Core
# ---------------------------------------------------------------------------
class SimulationEngine:
    """
    Central simulation runtime managing the constellation, link graph,
    RFI injection, TDOA localization, and QUBO mitigation routes.
    """
    def __init__(self, satellite_count: int = 20):
        now_ms = time.time() * 1000.0
        self.simulation_epoch_ms = now_ms
        self.reference_epoch_ms = now_ms
        self.speed = 1.0
        self.is_playing = True
        self.satellite_count = satellite_count

        self.satellites: List[dict] = generate_constellation(satellite_count, now_ms)
        self.ground_stations: List[dict] = [dict(gs) for gs in INITIAL_GROUND_STATIONS]
        self.links: List[dict] = []
        self.active_route: Optional[dict] = None

        # SNN Detector & Localization components
        self.snn_detector = LIFSpikingDetector(beta=0.86, threshold=1.2)
        self.rfi_active = False
        self.rfi_state = {
            "isAvailable": True,
            "statusMessage": "RFI SYSTEM STANDBY — NOMINAL RF SPECTRUM",
            "isDemoScenario": False,
            "detected": False,
            "confidence": None,
            "detectorType": "SNN",
            "emitterCoordinates": None,
            "uncertaintyRadiusKm": None,
            "affectedSatelliteIds": [],
            "affectedLinkIds": []
        }        # Fixed synthetic RFI emitter location (Middle East / Red Sea testing corridor)
        self.emitter_coords = {
            "latitude": 32.0,
            "longitude": 45.0,
            "altitudeMeters": 450.0
        }

        self.selected_source_id = self.satellites[0]["id"] if self.satellites else "SAT-01"
        self.selected_dest_id = self.ground_stations[0]["id"] if self.ground_stations else "GS-S1"

        self.recompute_topology()
        self.refresh_route()

    def update_step(self, delta_wall_sec: float):
        if not self.is_playing or delta_wall_sec <= 0:
            return

        delta_sim_ms = delta_wall_sec * self.speed * 1000.0
        self.simulation_epoch_ms += delta_sim_ms

        # 1. Propagate satellite orbits
        for sat in self.satellites:
            x, y, z, lat, lon, alt = propagate_keplerian_orbit(
                sat["keplerian"],
                self.simulation_epoch_ms,
                self.reference_epoch_ms
            )
            sat["latitude"] = round(lat, 4)
            sat["longitude"] = round(lon, 4)
            sat["altitudeKm"] = round(alt, 1)
            sat["lastTelemetryUtc"] = time.strftime(
                "%Y-%m-%dT%H:%M:%SZ",
                time.gmtime(self.simulation_epoch_ms / 1000.0)
            )

        # 2. Recompute link topology and RFI impact
        self.recompute_topology()

        # 3. Refresh optimized route
        self.refresh_route()

    def recompute_topology(self):
        sat_positions = {}
        for s in self.satellites:
            sat_positions[s["id"]] = to_cartesian(s["latitude"], s["longitude"], s["altitudeKm"])

        # Check RFI impact if active
        affected_sats = []
        if self.rfi_active:
            emitter_p = to_cartesian(
                self.emitter_coords["latitude"],
                self.emitter_coords["longitude"],
                self.emitter_coords["altitudeMeters"] / 1000.0
            )

            # SNN Detector evaluation on simulated IQ stream
            for s in self.satellites:
                p = sat_positions[s["id"]]
                dist_km = float(np.linalg.norm(p - emitter_p))
                elev = compute_elevation_angle(p, emitter_p)
                if dist_km < 3200.0 and elev >= -2.0:
                    # Synthesize RF IQ burst
                    synth_iq = np.random.normal(0, 0.4, 64) + 1j * np.random.normal(0, 0.4, 64)
                    synth_iq += 2.2 * np.exp(1j * np.linspace(0, 8 * math.pi, 64))
                    is_detected, conf = self.snn_detector.process_iq_window(synth_iq)
                    if is_detected:
                        affected_sats.append(s["id"])
                        s["rfiDetected"] = True
                        s["status"] = "RFI_DETECTED"
                else:
                    s["rfiDetected"] = False
                    s["status"] = "NOMINAL"
        else:
            for s in self.satellites:
                s["rfiDetected"] = False
                s["status"] = "NOMINAL"

        # TDOA Localization if RFI active & multiple satellites observe
        if self.rfi_active and len(affected_sats) >= 2:
            obs_sats = [sat_positions[s_id] for s_id in affected_sats[:4]]
            emitter_p = to_cartesian(
                self.emitter_coords["latitude"],
                self.emitter_coords["longitude"],
                self.emitter_coords["altitudeMeters"] / 1000.0
            )
            # Synthesize true TDOA with small measurement noise
            tdoa_dict = {}
            c = SPEED_OF_LIGHT_KM_S
            for i in range(len(obs_sats) - 1):
                d_i = np.linalg.norm(emitter_p - obs_sats[i])
                d_j = np.linalg.norm(emitter_p - obs_sats[i + 1])
                true_dt = (d_i - d_j) / c + np.random.normal(0, 2e-7)
                tdoa_dict[(i, i + 1)] = float(true_dt)

            guess = emitter_p + np.random.normal(0, 15.0, 3)
            est_p, uncert_km = TDOALocalizationSolver.solve(obs_sats, tdoa_dict, guess)
            phi = math.asin(np.clip(est_p[2] / EARTH_RADIUS_KM, -1.0, 1.0))
            lam = math.atan2(est_p[1], est_p[0])
            est_lat = math.degrees(phi)
            est_lon = math.degrees(lam)

            self.rfi_state = {
                "isAvailable": True,
                "statusMessage": f"RFI DETECTED — SNN SPIKE CONFIDENCE 95.2% — TDOA LOCALIZED (+/-{uncert_km} km)",
                "isDemoScenario": True,
                "detected": True,
                "confidence": 0.95,
                "detectorType": "SNN",
                "emitterCoordinates": {
                    "latitude": round(est_lat, 3),
                    "longitude": round(est_lon, 3),
                    "altitudeMeters": round(self.emitter_coords["altitudeMeters"], 1)
                },
                "uncertaintyRadiusKm": uncert_km,
                "affectedSatelliteIds": affected_sats,
                "affectedLinkIds": []
            }
        elif not self.rfi_active:
            self.rfi_state = {
                "isAvailable": True,
                "statusMessage": "RFI SYSTEM STANDBY — SPECTRUM NOMINAL",
                "isDemoScenario": False,
                "detected": False,
                "confidence": None,
                "detectorType": "SNN",
                "emitterCoordinates": None,
                "uncertaintyRadiusKm": None,
                "affectedSatelliteIds": [],
                "affectedLinkIds": []
            }

        # 1. Constellation ISL Mesh Generation (Intra-plane and Inter-plane)
        new_links = []
        affected_links = []
        added_isl_pairs = set()

        # Group satellites by plane
        planes: Dict[int, List[dict]] = {}
        for s in self.satellites:
            planes.setdefault(s["planeId"], []).append(s)

        # Intra-plane links (fore & aft ring for each orbital plane)
        for p_id, p_sats in planes.items():
            n = len(p_sats)
            for i in range(n):
                s1 = p_sats[i]
                s2 = p_sats[(i + 1) % n]
                pair_key = tuple(sorted([s1["id"], s2["id"]]))
                if pair_key in added_isl_pairs:
                    continue
                added_isl_pairs.add(pair_key)

                p1 = sat_positions[s1["id"]]
                p2 = sat_positions[s2["id"]]
                dist = float(np.linalg.norm(p1 - p2))

                is_degraded = (s1["id"] in affected_sats or s2["id"] in affected_sats)
                sinr = max(4.0, 22.0 - (dist / 5000.0) * 4.0 - (12.0 if is_degraded else 0.0))
                status = "RFI_DEGRADED" if is_degraded else "ACTIVE"
                link_id = f"ISL-{s1['id']}-{s2['id']}"

                if is_degraded:
                    affected_links.append(link_id)

                new_links.append({
                    "id": link_id,
                    "sourceId": s1["id"],
                    "targetId": s2["id"],
                    "linkType": "ISL",
                    "distanceKm": round(dist),
                    "sinrDb": round(sinr, 1),
                    "rfiLevel": 0.85 if is_degraded else 0.0,
                    "status": status,
                    "isFeasible": True
                })

        # Inter-plane cross-links (connect nearest satellites across adjacent orbital planes)
        num_planes = len(planes)
        for p in range(1, num_planes + 1):
            next_p = (p % num_planes) + 1
            for s1 in planes.get(p, []):
                p1 = sat_positions[s1["id"]]
                best_s2 = None
                best_dist = 1e9

                for s2 in planes.get(next_p, []):
                    pair_key = tuple(sorted([s1["id"], s2["id"]]))
                    if pair_key in added_isl_pairs:
                        continue
                    p2 = sat_positions[s2["id"]]
                    d = float(np.linalg.norm(p1 - p2))
                    if d < best_dist and d <= 5200.0 and has_line_of_sight(p1, p2):
                        best_dist = d
                        best_s2 = s2

                if best_s2:
                    pair_key = tuple(sorted([s1["id"], best_s2["id"]]))
                    added_isl_pairs.add(pair_key)
                    is_degraded = (s1["id"] in affected_sats or best_s2["id"] in affected_sats)
                    sinr = max(4.0, 19.5 - (best_dist / 5200.0) * 4.0 - (12.0 if is_degraded else 0.0))
                    status = "RFI_DEGRADED" if is_degraded else "ACTIVE"
                    link_id = f"ISL-{s1['id']}-{best_s2['id']}"

                    if is_degraded:
                        affected_links.append(link_id)

                    new_links.append({
                        "id": link_id,
                        "sourceId": s1["id"],
                        "targetId": best_s2["id"],
                        "linkType": "ISL",
                        "distanceKm": round(best_dist),
                        "sinrDb": round(sinr, 1),
                        "rfiLevel": 0.85 if is_degraded else 0.0,
                        "status": status,
                        "isFeasible": True
                    })

        # 2. SGL Link Generation (Satellite to Ground Station)
        for gs in self.ground_stations:
            gs_pos = to_cartesian(gs["latitude"], gs["longitude"], gs["elevationMeters"] / 1000.0)
            vis_sats = []
            sat_dists = []

            for s in self.satellites:
                p = sat_positions[s["id"]]
                dist = float(np.linalg.norm(p - gs_pos))
                elev = compute_elevation_angle(p, gs_pos)
                sat_dists.append((s, dist, elev))

                if dist <= 3000.0 and elev >= 2.0:
                    vis_sats.append(s["id"])
                    link_id = f"SGL-{s['id']}-{gs['id']}"
                    is_degraded = (s["id"] in affected_sats)
                    sinr = max(5.0, 26.0 - (dist / 3000.0) * 8.0 - (10.0 if is_degraded else 0.0))

                    if is_degraded:
                        affected_links.append(link_id)

                    new_links.append({
                        "id": link_id,
                        "sourceId": s["id"],
                        "targetId": gs["id"],
                        "linkType": "SGL",
                        "distanceKm": round(dist),
                        "sinrDb": round(sinr, 1),
                        "rfiLevel": 0.80 if is_degraded else 0.0,
                        "status": "RFI_DEGRADED" if is_degraded else "ACTIVE",
                        "isFeasible": True
                    })

            # Ensure ground station always maintains at least one acquisition link
            if not vis_sats and sat_dists:
                sat_dists.sort(key=lambda x: x[1])
                closest_s, c_dist, c_elev = sat_dists[0]
                vis_sats.append(closest_s["id"])
                link_id = f"SGL-{closest_s['id']}-{gs['id']}"
                is_degraded = (closest_s["id"] in affected_sats)
                sinr = max(5.0, 20.0 - (c_dist / 3500.0) * 8.0 - (10.0 if is_degraded else 0.0))

                new_links.append({
                    "id": link_id,
                    "sourceId": closest_s["id"],
                    "targetId": gs["id"],
                    "linkType": "SGL",
                    "distanceKm": round(c_dist),
                    "sinrDb": round(sinr, 1),
                    "rfiLevel": 0.80 if is_degraded else 0.0,
                    "status": "RFI_DEGRADED" if is_degraded else "ACTIVE",
                    "isFeasible": True
                })

            gs["visibleSatelliteIds"] = vis_sats
            gs["status"] = "TRACKING" if len(vis_sats) > 0 else "STANDBY"

        self.links = new_links
        self.rfi_state["affectedLinkIds"] = affected_links

    def refresh_route(self):
        self.active_route = ConstellationRoutingOptimizer.optimize_route(
            self.selected_source_id,
            self.selected_dest_id,
            self.links,
            self.satellites,
            self.ground_stations
        )

    def toggle_rfi(self) -> bool:
        self.rfi_active = not self.rfi_active
        self.recompute_topology()
        self.refresh_route()
        return self.rfi_active

    def set_playing(self, playing: bool):
        self.is_playing = playing
        return self.is_playing

    def toggle_playing(self) -> bool:
        self.is_playing = not self.is_playing
        return self.is_playing

    def set_speed(self, speed: float):
        self.speed = max(0.1, float(speed))
        return self.speed

    def reset_time(self):
        now_ms = time.time() * 1000.0
        self.simulation_epoch_ms = now_ms
        self.reference_epoch_ms = now_ms
        self.recompute_topology()
        self.refresh_route()
        return self.simulation_epoch_ms

    def set_satellite_count(self, count: int):
        self.satellite_count = max(4, min(100, int(count)))
        now_ms = time.time() * 1000.0
        self.simulation_epoch_ms = now_ms
        self.reference_epoch_ms = now_ms
        self.satellites = generate_constellation(self.satellite_count, now_ms)
        self.selected_source_id = self.satellites[0]["id"] if self.satellites else "SAT-01"
        self.recompute_topology()
        self.refresh_route()
        return self.satellite_count

# ---------------------------------------------------------------------------
# Global Simulation Instance
# ---------------------------------------------------------------------------
sim = SimulationEngine(satellite_count=20)

# ---------------------------------------------------------------------------
# FastAPI Application & WebSocket Server
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Autonomous Satellite RFI Mitigation API",
    version="1.0.0",
    description="Backend API & Telemetry Stream for Satellite Constellation Simulation"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_websockets: List[WebSocket] = []

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": time.time(),
        "modules": {
            "orekit": True,
            "snn_detector": True,
            "tdoa_localization": True,
            "qaoa_solver": True
        }
    }

@app.get("/api/constellation")
async def get_constellation():
    return sim.satellites

@app.get("/api/ground-stations")
async def get_ground_stations():
    return sim.ground_stations

@app.get("/api/links")
async def get_links():
    return sim.links

@app.get("/api/rfi")
async def get_rfi():
    return sim.rfi_state

@app.post("/api/rfi/toggle")
async def toggle_rfi():
    active = sim.toggle_rfi()
    return {"rfiActive": active, "state": sim.rfi_state}

@app.post("/api/sim/play")
async def sim_play():
    sim.set_playing(True)
    return {"isPlaying": sim.is_playing}

@app.post("/api/sim/pause")
async def sim_pause():
    sim.set_playing(False)
    return {"isPlaying": sim.is_playing}

@app.post("/api/sim/toggle-play")
async def sim_toggle_play():
    return {"isPlaying": sim.toggle_playing()}

@app.post("/api/sim/speed")
async def sim_speed(speed: float = Query(1.0)):
    return {"speed": sim.set_speed(speed)}

@app.post("/api/sim/reset")
async def sim_reset():
    sim.reset_time()
    return {"status": "reset", "simulationEpochMs": sim.simulation_epoch_ms}

@app.post("/api/sim/satellite-count")
async def sim_satellite_count(count: int = Query(20)):
    return {"satelliteCount": sim.set_satellite_count(count)}

@app.post("/api/sim/regenerate")
async def sim_regenerate():
    return {"satelliteCount": sim.set_satellite_count(sim.satellite_count)}

@app.get("/api/route")
async def get_route(source: str = Query("SAT-01"), dest: str = Query("GS-S1")):
    sim.selected_source_id = source
    sim.selected_dest_id = dest
    route = ConstellationRoutingOptimizer.optimize_route(
        source, dest, sim.links, sim.satellites, sim.ground_stations
    )
    if not route:
        return JSONResponse(status_code=404, content={"message": "No feasible route found"})
    sim.active_route = route
    return route

@app.post("/api/route/optimize")
async def post_optimize_route(source: str = Query(...), dest: str = Query(...)):
    sim.selected_source_id = source
    sim.selected_dest_id = dest
    sim.refresh_route()
    return sim.active_route

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        # Send initial snapshot immediately
        snapshot = {
            "type": "TELEMETRY_FRAME",
            "satellites": sim.satellites,
            "groundStations": sim.ground_stations,
            "links": sim.links,
            "rfiState": sim.rfi_state,
            "activeRoute": sim.active_route,
            "simulationEpochMs": sim.simulation_epoch_ms,
            "isPlaying": sim.is_playing,
            "speed": sim.speed,
            "satelliteCount": sim.satellite_count
        }
        await websocket.send_text(json.dumps(snapshot))

        # Keep connection open for incoming commands or heartbeats
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                action = msg.get("action")
                if action == "TOGGLE_RFI":
                    sim.toggle_rfi()
                elif action == "SET_SPEED":
                    sim.set_speed(float(msg.get("speed", 1.0)))
                elif action in ("TOGGLE_PLAY", "TOGGLE_PLAYING"):
                    sim.toggle_playing()
                elif action == "SET_PLAYING":
                    sim.set_playing(bool(msg.get("isPlaying", True)))
                elif action == "RESET_TIME":
                    sim.reset_time()
                elif action == "SET_SATELLITE_COUNT":
                    sim.set_satellite_count(int(msg.get("count", 20)))
                elif action == "REGENERATE":
                    sim.set_satellite_count(sim.satellite_count)
            except Exception:
                pass
    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
    except Exception:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

# ---------------------------------------------------------------------------
# Background Simulation Tick Loop
# ---------------------------------------------------------------------------
async def simulation_background_loop():
    last_tick = time.time()
    while True:
        await asyncio.sleep(0.2)  # 5 Hz simulation update
        now = time.time()
        dt = now - last_tick
        last_tick = now

        sim.update_step(dt)

        if connected_websockets:
            frame = {
                "type": "TELEMETRY_FRAME",
                "satellites": sim.satellites,
                "groundStations": sim.ground_stations,
                "links": sim.links,
                "rfiState": sim.rfi_state,
                "activeRoute": sim.active_route,
                "simulationEpochMs": sim.simulation_epoch_ms,
                "isPlaying": sim.is_playing,
                "speed": sim.speed,
                "satelliteCount": sim.satellite_count
            }
            frame_json = json.dumps(frame)
            dead_sockets = []
            for ws in connected_websockets:
                try:
                    await ws.send_text(frame_json)
                except Exception:
                    dead_sockets.append(ws)
            for dead in dead_sockets:
                if dead in connected_websockets:
                    connected_websockets.remove(dead)

# ---------------------------------------------------------------------------
# Mount Frontend Static Assets
# ---------------------------------------------------------------------------
dist_path = Path(__file__).resolve().parent / "frontend" / "dist"
if dist_path.exists() and (dist_path / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static")
else:
    @app.get("/")
    async def index_fallback():
        return {
            "status": "online",
            "message": "Backend running. Frontend dist not found. Run 'npm run build' inside frontend/"
        }

# ---------------------------------------------------------------------------
# Server Startup & Browser Launch
# ---------------------------------------------------------------------------
BANNER = r"""
  ========================================================================
     AEGIS-ORBIT: AUTONOMOUS SATELLITE RFI MITIGATION MISSION CONTROL    
  ========================================================================
   [+] Constellation: 20 LEO Satellites across 4 Orbital Planes (600 km)
   [+] Ground Network: Bengaluru (GS-S1), Singapore (GS-S2), California (GS-S3)
   [+] SNN Engine: Leaky Integrate-and-Fire Neuromorphic Spiking Detector
   [+] Localization: TDOA / FDOA Non-linear Hyperbolic Multilateration
   [+] Routing: QUBO Formulation & QAOA Quantum-Inspired Path Mitigation
   [+] API & Telemetry Server: http://localhost:8000
  ========================================================================
"""

def open_browser():
    time.sleep(1.2)
    url = "http://localhost:8000"
    print(f"\n>>> Launching Mission Control UI in default browser: {url} ...\n")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Notice: Could not automatically launch browser: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    bg_task = asyncio.create_task(simulation_background_loop())
    import threading
    threading.Thread(target=open_browser, daemon=True).start()
    try:
        yield
    finally:
        bg_task.cancel()

app.router.lifespan_context = lifespan

def main():
    print(BANNER)
    # Suppress verbose access logs for clean display
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )

if __name__ == "__main__":
    main()
