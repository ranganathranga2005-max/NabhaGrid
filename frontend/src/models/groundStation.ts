export type GroundStationStatus = 'ONLINE' | 'TRACKING' | 'STANDBY' | 'MAINTENANCE';

export interface GroundStation {
  id: string;                  // e.g. "GS-SGS"
  name: string;                // e.g. "Svalbard Satellite Station (SGS)"
  locationName: string;        // e.g. "Svalbard, Norway"
  latitude: number;            // WGS84 latitude
  longitude: number;           // WGS84 longitude
  elevationMeters: number;     // Above mean sea level
  minElevationAngleDeg: number;// Minimum horizon mask angle (typically 10-15°)
  status: GroundStationStatus;
  visibleSatelliteIds: string[]; // Satellites currently passing within LOS horizon
}
