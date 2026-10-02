import React, { useState } from 'react';
import { Satellite as SatelliteIcon, Search } from 'lucide-react';
import { Satellite } from '../../models/satellite';

interface SatellitePanelProps {
  satellites: Satellite[];
  selectedSatelliteId: string | null;
  onSelectSatellite: (id: string) => void;
}

export const SatellitePanel: React.FC<SatellitePanelProps> = ({
  satellites,
  selectedSatelliteId,
  onSelectSatellite,
}) => {
  const [filter, setFilter] = useState('');

  const filtered = satellites.filter((s) =>
    s.id.toLowerCase().includes(filter.toLowerCase()) ||
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="mission-card font-mono text-xs" style={{ display: 'flex', flexDirection: 'column', height: '220px' }}>
      <div className="mission-card-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SatelliteIcon size={13} style={{ color: '#00e5ff' }} />
          <span>Constellation Telemetry</span>
        </div>
        <span className="mc-badge mc-badge-cyan" style={{ fontSize: '8.5px', padding: '1px 5px' }}>
          {satellites.length} SATELLITES
        </span>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '5px 8px', borderBottom: '1px solid rgba(0, 229, 255, 0.15)', flexShrink: 0, position: 'relative' }}>
        <Search size={12} style={{ position: 'absolute', left: '16px', top: '11px', color: '#64748b' }} />
        <input
          type="text"
          placeholder="Search satellites..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mc-input"
          style={{ width: '100%', paddingLeft: '26px', height: '26px' }}
        />
      </div>

      {/* Satellites Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="mc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>PLANE</th>
              <th>LAT (°)</th>
              <th>LON (°)</th>
              <th>ALT (km)</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sat) => {
              const isSelected = selectedSatelliteId === sat.id;
              const isRfi = sat.status === 'RFI_DETECTED';

              return (
                <tr
                  key={sat.id}
                  onClick={() => onSelectSatellite(sat.id)}
                  className={isSelected ? 'selected' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 700, color: isRfi ? '#f87171' : isSelected ? '#fbbf24' : '#38bdf8' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      marginRight: '5px',
                      backgroundColor: isRfi ? '#ef4444' : isSelected ? '#fbbf24' : '#10b981',
                      boxShadow: isRfi ? '0 0 6px #ef4444' : '0 0 6px #10b981'
                    }} />
                    {sat.id}
                  </td>
                  <td style={{ color: '#94a3b8' }}>P-{sat.planeId}</td>
                  <td style={{ color: '#cbd5e1' }}>{sat.latitude.toFixed(1)}</td>
                  <td style={{ color: '#cbd5e1' }}>{sat.longitude.toFixed(1)}</td>
                  <td style={{ color: '#cbd5e1' }}>{Math.round(sat.altitudeKm)}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isRfi ? '#ef4444' : '#10b981',
                      fontWeight: 700,
                      fontSize: '9.5px'
                    }}>
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        backgroundColor: isRfi ? '#ef4444' : '#10b981',
                        boxShadow: isRfi ? '0 0 6px #ef4444' : '0 0 6px #10b981'
                      }} />
                      {isRfi ? 'RFI' : 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
