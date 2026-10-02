import { Satellite } from '../models/satellite';
import { GroundStation } from '../models/groundStation';
import { CommunicationLink } from '../models/link';
import { ConstellationRoute } from '../models/route';
import { RfiState } from '../models/rfi';
import { SimulationSpeed } from '../models/simulation';
import { generateConstellation } from '../simulation/constellationGenerator';
import { INITIAL_GROUND_STATIONS } from '../simulation/groundStationData';
import { generateFeasibleLinks } from '../simulation/linkGenerator';
import { computeDemoRoute } from '../simulation/routeDemo';
import { propagateKeplerianOrbit } from '../simulation/orbitalSimulator';

export interface SimulationState {
  satellites: Satellite[];
  groundStations: GroundStation[];
  links: CommunicationLink[];
  activeRoute: ConstellationRoute | null;
  rfiState: RfiState;
  simulationEpochMs: number;
  referenceEpochMs: number;
  speed: SimulationSpeed;
  isPlaying: boolean;
  satelliteCount: number;
  selectedSatelliteId: string | null;
  selectedGroundStationId: string | null;
}

export type StateListener = (state: SimulationState) => void;

class MockSimulationEngine {
  private state: SimulationState;
  private listeners: Set<StateListener> = new Set();
  private animationFrameId: number | null = null;
  private lastTickMs: number = Date.now();

  constructor() {
    const now = Date.now();
    const satCount = 20;
    const initialSats = generateConstellation(satCount, now, now);
    const { links, updatedGroundStations } = generateFeasibleLinks(initialSats, INITIAL_GROUND_STATIONS);

    this.state = {
      satellites: initialSats,
      groundStations: updatedGroundStations,
      links,
      activeRoute: null,
      rfiState: {
        isAvailable: false,
        statusMessage: 'RFI DATA: NOT AVAILABLE',
        isDemoScenario: false,
        detected: false,
        confidence: null,
        detectorType: 'UNCONNECTED',
        emitterCoordinates: null,
        uncertaintyRadiusKm: null,
        affectedSatelliteIds: [],
        affectedLinkIds: [],
      },
      simulationEpochMs: now,
      referenceEpochMs: now,
      speed: 1,
      isPlaying: true,
      satelliteCount: satCount,
      selectedSatelliteId: initialSats[0]?.id || null,
      selectedGroundStationId: updatedGroundStations[0]?.id || null,
    };

    // Calculate initial demo route
    this.refreshDemoRoute();
    this.startLoop();
  }

  getState(): SimulationState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public setPlaying(playing: boolean) {
    this.state.isPlaying = playing;
    this.lastTickMs = Date.now();
    this.notify();
  }

  public setSpeed(speed: SimulationSpeed) {
    this.state.speed = speed;
    this.notify();
  }

  public resetTime() {
    const now = Date.now();
    this.state.simulationEpochMs = now;
    this.state.referenceEpochMs = now;
    this.updateOrbitPositions();
    this.notify();
  }

  public setSatelliteCount(count: number) {
    this.state.satelliteCount = count;
    this.state.satellites = generateConstellation(
      count,
      this.state.referenceEpochMs,
      this.state.simulationEpochMs
    );
    this.state.selectedSatelliteId = this.state.satellites[0]?.id || null;
    this.recomputeTopology();
  }

  public selectSatellite(id: string | null) {
    this.state.selectedSatelliteId = id;
    this.refreshDemoRoute();
    this.notify();
  }

  public selectGroundStation(id: string | null) {
    this.state.selectedGroundStationId = id;
    this.refreshDemoRoute();
    this.notify();
  }

