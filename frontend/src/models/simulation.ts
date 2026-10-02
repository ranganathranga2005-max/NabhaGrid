export type SimulationSpeed = 1 | 10 | 100 | 1000;

export interface SimulationClock {
  currentUtcEpochMs: number;
  speed: SimulationSpeed;
  isPlaying: boolean;
  timeLabel: string;               // ISO or formatted UTC string
}

export interface BackendConnectionState {
  isConnected: boolean;
  backendUrl: string;
  isConnecting: boolean;
  lastPingMs: number | null;
  errorMessage: string | null;
  activeModules: {
    orekitEphemeris: boolean;
    snnDetection: boolean;
    tdoaLocalization: boolean;
    qaoaOptimization: boolean;
  };
}

export interface ConstellationConfig {
  satelliteCount: number;          // 10, 20, 30, 50
  numPlanes: number;
  baseAltitudeKm: number;
  inclinationDeg: number;
}
