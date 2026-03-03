import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GroupState } from "../types.js";
import type { AbilityStatKey, LevelAllocation } from "../character/masterTypes.js";

// --- Mock Redis ---
const mockRedisData = new Map<string, Map<string, string>>();

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
  pipeline: vi.fn(() => mockPipeline),
};

vi.mock("../../db/redis.js", () => ({
  getRedis: () => mockRedis,
}));

import {
  initializePrep,
  submitMasterBuild,
  confirmReady,
  getPrepState,
  getCharacterData,
} from "../prepManager.js";

// --- Test Data ---
const twoGroups: readonly GroupState[] = [
  { groupIndex: 0, masterId: "m0", servantId: "s0", isNpc: false, isEliminated: false },
  {
    groupIndex: 1,
    masterId: "npc-master-1",
    servantId: "npc-servant-1",
    isNpc: true,
    isEliminated: false,
  },
];

const threeGroups: readonly GroupState[] = [
  { groupIndex: 0, masterId: "m0", servantId: "s0", isNpc: false, isEliminated: false },
  { groupIndex: 1, masterId: "m1", servantId: "s1", isNpc: false, isEliminated: false },
  {
    groupIndex: 2,
    masterId: "npc-master-2",
    servantId: "npc-servant-2",
    isNpc: true,
    isEliminated: false,
  },
];

const validAllocation: readonly LevelAllocation[] = [
  { levelId: "magician", level: 2 },
  { levelId: "executor", level: 2 },
];

const validFreePoint: AbilityStatKey = "reason";

