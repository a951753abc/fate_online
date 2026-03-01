import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CharacterState, GroupState } from "../types.js";

// --- Mock Redis ---
const mockRedisData = new Map<string, Map<string, string>>();
const mockSets = new Map<string, Set<string>>();

function getHash(key: string): Map<string, string> {
  if (!mockRedisData.has(key)) mockRedisData.set(key, new Map());
  return mockRedisData.get(key)!;
}

const mockPipeline = {
  hset: vi.fn((key: string, ...args: unknown[]) => {
    const hash = getHash(key);
    if (typeof args[0] === "object" && args[0] !== null) {
      for (const [k, v] of Object.entries(args[0] as Record<string, string>)) {
        hash.set(k, v);
      }
    } else {
      hash.set(args[0] as string, args[1] as string);
    }
    return mockPipeline;
  }),
  del: vi.fn((key: string) => {
    mockRedisData.delete(key);
    return mockPipeline;
  }),
  exec: vi.fn(async () => []),
};

const mockRedis = {
  hset: vi.fn(async (key: string, ...args: unknown[]) => {
    const hash = getHash(key);
    if (typeof args[0] === "object" && args[0] !== null) {
      for (const [k, v] of Object.entries(args[0] as Record<string, string>)) {
        hash.set(k, v);
      }
    } else {
      hash.set(args[0] as string, args[1] as string);
    }
  }),
  hget: vi.fn(async (key: string, field: string) => {
    return getHash(key).get(field) ?? null;
  }),
  hgetall: vi.fn(async (key: string) => {
    const hash = getHash(key);
    const result: Record<string, string> = {};
    for (const [k, v] of hash) result[k] = v;
    return result;
  }),
  smembers: vi.fn(async (key: string) => {
    return [...(mockSets.get(key) ?? [])];
  }),
  sadd: vi.fn(async (key: string, ...values: string[]) => {
    if (!mockSets.has(key)) mockSets.set(key, new Set());
    for (const v of values) mockSets.get(key)!.add(v);
  }),
  pipeline: vi.fn(() => mockPipeline),
};

vi.mock("../../db/redis.js", () => ({
  getRedis: () => mockRedis,
}));

import {
  initializeGame,
  getGameState,
  getCharacter,
  getAllCharacters,
  submitMove,
  getPendingMoves,
  resolveMovement,
  updateOccupations,
  setPhase,
  advanceNight,
  setGameStatus,
} from "../gameStateManager.js";

// --- Test Data ---
const testGroups: readonly GroupState[] = [
  { groupIndex: 0, masterId: "m0", servantId: "s0", isNpc: false, isEliminated: false },
  { groupIndex: 1, masterId: "m1", servantId: "s1", isNpc: true, isEliminated: false },
];

