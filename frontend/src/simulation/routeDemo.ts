import { CommunicationLink } from '../models/link';
import { ConstellationRoute } from '../models/route';

/**
 * Computes a demo multi-hop route through the active constellation graph.
 * Clearly labeled as demo graph search (not QAOA).
 */
export function computeDemoRoute(
  sourceSatId: string,
  targetGsId: string,
  links: CommunicationLink[]
): ConstellationRoute | null {
  // Build adjacency graph
  const adjacency = new Map<string, Array<{ neighbor: string; link: CommunicationLink }>>();

  for (const link of links) {
    if (!link.isFeasible || link.status === 'BLOCKED') continue;

    if (!adjacency.has(link.sourceId)) adjacency.set(link.sourceId, []);
    if (!adjacency.has(link.targetId)) adjacency.set(link.targetId, []);

    adjacency.get(link.sourceId)!.push({ neighbor: link.targetId, link });
    adjacency.get(link.targetId)!.push({ neighbor: link.sourceId, link });
  }

  // BFS / Dijkstra to find shortest path
  const queue: Array<{ node: string; path: string[]; linkPath: CommunicationLink[]; totalDist: number }> = [
    { node: sourceSatId, path: [sourceSatId], linkPath: [], totalDist: 0 },
  ];
  const visited = new Set<string>([sourceSatId]);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.node === targetGsId) {
      // Found destination ground station
      // Latency approx: 3.33 microseconds per km (speed of light) + 5ms hop processing
      const totalLatencyMs = (current.totalDist * 0.00333) + (current.linkPath.length * 4.5);
      const bottleneckSinr = current.linkPath.reduce((min, l) => Math.min(min, l.sinrDb), 999);

      return {
        pathId: `DEMO-ROUTE-${sourceSatId}-${targetGsId}`,
        sourceSatelliteId: sourceSatId,
        destinationGroundStationId: targetGsId,
        nodeSequence: current.path,
        links: current.linkPath,
        totalLatencyMs: parseFloat(totalLatencyMs.toFixed(2)),
        bottleneckSinrDb: parseFloat(bottleneckSinr.toFixed(1)),
        aggregatedRfiLevel: 0.0,
        isFeasible: true,
        optimizationType: 'DEMO_GRAPH_SEARCH',
        isBackendOptimized: false,
        label: 'Demo Route — QAOA Backend Not Connected',
      };
    }

    const neighbors = adjacency.get(current.node) || [];
    for (const { neighbor, link } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({
          node: neighbor,
          path: [...current.path, neighbor],
          linkPath: [...current.linkPath, link],
          totalDist: current.totalDist + link.distanceKm,
        });
      }
    }
  }

  return null;
}
