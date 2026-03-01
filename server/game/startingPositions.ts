import type { LocationId } from "./map/types.js";
import { LOCATION_IDS } from "./map/mapData.js";

export function assignStartingPositions(
  groupCount: number,
  availableLocations: readonly LocationId[] = LOCATION_IDS,
): ReadonlyMap<number, LocationId> {
  if (groupCount > availableLocations.length) {
    throw new Error(`Cannot assign ${groupCount} groups to ${availableLocations.length} locations`);
  }

  const shuffled = [...availableLocations].sort(() => Math.random() - 0.5);
  const assignments = new Map<number, LocationId>();

  for (let i = 0; i < groupCount; i++) {
    assignments.set(i, shuffled[i]);
  }

  return assignments;
}
