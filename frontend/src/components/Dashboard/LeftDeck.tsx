import React, { useState } from 'react';
import { Sliders, ShieldAlert, GitCommit } from 'lucide-react';
import { SimulationControls } from './SimulationControls';
import { RfiPanel } from './RfiPanel';
import { LocalizationPanel } from './LocalizationPanel';
import { RoutingPanel } from './RoutingPanel';
import { SimulationSpeed } from '../../models/simulation';
import { RfiState } from '../../models/rfi';
import { ConstellationRoute } from '../../models/route';
import { Satellite } from '../../models/satellite';
import { GroundStation } from '../../models/groundStation';

interface LeftDeckProps {
  isPlaying: boolean;
  speed: SimulationSpeed;
  satelliteCount: number;
  orbitType: string;
  showSatellites: boolean;
  showOrbits: boolean;
  showGroundStations: boolean;
  showLinks: boolean;
  showRfiRegion: boolean;
  showLabels: boolean;
  rfiState: RfiState;
  activeRoute: ConstellationRoute | null;
  satellites: Satellite[];
  groundStations: GroundStation[];
  selectedSourceSatId: string | null;
  selectedDestGsId: string | null;
  onTogglePlay: () => void;
  onSetSpeed: (speed: SimulationSpeed) => void;
  onResetTime: () => void;
  onRegenerate: () => void;
  onSetSatelliteCount: (count: number) => void;
  onSetOrbitType: (type: string) => void;
  onToggleSatellites: () => void;
  onToggleOrbits: () => void;
  onToggleGroundStations: () => void;
  onToggleLinks: () => void;
  onToggleRfiRegion: () => void;
  onToggleLabels: () => void;
  onToggleDemoRfi: () => void;
  onSelectSource: (satId: string) => void;
  onSelectDest: (gsId: string) => void;
}

export const LeftDeck: React.FC<LeftDeckProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'RFI' | 'ROUTING'>('CONTROLS');

  return (
    <div className="mc-left-deck">
      <div className="mission-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', pointerEvents: 'auto' }}>
        {/* Navigation Tabs Header */}
        <div style={{
          display: 'flex',
          background: 'linear-gradient(180deg, rgba(14, 28, 56, 0.9) 0%, rgba(8, 16, 34, 0.8) 100%)',
          borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
          padding: '4px 6px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`mc-btn ${activeTab === 'CONTROLS' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1, padding: '5px 4px', fontSize: '10px', gap: '4px' }}
          >
            <Sliders size={11} />
            <span>Controls</span>
          </button>

          <button
            onClick={() => setActiveTab('RFI')}
            className={`mc-btn ${activeTab === 'RFI' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1.1, padding: '5px 4px', fontSize: '10px', gap: '4px' }}
          >
            <ShieldAlert size={11} />
            <span>RFI &amp; Solver</span>
          </button>

          <button
            onClick={() => setActiveTab('ROUTING')}
            className={`mc-btn ${activeTab === 'ROUTING' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1, padding: '5px 4px', fontSize: '10px', gap: '4px' }}
          >
            <GitCommit size={11} />
            <span>QAOA Route</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {activeTab === 'CONTROLS' && (
            <SimulationControls
              isPlaying={props.isPlaying}
              speed={props.speed}
              satelliteCount={props.satelliteCount}
              orbitType={props.orbitType}
              showSatellites={props.showSatellites}
              showOrbits={props.showOrbits}
              showGroundStations={props.showGroundStations}
              showLinks={props.showLinks}
              showRfiRegion={props.showRfiRegion}
              showLabels={props.showLabels}
              onTogglePlay={props.onTogglePlay}
              onSetSpeed={props.onSetSpeed}
              onResetTime={props.onResetTime}
              onRegenerate={props.onRegenerate}
              onSetSatelliteCount={props.onSetSatelliteCount}
              onSetOrbitType={props.onSetOrbitType}
              onToggleSatellites={props.onToggleSatellites}
              onToggleOrbits={props.onToggleOrbits}
              onToggleGroundStations={props.onToggleGroundStations}
              onToggleLinks={props.onToggleLinks}
              onToggleRfiRegion={props.onToggleRfiRegion}
              onToggleLabels={props.onToggleLabels}
            />
          )}

          {activeTab === 'RFI' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <RfiPanel
                rfiState={props.rfiState}
                onToggleDemoRfi={props.onToggleDemoRfi}
              />
              <LocalizationPanel rfiState={props.rfiState} />
            </div>
          )}

          {activeTab === 'ROUTING' && (
            <RoutingPanel
              route={props.activeRoute}
              satellites={props.satellites}
              groundStations={props.groundStations}
              selectedSourceSatId={props.selectedSourceSatId}
              selectedDestGsId={props.selectedDestGsId}
              onSelectSource={props.onSelectSource}
              onSelectDest={props.onSelectDest}
            />
          )}
        </div>
      </div>
    </div>
  );
};
