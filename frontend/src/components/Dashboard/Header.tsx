import React from 'react';
import { Satellite as SatelliteIcon, Clock, Network, Pause, Play } from 'lucide-react';
import { SimulationSpeed } from '../../models/simulation';

interface HeaderProps {
  simulationEpochMs: number;
  speed: SimulationSpeed;
  isPlaying: boolean;
  satelliteCount: number;
  activeLinkCount: number;
  isBackendConnected: boolean;
  onTogglePlay: () => void;
  onSetSpeed: (speed: SimulationSpeed) => void;
}

export const Header: React.FC<HeaderProps> = ({
  simulationEpochMs,
  speed,
  isPlaying,
  satelliteCount,
  activeLinkCount,
  isBackendConnected,
  onTogglePlay,
  onSetSpeed,
}) => {
  const utcDate = new Date(simulationEpochMs);
  const timeFormatted = utcDate.toISOString().replace('T', ' ').substring(0, 19);

  return (
    <header className="mc-header">
      {/* Brand & Research Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(2, 132, 199, 0.4))',
          border: '1px solid rgba(0, 229, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00e5ff',
          boxShadow: '0 0 10px rgba(0, 229, 255, 0.3)'
        }}>
          <SatelliteIcon size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f8fafc' }}>
              Autonomous Constellation RFI Mitigation
            </span>
            <span className="mc-badge mc-badge-cyan" style={{ fontSize: '8.5px', padding: '1px 5px' }}>
              v0.1 - SKELETON
            </span>
          </div>
          <p style={{ fontSize: '9.5px', color: '#94a3b8', margin: 0 }}>
            SNN Detection • TDOA/FDOA Localization • QUBO/QAOA Routing
          </p>
        </div>
      </div>

      {/* Center: Mission Control Simulation Clock */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'linear-gradient(180deg, rgba(12, 24, 48, 0.9), rgba(6, 13, 26, 0.95))',
        padding: '5px 12px',
        borderRadius: '6px',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        boxShadow: '0 0 10px rgba(0, 229, 255, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#00e5ff' }}>
          <Clock size={13} />
          <span className="font-mono" style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>SIM TIME (UTC)</span>
        </div>
        <span className="font-mono" style={{ fontSize: '12.5px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.06em' }}>
          {timeFormatted}
        </span>

        {/* Quick Pause/Play Pill */}
        <button
          onClick={onTogglePlay}
          className="mc-btn"
          style={{
            padding: '2px 7px',
            fontSize: '10px',
            background: isPlaying ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            borderColor: isPlaying ? '#10b981' : '#f59e0b',
            color: isPlaying ? '#6ee7b7' : '#fcd34d'
          }}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
          <span>{isPlaying ? 'Live' : 'Paused'}</span>
        </button>

        {/* Quick Speed Pills */}
        <div style={{ display: 'flex', gap: '3px', paddingLeft: '6px', borderLeft: '1px solid rgba(0, 229, 255, 0.2)' }}>
          {[1, 10, 100, 1000].map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s as SimulationSpeed)}
              className={`mc-btn font-mono ${speed === s ? 'mc-btn-primary' : ''}`}
              style={{ padding: '2px 5px', fontSize: '9.5px', minWidth: '24px' }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Right: Telemetry & Connection Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '5px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          fontSize: '10.5px',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          <span style={{ fontSize: '11px' }}>🛰️</span>
          <span style={{ color: '#cbd5e1' }}>{satelliteCount} SATS</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: '5px',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          fontSize: '10.5px',
          fontFamily: "'JetBrains Mono', monospace"
        }}>
          <Network size={12} style={{ color: '#00e5ff' }} />
          <span style={{ color: '#38bdf8' }}>{activeLinkCount} LINKS</span>
        </div>

        {/* Mock Simulation Badge */}
        <div className="mc-badge mc-badge-amber" style={{ padding: '5px 8px', fontSize: '10px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
            boxShadow: isBackendConnected ? '0 0 6px #10b981' : '0 0 6px #f59e0b'
          }} />
          <span>{isBackendConnected ? 'BACKEND CONNECTED' : 'MOCK SIMULATION'}</span>
        </div>
      </div>
    </header>
  );
};
