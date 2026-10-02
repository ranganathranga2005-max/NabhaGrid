import React from 'react';
import { Radio } from 'lucide-react';
import { GroundStation } from '../../models/groundStation';

interface GroundStationPanelProps {
  groundStations: GroundStation[];
  selectedGroundStationId: string | null;
  onSelectGroundStation: (id: string) => void;
}

export const GroundStationPanel: React.FC<GroundStationPanelProps> = ({
  groundStations,
  selectedGroundStationId,
  onSelectGroundStation,
}) => {
  return (
    <div className="mission-card font-mono text-xs">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={13} style={{ color: '#00e5ff' }} />
          <span>Ground Stations (Geospatial)</span>
        </div>
        <span className="mc-badge mc-badge-cyan" style={{ fontSize: '8.5px', padding: '1px 5px' }}>
          {groundStations.length} STATIONS
        </span>
      </div>

      <div style={{ maxHeight: '115px', overflowY: 'auto' }}>
        <table className="mc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NAME</th>
              <th>LAT (°)</th>
              <th>LON (°)</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {groundStations.map((gs) => {
              const isSelected = selectedGroundStationId === gs.id;

              return (
                <tr
                  key={gs.id}
                  onClick={() => onSelectGroundStation(gs.id)}
                  className={isSelected ? 'selected' : ''}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 700, color: '#38bdf8' }}>{gs.id}</td>
                  <td style={{ color: '#f1f5f9' }}>{gs.name.split(' ')[0]}</td>
                  <td style={{ color: '#cbd5e1' }}>{gs.latitude.toFixed(2)}</td>
                  <td style={{ color: '#cbd5e1' }}>{gs.longitude.toFixed(2)}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '9.5px'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                      ONLINE
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
