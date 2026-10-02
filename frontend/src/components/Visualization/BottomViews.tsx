import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, ChevronDown, ChevronUp, Map, Globe, Eye } from 'lucide-react';
import { Satellite } from '../../models/satellite';
import { GroundStation } from '../../models/groundStation';
import { ConstellationRoute } from '../../models/route';

interface BottomViewsProps {
  satellites: Satellite[];
  groundStations: GroundStation[];
  activeRoute: ConstellationRoute | null;
}

export const BottomViews: React.FC<BottomViewsProps> = ({
  satellites,
  groundStations,
  activeRoute,
}) => {
  const [isOpen, setIsOpen] = useState(false); // Default collapsed so 3D Globe has full view!
  const canvas2dRef = useRef<HTMLCanvasElement>(null);
  const canvasNightRef = useRef<HTMLCanvasElement>(null);
  const canvasDayRef = useRef<HTMLCanvasElement>(null);
  const canvasRouteRef = useRef<HTMLCanvasElement>(null);

  // 1. Draw 2D World Map with Orbital Ground Tracks
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvas2dRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#060d1d';
    ctx.fillRect(0, 0, w, h);

    // Lat/Lon grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;

    [-60, -30, 0, 30, 60].forEach((lat) => {
      const y = ((90 - lat) / 180) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    [-120, -60, 0, 60, 120].forEach((lon) => {
      const x = ((lon + 180) / 360) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    });

    // World continents outline
    ctx.fillStyle = 'rgba(30, 58, 95, 0.45)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 0.8;

    // Americas
    ctx.beginPath();
    ctx.ellipse(w * 0.28, h * 0.35, w * 0.12, h * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w * 0.32, h * 0.65, w * 0.08, h * 0.22, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eurasia & Africa
    ctx.beginPath();
    ctx.ellipse(w * 0.62, h * 0.32, w * 0.16, h * 0.18, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w * 0.54, h * 0.58, w * 0.08, h * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Australia
    ctx.beginPath();
    ctx.ellipse(w * 0.82, h * 0.72, w * 0.05, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sinusoidal Ground Tracks
    const planeTracks = [
      { inc: 55, color: 'rgba(0, 229, 255, 0.75)', phase: 0 },
      { inc: 60, color: 'rgba(16, 185, 129, 0.75)', phase: Math.PI / 3 },
      { inc: 70, color: 'rgba(245, 158, 11, 0.75)', phase: (2 * Math.PI) / 3 },
    ];

    planeTracks.forEach((track) => {
      ctx.strokeStyle = track.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const lon = (x / w) * 360 - 180;
        const lonRad = (lon * Math.PI) / 180;
        const lat = track.inc * Math.sin(lonRad + track.phase);
        const y = ((90 - lat) / 180) * h;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Ground Stations
    groundStations.forEach((gs) => {
      const x = ((gs.longitude + 180) / 360) * w;
      const y = ((90 - gs.latitude) / 180) * h;

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '8px monospace';
      ctx.fillText(gs.id.replace('GS-', ''), x + 4, y - 2);
    });

    // Satellites
    satellites.forEach((sat) => {
      const x = ((sat.longitude + 180) / 360) * w;
      const y = ((90 - sat.latitude) / 180) * h;

      ctx.fillStyle = sat.status === 'RFI_DETECTED' ? '#ef4444' : '#00e5ff';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [satellites, groundStations, isOpen]);

  // 2. Night Earth View
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasNightRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.42;

    ctx.fillStyle = '#050a17';
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(cx * 0.8, cy * 0.8, r * 0.2, cx, cy, r);
    grad.addColorStop(0, '#0c1a36');
    grad.addColorStop(0.7, '#040b18');
    grad.addColorStop(1, '#02050b');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    const cityOffsets = [
      [-12, -8], [-5, -12], [8, -10], [14, -6], [-8, 2], [5, 4], [18, 2], [-14, 12], [10, 16],
    ];
    cityOffsets.forEach(([ox, oy]) => {
      ctx.beginPath();
      ctx.arc(cx + ox, cy + oy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [isOpen]);

  // 3. Day Earth View
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasDayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.42;

    ctx.fillStyle = '#050a17';
    ctx.fillRect(0, 0, w, h);

    const grad = ctx.createRadialGradient(cx * 0.7, cy * 0.7, r * 0.2, cx, cy, r);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.5, '#0284c7');
    grad.addColorStop(0.9, '#034575');
    grad.addColorStop(1, '#02182e');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy - 8, r * 0.35, r * 0.25, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 8, cy + 6, r * 0.28, r * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }, [isOpen]);

  // 4. Route View
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRouteRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.4;

    ctx.fillStyle = '#050a17';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, -Math.PI * 0.8, -Math.PI * 0.1);
    ctx.stroke();

    const nodeCoords = [
      [cx - r * 0.65, cy - r * 0.6],
      [cx - r * 0.1, cy - r * 0.9],
      [cx + r * 0.55, cy - r * 0.68],
      [cx + r * 0.85, cy - r * 0.25],
    ];

    nodeCoords.forEach(([nx, ny], idx) => {
      ctx.fillStyle = idx === nodeCoords.length - 1 ? '#10b981' : '#00e5ff';
      ctx.beginPath();
      ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [activeRoute, isOpen]);

  // If minimized, show sleek floating bar in the center-bottom
  if (!isOpen) {
    return (
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '5px 12px',
        background: 'linear-gradient(135deg, rgba(12, 25, 48, 0.92), rgba(6, 13, 27, 0.95))',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 229, 255, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 229, 255, 0.15)',
        cursor: 'pointer'
      }} onClick={() => setIsOpen(true)}>
        <span style={{ fontSize: '11px', color: '#00e5ff', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
          <Map size={12} />
          <span>2D Map &amp; Views</span>
        </span>
        <span style={{ width: '1px', height: '12px', backgroundColor: 'rgba(0, 229, 255, 0.25)' }} />
        <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>Expand</span>
          <ChevronUp size={12} />
        </span>
      </div>
    );
  }

  // Expanded bottom views
  return (
    <div className="mc-bottom-row" style={{ animation: 'fadeIn 0.2s ease-in' }}>
      {/* 1. 2D World Map (Ground Track) */}
      <div className="mission-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mission-card-header" style={{ padding: '4px 8px' }}>
          <span>2D World Map (Ground Track)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Maximize2 size={11} style={{ color: '#00e5ff', cursor: 'pointer' }} />
            <ChevronDown size={12} style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
          </div>
        </div>
        <div style={{ flex: 1, padding: '4px' }}>
          <canvas
            ref={canvas2dRef}
            width={270}
            height={155}
            style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'block' }}
          />
        </div>
      </div>

      {/* 2. Earth View (Night Side) */}
      <div className="mission-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mission-card-header" style={{ padding: '4px 8px' }}>
          <span>Earth (Night)</span>
        </div>
        <div style={{ flex: 1, padding: '4px' }}>
          <canvas
            ref={canvasNightRef}
            width={140}
            height={155}
            style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'block' }}
          />
        </div>
      </div>

      {/* 3. Earth View (Day Side) */}
      <div className="mission-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mission-card-header" style={{ padding: '4px 8px' }}>
          <span>Earth (Day)</span>
        </div>
        <div style={{ flex: 1, padding: '4px' }}>
          <canvas
            ref={canvasDayRef}
            width={140}
            height={155}
            style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'block' }}
          />
        </div>
      </div>

      {/* 4. Selected Route View */}
      <div className="mission-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="mission-card-header" style={{ padding: '4px 8px' }}>
          <span>Route View</span>
        </div>
        <div style={{ flex: 1, padding: '4px' }}>
          <canvas
            ref={canvasRouteRef}
            width={140}
            height={155}
            style={{ width: '100%', height: '100%', borderRadius: '4px', display: 'block' }}
          />
        </div>
      </div>

      {/* 5. Legend */}
      <div className="mission-card font-mono" style={{ display: 'flex', flexDirection: 'column', fontSize: '9.5px', padding: '6px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ color: '#00e5ff', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '10px' }}>
            Legend
          </span>
          <ChevronDown size={12} style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: '8px', rowGap: '4px', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2.5px', backgroundColor: '#10b981' }} />
            <span>Selected Route</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>🛰️</span>
            <span>Satellite</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #00e5ff' }} />
            <span>Satellite Link (ISL)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>📡</span>
            <span>Ground Station</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #fbbf24' }} />
            <span>Satellite-Ground Link</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>RFI Source (Demo)</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '2px', borderTop: '2px dashed #ef4444' }} />
            <span>High RFI Link (Avoided)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.4)' }} />
            <span>Interference Region</span>
          </div>
        </div>
      </div>
    </div>
  );
};
