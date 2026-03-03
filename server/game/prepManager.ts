import { getRedis } from "../db/redis.js";
import type { GroupState } from "./types.js";
import type { AbilityStatKey, LevelAllocation } from "./character/masterTypes.js";
import type { ComputedStats } from "./character/masterTypes.js";
import type { PrepPlayerState, PrepStatus } from "../shared/protocol.js";
import { validateAllocation, computeAllStats } from "./character/masterStats.js";
import { DEFAULT_LEVEL_CONFIG } from "./character/masterLevels.js";

// Redis key helpers
const prepKey = (code: string) => `game:${code}:prep`;
const chardataKey = (code: string) => `game:${code}:chardata`;

// Prep hash stores "status:role" to avoid fragile string-sniffing on characterId
const VALID_STATUSES = new Set<string>(["pending", "submitted", "ready"]);
const VALID_ROLES = new Set<string>(["master", "servant"]);

function rawStatus(status: PrepStatus, role: "master" | "servant"): string {
  return `${status}:${role}`;
}

function parseRawStatus(raw: string): {
  readonly status: PrepStatus;
  readonly role: "master" | "servant";
} {
  const idx = raw.indexOf(":");
  const status = raw.slice(0, idx);
  const role = raw.slice(idx + 1);
  if (!VALID_STATUSES.has(status) || !VALID_ROLES.has(role)) {
    throw new Error(`Corrupt prep status in Redis: "${raw}"`);
  }
  return { status: status as PrepStatus, role: role as "master" | "servant" };
}

export interface CharacterData {
  readonly allocation: readonly LevelAllocation[];
  readonly freePoint: AbilityStatKey;
  readonly stats: ComputedStats;
}

export interface SubmitResult {
  readonly success: boolean;
  readonly error?: string;
  readonly stats?: ComputedStats;
}

// Pre-compute NPC master data (always magician LV{gameLevel}, freePoint: reason)
const NPC_MASTER_ALLOCATION: readonly LevelAllocation[] = Object.freeze([
  { levelId: "magician", level: DEFAULT_LEVEL_CONFIG.gameLevel },
]);
const NPC_MASTER_DATA: CharacterData = Object.freeze({
  allocation: NPC_MASTER_ALLOCATION,
  freePoint: "reason",
  stats: computeAllStats(NPC_MASTER_ALLOCATION, "reason"),
});
const NPC_MASTER_DATA_JSON = JSON.stringify(NPC_MASTER_DATA);

// === Initialize Preparation ===

export async function initializePrep(
  roomCode: string,
  groups: readonly GroupState[],
): Promise<void> {
  const redis = getRedis();

  const prepFields: Record<string, string> = {};
  const chardataFields: Record<string, string> = {};

  for (const group of groups) {
    prepFields[group.servantId] = rawStatus("ready", "servant");
    if (group.isNpc) {
      prepFields[group.masterId] = rawStatus("ready", "master");
      chardataFields[group.masterId] = NPC_MASTER_DATA_JSON;
    } else {
      prepFields[group.masterId] = rawStatus("pending", "master");
    }
  }

  const pipeline = redis.pipeline();
  pipeline.hset(prepKey(roomCode), prepFields);
  if (Object.keys(chardataFields).length > 0) {
    pipeline.hset(chardataKey(roomCode), chardataFields);
  }
  await pipeline.exec();
}

// === Submit Master Build ===

export async function submitMasterBuild(
  roomCode: string,
  characterId: string,
  allocation: readonly LevelAllocation[],
  freePoint: AbilityStatKey,
): Promise<SubmitResult> {
  const redis = getRedis();

  // Check player is in prep and is pending/submitted (not already ready)
  const currentRaw = await redis.hget(prepKey(roomCode), characterId);
  if (!currentRaw) {
    return Object.freeze({ success: false, error: "角色不在準備階段中" });
  }
  const { status: currentStatus, role } = parseRawStatus(currentRaw);
  if (currentStatus === "ready") {
    return Object.freeze({ success: false, error: "角色已確認就緒，無法修改" });
  }

  // Validate allocation total = gameLevel (starting + upgrade combined)
  const validationError = validateAllocation(allocation);
  if (validationError) {
    return Object.freeze({ success: false, error: validationError });
  }

  // Compute stats
  const stats = computeAllStats(allocation, freePoint);

  // Store
  const charData: CharacterData = { allocation, freePoint, stats };
  const pipeline = redis.pipeline();
  pipeline.hset(chardataKey(roomCode), characterId, JSON.stringify(charData));
  pipeline.hset(prepKey(roomCode), characterId, rawStatus("submitted", role));
  await pipeline.exec();

  return Object.freeze({ success: true, stats });
}

// === Confirm Ready ===

export interface ConfirmReadyResult {
  readonly success: boolean;
  readonly allReady: boolean;
  readonly players: readonly PrepPlayerState[];
}

export async function confirmReady(
  roomCode: string,
  characterId: string,
): Promise<ConfirmReadyResult> {
  const redis = getRedis();

  // Parallel read: full prep hash (reused for player list) + chardata existence check
  const [prepRaw, charData] = await Promise.all([
    redis.hgetall(prepKey(roomCode)),
    redis.hget(chardataKey(roomCode), characterId),
  ]);
  const currentRaw = prepRaw[characterId] ?? null;
  if (!charData || !currentRaw) {
    return Object.freeze({ success: false, allReady: false, players: [] });
  }

  const { role } = parseRawStatus(currentRaw);
  const updatedRawStatus = rawStatus("ready", role);
  await redis.hset(prepKey(roomCode), characterId, updatedRawStatus);

  // Build player list from the snapshot + the write we just did
  const updatedPrepRaw = { ...prepRaw, [characterId]: updatedRawStatus };
  const players = buildPrepPlayersFromSnapshot(updatedPrepRaw);
  const allReady = players.every((p) => p.status === "ready");

  return Object.freeze({ success: true, allReady, players });
}

// === Query ===

// Build PrepPlayerState[] from a raw Redis hash snapshot
function buildPrepPlayersFromSnapshot(
  raw: Readonly<Record<string, string>>,
): readonly PrepPlayerState[] {
  const players: PrepPlayerState[] = [];
  for (const [characterId, rawValue] of Object.entries(raw)) {
    const { status, role } = parseRawStatus(rawValue);
    players.push(Object.freeze({ characterId, role, status }));
  }
  return Object.freeze(players);
}

export async function getPrepState(roomCode: string): Promise<readonly PrepPlayerState[]> {
  const redis = getRedis();
  const raw = await redis.hgetall(prepKey(roomCode));
  return buildPrepPlayersFromSnapshot(raw);
}

export async function getCharacterData(
  roomCode: string,
  characterId: string,
): Promise<CharacterData | null> {
  const redis = getRedis();
  const raw = await redis.hget(chardataKey(roomCode), characterId);
  if (!raw) return null;
  return JSON.parse(raw) as CharacterData;
}
