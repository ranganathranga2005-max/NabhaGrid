import React from 'react';
import { Crosshair, Info } from 'lucide-react';
import { RfiState } from '../../models/rfi';

interface LocalizationPanelProps {
  rfiState: RfiState;
}

export const LocalizationPanel: React.FC<LocalizationPanelProps> = ({ rfiState }) => {
  return (
    <div className="mission-card font-mono text-xs">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crosshair size={13} style={{ color: '#00e5ff' }} />
          <span>TDOA / FDOA Localization</span>
        </div>
        <span className={`mc-badge ${rfiState.isDemoScenario ? 'mc-badge-cyan' : 'mc-badge-amber'}`} style={{ fontSize: '8.5px', padding: '1px 5px' }}>
          {rfiState.isDemoScenario ? 'DEMO ESTIMATE' : 'NOT CONNECTED'}
        </span>
      </div>

      <div className="mission-card-body" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: '6px 8px',
          borderRadius: '5px',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          background: 'rgba(8, 16, 32, 0.7)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <Info size={14} style={{ color: '#00e5ff', marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#e2e8f0' }}>
              {rfiState.isDemoScenario ? 'LOCALIZED EMITTER (DEMO)' : 'LOCALIZATION DATA: NOT AVAILABLE'}
            </div>
            <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
              {rfiState.isDemoScenario
                ? 'Mathematical TDOA/FDOA solver estimate plotted on 3D globe.'
                : 'Connect backend to receive TDOA/FDOA coordinates.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', fontSize: '9.5px', color: '#94a3b8', padding: '4px 6px', borderRadius: '4px', background: 'rgba(10, 20, 40, 0.6)' }}>
          <div>
            Estimated Location:{' '}
            <span style={{ color: rfiState.isDemoScenario ? '#38bdf8' : '#ffffff', fontWeight: 700 }}>
              {rfiState.isDemoScenario && rfiState.emitterCoordinates
                ? `${rfiState.emitterCoordinates.latitude.toFixed(2)}°N, ${rfiState.emitterCoordinates.longitude.toFixed(2)}°E`
                : '—'}
            </span>
          </div>
          <div>
            Uncertainty Radius:{' '}
            <span style={{ color: rfiState.isDemoScenario ? '#fbbf24' : '#ffffff', fontWeight: 700 }}>
              {rfiState.isDemoScenario ? `±${rfiState.uncertaintyRadiusKm} km` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
