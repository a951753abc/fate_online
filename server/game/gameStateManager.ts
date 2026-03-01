import { getRedis } from "../db/redis.js";
import type { LocationId } from "./map/types.js";
import type {
  GameState,
  GameStatus,
  NightPhase,
  NightState,
  CharacterState,
  GroupState,
  OccupationEntry,
} from "./types.js";
import { getValidMoves, getAdjacentLocations } from "./map/mapUtils.js";
import { LOCATION_IDS, LEY_LINE_LOCATIONS } from "./map/mapData.js";

// Redis key helpers
const gameKey = (code: string) => `game:${code}`;
const groupsKey = (code: string) => `game:${code}:groups`;
const charsKey = (code: string) => `game:${code}:characters`;
const occupationsKey = (code: string) => `game:${code}:occupations`;
const movesKey = (code: string) => `game:${code}:moves`;
const destroyedKey = (code: string) => `game:${code}:destroyed`;

export async function initializeGame(
  roomCode: string,
  groups: readonly GroupState[],
  characters: readonly CharacterState[],
): Promise<GameState> {
  const redis = getRedis();
  const now = Date.now();
  const night: NightState = Object.freeze({
    nightNumber: 1,
    phase: "free_action" as NightPhase,
    phaseEndsAt: now,
  });

  const pipeline = redis.pipeline();

  pipeline.hset(gameKey(roomCode), {
    status: "active",
    nightNumber: "1",
    nightPhase: "free_action",
    phaseEndsAt: String(now),
  });

  for (const group of groups) {
    pipeline.hset(groupsKey(roomCode), String(group.groupIndex), JSON.stringify(group));
  }

  for (const char of characters) {
    pipeline.hset(charsKey(roomCode), char.characterId, JSON.stringify(char));
  }

  await pipeline.exec();

  return Object.freeze({
    roomCode,
    status: "active",
    groups,
    characters,
    occupations: [],
    night,
    destroyedLocations: [],
  });
}

export async function getGameState(roomCode: string): Promise<GameState | null> {
  const redis = getRedis();
  const meta = await redis.hgetall(gameKey(roomCode));
  if (!meta.status) return null;

  const [groupsRaw, charsRaw, occupationsRaw, destroyed] = await Promise.all([
    redis.hgetall(groupsKey(roomCode)),
    redis.hgetall(charsKey(roomCode)),
    redis.hgetall(occupationsKey(roomCode)),
    redis.smembers(destroyedKey(roomCode)),
  ]);

  const groups = Object.values(groupsRaw).map((v) => JSON.parse(v) as GroupState);
  const characters = Object.values(charsRaw).map((v) => JSON.parse(v) as CharacterState);
  const occupations = Object.values(occupationsRaw).map((v) => JSON.parse(v) as OccupationEntry);

  return Object.freeze({
    roomCode,
    status: meta.status as GameStatus,
    groups: Object.freeze(groups),
    characters: Object.freeze(characters),
    occupations: Object.freeze(occupations),
    night: Object.freeze({
      nightNumber: Number(meta.nightNumber),
      phase: meta.nightPhase as NightPhase,
      phaseEndsAt: Number(meta.phaseEndsAt),
    }),
    destroyedLocations: Object.freeze(destroyed as LocationId[]),
  });
}

export async function getCharacter(
  roomCode: string,
  characterId: string,
): Promise<CharacterState | null> {
  const redis = getRedis();
  const raw = await redis.hget(charsKey(roomCode), characterId);
  if (!raw) return null;
  return JSON.parse(raw) as CharacterState;
}

export async function getAllCharacters(roomCode: string): Promise<readonly CharacterState[]> {
  const redis = getRedis();
  const raw = await redis.hgetall(charsKey(roomCode));
  return Object.freeze(Object.values(raw).map((v) => JSON.parse(v) as CharacterState));
}

export async function submitMove(
  roomCode: string,
  characterId: string,
  target: LocationId,
): Promise<{ readonly success: boolean; readonly error?: string }> {
  const redis = getRedis();

  const [meta, destroyed] = await Promise.all([
    redis.hgetall(gameKey(roomCode)),
    redis.smembers(destroyedKey(roomCode)),
  ]);
  if (meta.nightPhase !== "free_action") {
    return Object.freeze({ success: false, error: "Not in free action phase" });
  }
  if (destroyed.includes(target)) {
    return Object.freeze({ success: false, error: "Location is destroyed" });
  }

  const charRaw = await redis.hget(charsKey(roomCode), characterId);
  if (!charRaw) {
    return Object.freeze({ success: false, error: "Character not found" });
  }
  const char = JSON.parse(charRaw) as CharacterState;

  if (target === char.location) {
    await redis.hset(movesKey(roomCode), characterId, target);
    return Object.freeze({ success: true });
  }

  const isAtStation = char.location === "station";
  const validMoves = getValidMoves(char.location, isAtStation);
  if (!validMoves.includes(target)) {
    return Object.freeze({ success: false, error: "Invalid move: not reachable" });
  }

  await redis.hset(movesKey(roomCode), characterId, target);
  return Object.freeze({ success: true });
}

export async function getPendingMoves(roomCode: string): Promise<ReadonlyMap<string, LocationId>> {
  const redis = getRedis();
  const raw = await redis.hgetall(movesKey(roomCode));
  const moves = new Map<string, LocationId>();
  for (const [charId, loc] of Object.entries(raw)) {
    moves.set(charId, loc as LocationId);
  }
  return moves;
}

