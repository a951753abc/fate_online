import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ioredis before imports
const mockRedisData = new Map<string, Map<string, string>>();
const mockSets = new Map<string, Set<string>>();
const mockStrings = new Map<string, string>();

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
  set: vi.fn((key: string, value: string) => {
    mockStrings.set(key, value);
    return mockPipeline;
  }),
  sadd: vi.fn((key: string, value: string) => {
    if (!mockSets.has(key)) mockSets.set(key, new Set());
    mockSets.get(key)!.add(value);
    return mockPipeline;
  }),
  srem: vi.fn((key: string, value: string) => {
    mockSets.get(key)?.delete(value);
    return mockPipeline;
  }),
  hdel: vi.fn((key: string, field: string) => {
    getHash(key).delete(field);
    return mockPipeline;
  }),
  del: vi.fn((key: string) => {
    mockRedisData.delete(key);
    mockStrings.delete(key);
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
    for (const [k, v] of hash) {
      result[k] = v;
    }
    return result;
  }),
  hlen: vi.fn(async (key: string) => {
    return getHash(key).size;
  }),
  hdel: vi.fn(async (key: string, field: string) => {
    getHash(key).delete(field);
  }),
  get: vi.fn(async (key: string) => {
    return mockStrings.get(key) ?? null;
  }),
  set: vi.fn(async (key: string, value: string) => {
    mockStrings.set(key, value);
  }),
  del: vi.fn(async (key: string) => {
    mockRedisData.delete(key);
    mockStrings.delete(key);
  }),
  pipeline: vi.fn(() => mockPipeline),
};

vi.mock("../../server/db/redis.js", () => ({
  getRedis: () => mockRedis,
}));

vi.mock("../../server/config.js", () => ({
  config: Object.freeze({
    port: 3000,
    nodeEnv: "test",
    redisUrl: "redis://localhost:6379",
    databaseUrl: "postgresql://localhost:5432/test",
    maxGroups: 7,
    minHumanPairs: 2,
    isDev: true,
  }),
}));

import {
  createRoom,
  joinRoom,
  leaveRoom,
  setRolePreference,
  getRoomState,
  getPlayerRoom,
  canStartGame,
  getInternalPlayers,
} from "../../server/room/roomManager.js";

