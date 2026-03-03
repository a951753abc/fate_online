import { getRedis } from "../db/redis.js";
import type { GroupState } from "./types.js";
import type { AbilityStatKey, LevelAllocation, MasterLevelId } from "./character/masterTypes.js";
import type { ComputedStats } from "./character/masterTypes.js";
import type { PrepPlayerState, PrepStatus, SkillSelectionPayload } from "../shared/protocol.js";
import type { SkillSelection, SkillInstanceConfig } from "./character/skills/types.js";
import { validateAllocation, computeAllStats } from "./character/masterStats.js";
import { DEFAULT_LEVEL_CONFIG } from "./character/masterLevels.js";
import { validateSkillSelection } from "./character/skills/skillValidation.js";
import {
  getClassSkillAcquisition,
  computeExpectedSkillCount,
} from "./character/skills/acquisitionRules.js";
import { getClassNormalSkills, findSkillDef } from "./character/skills/index.js";

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
  readonly skillSelections: readonly SkillSelection[];
}

export interface SubmitResult {
  readonly success: boolean;
  readonly error?: string;
  readonly stats?: ComputedStats;
  readonly players?: readonly PrepPlayerState[];
}

// --- NPC Auto Skill Selection ---

/**
 * 為 NPC 自動生成技能選擇（簡單策略：滿足初期步驟 + 取前 N 個非額外非要素技能）
 */
function generateNpcSkillSelection(classId: MasterLevelId, classLevel: number): SkillSelection {
  const acq = getClassSkillAcquisition(classId);
  const normalSkills = getClassNormalSkills(classId);
  const totalNeeded = computeExpectedSkillCount(classId, classLevel);
  const selected: string[] = [];
  const selectedSet = new Set<string>();
  const configs: Record<string, readonly SkillInstanceConfig[]> = {};

  const addSkill = (id: string) => {
    if (!selectedSet.has(id)) {
      selectedSet.add(id);
      selected.push(id);
    }
  };

  // 按照初期步驟挑選
  for (const step of acq.initialSteps) {
    switch (step.type) {
      case "required":
        for (const sid of step.skillIds ?? []) addSkill(sid);
        break;
      case "choose_one":
        // 選第一個選項
        if (step.skillIds && step.skillIds.length > 0) addSkill(step.skillIds[0]);
        break;
      case "free":
        // 之後填充
        break;
    }
  }

  // 用非額外、非 compositionOnly 技能填充剩餘位置
  for (const skill of normalSkills) {
    if (selected.length >= totalNeeded) break;
    if (skill.compositionOnly) continue;
    addSkill(skill.id);
  }

  // 為需要配置的技能生成 NPC 預設配置
  for (const skillId of selected) {
    const def = findSkillDef(skillId);
    if (!def?.configType) continue;

    switch (def.configType) {
      case "attribute_distribution": {
        // NPC 簡單策略：全部分配到第一種屬性（地）
        const totalPts = classLevel + 1;
        configs[skillId] = Object.freeze([
          Object.freeze({
            type: "attribute_distribution" as const,
            distribution: Object.freeze({ earth: totalPts }),
          }),
        ]);
        break;
      }
      case "familiar":
        configs[skillId] = Object.freeze([
          Object.freeze({ type: "familiar" as const, familiarType: "dog" as const }),
        ]);
        break;
      case "mystic_code":
        configs[skillId] = Object.freeze([
          Object.freeze({ type: "mystic_code" as const, mysticCodeId: "mc-azoth-sword" }),
        ]);
        break;
      case "composition":
        configs[skillId] = Object.freeze([
          Object.freeze({
            type: "composition" as const,
            mode: "new" as const,
            elements: Object.freeze([
              Object.freeze({ elementSkillId: "mag-element-damage" }),
              Object.freeze({ elementSkillId: "mag-element-attack-type", subChoice: "spirit" }),
              Object.freeze({ elementSkillId: "mag-element-chant" }),
            ]),
          }),
        ]);
        break;
    }
  }

  return Object.freeze({
    classId,
    classLevel,
    selectedSkillIds: Object.freeze(selected),
    skillConfigs: Object.freeze(configs),
  });
}