describe("prepManager", () => {
  beforeEach(() => {
    mockRedisData.clear();
    vi.clearAllMocks();
  });

  describe("initializePrep", () => {
    it("sets human Master to pending", async () => {
      await initializePrep("R1", twoGroups);

      const status = getHash("game:R1:prep").get("m0");
      expect(status).toBe("pending:master");
    });

    it("sets human Servant to ready (no creation yet)", async () => {
      await initializePrep("R1", twoGroups);

      const status = getHash("game:R1:prep").get("s0");
      expect(status).toBe("ready:servant");
    });

    it("sets NPC Master and Servant to ready", async () => {
      await initializePrep("R1", twoGroups);

      expect(getHash("game:R1:prep").get("npc-master-1")).toBe("ready:master");
      expect(getHash("game:R1:prep").get("npc-servant-1")).toBe("ready:servant");
    });

    it("generates NPC chardata with default build", async () => {
      await initializePrep("R1", twoGroups);

      const raw = getHash("game:R1:chardata").get("npc-master-1");
      expect(raw).toBeDefined();
      const data = JSON.parse(raw!);
      expect(data.allocation).toHaveLength(1);
      expect(data.allocation[0].levelId).toBe("magician");
      expect(data.stats).toBeDefined();
      expect(data.stats.finalCombat).toBeDefined();
    });

    it("does NOT generate chardata for human Masters", async () => {
      await initializePrep("R1", twoGroups);

      const raw = getHash("game:R1:chardata").get("m0");
      expect(raw).toBeUndefined();
    });

    it("handles multiple human groups", async () => {
      await initializePrep("R1", threeGroups);

      expect(getHash("game:R1:prep").get("m0")).toBe("pending:master");
      expect(getHash("game:R1:prep").get("m1")).toBe("pending:master");
      expect(getHash("game:R1:prep").get("s0")).toBe("ready:servant");
      expect(getHash("game:R1:prep").get("s1")).toBe("ready:servant");
      expect(getHash("game:R1:prep").get("npc-master-2")).toBe("ready:master");
    });
  });

  describe("submitMasterBuild", () => {
    beforeEach(async () => {
      await initializePrep("R1", twoGroups);
    });

    it("accepts valid allocation and returns stats", async () => {
      const result = await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats!.finalCombat).toBeDefined();
    });

    it("stores chardata in Redis", async () => {
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);

      const raw = getHash("game:R1:chardata").get("m0");
      expect(raw).toBeDefined();
      const data = JSON.parse(raw!);
      expect(data.allocation).toEqual(validAllocation);
      expect(data.freePoint).toBe("reason");
    });

    it("sets status to submitted", async () => {
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);

      expect(getHash("game:R1:prep").get("m0")).toBe("submitted:master");
    });

    it("allows re-submission (overwrite)", async () => {
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);

      const newAllocation: readonly LevelAllocation[] = [{ levelId: "fighter", level: 4 }];
      const result = await submitMasterBuild("R1", "m0", newAllocation, "body");

      expect(result.success).toBe(true);
      const data = JSON.parse(getHash("game:R1:chardata").get("m0")!);
      expect(data.allocation[0].levelId).toBe("fighter");
    });

    it("rejects unknown character", async () => {
      const result = await submitMasterBuild("R1", "nobody", validAllocation, validFreePoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain("不在準備階段");
    });

    it("rejects already-ready character", async () => {
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);
      await confirmReady("R1", "m0");

      const result = await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);
      expect(result.success).toBe(false);
      expect(result.error).toContain("已確認就緒");
    });

    it("rejects invalid allocation (empty)", async () => {
      const result = await submitMasterBuild("R1", "m0", [], validFreePoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain("至少需要");
    });

    it("rejects invalid allocation (wrong total)", async () => {
      const badAllocation: readonly LevelAllocation[] = [{ levelId: "magician", level: 2 }];
      const result = await submitMasterBuild("R1", "m0", badAllocation, validFreePoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain("等級總和");
    });

    it("rejects unknown levelId", async () => {
      const badAllocation = [{ levelId: "ninja" as never, level: 4 }];
      const result = await submitMasterBuild("R1", "m0", badAllocation, validFreePoint);

      expect(result.success).toBe(false);
      expect(result.error).toContain("未知的級別");
    });
  });

  describe("confirmReady", () => {
    beforeEach(async () => {
      await initializePrep("R1", twoGroups);
    });

    it("sets status to ready after submission", async () => {
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);
      await confirmReady("R1", "m0");

      expect(getHash("game:R1:prep").get("m0")).toBe("ready:master");
    });

    it("returns allReady=true when all players are ready", async () => {
      // twoGroups: m0 pending, s0 ready, npc-master-1 ready, npc-servant-1 ready
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);
      const result = await confirmReady("R1", "m0");

      expect(result.success).toBe(true);
      expect(result.allReady).toBe(true);
      expect(result.players).toHaveLength(4);
    });

    it("returns allReady=false when some players not ready", async () => {
      await initializePrep("R2", threeGroups);
      // m0 and m1 both pending. Submit + confirm only m0
      await submitMasterBuild("R2", "m0", validAllocation, validFreePoint);
      const result = await confirmReady("R2", "m0");

      expect(result.success).toBe(true);
      expect(result.allReady).toBe(false);
    });

    it("does not set ready if no chardata submitted", async () => {
      // m0 is pending, no submission
      const result = await confirmReady("R1", "m0");

      expect(result.success).toBe(false);
      expect(result.allReady).toBe(false);
      // Status should NOT be changed to ready
      expect(getHash("game:R1:prep").get("m0")).toBe("pending:master");
    });
  });

  describe("getPrepState", () => {
    it("returns all players with statuses", async () => {
      await initializePrep("R1", twoGroups);
      const state = await getPrepState("R1");

      expect(state).toHaveLength(4);
      const m0 = state.find((p) => p.characterId === "m0");
      expect(m0).toBeDefined();
      expect(m0!.role).toBe("master");
      expect(m0!.status).toBe("pending");

      const npc = state.find((p) => p.characterId === "npc-master-1");
      expect(npc!.status).toBe("ready");
    });

    it("reflects status changes", async () => {
      await initializePrep("R1", twoGroups);
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);
      const state = await getPrepState("R1");

      const m0 = state.find((p) => p.characterId === "m0");
      expect(m0!.status).toBe("submitted");
    });
  });

  describe("getCharacterData", () => {
    it("returns null for no data", async () => {
      const data = await getCharacterData("R1", "m0");
      expect(data).toBeNull();
    });

    it("returns stored chardata", async () => {
      await initializePrep("R1", twoGroups);
      await submitMasterBuild("R1", "m0", validAllocation, validFreePoint);

      const data = await getCharacterData("R1", "m0");
      expect(data).not.toBeNull();
      expect(data!.allocation).toEqual(validAllocation);
      expect(data!.freePoint).toBe("reason");
      expect(data!.stats.finalCombat).toBeDefined();
    });
  });
});
