import React, { useState } from 'react';
import { Satellite as SatIcon, Radio, Link2, Server } from 'lucide-react';
import { SatellitePanel } from './SatellitePanel';
import { GroundStationPanel } from './GroundStationPanel';
import { LinkInfoPanel } from './LinkInfoPanel';
import { BackendStatus } from './BackendStatus';
import { Satellite } from '../../models/satellite';
import { GroundStation } from '../../models/groundStation';
import { CommunicationLink } from '../../models/link';

interface RightDeckProps {
  satellites: Satellite[];
  groundStations: GroundStation[];
  links: CommunicationLink[];
  selectedSatelliteId: string | null;
  selectedGroundStationId: string | null;
  selectedLink: CommunicationLink | null;
  isBackendConnected: boolean;
  onSelectSatellite: (id: string) => void;
  onSelectGroundStation: (id: string) => void;
  onConnectionChange: (connected: boolean) => void;
}

export const RightDeck: React.FC<RightDeckProps> = ({
  satellites,
  groundStations,
  links,
  selectedSatelliteId,
  selectedGroundStationId,
  selectedLink,
  isBackendConnected,
  onSelectSatellite,
  onSelectGroundStation,
  onConnectionChange,
}) => {
  const [activeTab, setActiveTab] = useState<'SATELLITES' | 'GROUND_STATIONS' | 'LINKS' | 'BACKEND'>('SATELLITES');

  return (
    <div className="mc-right-deck">
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
            onClick={() => setActiveTab('SATELLITES')}
            className={`mc-btn ${activeTab === 'SATELLITES' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1, padding: '5px 4px', fontSize: '10px', gap: '3px' }}
          >
            <SatIcon size={11} />
            <span>Satellites</span>
          </button>

          <button
            onClick={() => setActiveTab('GROUND_STATIONS')}
            className={`mc-btn ${activeTab === 'GROUND_STATIONS' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1.2, padding: '5px 4px', fontSize: '10px', gap: '3px' }}
          >
            <Radio size={11} />
            <span>Ground Stations</span>
          </button>

          <button
            onClick={() => setActiveTab('LINKS')}
            className={`mc-btn ${activeTab === 'LINKS' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1, padding: '5px 4px', fontSize: '10px', gap: '3px' }}
          >
            <Link2 size={11} />
            <span>Links</span>
          </button>

          <button
            onClick={() => setActiveTab('BACKEND')}
            className={`mc-btn ${activeTab === 'BACKEND' ? 'mc-btn-primary' : ''}`}
            style={{ flex: 1, padding: '5px 4px', fontSize: '10px', gap: '3px' }}
          >
            <Server size={11} />
            <span>Backend</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {activeTab === 'SATELLITES' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
              <SatellitePanel
                satellites={satellites}
                selectedSatelliteId={selectedSatelliteId}
                onSelectSatellite={onSelectSatellite}
              />
            </div>
          )}

          {activeTab === 'GROUND_STATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
              <GroundStationPanel
                groundStations={groundStations}
                selectedGroundStationId={selectedGroundStationId}
                onSelectGroundStation={onSelectGroundStation}
              />

              {/* Detailed Station Card for Selected Station */}
              {selectedGroundStationId && (
                <div className="font-mono text-xs" style={{ padding: '8px', borderRadius: '6px', background: 'rgba(10, 20, 40, 0.7)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
                    {selectedGroundStationId} Detailed Telemetry
                  </div>
                  {(() => {
                    const gs = groundStations.find((g) => g.id === selectedGroundStationId);
                    if (!gs) return null;
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '10px', color: '#94a3b8' }}>
                        <div>Station Name: <span style={{ color: '#fff' }}>{gs.name}</span></div>
                        <div>Elevation: <span style={{ color: '#38bdf8' }}>{gs.elevationMeters} m MSL</span></div>
                        <div>Min Horizon Mask: <span style={{ color: '#fbbf24' }}>{gs.minElevationAngleDeg}°</span></div>
                        <div>Visible Passes: <span style={{ color: '#10b981', fontWeight: 700 }}>{gs.visibleSatelliteIds.length} SATS</span></div>
                        <div style={{ gridColumn: 'span 2', color: '#cbd5e1', marginTop: '2px' }}>
                          In-View Nodes: <span style={{ color: '#00e5ff' }}>{gs.visibleSatelliteIds.join(', ') || 'None within horizon'}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'LINKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <LinkInfoPanel selectedLink={selectedLink} />

              <div className="font-mono text-xs" style={{ padding: '8px', borderRadius: '6px', background: 'rgba(8, 16, 32, 0.7)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <div style={{ fontSize: '10px', color: '#00e5ff', fontWeight: 700, marginBottom: '4px' }}>
                  Constellation Link Graph Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '9.5px', color: '#94a3b8' }}>
                  <div>Total Active Links: <span style={{ color: '#fff', fontWeight: 700 }}>{links.length}</span></div>
                  <div>Inter-Satellite (ISL): <span style={{ color: '#00e5ff', fontWeight: 700 }}>{links.filter((l) => l.linkType === 'ISL').length}</span></div>
                  <div>Sat-to-Ground (SGL): <span style={{ color: '#10b981', fontWeight: 700 }}>{links.filter((l) => l.linkType === 'SGL').length}</span></div>
                  <div>RFI Degraded: <span style={{ color: '#ef4444', fontWeight: 700 }}>{links.filter((l) => l.status === 'RFI_DEGRADED').length}</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'BACKEND' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <BackendStatus
                isBackendConnected={isBackendConnected}
                onConnectionChange={onConnectionChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
