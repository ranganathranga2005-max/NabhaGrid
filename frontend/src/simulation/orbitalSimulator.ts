import { KeplerianElements, Satellite } from '../models/satellite';

// Physical Constants (WGS84 Earth)
export const EARTH_RADIUS_KM = 6378.137;
export const MU_EARTH_KM3_S2 = 398600.4418; // Standard gravitational parameter
export const EARTH_ROTATION_RAD_PER_SEC = 7.292115e-5; // WGS84 sidereal rotation rate

export interface Position3D {
  xKm: number;
  yKm: number;
  zKm: number;
  latitudeDeg: number;
  longitudeDeg: number;
  altitudeKm: number;
}

/**
 * Computes instantaneous satellite position in ECEF frame (WGS84 coordinates)
 * using Keplerian orbital mechanics.
 */
export function propagateKeplerianOrbit(
  keplerian: KeplerianElements,
  epochMs: number,
  referenceEpochMs: number
): Position3D {
  const deltaSec = (epochMs - referenceEpochMs) / 1000.0;
  const a = keplerian.semiMajorAxisKm;
  
  // Mean motion (rad/sec)
  const n = Math.sqrt(MU_EARTH_KM3_S2 / Math.pow(a, 3));
  
  // Mean anomaly at time t
  const m0Rad = (keplerian.meanAnomalyAtEpochDeg * Math.PI) / 180.0;
  let mRad = (m0Rad + n * deltaSec) % (2 * Math.PI);
  if (mRad < 0) mRad += 2 * Math.PI;

  // For near-circular orbits (e ~ 0), true anomaly nu ~ mean anomaly M
  // If eccentricity > 0, solve Kepler's equation with Newton-Raphson
  let nuRad = mRad;
  const e = keplerian.eccentricity;
  if (e > 0.0001) {
    let E = mRad;
    for (let iter = 0; iter < 5; iter++) {
      E = E - (E - e * Math.sin(E) - mRad) / (1 - e * Math.cos(E));
    }
    nuRad = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  }

  // Argument of latitude theta = nu + omega
  const omegaRad = (keplerian.argOfPeriapsisDeg * Math.PI) / 180.0;
  const thetaRad = nuRad + omegaRad;

  // Distance from Earth center
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(nuRad));

  // Orbital angles
  const incRad = (keplerian.inclinationDeg * Math.PI) / 180.0;
  const raanRad = (keplerian.raanDeg * Math.PI) / 180.0;

  // ECI coordinates (Earth-Centered Inertial)
  const xEci = r * (Math.cos(raanRad) * Math.cos(thetaRad) - Math.sin(raanRad) * Math.sin(thetaRad) * Math.cos(incRad));
  const yEci = r * (Math.sin(raanRad) * Math.cos(thetaRad) + Math.cos(raanRad) * Math.sin(thetaRad) * Math.cos(incRad));
  const zEci = r * (Math.sin(thetaRad) * Math.sin(incRad));

  // Earth rotation angle (sidereal rotation)
  const gmstRad = (EARTH_ROTATION_RAD_PER_SEC * deltaSec) % (2 * Math.PI);

  // ECEF coordinates (Earth-Centered Earth-Fixed)
  const xEcef = xEci * Math.cos(gmstRad) + yEci * Math.sin(gmstRad);
  const yEcef = -xEci * Math.sin(gmstRad) + yEci * Math.cos(gmstRad);
  const zEcef = zEci;

  // Spherical/Geodetic conversion
  const rXy = Math.sqrt(xEcef * xEcef + yEcef * yEcef);
  const latitudeDeg = (Math.atan2(zEcef, rXy) * 180.0) / Math.PI;
  let longitudeDeg = (Math.atan2(yEcef, xEcef) * 180.0) / Math.PI;
  if (longitudeDeg > 180) longitudeDeg -= 360;
  if (longitudeDeg < -180) longitudeDeg += 360;

  const altitudeKm = Math.sqrt(xEcef * xEcef + yEcef * yEcef + zEcef * zEcef) - EARTH_RADIUS_KM;

  return {
    xKm: xEcef,
    yKm: yEcef,
    zKm: zEcef,
    latitudeDeg,
    longitudeDeg,
    altitudeKm: Math.max(0, altitudeKm),
  };
}

/**
 * Generates an array of 3D Cartographic points along one full orbital period
 * to render a smooth 3D orbit line in Cesium.
 */
export function generateOrbitPathPoints(
  keplerian: KeplerianElements,
  epochMs: number,
  referenceEpochMs: number,
  numSamples: number = 72
): Array<{ longitude: number; latitude: number; altitude: number }> {
  const points: Array<{ longitude: number; latitude: number; altitude: number }> = [];
  const periodSec = keplerian.orbitalPeriodMinutes * 60;
  const stepSec = periodSec / numSamples;
  
  for (let i = 0; i <= numSamples; i++) {
    const sampleEpochMs = epochMs + i * stepSec * 1000;
    const pos = propagateKeplerianOrbit(keplerian, sampleEpochMs, referenceEpochMs);
    points.push({
      longitude: pos.longitudeDeg,
      latitude: pos.latitudeDeg,
      altitude: pos.altitudeKm * 1000, // meters for Cesium
    });
  }
  return points;
}

/**
 * Calculates orbital velocity for a given semi-major axis.
 */
export function calculateOrbitalVelocity(semiMajorAxisKm: number): number {
  return Math.sqrt(MU_EARTH_KM3_S2 / semiMajorAxisKm);
}
