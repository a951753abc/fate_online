import type { LocationId } from "./map/types.js";
import type { CharacterState, GroupState } from "./types.js";

export interface Encounter {
  readonly locationId: LocationId;
  readonly groupIndices: readonly number[];
}

export function detectEncounters(
  characters: readonly CharacterState[],
  groups: readonly GroupState[],
): readonly Encounter[] {
  const eliminatedGroups = new Set(groups.filter((g) => g.isEliminated).map((g) => g.groupIndex));

  // Group non-eliminated characters by location
  const locationMap = new Map<LocationId, Set<number>>();
  for (const char of characters) {
    if (eliminatedGroups.has(char.groupIndex)) continue;

    const existing = locationMap.get(char.location) ?? new Set<number>();
    existing.add(char.groupIndex);
    locationMap.set(char.location, existing);
  }

  // Locations with 2+ different groups = encounter
  const encounters: Encounter[] = [];
  for (const [locationId, groupSet] of locationMap) {
    if (groupSet.size >= 2) {
      encounters.push(
        Object.freeze({
          locationId,
          groupIndices: Object.freeze([...groupSet].sort((a, b) => a - b)),
        }),
      );
    }
  }

  return Object.freeze(encounters);
}
