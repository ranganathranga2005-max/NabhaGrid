import { Satellite } from '../models/satellite';
import { GroundStation } from '../models/groundStation';
import { ConstellationRoute } from '../models/route';
import { RfiState } from '../models/rfi';

export interface BackendHealthResponse {
  status: string;
  version: string;
  modules: {
    orekit: boolean;
    snn_detector: boolean;
    tdoa_localization: boolean;
    qaoa_solver: boolean;
  };
}

export class BackendClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(): Promise<BackendHealthResponse> {
    const res = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    return res.json();
  }

  async getConstellation(): Promise<Satellite[]> {
    const res = await fetch(`${this.baseUrl}/api/constellation`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Failed to fetch constellation: ${res.statusText}`);
    return res.json();
  }

  async getGroundStations(): Promise<GroundStation[]> {
    const res = await fetch(`${this.baseUrl}/api/ground-stations`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Failed to fetch ground stations: ${res.statusText}`);
    return res.json();
  }

  async getOptimizedRoute(sourceSatId: string, destGsId: string): Promise<ConstellationRoute> {
    const res = await fetch(`${this.baseUrl}/api/route?source=${sourceSatId}&dest=${destGsId}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`Failed to fetch route: ${res.statusText}`);
    return res.json();
  }

  async getRfiState(): Promise<RfiState> {
    const res = await fetch(`${this.baseUrl}/api/rfi`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Failed to fetch RFI state: ${res.statusText}`);
    return res.json();
  }

  async toggleRfi(): Promise<{ rfiActive: boolean; state: RfiState }> {
    const res = await fetch(`${this.baseUrl}/api/rfi/toggle`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Failed to toggle RFI: ${res.statusText}`);
    return res.json();
  }

  async togglePlay(): Promise<{ isPlaying: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/sim/toggle-play`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Failed to toggle play: ${res.statusText}`);
    return res.json();
  }

  async setPlaying(playing: boolean): Promise<{ isPlaying: boolean }> {
    const endpoint = playing ? '/api/sim/play' : '/api/sim/pause';
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Failed to set play state: ${res.statusText}`);
    return res.json();
  }

  async setSpeed(speed: number): Promise<{ speed: number }> {
    const res = await fetch(`${this.baseUrl}/api/sim/speed?speed=${speed}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Failed to set speed: ${res.statusText}`);
    return res.json();
  }

  async resetTime(): Promise<{ status: string; simulationEpochMs: number }> {
    const res = await fetch(`${this.baseUrl}/api/sim/reset`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`Failed to reset time: ${res.statusText}`);
    return res.json();
  }

  async setSatelliteCount(count: number): Promise<{ satelliteCount: number }> {
    const res = await fetch(`${this.baseUrl}/api/sim/satellite-count?count=${count}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Failed to set satellite count: ${res.statusText}`);
    return res.json();
  }

  async regenerate(): Promise<{ satelliteCount: number }> {
    const res = await fetch(`${this.baseUrl}/api/sim/regenerate`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Failed to regenerate: ${res.statusText}`);
    return res.json();
  }
}

export const backendClient = new BackendClient();