const testCharacters: readonly CharacterState[] = [
  { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
  { characterId: "s0", type: "servant", groupIndex: 0, location: "bridge", isNpc: false },
  { characterId: "m1", type: "master", groupIndex: 1, location: "port", isNpc: true },
  { characterId: "s1", type: "servant", groupIndex: 1, location: "port", isNpc: true },
];

describe("gameStateManager", () => {
  beforeEach(() => {
    mockRedisData.clear();
    mockSets.clear();
    vi.clearAllMocks();
  });

  describe("initializeGame", () => {
    it("creates game state in Redis", async () => {
      const result = await initializeGame("ROOM1", testGroups, testCharacters);

      expect(result.roomCode).toBe("ROOM1");
      expect(result.status).toBe("active");
      expect(result.groups).toHaveLength(2);
      expect(result.characters).toHaveLength(4);
      expect(result.night.nightNumber).toBe(1);
      expect(result.night.phase).toBe("free_action");
    });

    it("stores game metadata in Redis hash", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);

      const meta = getHash("game:ROOM1");
      expect(meta.get("status")).toBe("active");
      expect(meta.get("nightNumber")).toBe("1");
      expect(meta.get("nightPhase")).toBe("free_action");
    });

    it("stores characters in Redis", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);

      const chars = getHash("game:ROOM1:characters");
      expect(chars.size).toBe(4);
      const m0 = JSON.parse(chars.get("m0")!);
      expect(m0.location).toBe("bridge");
      expect(m0.type).toBe("master");
    });
  });

  describe("getGameState", () => {
    it("returns null for nonexistent game", async () => {
      const result = await getGameState("NONEXIST");
      expect(result).toBeNull();
    });

    it("returns full game state", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      const state = await getGameState("ROOM1");

      expect(state).not.toBeNull();
      expect(state!.roomCode).toBe("ROOM1");
      expect(state!.characters).toHaveLength(4);
      expect(state!.groups).toHaveLength(2);
    });
  });

  describe("getCharacter", () => {
    it("returns null for nonexistent character", async () => {
      const result = await getCharacter("ROOM1", "nonexistent");
      expect(result).toBeNull();
    });

    it("returns character state", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      const char = await getCharacter("ROOM1", "m0");

      expect(char).not.toBeNull();
      expect(char!.type).toBe("master");
      expect(char!.location).toBe("bridge");
    });
  });

  describe("getAllCharacters", () => {
    it("returns all characters", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      const chars = await getAllCharacters("ROOM1");
      expect(chars).toHaveLength(4);
    });
  });

  describe("submitMove", () => {
    it("accepts valid adjacent move", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      // m0 is at bridge, warehouse is adjacent
      const result = await submitMove("ROOM1", "m0", "warehouse");
      expect(result.success).toBe(true);
    });

    it("accepts stay (same location)", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      const result = await submitMove("ROOM1", "m0", "bridge");
      expect(result.success).toBe(true);
    });

    it("rejects non-adjacent move", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      // m0 is at bridge, port is not adjacent to bridge
      const result = await submitMove("ROOM1", "m0", "port");
      expect(result.success).toBe(false);
      expect(result.error).toContain("無法到達");
    });

    it("rejects move when not in free_action phase", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      getHash("game:ROOM1").set("nightPhase", "encounter");
      const result = await submitMove("ROOM1", "m0", "warehouse");
      expect(result.success).toBe(false);
      expect(result.error).toContain("自由行動");
    });

    it("rejects move to destroyed location", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      mockSets.set("game:ROOM1:destroyed", new Set(["warehouse"]));
      const result = await submitMove("ROOM1", "m0", "warehouse");
      expect(result.success).toBe(false);
      expect(result.error).toContain("崩壞");
    });

    it("rejects move for nonexistent character", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      const result = await submitMove("ROOM1", "nobody", "bridge");
      expect(result.success).toBe(false);
      expect(result.error).toContain("找不到");
    });

    it("accepts station 2-step move", async () => {
      // Place character at station
      const stationChars: readonly CharacterState[] = [
        { characterId: "m0", type: "master", groupIndex: 0, location: "station", isNpc: false },
        { characterId: "s0", type: "servant", groupIndex: 0, location: "bridge", isNpc: false },
      ];
      await initializeGame("ROOM2", testGroups, stationChars);
      // church is 2 steps from station (station → bridge → church)
      const result = await submitMove("ROOM2", "m0", "church");
      expect(result.success).toBe(true);
    });
  });

  describe("getPendingMoves", () => {
    it("returns empty map when no moves", async () => {
      const moves = await getPendingMoves("ROOM1");
      expect(moves.size).toBe(0);
    });

    it("returns submitted moves", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      await submitMove("ROOM1", "m0", "warehouse");
      const moves = await getPendingMoves("ROOM1");
      expect(moves.get("m0")).toBe("warehouse");
    });
  });

  describe("resolveMovement", () => {
    it("applies pending moves and updates character locations", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      await submitMove("ROOM1", "m0", "warehouse");

      const updated = await resolveMovement("ROOM1");
      const m0 = updated.find((c) => c.characterId === "m0");
      expect(m0!.location).toBe("warehouse");
    });

    it("keeps characters in place if no move submitted", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      // Only m0 moves, s0 stays
      await submitMove("ROOM1", "m0", "warehouse");

      const updated = await resolveMovement("ROOM1");
      const s0 = updated.find((c) => c.characterId === "s0");
      expect(s0!.location).toBe("bridge");
    });

    it("clears pending moves after resolution", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      await submitMove("ROOM1", "m0", "warehouse");
      await resolveMovement("ROOM1");

      // The moves hash should be deleted
      expect(mockPipeline.del).toHaveBeenCalledWith("game:ROOM1:moves");
    });
  });

  describe("updateOccupations", () => {
    it("assigns occupation to stationary characters", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      // No moves submitted → both groups stay → both occupy
      const occupations = await updateOccupations("ROOM1");

      expect(occupations).toHaveLength(2);
      const bridgeOcc = occupations.find((o) => o.locationId === "bridge");
      expect(bridgeOcc).toBeDefined();
      expect(bridgeOcc!.groupIndex).toBe(0);
      expect(bridgeOcc!.occupiedBy).toBe("both");
    });

    it("does not assign occupation to characters who moved", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      // m0 moves away from bridge
      getHash("game:ROOM1:moves").set("m0", "warehouse");
      // s0 stays at bridge
      const occupations = await updateOccupations("ROOM1");

      const bridgeOcc = occupations.find((o) => o.locationId === "bridge");
      expect(bridgeOcc).toBeDefined();
      expect(bridgeOcc!.occupiedBy).toBe("servant"); // only s0 stayed
    });

    it("returns no occupation when location is contested by 2+ groups", async () => {
      // Put both groups at bridge
      const sameLocChars: readonly CharacterState[] = [
        { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
        { characterId: "s0", type: "servant", groupIndex: 0, location: "bridge", isNpc: false },
        { characterId: "m1", type: "master", groupIndex: 1, location: "bridge", isNpc: true },
        { characterId: "s1", type: "servant", groupIndex: 1, location: "bridge", isNpc: true },
      ];
      await initializeGame("ROOM3", testGroups, sameLocChars);

      const occupations = await updateOccupations("ROOM3");
      const bridgeOcc = occupations.find((o) => o.locationId === "bridge");
      expect(bridgeOcc).toBeUndefined();
    });
  });

  describe("setPhase", () => {
    it("updates phase in Redis", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      await setPhase("ROOM1", "encounter", 99999);

      const meta = getHash("game:ROOM1");
      expect(meta.get("nightPhase")).toBe("encounter");
      expect(meta.get("phaseEndsAt")).toBe("99999");
    });
  });

  describe("advanceNight", () => {
    it("increments night number and resets to free_action", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      const night = await advanceNight("ROOM1");

      expect(night.nightNumber).toBe(2);
      expect(night.phase).toBe("free_action");
    });
  });

  describe("setGameStatus", () => {
    it("updates game status in Redis", async () => {
      await initializeGame("ROOM1", testGroups, testCharacters);
      await setGameStatus("ROOM1", "ended");

      const meta = getHash("game:ROOM1");
      expect(meta.get("status")).toBe("ended");
    });
  });
});
