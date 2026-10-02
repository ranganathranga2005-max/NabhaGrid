import React from 'react';
import { ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import { RfiState } from '../../models/rfi';

interface RfiPanelProps {
  rfiState: RfiState;
  onToggleDemoRfi: () => void;
}

export const RfiPanel: React.FC<RfiPanelProps> = ({ rfiState, onToggleDemoRfi }) => {
  const isAlert = rfiState.detected || rfiState.isDemoScenario;

  return (
    <div className="mission-card font-mono text-xs">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={13} style={{ color: isAlert ? '#ef4444' : '#10b981' }} />
          <span>SNN RFI Detection</span>
        </div>
        <span className={`mc-badge ${isAlert ? 'mc-badge-red' : 'mc-badge-emerald'}`} style={{ fontSize: '8.5px', padding: '1px 5px' }}>
          {isAlert ? 'RFI DETECTED' : 'SPECTRUM NOMINAL'}
        </span>
      </div>

      <div className="mission-card-body" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Warning / Status Box */}
        <div style={{
          padding: '8px 10px',
          borderRadius: '5px',
          border: isAlert ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.3)',
          background: isAlert ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.08)',
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={15} style={{ color: isAlert ? '#ef4444' : '#10b981', marginTop: '1px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: isAlert ? '#fca5a5' : '#34d399' }}>
              {isAlert ? 'HIGH RFI INTERFERENCE DETECTED' : 'RF SPECTRUM NOMINAL & STABLE'}
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
              {isAlert
                ? 'SNN spike rate exceeded 1.2 LIF threshold. Multi-path multilateration active.'
                : 'Constellation monitoring nominal. Click below to inject synthetic RFI test signal.'}
            </div>
          </div>
        </div>

        {/* SNN Detector Slot */}
        <div style={{ padding: '6px 8px', borderRadius: '5px', background: 'rgba(10, 20, 40, 0.6)', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '9.5px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Zap size={10} style={{ color: '#00e5ff' }} />
              <span>SNN Detector (LIF Neuromorphic)</span>
            </span>
            <span className="mc-badge mc-badge-cyan" style={{ fontSize: '8px', padding: '0 4px' }}>ONLINE</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '9.5px', color: '#94a3b8' }}>
            <div>
              Status: <span style={{ color: isAlert ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                {isAlert ? 'ALERT' : 'NOMINAL'}
              </span>
            </div>
            <div>
              Confidence: <span style={{ color: isAlert ? '#f59e0b' : '#38bdf8', fontWeight: 700 }}>
                {isAlert ? '95.2%' : '100%'}
              </span>
            </div>
            <div>
              Affected Sats: <span style={{ color: isAlert ? '#ef4444' : '#94a3b8', fontWeight: 700 }}>
                {isAlert ? `${rfiState.affectedSatelliteIds.length || 2}` : '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Demo Toggle */}
        <button
          onClick={onToggleDemoRfi}
          className={`mc-btn ${isAlert ? 'mc-btn-danger' : 'mc-btn-primary'}`}
          style={{ width: '100%', padding: '7px 10px', fontSize: '11px', fontWeight: 700, marginTop: '2px' }}
        >
          {isAlert ? 'Clear RFI Scenario' : 'Inject Synthetic RFI Signal'}
        </button>
      </div>
    </div>
  );
};