  public toggleDemoRfiScenario() {
    const active = !this.state.rfiState.isDemoScenario;
    if (active) {
      // Pick a realistic demo emitter location (e.g. Sahara desert test region or North Atlantic)
      const emitter = { latitude: 28.5, longitude: 17.2, altitudeMeters: 450 };
      const affectedSats = this.state.satellites
        .filter((s) => {
          const dLat = s.latitude - emitter.latitude;
          const dLon = s.longitude - emitter.longitude;
          return Math.sqrt(dLat * dLat + dLon * dLon) < 18;
        })
        .map((s) => s.id);

      const affectedLinks = this.state.links
        .filter((l) => affectedSats.includes(l.sourceId) || affectedSats.includes(l.targetId))
        .map((l) => l.id);

      this.state.rfiState = {
        isAvailable: true,
        statusMessage: 'DEMO RFI SCENARIO (SYNTHETIC VISUALIZATION ONLY)',
        isDemoScenario: true,
        detected: true,
        confidence: 0.94,
        detectorType: 'SNN',
        emitterCoordinates: emitter,
        uncertaintyRadiusKm: 65.0,
        affectedSatelliteIds: affectedSats,
        affectedLinkIds: affectedLinks,
      };

      // Mark affected satellites
      this.state.satellites = this.state.satellites.map((s) => ({
        ...s,
        rfiDetected: affectedSats.includes(s.id),
        status: affectedSats.includes(s.id) ? 'RFI_DETECTED' : s.status,
      }));
    } else {
      this.state.rfiState = {
        isAvailable: false,
        statusMessage: 'RFI DATA: NOT AVAILABLE',
        isDemoScenario: false,
        detected: false,
        confidence: null,
        detectorType: 'UNCONNECTED',
        emitterCoordinates: null,
        uncertaintyRadiusKm: null,
        affectedSatelliteIds: [],
        affectedLinkIds: [],
      };

      this.state.satellites = this.state.satellites.map((s) => ({
        ...s,
        rfiDetected: false,
        status: 'NOMINAL',
      }));
    }

    this.recomputeTopology();
  }

  private startLoop() {
    const tick = () => {
      const now = Date.now();
      const elapsedWallMs = now - this.lastTickMs;
      this.lastTickMs = now;

      if (this.state.isPlaying && elapsedWallMs > 0 && elapsedWallMs < 1000) {
        const deltaSimMs = elapsedWallMs * this.state.speed;
        this.state.simulationEpochMs += deltaSimMs;
        this.updateOrbitPositions();
        this.recomputeTopology();
      }

      this.animationFrameId = requestAnimationFrame(tick);
    };

    this.lastTickMs = Date.now();
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private updateOrbitPositions() {
    const { simulationEpochMs, referenceEpochMs } = this.state;
    this.state.satellites = this.state.satellites.map((sat) => {
      const pos = propagateKeplerianOrbit(sat.keplerian, simulationEpochMs, referenceEpochMs);
      return {
        ...sat,
        latitude: pos.latitudeDeg,
        longitude: pos.longitudeDeg,
        altitudeKm: pos.altitudeKm,
        lastTelemetryUtc: new Date(simulationEpochMs).toISOString(),
      };
    });
  }

  private recomputeTopology() {
    const { links, updatedGroundStations } = generateFeasibleLinks(
      this.state.satellites,
      this.state.groundStations
    );

    // If demo RFI is active, degrade affected links
    if (this.state.rfiState.isDemoScenario) {
      const affectedIds = new Set(this.state.rfiState.affectedLinkIds);
      links.forEach((link) => {
        if (affectedIds.has(link.id)) {
          link.status = 'RFI_DEGRADED';
          link.sinrDb = Math.max(0, link.sinrDb - 12.0);
          link.rfiLevel = 0.85;
        }
      });
    }

    this.state.links = links;
    this.state.groundStations = updatedGroundStations;
    this.refreshDemoRoute();
    this.notify();
  }

  public refreshDemoRoute() {
    const sourceId = this.state.selectedSatelliteId || this.state.satellites[0]?.id;
    const destId = this.state.selectedGroundStationId || this.state.groundStations[0]?.id;

    if (sourceId && destId) {
      this.state.activeRoute = computeDemoRoute(sourceId, destId, this.state.links);
    } else {
      this.state.activeRoute = null;
    }
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

export const mockSimulation = new MockSimulationEngine();
