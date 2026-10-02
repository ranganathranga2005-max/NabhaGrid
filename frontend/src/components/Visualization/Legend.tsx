import React from 'react';

export const Legend: React.FC = () => {
  return (
    <div className="mission-card font-mono" style={{ padding: '8px 12px', fontSize: '10px' }}>
      <div style={{ color: '#00e5ff', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
        Symbology &amp; Legend
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '12px', rowGap: '4px', color: '#cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#00e5ff' }} />
          <span>Nominal Satellite</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <span>RFI Detected (SNN)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>Ground Station</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
          <span>Selected Node</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '2px', backgroundColor: '#00e5ff' }} />
          <span>Inter-Sat Link (ISL)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '2px', backgroundColor: '#10b981' }} />
          <span>Sat-Ground (SGL)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '2px', backgroundColor: '#a855f7' }} />
          <span>Mitigated Route</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
          <span>RFI Uncertainty Zone</span>
        </div>
      </div>
    </div>
  );
};
