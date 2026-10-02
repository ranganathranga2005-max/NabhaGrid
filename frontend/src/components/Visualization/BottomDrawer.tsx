import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ConstellationRoute } from '../../models/route';
import { CommunicationLink } from '../../models/link';
import { Satellite } from '../../models/satellite';

interface BottomDrawerProps {
  activeRoute: ConstellationRoute | null;
  links: CommunicationLink[];
  satellites: Satellite[];
}

export const BottomDrawer: React.FC<BottomDrawerProps> = ({
  activeRoute,
  links,
  satellites,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'ROUTE' | 'LINKS' | 'CONTRACTS'>('ROUTE');

  const islCount = links.filter((l) => l.linkType === 'ISL').length;
  const sglCount = links.filter((l) => l.linkType === 'SGL').length;
  const degradedCount = links.filter((l) => l.status === 'RFI_DEGRADED').length;

  return (
    <div className="mission-card select-none" style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.6)' }}>
      {/* Drawer Toggle Header */}
      <div
        className="mission-card-header"
        style={{ cursor: 'pointer', padding: '6px 14px' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#cbd5e1' }}>TELEMETRY & ROUTE INSPECTOR</span>
          {/* Quick Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setActiveTab('ROUTE'); setIsOpen(true); }}
              className={`mc-btn font-mono ${activeTab === 'ROUTE' ? 'mc-btn-primary' : ''}`}
              style={{ padding: '2px 8px', fontSize: '9.5px', fontWeight: activeTab === 'ROUTE' ? 700 : 400 }}
            >
              Route Hop Sequence
            </button>
            <button
              onClick={() => { setActiveTab('LINKS'); setIsOpen(true); }}
              className={`mc-btn font-mono ${activeTab === 'LINKS' ? 'mc-btn-primary' : ''}`}
              style={{ padding: '2px 8px', fontSize: '9.5px', fontWeight: activeTab === 'LINKS' ? 700 : 400 }}
            >
              Link Graph ({links.length})
            </button>
            <button
              onClick={() => { setActiveTab('CONTRACTS'); setIsOpen(true); }}
              className={`mc-btn font-mono ${activeTab === 'CONTRACTS' ? 'mc-btn-primary' : ''}`}
              style={{ padding: '2px 8px', fontSize: '9.5px', fontWeight: activeTab === 'CONTRACTS' ? 700 : 400 }}
            >
              API Contracts
            </button>
          </div>
        </div>

        <button className="mc-btn" style={{ padding: '2px 6px', background: 'transparent' }}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Drawer Content */}
      {isOpen && (
        <div className="mission-card-body font-mono" style={{ padding: '8px 12px', fontSize: '11px', maxHeight: '135px', overflowY: 'auto' }}>
          {activeTab === 'ROUTE' && (
            <div>
              {activeRoute ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                    <div>
                      PATH ID: <span style={{ color: '#d8b4fe', fontWeight: 700 }}>{activeRoute.pathId}</span>
                    </div>
                    <div>
                      STATUS: <span style={{ color: '#34d399', fontWeight: 700 }}>FEASIBLE (DEMO SEARCH)</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                    {activeRoute.links.map((link, idx) => (
                      <div key={link.id} style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.15)', fontSize: '9.5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                          <span>HOP {idx + 1}</span>
                          <span style={{ color: link.linkType === 'ISL' ? '#00e5ff' : '#10b981', fontWeight: 700 }}>
                            {link.linkType}
                          </span>
                        </div>
                        <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '11px', margin: '2px 0' }}>
                          {link.sourceId} → {link.targetId}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                          <span>{link.distanceKm} km</span>
                          <span>SINR: {link.sinrDb} dB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '12px 0', fontSize: '11px' }}>
                  Select a source satellite and target ground station to inspect the multi-hop transmission path.
                </div>
              )}
            </div>
          )}

          {activeTab === 'LINKS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '10.5px', color: '#94a3b8' }}>
                <div>
                  TOTAL ACTIVE LINKS: <span style={{ color: '#ffffff', fontWeight: 700 }}>{links.length}</span>
                </div>
                <div>
                  INTER-SATELLITE (ISL): <span style={{ color: '#00e5ff', fontWeight: 700 }}>{islCount}</span>
                </div>
                <div>
                  SATELLITE-TO-GROUND (SGL): <span style={{ color: '#10b981', fontWeight: 700 }}>{sglCount}</span>
                </div>
                <div>
                  RFI DEGRADED: <span style={{ color: '#fbbf24', fontWeight: 700 }}>{degradedCount}</span>
                </div>
              </div>

              <div style={{ fontSize: '9.5px', color: '#64748b' }}>
                Network links enforce physical line-of-sight (LOS) occlusion by Earth's limb radius (6,458 km) and elevation horizon masks (&gt;10°).
              </div>
            </div>
          )}

          {activeTab === 'CONTRACTS' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '9.5px' }}>
              <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(8, 12, 22, 0.7)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <span style={{ color: '#00e5ff', fontWeight: 700 }}>GET /api/constellation</span>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  Returns array of `Satellite` objects with WGS84 coordinates from Orekit/SGP4.
                </p>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(8, 12, 22, 0.7)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <span style={{ color: '#a855f7', fontWeight: 700 }}>GET /api/route?source=&amp;dest=</span>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  Returns `OptimizationResult` containing QUBO/QAOA chosen binary decision variables.
                </p>
              </div>
              <div style={{ padding: '6px 8px', borderRadius: '4px', background: 'rgba(8, 12, 22, 0.7)', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>WS /ws/telemetry</span>
                <p style={{ color: '#64748b', marginTop: '2px' }}>
                  Streams 10Hz SNN spike outputs and TDOA/FDOA coordinate solutions.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
