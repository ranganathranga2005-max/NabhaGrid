import React from 'react';
import { Play, Pause, RotateCcw, RefreshCw, Radio, Layers, Satellite, Globe, Link2, ShieldAlert, Tag } from 'lucide-react';
import { SimulationSpeed } from '../../models/simulation';

interface SimulationControlsProps {
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
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isPlaying,
  speed,
  satelliteCount,
  orbitType,
  showSatellites,
  showOrbits,
  showGroundStations,
  showLinks,
  showRfiRegion,
  showLabels,
  onTogglePlay,
  onSetSpeed,
  onResetTime,
  onRegenerate,
  onSetSatelliteCount,
  onSetOrbitType,
  onToggleSatellites,
  onToggleOrbits,
  onToggleGroundStations,
  onToggleLinks,
  onToggleRfiRegion,
  onToggleLabels,
}) => {
  const speeds: SimulationSpeed[] = [1, 10, 100, 1000];
  const satCounts = [10, 20, 30, 50];

  return (
    <div className="mission-card">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} style={{ color: '#00e5ff' }} />
          <span>Simulation Controls</span>
        </div>
        <span className="mc-badge mc-badge-amber">
          SIMULATED ORBIT
        </span>
      </div>

      <div className="mission-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Play/Pause, Reset, Regenerate Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onTogglePlay}
            className={`mc-btn ${isPlaying ? 'mc-btn-amber' : 'mc-btn-primary'}`}
            style={{ flex: 1.3, padding: '6px 8px', fontSize: '11px', fontWeight: 700 }}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause Sim' : 'Resume Sim'}</span>
          </button>

          <button
            onClick={onResetTime}
            className="mc-btn"
            style={{ flex: 1, padding: '6px 8px', fontSize: '11px' }}
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <button
            onClick={onRegenerate}
            className="mc-btn"
            style={{ flex: 1.2, padding: '6px 8px', fontSize: '11px' }}
          >
            <RefreshCw size={12} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Time Warp Multiplier */}
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Time Warp Multiplier
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`mc-btn font-mono ${speed === s ? 'mc-btn-primary' : ''}`}
                style={{ padding: '5px 0', fontSize: '11px', fontWeight: speed === s ? 700 : 500 }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Number of Satellites */}
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Number of Satellites
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {satCounts.map((count) => (
              <button
                key={count}
                onClick={() => onSetSatelliteCount(count)}
                className={`mc-btn font-mono ${satelliteCount === count ? 'mc-btn-primary' : ''}`}
                style={{ padding: '5px 0', fontSize: '11px', fontWeight: satelliteCount === count ? 700 : 500 }}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Orbit Type Dropdown */}
        <div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Orbit Type
          </div>
          <select
            value={orbitType}
            onChange={(e) => onSetOrbitType(e.target.value)}
            className="mc-select"
            style={{ width: '100%', padding: '5px 8px', fontSize: '11px' }}
          >
            <option value="Random LEO (Demo)">Random LEO (Demo)</option>
            <option value="Walker Constellation">Walker Constellation</option>
            <option value="Polar Constellation">Polar Constellation</option>
          </select>
        </div>

        {/* Toggle Switches */}
        <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(0, 229, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div className="mc-switch-row" onClick={onToggleSatellites} style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Satellite size={12} style={{ color: '#00e5ff' }} />
              <span>Show Satellites</span>
            </span>
            <label className="mc-switch" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={showSatellites} onChange={onToggleSatellites} />
              <span className="mc-slider" />
            </label>
          </div>

          <div className="mc-switch-row" onClick={onToggleOrbits} style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={12} style={{ color: '#10b981' }} />
              <span>Show Orbits</span>
            </span>
            <label className="mc-switch" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={showOrbits} onChange={onToggleOrbits} />
              <span className="mc-slider" />
            </label>
          </div>

          <div className="mc-switch-row" onClick={onToggleGroundStations} style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={12} style={{ color: '#f59e0b' }} />
              <span>Show Ground Stations</span>
            </span>
            <label className="mc-switch" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={showGroundStations} onChange={onToggleGroundStations} />
              <span className="mc-slider" />
            </label>
          </div>

          <div className="mc-switch-row" onClick={onToggleLinks} style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Link2 size={12} style={{ color: '#38bdf8' }} />
              <span>Show Links</span>
            </span>
            <label className="mc-switch" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={showLinks} onChange={onToggleLinks} />
              <span className="mc-slider" />
            </label>
          </div>

          <div className="mc-switch-row" onClick={onToggleRfiRegion} style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={12} style={{ color: '#ef4444' }} />
              <span>Show RFI Region (Demo)</span>
            </span>
            <label className="mc-switch" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={showRfiRegion} onChange={onToggleRfiRegion} />
              <span className="mc-slider" />
            </label>
          </div>

          <div className="mc-switch-row" onClick={onToggleLabels} style={{ cursor: 'pointer' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={12} style={{ color: '#cbd5e1' }} />
              <span>Show Labels</span>
            </span>
            <label className="mc-switch" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={showLabels} onChange={onToggleLabels} />
              <span className="mc-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
