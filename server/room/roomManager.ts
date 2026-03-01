import { getRedis } from "../db/redis.js";
import { config } from "../config.js";
import { generateRoomCode } from "./roomCodeGenerator.js";
import type { InternalPlayer } from "./types.js";
import type { PlayerInfo, RolePreference, RoomState } from "../shared/protocol.js";

// Redis key helpers
const roomKey = (code: string) => `room:${code}`;
const playersKey = (code: string) => `room:${code}:players`;
const playerLookupKey = (playerId: string) => `player:${playerId}`;

function serializePlayer(player: InternalPlayer): string {
  return JSON.stringify(player);
}

function deserializePlayer(json: string): InternalPlayer {
  return JSON.parse(json) as InternalPlayer;
}

function toPlayerInfo(player: InternalPlayer): PlayerInfo {
  return Object.freeze({
    id: player.id,
    nickname: player.nickname,
    rolePreference: player.rolePreference,
    isHost: player.isHost,
    isConnected: player.isConnected,
  });
}

export async function createRoom(
  playerId: string,
  socketId: string,
  nickname: string,
): Promise<{ code: string }> {
  const redis = getRedis();
  const code = generateRoomCode();

  const player: InternalPlayer = Object.freeze({
    id: playerId,
    socketId,
    nickname,
    rolePreference: "any" as RolePreference,
    isHost: true,
    isConnected: true,
  });

  const pipeline = redis.pipeline();
  pipeline.hset(roomKey(code), {
    hostPlayerId: playerId,
    status: "waiting",
    maxGroups: config.maxGroups.toString(),
    minHumanPairs: config.minHumanPairs.toString(),
    createdAt: new Date().toISOString(),
  });
  pipeline.hset(playersKey(code), playerId, serializePlayer(player));
  pipeline.set(playerLookupKey(playerId), code, "EX", 3600);
  pipeline.sadd("rooms:active", code);
  await pipeline.exec();

  return { code };
}

export async function joinRoom(
  code: string,
  playerId: string,
  socketId: string,
  nickname: string,
): Promise<{ success: boolean; error?: string }> {
  const redis = getRedis();

  const roomData = await redis.hgetall(roomKey(code));
  if (!roomData.status) {
    return { success: false, error: "Room not found" };
  }
  if (roomData.status !== "waiting") {
    return { success: false, error: "Game already started" };
  }

  const maxPlayers = parseInt(roomData.maxGroups, 10) * 2;
  const playerCount = await redis.hlen(playersKey(code));
  if (playerCount >= maxPlayers) {
    return { success: false, error: "Room is full" };
  }

  const player: InternalPlayer = Object.freeze({
    id: playerId,
    socketId,
    nickname,
    rolePreference: "any" as RolePreference,
    isHost: false,
    isConnected: true,
  });

  const pipeline = redis.pipeline();
  pipeline.hset(playersKey(code), playerId, serializePlayer(player));
  pipeline.set(playerLookupKey(playerId), code, "EX", 3600);
  await pipeline.exec();

  return { success: true };
}

export async function leaveRoom(
  code: string,
  playerId: string,
): Promise<{ hostTransferred?: string }> {
  const redis = getRedis();

  const pipeline = redis.pipeline();
  pipeline.hdel(playersKey(code), playerId);
  pipeline.del(playerLookupKey(playerId));
  await pipeline.exec();

  const remaining = await redis.hgetall(playersKey(code));
  const remainingIds = Object.keys(remaining);

  if (remainingIds.length === 0) {
    // Clean up empty room
    const cleanup = redis.pipeline();
    cleanup.del(roomKey(code));
    cleanup.del(playersKey(code));
    cleanup.srem("rooms:active", code);
    await cleanup.exec();
    return {};
  }

  // Transfer host if needed
  const roomData = await redis.hgetall(roomKey(code));
  if (roomData.hostPlayerId === playerId) {
    const newHostId = remainingIds[0]!;
    const newHostData = deserializePlayer(remaining[newHostId]!);
    const updatedHost: InternalPlayer = { ...newHostData, isHost: true };

    // Remove old host flag from all, set new host
    const hostPipeline = redis.pipeline();
    for (const [id, json] of Object.entries(remaining)) {
      const p = deserializePlayer(json as string);
      hostPipeline.hset(playersKey(code), id, serializePlayer({ ...p, isHost: id === newHostId }));
    }
    hostPipeline.hset(roomKey(code), "hostPlayerId", newHostId);
    await hostPipeline.exec();

    return { hostTransferred: updatedHost.nickname };
  }

  return {};
}

