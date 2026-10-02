import { GroundStation } from '../models/groundStation';

export const INITIAL_GROUND_STATIONS: GroundStation[] = [
  {
    id: 'GS-S1',
    name: 'Bengaluru Station',
    locationName: 'Bengaluru, India',
    latitude: 12.97,
    longitude: 77.59,
    elevationMeters: 920,
    minElevationAngleDeg: 10.0,
    status: 'ONLINE',
    visibleSatelliteIds: [],
  },
  {
    id: 'GS-S2',
    name: 'Singapore Station',
    locationName: 'Singapore',
    latitude: 1.35,
    longitude: 103.82,
    elevationMeters: 15,
    minElevationAngleDeg: 10.0,
    status: 'ONLINE',
    visibleSatelliteIds: [],
  },
  {
    id: 'GS-S3',
    name: 'California Station',
    locationName: 'California, USA',
    latitude: 34.05,
    longitude: -118.24,
    elevationMeters: 140,
    minElevationAngleDeg: 10.0,
    status: 'ONLINE',
    visibleSatelliteIds: [],
  },
];