// Pre-compute NPC master data (always magician LV{gameLevel}, freePoint: reason)
const NPC_MASTER_ALLOCATION: readonly LevelAllocation[] = Object.freeze([
  {
    levelId: "magician",
    level: DEFAULT_LEVEL_CONFIG.gameLevel,
    startingLevel: DEFAULT_LEVEL_CONFIG.gameLevel,
  },
]);
const NPC_MASTER_SKILLS: readonly SkillSelection[] = Object.freeze([
  generateNpcSkillSelection("magician", DEFAULT_LEVEL_CONFIG.gameLevel),
]);
const NPC_MASTER_DATA: CharacterData = Object.freeze({
  allocation: NPC_MASTER_ALLOCATION,
  freePoint: "reason",
  stats: computeAllStats(NPC_MASTER_ALLOCATION, "reason"),
  skillSelections: NPC_MASTER_SKILLS,
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
  skillSelections: readonly SkillSelectionPayload[],
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

  // Validate skill selections match allocation
  const allocMap = new Map<string, number>(allocation.map((a) => [a.levelId, a.level]));
  if (skillSelections.length !== allocation.length) {
    return Object.freeze({
      success: false,
      error: `技能選擇數量不符：需要 ${allocation.length} 個級別，但收到 ${skillSelections.length} 個`,
    });
  }

  for (const sel of skillSelections) {
    if (!allocMap.has(sel.classId)) {
      return Object.freeze({
        success: false,
        error: `技能選擇的級別 ${sel.classId} 不在等級配置中`,
      });
    }

    // Validate class level matches allocation
    const allocLevel = allocMap.get(sel.classId)!;
    if (sel.classLevel !== allocLevel) {
      return Object.freeze({
        success: false,
        error: `技能選擇的等級不符：${sel.classId} 應為 LV${allocLevel}，但收到 LV${sel.classLevel}`,
      });
    }

    // Validate skill selection using the existing validation system
    const classId = sel.classId as MasterLevelId;
    const skillValidation = validateSkillSelection({
      classId,
      classLevel: sel.classLevel,
      selectedSkillIds: sel.selectedSkillIds,
      skillConfigs: sel.skillConfigs as unknown as
        | Readonly<Record<string, readonly SkillInstanceConfig[]>>
        | undefined,
    });
    if (!skillValidation.valid) {
      const firstError = skillValidation.errors[0];
      return Object.freeze({
        success: false,
        error: `技能驗證失敗（${sel.classId}）：${firstError.message}`,
      });
    }
  }

  // Compute stats
  const stats = computeAllStats(allocation, freePoint);

  // Build SkillSelection array
  const validatedSelections: readonly SkillSelection[] = Object.freeze(
    skillSelections.map((sel) =>
      Object.freeze({
        classId: sel.classId as MasterLevelId,
        classLevel: sel.classLevel,
        selectedSkillIds: Object.freeze([...sel.selectedSkillIds]),
        skillConfigs: sel.skillConfigs
          ? Object.freeze(
              sel.skillConfigs as unknown as Readonly<
                Record<string, readonly SkillInstanceConfig[]>
              >,
            )
          : undefined,
      }),
    ),
  );

  // Store + read updated prep state in one pipeline
  const charData: CharacterData = {
    allocation,
    freePoint,
    stats,
    skillSelections: validatedSelections,
  };
  const updatedStatus = rawStatus("submitted", role);
  const pipeline = redis.pipeline();
  pipeline.hset(chardataKey(roomCode), characterId, JSON.stringify(charData));
  pipeline.hset(prepKey(roomCode), characterId, updatedStatus);
  pipeline.hgetall(prepKey(roomCode));
  const results = await pipeline.exec();

  // Pipeline result [2] is the hgetall — build player list from it
  const prepRaw = (results?.[2]?.[1] ?? {}) as Record<string, string>;
  // Ensure our write is reflected (pipeline reads may see pre-write state)
  prepRaw[characterId] = updatedStatus;
  const players = buildPrepPlayersFromSnapshot(prepRaw);

  return Object.freeze({ success: true, stats, players });
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
