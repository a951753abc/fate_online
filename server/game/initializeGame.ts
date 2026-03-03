import type { LocationId } from "./map/types.js";
import type { CharacterState, GroupState } from "./types.js";
import type {
  PairingResult,
  GameInitializedPayload,
  GroupView,
  CharacterPositionView,
  NightStateView,
  PrepConfig,
} from "../shared/protocol.js";

export function buildGroupsFromPairing(pairing: PairingResult): readonly GroupState[] {
  const groups: GroupState[] = [];

  // Human pairs
  for (let i = 0; i < pairing.humanPairs.length; i++) {
    const pair = pairing.humanPairs[i];
    groups.push(
      Object.freeze({
        groupIndex: i,
        masterId: pair.masterId,
        servantId: pair.servantId,
        isNpc: false,
        isEliminated: false,
      }),
    );
  }

  // NPC groups
  const npcStart = pairing.humanPairs.length;
  for (let i = 0; i < pairing.npcGroupCount; i++) {
    const idx = npcStart + i;
    groups.push(
      Object.freeze({
        groupIndex: idx,
        masterId: `npc-master-${idx}`,
        servantId: `npc-servant-${idx}`,
        isNpc: true,
        isEliminated: false,
      }),
    );
  }

  return Object.freeze(groups);
}

export function buildCharactersFromGroups(
  groups: readonly GroupState[],
  startingPositions: ReadonlyMap<number, LocationId>,
): readonly CharacterState[] {
  const characters: CharacterState[] = [];

  for (const group of groups) {
    const location = startingPositions.get(group.groupIndex) ?? "bridge";
    characters.push(
      Object.freeze({
        characterId: group.masterId,
        type: "master" as const,
        groupIndex: group.groupIndex,
        location,
        isNpc: group.isNpc,
      }),
    );
    characters.push(
      Object.freeze({
        characterId: group.servantId,
        type: "servant" as const,
        groupIndex: group.groupIndex,
        location,
        isNpc: group.isNpc,
      }),
    );
  }

  return Object.freeze(characters);
}

export function buildGroupViews(
  groups: readonly GroupState[],
  nicknames: ReadonlyMap<string, string>,
): readonly GroupView[] {
  return Object.freeze(
    groups.map((g) =>
      Object.freeze({
        groupIndex: g.groupIndex,
        masterNickname:
          nicknames.get(g.masterId) ?? (g.isNpc ? `NPC Master ${g.groupIndex}` : "Unknown"),
        servantNickname:
          nicknames.get(g.servantId) ?? (g.isNpc ? `NPC Servant ${g.groupIndex}` : "Unknown"),
      }),
    ),
  );
}

export function buildInitPayloadForPlayer(
  playerId: string,
  groups: readonly GroupState[],
  characters: readonly CharacterState[],
  groupViews: readonly GroupView[],
  nightState: NightStateView,
  prepConfig?: PrepConfig,
): GameInitializedPayload | null {
  // Find which character this player is
  const myChar = characters.find((c) => c.characterId === playerId);
  if (!myChar) return null;

  const positions: readonly CharacterPositionView[] = Object.freeze(
    characters.map((c) =>
      Object.freeze({
        characterId: c.characterId,
        location: c.location,
        type: c.type,
        groupIndex: c.groupIndex,
      }),
    ),
  );

  const base = {
    yourCharacterId: playerId,
    yourGroupIndex: myChar.groupIndex,
    yourRole: myChar.type,
    yourLocation: myChar.location,
    groups: groupViews,
    positions,
    night: nightState,
  };

  return Object.freeze(prepConfig ? { ...base, prepConfig } : base);
}
