import { Satellite } from '../models/satellite';
import { GroundStation } from '../models/groundStation';
import { CommunicationLink } from '../models/link';
import { EARTH_RADIUS_KM } from './orbitalSimulator';

// Atmosphere / Earth limb buffer in km
const EARTH_OCCLUSION_RADIUS_KM = EARTH_RADIUS_KM + 80.0;
const MAX_ISL_DISTANCE_KM = 4500.0;
const MAX_SGL_DISTANCE_KM = 2400.0;
const MAX_ISL_NEIGHBORS_PER_SAT = 4;

/**
 * Converts spherical lat/lon/alt to Cartesian vector (km)
 */
function toCartesian(latDeg: number, lonDeg: number, altKm: number): [number, number, number] {
  const phi = (latDeg * Math.PI) / 180.0;
  const theta = (lonDeg * Math.PI) / 180.0;
  const r = EARTH_RADIUS_KM + altKm;
  return [
    r * Math.cos(phi) * Math.cos(theta),
    r * Math.cos(phi) * Math.sin(theta),
    r * Math.sin(phi),
  ];
}

/**
 * Calculates Euclidean distance between two 3D points
 */
function distance(p1: [number, number, number], p2: [number, number, number]): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Checks if line-of-sight between two satellites is occluded by Earth limb
 */
function hasLineOfSight(p1: [number, number, number], p2: [number, number, number]): boolean {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const dz = p2[2] - p1[2];
  const segmentLengthSq = dx * dx + dy * dy + dz * dz;
  if (segmentLengthSq < 1e-6) return true;

  // Projection parameter t of Earth origin (0,0,0) onto segment p1->p2
  const dot = -(p1[0] * dx + p1[1] * dy + p1[2] * dz);
  const t = Math.max(0, Math.min(1, dot / segmentLengthSq));

  // Closest point on line segment to Earth center
  const cx = p1[0] + t * dx;
  const cy = p1[1] + t * dy;
  const cz = p1[2] + t * dz;
  const closestDistSq = cx * cx + cy * cy + cz * cz;

  return closestDistSq >= EARTH_OCCLUSION_RADIUS_KM * EARTH_OCCLUSION_RADIUS_KM;
}

/**
 * Computes elevation angle (degrees) of a satellite as observed from a ground station
 */
function computeElevationAngle(
  satPos: [number, number, number],
  gsPos: [number, number, number]
): number {
  // Vector from GS to Sat
  const rx = satPos[0] - gsPos[0];
  const ry = satPos[1] - gsPos[1];
  const rz = satPos[2] - gsPos[2];
  const slantRange = Math.sqrt(rx * rx + ry * ry + rz * rz);

  // Up vector (normal to Earth surface at GS)
  const gsR = Math.sqrt(gsPos[0] * gsPos[0] + gsPos[1] * gsPos[1] + gsPos[2] * gsPos[2]);
  const upX = gsPos[0] / gsR;
  const upY = gsPos[1] / gsR;
  const upZ = gsPos[2] / gsR;

  // Dot product of line-of-sight and local zenith
  const cosZenith = (rx * upX + ry * upY + rz * upZ) / slantRange;
  const zenithAngleRad = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const elevationDeg = 90.0 - (zenithAngleRad * 180.0) / Math.PI;

  return elevationDeg;
}

/**
 * Generates physically feasible Inter-Satellite Links (ISL) and Satellite-to-Ground Links (SGL)
 */
export function generateFeasibleLinks(
  satellites: Satellite[],
  groundStations: GroundStation[]
): {
  links: CommunicationLink[];
  updatedGroundStations: GroundStation[];
} {
  const links: CommunicationLink[] = [];
  const satPositions = new Map<string, [number, number, number]>();
  const satLinkCounts = new Map<string, number>();

  satellites.forEach((sat) => {
    satPositions.set(sat.id, toCartesian(sat.latitude, sat.longitude, sat.altitudeKm));
    satLinkCounts.set(sat.id, 0);
  });

  // 1. Inter-Satellite Links (ISL)
  // Gather all candidate pairs that satisfy LOS and max distance
  interface Candidate {
    s1: Satellite;
    s2: Satellite;
    dist: number;
  }
  const candidatePairs: Candidate[] = [];

  for (let i = 0; i < satellites.length; i++) {
    const s1 = satellites[i];
    const p1 = satPositions.get(s1.id)!;

    for (let j = i + 1; j < satellites.length; j++) {
      const s2 = satellites[j];
      const p2 = satPositions.get(s2.id)!;

      const dist = distance(p1, p2);
      if (dist <= MAX_ISL_DISTANCE_KM && hasLineOfSight(p1, p2)) {
        candidatePairs.push({ s1, s2, dist });
      }
    }
  }

  // Sort by shortest distance to prefer physically optimal links
  candidatePairs.sort((a, b) => a.dist - b.dist);

  for (const { s1, s2, dist } of candidatePairs) {
    const c1 = satLinkCounts.get(s1.id) || 0;
    const c2 = satLinkCounts.get(s2.id) || 0;

    if (c1 < MAX_ISL_NEIGHBORS_PER_SAT && c2 < MAX_ISL_NEIGHBORS_PER_SAT) {
      links.push({
        id: `ISL-${s1.id}-${s2.id}`,
        sourceId: s1.id,
        targetId: s2.id,
        linkType: 'ISL',
        distanceKm: Math.round(dist),
        sinrDb: parseFloat((18.5 - (dist / MAX_ISL_DISTANCE_KM) * 4.0).toFixed(1)),
        rfiLevel: 0.0,
        status: 'ACTIVE',
        isFeasible: true,
      });

      satLinkCounts.set(s1.id, c1 + 1);
      satLinkCounts.set(s2.id, c2 + 1);
    }
  }

  // 2. Satellite-to-Ground Links (SGL)
  const updatedGroundStations = groundStations.map((gs) => {
    const gsPos = toCartesian(gs.latitude, gs.longitude, gs.elevationMeters / 1000.0);
    const visibleSats: string[] = [];

    for (const sat of satellites) {
      const satPos = satPositions.get(sat.id)!;
      const dist = distance(gsPos, satPos);

      if (dist <= MAX_SGL_DISTANCE_KM) {
        const elevation = computeElevationAngle(satPos, gsPos);
        if (elevation >= gs.minElevationAngleDeg) {
          visibleSats.push(sat.id);
          links.push({
            id: `SGL-${sat.id}-${gs.id}`,
            sourceId: sat.id,
            targetId: gs.id,
            linkType: 'SGL',
            distanceKm: Math.round(dist),
            sinrDb: parseFloat((24.0 - (dist / MAX_SGL_DISTANCE_KM) * 8.0).toFixed(1)),
            rfiLevel: 0.0,
            status: 'ACTIVE',
            isFeasible: true,
          });
        }
      }
    }

    return {
      ...gs,
      status: visibleSats.length > 0 ? ('TRACKING' as const) : ('STANDBY' as const),
      visibleSatelliteIds: visibleSats,
    };
  });

  return { links, updatedGroundStations };
}
