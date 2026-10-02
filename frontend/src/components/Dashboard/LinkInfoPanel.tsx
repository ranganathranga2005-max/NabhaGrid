import React from 'react';
import { Link2 } from 'lucide-react';
import { CommunicationLink } from '../../models/link';

interface LinkInfoPanelProps {
  selectedLink: CommunicationLink | null;
}

export const LinkInfoPanel: React.FC<LinkInfoPanelProps> = ({ selectedLink }) => {
  return (
    <div className="mission-card font-mono text-xs">
      <div className="mission-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link2 size={13} style={{ color: '#00e5ff' }} />
          <span>Link Information (Selected)</span>
        </div>
      </div>

      <div className="mission-card-body" style={{ padding: '8px 11px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Type</span>
          <span style={{ color: '#f8fafc', fontWeight: 600 }}>
            {selectedLink ? (selectedLink.linkType === 'ISL' ? 'Inter-Satellite (ISL)' : 'Satellite-Ground (SGL)') : 'Inter-Satellite (ISL)'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>From</span>
          <span style={{ color: '#00e5ff', fontWeight: 700 }}>
            {selectedLink ? selectedLink.sourceId : 'SAT-01'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>To</span>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>
            {selectedLink ? selectedLink.targetId : 'SAT-04'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Distance</span>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>
            {selectedLink ? `${selectedLink.distanceKm.toLocaleString()} km` : '1,245 km'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Status</span>
          <span style={{ color: '#34d399', fontWeight: 700 }}>
            {selectedLink?.isFeasible ? 'Feasible (LOS)' : 'Feasible (LOS)'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>RFI Exposure</span>
          <span style={{ color: selectedLink?.status === 'RFI_DEGRADED' ? '#ef4444' : '#60a5fa', fontWeight: 600 }}>
            {selectedLink?.status === 'RFI_DEGRADED' ? 'High (Degraded)' : 'Low (Simulated)'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Link Cost</span>
          <span style={{ color: '#fcd34d', fontWeight: 600 }}>
            {selectedLink ? (selectedLink.distanceKm / 1500).toFixed(2) : '0.82'} (Demo)
          </span>
        </div>
      </div>
    </div>
  );
};
