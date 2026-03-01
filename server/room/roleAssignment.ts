import type { InternalPlayer } from "./types.js";
import type { PairingResult } from "../shared/protocol.js";

export function assignRoles(
  players: ReadonlyMap<string, InternalPlayer>,
  maxGroups: number,
): PairingResult {
  const masters: string[] = [];
  const servants: string[] = [];
  const any: string[] = [];

  for (const [id, player] of players) {
    switch (player.rolePreference) {
      case "master":
        masters.push(id);
        break;
      case "servant":
        servants.push(id);
        break;
      case "any":
        any.push(id);
        break;
    }
  }

  // Shuffle "any" pool for fairness
  const shuffledAny = [...any].sort(() => Math.random() - 0.5);

  // Fill Masters and Servants from "any" pool
  const pairs = Math.floor(players.size / 2);
  const finalMasters = [...masters];
  const finalServants = [...servants];

  for (const id of shuffledAny) {
    if (finalMasters.length < pairs && finalMasters.length <= finalServants.length) {
      finalMasters.push(id);
    } else if (finalServants.length < pairs) {
      finalServants.push(id);
    }
  }

  // Pair them up
  const humanPairs = finalMasters.slice(0, pairs).map((masterId, i) => ({
    masterId,
    servantId: finalServants[i]!,
  }));

  const npcGroupCount = maxGroups - humanPairs.length;

  return Object.freeze({
    humanPairs,
    npcGroupCount,
  });
}
