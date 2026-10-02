import { Satellite, KeplerianElements } from '../models/satellite';
import { EARTH_RADIUS_KM, MU_EARTH_KM3_S2, propagateKeplerianOrbit, calculateOrbitalVelocity } from './orbitalSimulator';

export interface ConstellationSpec {
  totalSatellites: number;
  numPlanes: number;
  altitudeKm: number;
  inclinationDeg: number;
}

const PRESET_CONSTELLATIONS: Record<number, { numPlanes: number; inclinationDeg: number; altitudeKm: number }> = {
  10: { numPlanes: 2, inclinationDeg: 53.0, altitudeKm: 550 },
  20: { numPlanes: 4, inclinationDeg: 55.0, altitudeKm: 600 },
  30: { numPlanes: 5, inclinationDeg: 60.0, altitudeKm: 650 },
  50: { numPlanes: 5, inclinationDeg: 70.0, altitudeKm: 700 },
};

/**
 * Generates a Walker-delta like constellation with coherent Keplerian elements.
 */
export function generateConstellation(
  count: number = 20,
  referenceEpochMs: number = Date.now(),
  currentEpochMs: number = Date.now()
): Satellite[] {
  const spec = PRESET_CONSTELLATIONS[count] || {
    numPlanes: Math.max(2, Math.floor(count / 6)),
    inclinationDeg: 55.0,
    altitudeKm: 600,
  };

  const semiMajorAxisKm = EARTH_RADIUS_KM + spec.altitudeKm;
  const orbitalPeriodMinutes = (2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisKm, 3) / MU_EARTH_KM3_S2)) / 60;
  const velocityKmPerSec = calculateOrbitalVelocity(semiMajorAxisKm);
  
  const satsPerPlane = Math.ceil(count / spec.numPlanes);
  const satellites: Satellite[] = [];

  let satIndex = 1;
  for (let plane = 0; plane < spec.numPlanes && satIndex <= count; plane++) {
    // Distribute RAAN across 360 degrees
    const raanDeg = (plane * 360.0) / spec.numPlanes;
    
    // Walker phase offset between adjacent planes
    const planePhaseOffsetDeg = (plane * 360.0) / (spec.numPlanes * satsPerPlane);

    for (let s = 0; s < satsPerPlane && satIndex <= count; s++) {
      const meanAnomalyDeg = ((s * 360.0) / satsPerPlane + planePhaseOffsetDeg) % 360.0;
      
      const keplerian: KeplerianElements = {
        semiMajorAxisKm,
        eccentricity: 0.001, // Circular orbit with tiny eccentricity
        inclinationDeg: spec.inclinationDeg,
        raanDeg,
        argOfPeriapsisDeg: 0.0,
        meanAnomalyAtEpochDeg: meanAnomalyDeg,
        epochUtc: new Date(referenceEpochMs).toISOString(),
        orbitalPeriodMinutes,
      };

      const pos = propagateKeplerianOrbit(keplerian, currentEpochMs, referenceEpochMs);
      const satId = `SAT-${satIndex.toString().padStart(2, '0')}`;

      satellites.push({
        id: satId,
        name: `Node-${satIndex.toString().padStart(2, '0')}`,
        planeId: plane + 1,
        latitude: pos.latitudeDeg,
        longitude: pos.longitudeDeg,
        altitudeKm: pos.altitudeKm,
        velocityKmPerSec: parseFloat(velocityKmPerSec.toFixed(2)),
        keplerian,
        status: 'NOMINAL',
        health: 98 + ((satIndex * 7) % 3),
        rfiDetected: false,
        isPlaceholder: true,
        lastTelemetryUtc: new Date(currentEpochMs).toISOString(),
      });

      satIndex++;
    }
  }

  return satellites;
}
