export type SatelliteStatus = 'NOMINAL' | 'RFI_DETECTED' | 'DEGRADED' | 'MAINTENANCE';

export interface KeplerianElements {
  semiMajorAxisKm: number;    // Orbit radius (e.g. Earth radius ~6378 km + 500-1200 km)
  eccentricity: number;        // Circular ~0.0 or near-circular
  inclinationDeg: number;      // e.g. 53°, 85°, 97°
  raanDeg: number;             // Right Ascension of Ascending Node (0-360°)
  argOfPeriapsisDeg: number;   // Argument of periapsis (0-360°)
  meanAnomalyAtEpochDeg: number; // M0 (0-360°)
  epochUtc: string;            // Reference epoch (ISO 8601)
  orbitalPeriodMinutes: number; // T
}

export interface Satellite {
  id: string;                  // e.g. "SAT-01"
  name: string;                // e.g. "Aegis-Alpha 01"
  planeId: number;             // Orbital plane index (1..P)
  latitude: number;            // Current WGS84 latitude (-90 to +90)
  longitude: number;           // Current WGS84 longitude (-180 to +180)
  altitudeKm: number;          // Current altitude in km
  velocityKmPerSec: number;    // Orbital velocity (~7.5-7.8 km/s in LEO)
  keplerian: KeplerianElements;
  status: SatelliteStatus;
  health: number;              // 0-100%
  rfiDetected: boolean;        // Active RFI flag
  isPlaceholder: boolean;      // Always true for frontend simulation
  lastTelemetryUtc: string;
}
