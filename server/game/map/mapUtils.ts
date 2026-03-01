import type { LocationId } from "./types.js";
import { ADJACENCY } from "./mapData.js";

export function isAdjacent(from: LocationId, to: LocationId): boolean {
  const neighbors = ADJACENCY.get(from);
  return neighbors !== undefined && neighbors.includes(to);
}

export function getAdjacentLocations(location: LocationId): readonly LocationId[] {
  return ADJACENCY.get(location) ?? [];
}

export function shortestPathDistance(from: LocationId, to: LocationId): number {
  if (from === to) return 0;

  const visited = new Set<LocationId>([from]);
  const queue: { location: LocationId; distance: number }[] = [{ location: from, distance: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = ADJACENCY.get(current.location) ?? [];

    for (const neighbor of neighbors) {
      if (neighbor === to) return current.distance + 1;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ location: neighbor, distance: current.distance + 1 });
      }
    }
  }

  return Infinity;
}

export function getStationReachable(): readonly LocationId[] {
  const visited = new Set<LocationId>(["station"]);
  const queue: { location: LocationId; distance: number }[] = [
    { location: "station", distance: 0 },
  ];
  const reachable: LocationId[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.distance > 0) {
      reachable.push(current.location);
    }
    if (current.distance >= 2) continue;

    const neighbors = ADJACENCY.get(current.location) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ location: neighbor, distance: current.distance + 1 });
      }
    }
  }

  return Object.freeze(reachable);
}

export function getValidMoves(
  currentLocation: LocationId,
  isAtStation: boolean,
): readonly LocationId[] {
  if (isAtStation && currentLocation === "station") {
    return Object.freeze([currentLocation, ...getStationReachable()]);
  }
  const adjacent = getAdjacentLocations(currentLocation);
  return Object.freeze([currentLocation, ...adjacent]);
}

export function getManaDistanceMultiplier(distance: number): number {
  if (distance <= 1) return 1;
  if (distance === 2) return 1.5;
  if (distance === 3) return 2;
  return 3;
}
