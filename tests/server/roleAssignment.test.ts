import { describe, it, expect } from "vitest";
import { assignRoles } from "../../server/room/roleAssignment.js";
import type { InternalPlayer } from "../../server/room/types.js";

function makePlayer(
  id: string,
  rolePreference: "master" | "servant" | "any" = "any",
): InternalPlayer {
  return Object.freeze({
    id,
    socketId: `socket-${id}`,
    nickname: `Player ${id}`,
    rolePreference,
    isHost: false,
    isConnected: true,
  });
}

function makePlayers(
  specs: Array<[string, "master" | "servant" | "any"]>,
): ReadonlyMap<string, InternalPlayer> {
  const map = new Map<string, InternalPlayer>();
  for (const [id, role] of specs) {
    map.set(id, makePlayer(id, role));
  }
  return map;
}

describe("assignRoles", () => {
  it("assigns 4 players (2M + 2S) into 2 pairs, 5 NPC groups", () => {
    const players = makePlayers([
      ["a", "master"],
      ["b", "servant"],
      ["c", "master"],
      ["d", "servant"],
    ]);

    const result = assignRoles(players, 7);

    expect(result.humanPairs).toHaveLength(2);
    expect(result.npcGroupCount).toBe(5);

    const masterIds = result.humanPairs.map((p) => p.masterId);
    const servantIds = result.humanPairs.map((p) => p.servantId);

    expect(masterIds).toContain("a");
    expect(masterIds).toContain("c");
    expect(servantIds).toContain("b");
    expect(servantIds).toContain("d");
  });

  it("assigns 14 players into 7 pairs, 0 NPC groups", () => {
    const specs: Array<[string, "master" | "servant" | "any"]> = [];
    for (let i = 0; i < 7; i++) {
      specs.push([`m${i}`, "master"]);
      specs.push([`s${i}`, "servant"]);
    }
    const players = makePlayers(specs);

    const result = assignRoles(players, 7);

    expect(result.humanPairs).toHaveLength(7);
    expect(result.npcGroupCount).toBe(0);
  });

  it("assigns all-any players into balanced pairs", () => {
    const players = makePlayers([
      ["a", "any"],
      ["b", "any"],
      ["c", "any"],
      ["d", "any"],
    ]);

    const result = assignRoles(players, 7);

    expect(result.humanPairs).toHaveLength(2);
    expect(result.npcGroupCount).toBe(5);

    // Each pair should have distinct master and servant
    for (const pair of result.humanPairs) {
      expect(pair.masterId).not.toBe(pair.servantId);
    }
  });

  it("fills any-players to balance masters and servants", () => {
    const players = makePlayers([
      ["m1", "master"],
      ["m2", "master"],
      ["s1", "servant"],
      ["a1", "any"],
    ]);

    const result = assignRoles(players, 7);

    expect(result.humanPairs).toHaveLength(2);

    const masterIds = result.humanPairs.map((p) => p.masterId);
    const servantIds = result.humanPairs.map((p) => p.servantId);

    expect(masterIds).toContain("m1");
    expect(masterIds).toContain("m2");
    expect(servantIds).toContain("s1");
    // a1 should be assigned as servant to fill the gap
    expect(servantIds).toContain("a1");
  });

  it("handles odd player count (extra player not paired)", () => {
    const players = makePlayers([
      ["a", "any"],
      ["b", "any"],
      ["c", "any"],
    ]);

    // 3 players → 1 pair (floor(3/2))
    const result = assignRoles(players, 7);

    expect(result.humanPairs).toHaveLength(1);
    expect(result.npcGroupCount).toBe(6);
  });

  it("calculates NPC count correctly with maxGroups", () => {
    const players = makePlayers([
      ["a", "master"],
      ["b", "servant"],
    ]);

    const result5 = assignRoles(players, 5);
    expect(result5.npcGroupCount).toBe(4);

    const result7 = assignRoles(players, 7);
    expect(result7.npcGroupCount).toBe(6);
  });

  it("result is frozen (immutable)", () => {
    const players = makePlayers([
      ["a", "master"],
      ["b", "servant"],
    ]);

    const result = assignRoles(players, 7);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("handles minimum viable game (4 players, 2 pairs)", () => {
    const players = makePlayers([
      ["m1", "master"],
      ["s1", "servant"],
      ["m2", "master"],
      ["s2", "servant"],
    ]);

    const result = assignRoles(players, 7);
    expect(result.humanPairs).toHaveLength(2);
    expect(result.npcGroupCount).toBe(5);
  });

  it("handles empty player map", () => {
    const players = new Map<string, InternalPlayer>();
    const result = assignRoles(players, 7);

    expect(result.humanPairs).toHaveLength(0);
    expect(result.npcGroupCount).toBe(7);
  });
});
