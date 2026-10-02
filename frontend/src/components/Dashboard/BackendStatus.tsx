import React, { useState } from 'react';
import { Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { backendClient } from '../../services/backendClient';

interface BackendStatusProps {
  isBackendConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({
  isBackendConnected,
  onConnectionChange,
}) => {
  const [backendUrl, setBackendUrl] = useState(backendClient.getBaseUrl());
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setStatusMessage('Checking backend health endpoint...');
    backendClient.setBaseUrl(backendUrl);

    try {
      const health = await backendClient.checkHealth();
      setStatusMessage(`Connected! API Version: ${health.version}`);
      onConnectionChange(true);
    } catch {
      setStatusMessage('Connection failed. Using frontend simulation data.');
      onConnectionChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mission-card">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Server size={13} style={{ color: '#00e5ff' }} />
          <span>Backend Connection</span>
        </div>
        <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9.5px' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isBackendConnected ? '#10b981' : '#f59e0b',
            boxShadow: isBackendConnected ? '0 0 6px #10b981' : 'none'
          }} />
          <span style={{ color: isBackendConnected ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
            {isBackendConnected ? 'CONNECTED' : 'NOT CONNECTED'}
          </span>
        </div>
      </div>

      <div className="mission-card-body font-mono" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
        {/* Status text */}
        <div style={{ fontSize: '10.5px' }}>
          {isBackendConnected ? (
            <span style={{ color: '#6ee7b7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} />
              Backend Connected — Consuming live pipeline data
            </span>
          ) : (
            <span style={{ color: '#fcd34d', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={13} />
              Using frontend simulation data (Mock Engine Active)
            </span>
          )}
        </div>

        {/* URL Configuration Input & Action Button */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://localhost:8000"
            className="mc-input"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="mc-btn mc-btn-primary"
            style={{ padding: '5px 10px', fontSize: '10.5px', flexShrink: 0 }}
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            <span>{isBackendConnected ? 'RECHECK' : 'CONNECT'}</span>
          </button>
        </div>

        {statusMessage && (
          <div style={{ fontSize: '9.5px', color: '#94a3b8', background: 'rgba(8, 12, 22, 0.7)', padding: '5px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
            {statusMessage}
          </div>
        )}

        {/* Future Data Replacement Roadmap */}
        <div style={{ paddingTop: '6px', borderTop: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '9px' }}>
          <div style={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            Data Interfaces to Replace from Backend:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', color: '#94a3b8' }}>
            <div>▪ Satellite Ephemeris (Orekit)</div>
            <div>▪ SNN RFI Detection</div>
            <div>▪ TDOA/FDOA Localization</div>
            <div>▪ QUBO/QAOA Optimal Route</div>
          </div>
        </div>
      </div>
    </div>
  );
};
