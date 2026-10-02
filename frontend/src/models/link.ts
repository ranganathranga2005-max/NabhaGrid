export type LinkType = 'ISL' | 'SGL'; // Inter-Satellite Link or Satellite-to-Ground Link
export type LinkStatus = 'ACTIVE' | 'RFI_DEGRADED' | 'STANDBY' | 'BLOCKED';

export interface CommunicationLink {
  id: string;                  // e.g. "LINK-SAT01-SAT02"
  sourceId: string;            // Satellite ID
  targetId: string;            // Satellite ID or Ground Station ID
  linkType: LinkType;
  distanceKm: number;          // Slant range
  sinrDb: number;              // Signal to Interference plus Noise Ratio (placeholder)
  rfiLevel: number;            // 0.0 to 1.0 (placeholder)
  status: LinkStatus;
  isFeasible: boolean;         // Passed line-of-sight and range checks
}
