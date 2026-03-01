import { describe, it, expect } from "vitest";
import { detectEncounters } from "../encounterDetection.js";
import type { CharacterState, GroupState } from "../types.js";

const groups: readonly GroupState[] = [
  { groupIndex: 0, masterId: "m0", servantId: "s0", isNpc: false, isEliminated: false },
  { groupIndex: 1, masterId: "m1", servantId: "s1", isNpc: true, isEliminated: false },
  { groupIndex: 2, masterId: "m2", servantId: "s2", isNpc: true, isEliminated: false },
];

describe("detectEncounters", () => {
  it("returns no encounters when all characters at different locations", () => {
    const characters: CharacterState[] = [
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "s0", type: "servant", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "m1", type: "master", groupIndex: 1, location: "port", isNpc: true },
      { characterId: "s1", type: "servant", groupIndex: 1, location: "port", isNpc: true },
    ];
    const result = detectEncounters(characters, groups.slice(0, 2));
    expect(result).toHaveLength(0);
  });

  it("detects encounter when 2 groups at same location", () => {
    const characters: CharacterState[] = [
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "m1", type: "master", groupIndex: 1, location: "bridge", isNpc: true },
    ];
    const result = detectEncounters(characters, groups.slice(0, 2));
    expect(result).toHaveLength(1);
    expect(result[0].locationId).toBe("bridge");
    expect(result[0].groupIndices).toEqual([0, 1]);
  });

  it("detects multi-way encounter (3+ groups)", () => {
    const characters: CharacterState[] = [
      { characterId: "m0", type: "master", groupIndex: 0, location: "warehouse", isNpc: false },
      { characterId: "m1", type: "master", groupIndex: 1, location: "warehouse", isNpc: true },
      { characterId: "m2", type: "master", groupIndex: 2, location: "warehouse", isNpc: true },
    ];
    const result = detectEncounters(characters, groups);
    expect(result).toHaveLength(1);
    expect(result[0].groupIndices).toEqual([0, 1, 2]);
  });

  it("same-group characters at same location do not create encounter", () => {
    const characters: CharacterState[] = [
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "s0", type: "servant", groupIndex: 0, location: "bridge", isNpc: false },
    ];
    const result = detectEncounters(characters, groups.slice(0, 1));
    expect(result).toHaveLength(0);
  });

  it("excludes eliminated groups", () => {
    const groupsWithElim: readonly GroupState[] = [
      { groupIndex: 0, masterId: "m0", servantId: "s0", isNpc: false, isEliminated: false },
      { groupIndex: 1, masterId: "m1", servantId: "s1", isNpc: true, isEliminated: true },
    ];
    const characters: CharacterState[] = [
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "m1", type: "master", groupIndex: 1, location: "bridge", isNpc: true },
    ];
    const result = detectEncounters(characters, groupsWithElim);
    expect(result).toHaveLength(0);
  });

  it("detects encounters at multiple locations", () => {
    const characters: CharacterState[] = [
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "m1", type: "master", groupIndex: 1, location: "bridge", isNpc: true },
      { characterId: "s0", type: "servant", groupIndex: 0, location: "port", isNpc: false },
      { characterId: "s2", type: "servant", groupIndex: 2, location: "port", isNpc: true },
    ];
    const result = detectEncounters(characters, groups);
    expect(result).toHaveLength(2);
    const locs = result.map((e) => e.locationId).sort();
    expect(locs).toEqual(["bridge", "port"]);
  });

  it("returns sorted group indices", () => {
    const characters: CharacterState[] = [
      { characterId: "m2", type: "master", groupIndex: 2, location: "bridge", isNpc: true },
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
    ];
    const result = detectEncounters(characters, groups);
    expect(result[0].groupIndices).toEqual([0, 2]);
  });
});