describe("roomManager", () => {
  beforeEach(() => {
    mockRedisData.clear();
    mockSets.clear();
    mockStrings.clear();
    vi.clearAllMocks();
  });

  describe("createRoom", () => {
    it("creates a room and returns a code", async () => {
      const { code } = await createRoom("player1", "socket1", "Alice");
      expect(code).toHaveLength(6);
    });

    it("stores room data in Redis", async () => {
      const { code } = await createRoom("player1", "socket1", "Alice");
      expect(mockPipeline.hset).toHaveBeenCalled();
      expect(mockPipeline.sadd).toHaveBeenCalledWith("rooms:active", code);
    });

    it("sets player lookup for reverse lookup", async () => {
      await createRoom("player1", "socket1", "Alice");
      expect(mockPipeline.set).toHaveBeenCalled();
    });
  });

  describe("joinRoom", () => {
    it("joins an existing waiting room", async () => {
      const { code } = await createRoom("host", "s-host", "Host");

      const result = await joinRoom(code, "player2", "s-p2", "Bob");
      expect(result.success).toBe(true);
    });

    it("fails when room not found", async () => {
      const result = await joinRoom("XXXXXX", "p1", "s1", "Player");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Room not found");
    });

    it("fails when game already started", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      // Manually set status to starting
      getHash(`room:${code}`).set("status", "starting");

      const result = await joinRoom(code, "p2", "s2", "Player");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Game already started");
    });

    it("fails when room is full", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      // maxGroups=7 → maxPlayers=14; add 13 more players to fill
      const playersHash = getHash(`room:${code}:players`);
      for (let i = 1; i <= 13; i++) {
        playersHash.set(
          `p${i}`,
          JSON.stringify({
            id: `p${i}`,
            socketId: `s${i}`,
            nickname: `P${i}`,
            rolePreference: "any",
            isHost: false,
            isConnected: true,
          }),
        );
      }

      const result = await joinRoom(code, "extra", "s-extra", "Extra");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Room is full");
    });
  });

  describe("leaveRoom", () => {
    it("removes player from room", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await joinRoom(code, "p2", "s-p2", "Bob");

      await leaveRoom(code, "p2");
      // p2 should be deleted from the players hash
      expect(mockPipeline.hdel).toHaveBeenCalled();
    });

    it("cleans up empty room", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      // Remove all players from the mock so hgetall returns empty
      getHash(`room:${code}:players`).clear();

      await leaveRoom(code, "host");
      // Should call del to remove room keys
      expect(mockPipeline.del).toHaveBeenCalled();
      expect(mockPipeline.srem).toHaveBeenCalledWith("rooms:active", code);
    });

    it("transfers host when host leaves", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await joinRoom(code, "p2", "s-p2", "Bob");

      const result = await leaveRoom(code, "host");
      expect(result.hostTransferred).toBeDefined();
    });
  });

  describe("setRolePreference", () => {
    it("updates player role preference", async () => {
      const { code } = await createRoom("host", "s-host", "Host");

      await setRolePreference(code, "host", "master");

      const json = await mockRedis.hget(`room:${code}:players`, "host");
      if (json) {
        const player = JSON.parse(json);
        expect(player.rolePreference).toBe("master");
      }
    });

    it("does nothing for non-existent player", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await setRolePreference(code, "nonexistent", "master");
      // No error thrown
    });
  });

  describe("getRoomState", () => {
    it("returns room state with players", async () => {
      const { code } = await createRoom("host", "s-host", "Host");

      const state = await getRoomState(code);
      expect(state).not.toBeNull();
      expect(state!.code).toBe(code);
      expect(state!.status).toBe("waiting");
      expect(state!.players).toHaveLength(1);
      expect(state!.players[0].nickname).toBe("Host");
      expect(state!.players[0].isHost).toBe(true);
    });

    it("returns null for non-existent room", async () => {
      const state = await getRoomState("XXXXXX");
      expect(state).toBeNull();
    });

    it("returns frozen state", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      const state = await getRoomState(code);
      expect(Object.isFrozen(state)).toBe(true);
    });
  });

  describe("getPlayerRoom", () => {
    it("returns room code for player", async () => {
      await createRoom("host", "s-host", "Host");
      const room = await getPlayerRoom("host");
      expect(room).toHaveLength(6);
    });

    it("returns null for unknown player", async () => {
      const room = await getPlayerRoom("unknown");
      expect(room).toBeNull();
    });
  });

  describe("canStartGame", () => {
    it("cannot start with too few players", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      const check = await canStartGame(code);
      expect(check.canStart).toBe(false);
      expect(check.error).toContain("Need at least");
    });

    it("can start with 4 balanced players", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await setRolePreference(code, "host", "master");
      await joinRoom(code, "p2", "s-p2", "P2");
      await setRolePreference(code, "p2", "servant");
      await joinRoom(code, "p3", "s-p3", "P3");
      await setRolePreference(code, "p3", "master");
      await joinRoom(code, "p4", "s-p4", "P4");
      await setRolePreference(code, "p4", "servant");

      const check = await canStartGame(code);
      expect(check.canStart).toBe(true);
    });

    it("cannot start non-existent room", async () => {
      const check = await canStartGame("XXXXXX");
      expect(check.canStart).toBe(false);
      expect(check.error).toBe("Room not found");
    });

    it("can start with all-any preferences", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await joinRoom(code, "p2", "s-p2", "P2");
      await joinRoom(code, "p3", "s-p3", "P3");
      await joinRoom(code, "p4", "s-p4", "P4");

      const check = await canStartGame(code);
      expect(check.canStart).toBe(true);
    });

    it("cannot start with unbalanced roles", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await setRolePreference(code, "host", "master");
      await joinRoom(code, "p2", "s-p2", "P2");
      await setRolePreference(code, "p2", "master");
      await joinRoom(code, "p3", "s-p3", "P3");
      await setRolePreference(code, "p3", "master");
      await joinRoom(code, "p4", "s-p4", "P4");
      await setRolePreference(code, "p4", "master");

      const check = await canStartGame(code);
      expect(check.canStart).toBe(false);
      expect(check.error).toContain("Cannot balance roles");
    });
  });

  describe("getInternalPlayers", () => {
    it("returns all players in a room", async () => {
      const { code } = await createRoom("host", "s-host", "Host");
      await joinRoom(code, "p2", "s-p2", "Bob");

      const players = await getInternalPlayers(code);
      expect(players.size).toBe(2);
      expect(players.has("host")).toBe(true);
      expect(players.has("p2")).toBe(true);
    });

    it("returns empty map for non-existent room", async () => {
      const players = await getInternalPlayers("XXXXXX");
      expect(players.size).toBe(0);
    });
  });
});
