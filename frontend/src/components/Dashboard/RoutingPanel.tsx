import React from 'react';
import { GitCommit, ArrowRight } from 'lucide-react';
import { ConstellationRoute } from '../../models/route';
import { Satellite } from '../../models/satellite';
import { GroundStation } from '../../models/groundStation';

interface RoutingPanelProps {
  route: ConstellationRoute | null;
  satellites: Satellite[];
  groundStations: GroundStation[];
  selectedSourceSatId: string | null;
  selectedDestGsId: string | null;
  onSelectSource: (satId: string) => void;
  onSelectDest: (gsId: string) => void;
}

export const RoutingPanel: React.FC<RoutingPanelProps> = ({
  route,
  satellites,
  groundStations,
  selectedSourceSatId,
  selectedDestGsId,
  onSelectSource,
  onSelectDest,
}) => {
  return (
    <div className="mission-card font-mono text-xs">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GitCommit size={13} style={{ color: '#00e5ff' }} />
          <span>QUBO / QAOA Routing</span>
        </div>
        <span className="mc-badge mc-badge-purple" style={{ fontSize: '8.5px', padding: '1px 5px' }}>
          DEMO ROUTE
        </span>
      </div>

      <div className="mission-card-body" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Source & Destination Endpoints Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
              Source Satellite
            </label>
            <select
              value={selectedSourceSatId || ''}
              onChange={(e) => onSelectSource(e.target.value)}
              className="mc-select"
              style={{ width: '100%', padding: '3px 6px', fontSize: '10px' }}
            >
              {satellites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '9px', color: '#94a3b8', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>
              Destination Ground Station
            </label>
            <select
              value={selectedDestGsId || ''}
              onChange={(e) => onSelectDest(e.target.value)}
              className="mc-select"
              style={{ width: '100%', padding: '3px 6px', fontSize: '10px' }}
            >
              {groundStations.map((gs) => (
                <option key={gs.id} value={gs.id}>
                  {gs.id} ({gs.name.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Demo Route Sequence */}
        <div style={{ padding: '6px 8px', borderRadius: '5px', background: 'rgba(8, 16, 32, 0.7)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
          <div style={{ fontSize: '9.5px', color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}>
            Demo Route (Shortest Feasible Path)
          </div>

          {route ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '10px' }}>
              {route.nodeSequence.map((node, i) => (
                <React.Fragment key={node}>
                  <span style={{
                    fontWeight: 700,
                    color: node.startsWith('SAT') ? '#38bdf8' : '#10b981',
                    background: node.startsWith('SAT') ? 'rgba(0, 229, 255, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    border: node.startsWith('SAT') ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    {node}
                  </span>
                  {i < route.nodeSequence.length - 1 && (
                    <ArrowRight size={10} style={{ color: '#10b981' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '9.5px' }}>
              SAT-01 → SAT-04 → SAT-11 → GS-S1
            </div>
          )}

          <div style={{ fontSize: '8.5px', color: '#94a3b8', marginTop: '5px', lineHeight: '1.3' }}>
            This is a demo route based on current simulated links. QAOA backend not connected.
          </div>
        </div>
      </div>
    </div>
  );
};
