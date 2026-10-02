import React, { useEffect, useState } from 'react';
import { CesiumGlobe } from './components/Globe/CesiumGlobe';
import { Header } from './components/Dashboard/Header';
import { LeftDeck } from './components/Dashboard/LeftDeck';
import { RightDeck } from './components/Dashboard/RightDeck';
import { BottomViews } from './components/Visualization/BottomViews';
import { mockSimulation, SimulationState } from './services/mockSimulation';
import { SimulationSpeed } from './models/simulation';

import { backendClient } from './services/backendClient';
import { websocketClient } from './services/websocketClient';

export const App: React.FC = () => {
  const [simState, setSimState] = useState<SimulationState>(mockSimulation.getState());
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);

  // Layer Visibility Toggles
  const [orbitType, setOrbitType] = useState<string>('Random LEO (Demo)');
  const [showSatellites, setShowSatellites] = useState<boolean>(true);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showGroundStations, setShowGroundStations] = useState<boolean>(true);
  const [showLinks, setShowLinks] = useState<boolean>(true);
  const [showRfiRegion, setShowRfiRegion] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Subscribe to simulation engine ticks (fallback / base)
  useEffect(() => {
    const unsubscribe = mockSimulation.subscribe((state) => {
      // Only drive state from mock engine if backend is not connected
      if (!isBackendConnected) {
        setSimState({ ...state });
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isBackendConnected]);

  // Attempt connection to Python backend on mount
  useEffect(() => {
    let wsCleanup: (() => void) | null = null;
    let wsStatusCleanup: (() => void) | null = null;

    const connectToBackend = async () => {
      try {
        await backendClient.checkHealth();
        setIsBackendConnected(true);
        websocketClient.connect();

        wsCleanup = websocketClient.onTelemetry((data: any) => {
          if (data && data.type === 'TELEMETRY_FRAME') {
            setSimState((prev) => ({
              ...prev,
              satellites: data.satellites || prev.satellites,
              groundStations: data.groundStations || prev.groundStations,
              links: data.links || prev.links,
              rfiState: data.rfiState || prev.rfiState,
              activeRoute: data.activeRoute !== undefined ? data.activeRoute : prev.activeRoute,
              simulationEpochMs: data.simulationEpochMs || prev.simulationEpochMs,
              satelliteCount: data.satelliteCount !== undefined ? data.satelliteCount : (data.satellites ? data.satellites.length : prev.satelliteCount),
              isPlaying: data.isPlaying !== undefined ? data.isPlaying : prev.isPlaying,
              speed: data.speed !== undefined ? data.speed : prev.speed,
            }));
          }
        });

        wsStatusCleanup = websocketClient.onStatusChange((status) => {
          setIsBackendConnected(status === 'CONNECTED');
        });
      } catch {
        setIsBackendConnected(false);
      }
    };

    connectToBackend();

    return () => {
      if (wsCleanup) wsCleanup();
      if (wsStatusCleanup) wsStatusCleanup();
      websocketClient.disconnect();
    };
  }, []);

  // Handlers - Fast optimistic local update + immediate WebSocket and REST dispatch
  const handleTogglePlay = async () => {
    const nextPlaying = !simState.isPlaying;
    setSimState((prev) => ({ ...prev, isPlaying: nextPlaying }));
    mockSimulation.setPlaying(nextPlaying);
    if (isBackendConnected) {
      websocketClient.sendCommand('SET_PLAYING', { isPlaying: nextPlaying });
      backendClient.setPlaying(nextPlaying).catch(() => {});
    }
  };

  const handleSetSpeed = async (speed: SimulationSpeed) => {
    setSimState((prev) => ({ ...prev, speed }));
    mockSimulation.setSpeed(speed);
    if (isBackendConnected) {
      websocketClient.sendCommand('SET_SPEED', { speed });
      backendClient.setSpeed(speed).catch(() => {});
    }
  };

  const handleResetTime = async () => {
    mockSimulation.resetTime();
    setSimState((prev) => ({ ...prev, simulationEpochMs: Date.now() }));
    if (isBackendConnected) {
      websocketClient.sendCommand('RESET_TIME');
      backendClient.resetTime().catch(() => {});
    }
  };

  const handleRegenerate = async () => {
    mockSimulation.setSatelliteCount(simState.satelliteCount);
    if (isBackendConnected) {
      websocketClient.sendCommand('REGENERATE');
      backendClient.regenerate().catch(() => {});
    }
  };

  const handleSetSatelliteCount = async (count: number) => {
    setSimState((prev) => ({ ...prev, satelliteCount: count }));
    mockSimulation.setSatelliteCount(count);
    if (isBackendConnected) {
      websocketClient.sendCommand('SET_SATELLITE_COUNT', { count });
      backendClient.setSatelliteCount(count).catch(() => {});
    }
  };

  const handleSelectSatellite = (id: string | null) => {
    mockSimulation.selectSatellite(id);
    setSimState((prev) => ({ ...prev, selectedSatelliteId: id }));
    if (isBackendConnected && id && simState.selectedGroundStationId) {
      backendClient.getOptimizedRoute(id, simState.selectedGroundStationId)
        .then((route) => {
          setSimState((prev) => ({ ...prev, activeRoute: route }));
        })
        .catch(() => {});
    }
  };

  const handleSelectGroundStation = (id: string | null) => {
    mockSimulation.selectGroundStation(id);
    setSimState((prev) => ({ ...prev, selectedGroundStationId: id }));
    if (isBackendConnected && id && simState.selectedSatelliteId) {
      backendClient.getOptimizedRoute(simState.selectedSatelliteId, id)
        .then((route) => {
          setSimState((prev) => ({ ...prev, activeRoute: route }));
        })
        .catch(() => {});
    }
  };

  const handleToggleDemoRfi = async () => {
    mockSimulation.toggleDemoRfiScenario();
    if (isBackendConnected) {
      websocketClient.sendCommand('TOGGLE_RFI');
      backendClient.toggleRfi().catch(() => {});
    }
  };

  // Find currently selected link if any
  const selectedLink = simState.links.find(
    (l) => l.sourceId === simState.selectedSatelliteId || l.targetId === simState.selectedSatelliteId
  ) || simState.links[0] || null;

  return (
    <div className="mc-app">
      {/* Top Mission Control Header */}
      <Header
        simulationEpochMs={simState.simulationEpochMs}
        speed={simState.speed}
        isPlaying={simState.isPlaying}
        satelliteCount={simState.satellites.length}
        activeLinkCount={simState.links.length}
        isBackendConnected={isBackendConnected}
        onTogglePlay={handleTogglePlay}
        onSetSpeed={handleSetSpeed}
      />

      {/* Main Mission Control Center Viewport */}
      <div className="mc-viewport">
        {/* Full 3D Cesium Earth Globe */}
        <div className="mc-globe-container">
          <CesiumGlobe
            satellites={simState.satellites}
            groundStations={simState.groundStations}
            links={simState.links}
            activeRoute={simState.activeRoute}
            rfiState={simState.rfiState}
            simulationEpochMs={simState.simulationEpochMs}
            referenceEpochMs={simState.referenceEpochMs}
            selectedSatelliteId={simState.selectedSatelliteId}
            selectedGroundStationId={simState.selectedGroundStationId}
            onSelectSatellite={handleSelectSatellite}
            onSelectGroundStation={handleSelectGroundStation}
            showSatellites={showSatellites}
            showOrbits={showOrbits}
            showGroundStations={showGroundStations}
            showLinks={showLinks}
            showRfiRegion={showRfiRegion}
            showLabels={showLabels}
          />
        </div>

        {/* Tabbed Left Control Deck (Controls / RFI & Solver / QAOA Route) */}
        <LeftDeck
          isPlaying={simState.isPlaying}
          speed={simState.speed}
          satelliteCount={simState.satelliteCount}
          orbitType={orbitType}
          showSatellites={showSatellites}
          showOrbits={showOrbits}
          showGroundStations={showGroundStations}
          showLinks={showLinks}
          showRfiRegion={showRfiRegion}
          showLabels={showLabels}
          rfiState={simState.rfiState}
          activeRoute={simState.activeRoute}
          satellites={simState.satellites}
          groundStations={simState.groundStations}
          selectedSourceSatId={simState.selectedSatelliteId}
          selectedDestGsId={simState.selectedGroundStationId}
          onTogglePlay={handleTogglePlay}
          onSetSpeed={handleSetSpeed}
          onResetTime={handleResetTime}
          onRegenerate={handleRegenerate}
          onSetSatelliteCount={handleSetSatelliteCount}
          onSetOrbitType={setOrbitType}
          onToggleSatellites={() => setShowSatellites(!showSatellites)}
          onToggleOrbits={() => setShowOrbits(!showOrbits)}
          onToggleGroundStations={() => setShowGroundStations(!showGroundStations)}
          onToggleLinks={() => setShowLinks(!showLinks)}
          onToggleRfiRegion={() => setShowRfiRegion(!showRfiRegion)}
          onToggleLabels={() => setShowLabels(!showLabels)}
          onToggleDemoRfi={handleToggleDemoRfi}
          onSelectSource={handleSelectSatellite}
          onSelectDest={handleSelectGroundStation}
        />

        {/* Tabbed Right Telemetry Deck (Satellites / Ground Stations / Links / Backend) */}
        <RightDeck
          satellites={simState.satellites}
          groundStations={simState.groundStations}
          links={simState.links}
          selectedSatelliteId={simState.selectedSatelliteId}
          selectedGroundStationId={simState.selectedGroundStationId}
          selectedLink={selectedLink}
          isBackendConnected={isBackendConnected}
          onSelectSatellite={handleSelectSatellite}
          onSelectGroundStation={handleSelectGroundStation}
          onConnectionChange={setIsBackendConnected}
        />

        {/* Collapsible Bottom Supporting Views (2D World Map, Day/Night Earth, Route View, Legend) */}
        <BottomViews
          satellites={simState.satellites}
          groundStations={simState.groundStations}
          activeRoute={simState.activeRoute}
        />
      </div>
    </div>
  );
};

export default App;
