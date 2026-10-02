/**
 * Realistic Aerospace SVG Asset Generators for Cesium Billboards
 */

// Photorealistic Satellite with solar arrays, gold bus, and parabolic dish
export function createSatelliteSvgDataUrl(color: string = '#00e5ff', isRfi: boolean = false): string {
  const busColor = isRfi ? '#ef4444' : '#e2e8f0';
  const foilColor = isRfi ? '#dc2626' : '#d97706'; // Gold MLI thermal foil
  const panelColor = '#1d4ed8'; // Silicon photovoltaic blue
  const panelGrid = '#38bdf8';
  const glow = isRfi ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 229, 255, 0.7)';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <linearGradient id="foilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="50%" stop-color="${foilColor}" />
        <stop offset="100%" stop-color="#92400e" />
      </linearGradient>
      <linearGradient id="panelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2563eb" />
        <stop offset="50%" stop-color="${panelColor}" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </linearGradient>
    </defs>

    <!-- Outer Status Aura Glow -->
    <circle cx="48" cy="48" r="42" fill="none" stroke="${glow}" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.6" />
    
    <!-- Left Solar Array Wing -->
    <g transform="translate(6, 38)">
      <!-- Boom strut -->
      <line x1="28" y1="10" x2="36" y2="10" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
      <!-- Solar panel body -->
      <rect x="0" y="0" width="28" height="20" rx="2" fill="url(#panelGrad)" stroke="#60a5fa" stroke-width="1" />
      <!-- Grid cells -->
      <line x1="9" y1="0" x2="9" y2="20" stroke="${panelGrid}" stroke-width="0.8" opacity="0.7" />
      <line x1="18" y1="0" x2="18" y2="20" stroke="${panelGrid}" stroke-width="0.8" opacity="0.7" />
      <line x1="0" y1="10" x2="28" y2="10" stroke="${panelGrid}" stroke-width="0.8" opacity="0.7" />
    </g>

    <!-- Right Solar Array Wing -->
    <g transform="translate(62, 38)">
      <!-- Boom strut -->
      <line x1="-8" y1="10" x2="0" y2="10" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
      <!-- Solar panel body -->
      <rect x="0" y="0" width="28" height="20" rx="2" fill="url(#panelGrad)" stroke="#60a5fa" stroke-width="1" />
      <!-- Grid cells -->
      <line x1="9" y1="0" x2="9" y2="20" stroke="${panelGrid}" stroke-width="0.8" opacity="0.7" />
      <line x1="18" y1="0" x2="18" y2="20" stroke="${panelGrid}" stroke-width="0.8" opacity="0.7" />
      <line x1="0" y1="10" x2="28" y2="10" stroke="${panelGrid}" stroke-width="0.8" opacity="0.7" />
    </g>

    <!-- Main Satellite Central Bus (CubeSat / Spacecraft Body with MLI Foil) -->
    <g transform="translate(37, 35)">
      <rect x="0" y="0" width="22" height="26" rx="3" fill="url(#foilGrad)" stroke="#fef08a" stroke-width="1.2" />
      <!-- Instrument aperture / optical sensor -->
      <circle cx="11" cy="13" r="5" fill="#0f172a" stroke="${color}" stroke-width="1.5" />
      <circle cx="11" cy="13" r="2.5" fill="${color}" filter="url(#glow)" />
      <!-- Radiator panel -->
      <rect x="3" y="2" width="16" height="3" fill="#334155" rx="1" />
      <rect x="3" y="21" width="16" height="3" fill="#334155" rx="1" />
    </g>

    <!-- Nadir High-Gain Communications Dish Antenna -->
    <g transform="translate(48, 20)">
      <path d="M -12 6 Q 0 -4 12 6 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.2" />
      <line x1="0" y1="1" x2="0" y2="15" stroke="#cbd5e1" stroke-width="2" />
      <!-- Feedhorn -->
      <circle cx="0" cy="0" r="2.5" fill="${color}" />
    </g>

    <!-- Status Beacon / Pulse Indicator -->
    <circle cx="48" cy="48" r="3" fill="${color}" filter="url(#glow)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Photorealistic Ground Station Parabolic Radar Dish
export function createGroundStationSvgDataUrl(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <defs>
      <linearGradient id="dishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="50%" stop-color="#e2e8f0" />
        <stop offset="100%" stop-color="#94a3b8" />
      </linearGradient>
      <filter id="dishGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Signal Waves Radiating Out -->
    <path d="M 32 24 A 24 24 0 0 1 64 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 3" opacity="0.85" />
    <path d="M 38 30 A 16 16 0 0 1 58 30" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" opacity="0.95" />

    <!-- Parabolic Reflector Dish -->
    <g transform="translate(48, 48) rotate(-22)">
      <!-- Dish bowl curve -->
      <path d="M -24 -6 Q 0 16 24 -6 Q 0 8 -24 -6 Z" fill="url(#dishGrad)" stroke="#475569" stroke-width="1.5" />
      <!-- Feedhorn quadrapod struts -->
      <line x1="-18" y1="-3" x2="0" y2="-18" stroke="#334155" stroke-width="1.2" />
      <line x1="18" y1="-3" x2="0" y2="-18" stroke="#334155" stroke-width="1.2" />
      <!-- Subreflector / feed -->
      <circle cx="0" cy="-18" r="3" fill="#10b981" filter="url(#dishGlow)" />
      <!-- Gimbal mount / elevation axis -->
      <circle cx="0" cy="5" r="4.5" fill="#334155" stroke="#64748b" stroke-width="1" />
    </g>

    <!-- Concrete Azimuth Pedestal & Foundation -->
    <g transform="translate(48, 62)">
      <!-- Mast column -->
      <rect x="-4" y="-7" width="8" height="18" fill="#475569" stroke="#334155" stroke-width="1" rx="1" />
      <!-- Concrete base ring -->
      <path d="M -18 11 L 18 11 L 14 18 L -14 18 Z" fill="#334155" stroke="#64748b" stroke-width="1" />
      <line x1="-22" y1="18" x2="22" y2="18" stroke="#10b981" stroke-width="2" />
    </g>

    <!-- Online Status Dot -->
    <circle cx="48" cy="88" r="3.5" fill="#10b981" filter="url(#dishGlow)" />
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
