import type {
  LevelAllocation,
  LevelConfig,
  MasterBaseStats,
  CombatModifiers,
  ComputedStats,
  AbilityStatKey,
  MasterLevelId,
} from "./masterTypes.js";
import { MAX_LEVEL } from "./masterTypes.js";
import { getMasterLevelDef, MASTER_LEVEL_IDS, DEFAULT_LEVEL_CONFIG } from "./masterLevels.js";

// === Validation ===

export function validateAllocation(
  allocation: readonly LevelAllocation[],
  config: LevelConfig = DEFAULT_LEVEL_CONFIG,
): string | null {
  if (allocation.length === 0) {
    return "至少需要選擇一個級別";
  }

  if (allocation.length > config.maxClasses) {
    return `最多只能選擇 ${config.maxClasses} 個級別`;
  }

  const seen = new Set<MasterLevelId>();
  let totalLevel = 0;

  for (const entry of allocation) {
    if (!MASTER_LEVEL_IDS.includes(entry.levelId)) {
      return `未知的級別: ${entry.levelId}`;
    }
    if (seen.has(entry.levelId)) {
      return `級別不可重複: ${entry.levelId}`;
    }
    if (!Number.isInteger(entry.level)) {
      return `級別等級必須為整數: ${entry.levelId}`;
    }
    if (entry.level < 1) {
      return `級別等級至少為 1: ${entry.levelId}`;
    }
    if (entry.level > MAX_LEVEL) {
      return `級別等級最多為 ${MAX_LEVEL}: ${entry.levelId}`;
    }
    seen.add(entry.levelId);
    totalLevel += entry.level;
  }

  if (totalLevel !== config.gameLevel) {
    return `等級總和必須為 ${config.gameLevel}，目前為 ${totalLevel}`;
  }

  return null;
}

// === Base Abilities ===

export function computeBaseAbilities(
  allocation: readonly LevelAllocation[],
  freePoint: AbilityStatKey,
): MasterBaseStats {
  let body = 0;
  let perception = 0;
  let reason = 0;
  let will = 0;

  for (const entry of allocation) {
    const def = getMasterLevelDef(entry.levelId);
    body += def.baseStats.body * entry.level;
    perception += def.baseStats.perception * entry.level;
    reason += def.baseStats.reason * entry.level;
    will += def.baseStats.will * entry.level;
  }

  const base = { body, perception, reason, will };
  return Object.freeze({ ...base, [freePoint]: base[freePoint] + 1 });
}

// === Ability Bonuses ===

export function computeBonuses(baseAbilities: MasterBaseStats): MasterBaseStats {
  return Object.freeze({
    body: Math.floor(baseAbilities.body / 3),
    perception: Math.floor(baseAbilities.perception / 3),
    reason: Math.floor(baseAbilities.reason / 3),
    will: Math.floor(baseAbilities.will / 3),
  });
}

// === Base Combat Values ===

export function computeBaseCombat(bonuses: MasterBaseStats): CombatModifiers {
  return Object.freeze({
    melee: bonuses.body + bonuses.perception,
    ranged: bonuses.perception + bonuses.reason,
    spirit: bonuses.reason + bonuses.will,
    action: bonuses.body + bonuses.will,
    hp: (bonuses.body + bonuses.reason) * 5,
    focus: (bonuses.perception + bonuses.will) * 5,
    defense: 0,
  });
}

// === Combat Modifier Arithmetic ===

const ZERO_COMBAT: CombatModifiers = Object.freeze({
  melee: 0,
  ranged: 0,
  spirit: 0,
  action: 0,
  hp: 0,
  focus: 0,
  defense: 0,
});

function addCombatModifiers(a: CombatModifiers, b: CombatModifiers): CombatModifiers {
  return Object.freeze({
    melee: a.melee + b.melee,
    ranged: a.ranged + b.ranged,
    spirit: a.spirit + b.spirit,
    action: a.action + b.action,
    hp: a.hp + b.hp,
    focus: a.focus + b.focus,
    defense: a.defense + b.defense,
  });
}

// === Level Modifiers ===

export function computeLevelModifiers(allocation: readonly LevelAllocation[]): CombatModifiers {
  return allocation.reduce((acc, entry) => {
    const mod = getMasterLevelDef(entry.levelId).modifiers[entry.level - 1]; // index 0 = LV1
    return addCombatModifiers(acc, mod);
  }, ZERO_COMBAT);
}

// === Final Combat Values ===

export function computeFinalCombat(
  baseCombat: CombatModifiers,
  levelModifiers: CombatModifiers,
): CombatModifiers {
  return addCombatModifiers(baseCombat, levelModifiers);
}

// === All-in-one ===

export function computeAllStats(
  allocation: readonly LevelAllocation[],
  freePoint: AbilityStatKey,
): ComputedStats {
  const baseAbilities = computeBaseAbilities(allocation, freePoint);
  const bonuses = computeBonuses(baseAbilities);
  const baseCombat = computeBaseCombat(bonuses);
  const levelModifiers = computeLevelModifiers(allocation);
  const finalCombat = computeFinalCombat(baseCombat, levelModifiers);

  return Object.freeze({ baseAbilities, bonuses, baseCombat, levelModifiers, finalCombat });
}
