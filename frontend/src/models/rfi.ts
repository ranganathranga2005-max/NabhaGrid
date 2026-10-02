export type DetectorType = 'SNN' | 'CNN' | 'UNCONNECTED';

export interface RfiObservation {
  satelliteId: string;
  timestampUtc: string;
  snrDb: number;
  frequencyHz: number;
  carrierBand: string;
}

export interface RfiState {
  isAvailable: boolean;            // False when backend is not connected
  statusMessage: string;           // e.g. "RFI DATA: NOT AVAILABLE" or "DEMO RFI SCENARIO ACTIVE"
  isDemoScenario: boolean;         // True if user enabled visual testing demo
  detected: boolean;
  confidence: number | null;       // null when backend not connected
  detectorType: DetectorType;
  emitterCoordinates: {
    latitude: number;
    longitude: number;
    altitudeMeters: number;
  } | null;
  uncertaintyRadiusKm: number | null;
  affectedSatelliteIds: string[];
  affectedLinkIds: string[];
}