export async function resolveMovement(roomCode: string): Promise<readonly CharacterState[]> {
  const redis = getRedis();
  const [charsRaw, movesRaw] = await Promise.all([
    redis.hgetall(charsKey(roomCode)),
    redis.hgetall(movesKey(roomCode)),
  ]);

  const pipeline = redis.pipeline();
  const updatedChars: CharacterState[] = [];

  for (const [charId, charJson] of Object.entries(charsRaw)) {
    const char = JSON.parse(charJson as string) as CharacterState;
    const newLocation = (movesRaw[charId] as LocationId | undefined) ?? char.location;
    const updated: CharacterState = Object.freeze({ ...char, location: newLocation });
    updatedChars.push(updated);
    pipeline.hset(charsKey(roomCode), charId, JSON.stringify(updated));
  }

  pipeline.del(movesKey(roomCode));
  await pipeline.exec();

  return Object.freeze(updatedChars);
}

export async function updateOccupations(roomCode: string): Promise<readonly OccupationEntry[]> {
  const redis = getRedis();
  const [charsRaw, movesRaw, groupsRaw] = await Promise.all([
    redis.hgetall(charsKey(roomCode)),
    redis.hgetall(movesKey(roomCode)),
    redis.hgetall(groupsKey(roomCode)),
  ]);

  const characters = Object.values(charsRaw).map((v) => JSON.parse(v) as CharacterState);
  const groups = Object.values(groupsRaw).map((v) => JSON.parse(v) as GroupState);
  const eliminatedGroups = new Set(groups.filter((g) => g.isEliminated).map((g) => g.groupIndex));

  // Characters who didn't submit a move or submitted "stay" (same location) = stationary
  const stationaryChars = characters.filter((char) => {
    if (eliminatedGroups.has(char.groupIndex)) return false;
    const move = movesRaw[char.characterId] as string | undefined;
    return !move || move === char.location;
  });

  // Group stationary chars by location
  const locationGroups = new Map<LocationId, CharacterState[]>();
  for (const char of stationaryChars) {
    const list = locationGroups.get(char.location);
    if (list) {
      list.push(char);
    } else {
      locationGroups.set(char.location, [char]);
    }
  }

  const occupations: OccupationEntry[] = [];
  for (const [locationId, chars] of locationGroups) {
    // Get unique group indices at this location
    const groupIndices = [...new Set(chars.map((c) => c.groupIndex))];
    // Contested (2+ groups) = no occupation
    if (groupIndices.length !== 1) continue;

    const groupIndex = groupIndices[0];
    const types = new Set(chars.map((c) => c.type));
    const occupiedBy =
      types.size === 2 ? "both" : (types.values().next().value as "master" | "servant");

    occupations.push(Object.freeze({ locationId, groupIndex, occupiedBy }));
  }

  // Write to Redis
  const pipeline = redis.pipeline();
  pipeline.del(occupationsKey(roomCode));
  for (const occ of occupations) {
    pipeline.hset(occupationsKey(roomCode), occ.locationId, JSON.stringify(occ));
  }
  await pipeline.exec();

  return Object.freeze(occupations);
}

export async function setPhase(
  roomCode: string,
  phase: NightPhase,
  phaseEndsAt: number,
): Promise<void> {
  const redis = getRedis();
  await redis.hset(gameKey(roomCode), { nightPhase: phase, phaseEndsAt: String(phaseEndsAt) });
}

export async function advanceNight(roomCode: string): Promise<NightState> {
  const redis = getRedis();
  const meta = await redis.hgetall(gameKey(roomCode));
  const nextNight = Number(meta.nightNumber) + 1;
  const now = Date.now();

  await redis.hset(gameKey(roomCode), {
    nightNumber: String(nextNight),
    nightPhase: "free_action",
    phaseEndsAt: String(now),
  });

  return Object.freeze({
    nightNumber: nextNight,
    phase: "free_action" as NightPhase,
    phaseEndsAt: now,
  });
}

export async function setGameStatus(roomCode: string, status: GameStatus): Promise<void> {
  const redis = getRedis();
  await redis.hset(gameKey(roomCode), { status });
}

export async function destroyLocations(
  roomCode: string,
  count: number,
  nightNumber: number,
): Promise<readonly LocationId[]> {
  const redis = getRedis();
  const alreadyDestroyed = await redis.smembers(destroyedKey(roomCode));
  const alreadySet = new Set(alreadyDestroyed);

  const candidates = LOCATION_IDS.filter((id) => {
    if (alreadySet.has(id)) return false;
    // Protect ley line locations before Night 12
    if (nightNumber < 12 && LEY_LINE_LOCATIONS.includes(id)) {
      // Only protect if at least one ley line would remain
      const remainingLeyLines = LEY_LINE_LOCATIONS.filter((ll) => !alreadySet.has(ll) && ll !== id);
      if (remainingLeyLines.length === 0) return false;
    }
    return true;
  });

  // Shuffle and pick
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const toDestroy = shuffled.slice(0, Math.min(count, shuffled.length));

  if (toDestroy.length > 0) {
    await redis.sadd(destroyedKey(roomCode), ...toDestroy);

    // Scatter displaced characters
    const charsRaw = await redis.hgetall(charsKey(roomCode));
    const pipeline = redis.pipeline();
    for (const [charId, charJson] of Object.entries(charsRaw)) {
      const char = JSON.parse(charJson as string) as CharacterState;
      if (toDestroy.includes(char.location)) {
        const adjacent = getAdjacentLocations(char.location);
        const safe = adjacent.filter((loc) => !alreadySet.has(loc) && !toDestroy.includes(loc));
        if (safe.length > 0) {
          const newLoc = safe[Math.floor(Math.random() * safe.length)];
          const updated = { ...char, location: newLoc };
          pipeline.hset(charsKey(roomCode), charId, JSON.stringify(updated));
        }
      }
    }
    await pipeline.exec();
  }

  return Object.freeze(toDestroy as LocationId[]);
}