export async function setRolePreference(
  code: string,
  playerId: string,
  rolePreference: RolePreference,
): Promise<void> {
  const redis = getRedis();
  const json = await redis.hget(playersKey(code), playerId);
  if (!json) return;

  const player = deserializePlayer(json);
  const updated: InternalPlayer = { ...player, rolePreference };
  await redis.hset(playersKey(code), playerId, serializePlayer(updated));
}

export async function setPlayerConnection(
  code: string,
  playerId: string,
  isConnected: boolean,
): Promise<void> {
  const redis = getRedis();
  const json = await redis.hget(playersKey(code), playerId);
  if (!json) return;

  const player = deserializePlayer(json);
  const updated: InternalPlayer = { ...player, isConnected };
  await redis.hset(playersKey(code), playerId, serializePlayer(updated));
}

export async function getRoomState(code: string): Promise<RoomState | null> {
  const redis = getRedis();

  const [roomData, playersData] = await Promise.all([
    redis.hgetall(roomKey(code)),
    redis.hgetall(playersKey(code)),
  ]);

  if (!roomData.status) return null;

  const players = Object.values(playersData).map((json) =>
    toPlayerInfo(deserializePlayer(json as string)),
  );

  return Object.freeze({
    code,
    status: roomData.status as RoomState["status"],
    players,
    maxGroups: parseInt(roomData.maxGroups, 10),
    minHumanPairs: parseInt(roomData.minHumanPairs, 10),
  });
}

export async function getPlayerRoom(playerId: string): Promise<string | null> {
  const redis = getRedis();
  return redis.get(playerLookupKey(playerId));
}

export async function canStartGame(code: string): Promise<{ canStart: boolean; error?: string }> {
  const state = await getRoomState(code);
  if (!state) return { canStart: false, error: "Room not found" };
  if (state.status !== "waiting") return { canStart: false, error: "Game already started" };

  const playerCount = state.players.length;
  if (playerCount < state.minHumanPairs * 2) {
    return {
      canStart: false,
      error: `Need at least ${state.minHumanPairs * 2} players (${playerCount} joined)`,
    };
  }

  // Check role balance: must have enough Masters and Servants (or "any" to fill)
  const masters = state.players.filter((p) => p.rolePreference === "master").length;
  const servants = state.players.filter((p) => p.rolePreference === "servant").length;
  const any = state.players.filter((p) => p.rolePreference === "any").length;

  const pairs = Math.floor(playerCount / 2);
  const mastersNeeded = Math.max(0, pairs - masters);
  const servantsNeeded = Math.max(0, pairs - servants);

  if (mastersNeeded + servantsNeeded > any) {
    return { canStart: false, error: "Cannot balance roles with current preferences" };
  }

  return { canStart: true };
}

export async function startGame(code: string): Promise<void> {
  const redis = getRedis();
  await redis.hset(roomKey(code), "status", "starting");
}

export async function getInternalPlayers(
  code: string,
): Promise<ReadonlyMap<string, InternalPlayer>> {
  const redis = getRedis();
  const playersData = await redis.hgetall(playersKey(code));
  const map = new Map<string, InternalPlayer>();
  for (const [id, json] of Object.entries(playersData)) {
    map.set(id, deserializePlayer(json as string));
  }
  return map;
}
