import type {
  LevelAllocation,
  LevelConfig,
  MasterBaseStats,
  CombatModifiers,
  ComputedStats,
  AbilityStatKey,
  MasterLevelId,
} from "./masterTypes.js";
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
    if (entry.level < 1) {
      return `級別等級至少為 1: ${entry.levelId}`;
    }
    if (!Number.isInteger(entry.level)) {
      return `級別等級必須為整數: ${entry.levelId}`;
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

  // +1 free point
  switch (freePoint) {
    case "body":
      body += 1;
      break;
    case "perception":
      perception += 1;
      break;
    case "reason":
      reason += 1;
      break;
    case "will":
      will += 1;
      break;
  }

  return Object.freeze({ body, perception, reason, will });
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

// === Level Modifiers ===

export function computeLevelModifiers(allocation: readonly LevelAllocation[]): CombatModifiers {
  let melee = 0;
  let ranged = 0;
  let spirit = 0;
  let action = 0;
  let hp = 0;
  let focus = 0;
  let defense = 0;

  for (const entry of allocation) {
    const def = getMasterLevelDef(entry.levelId);
    const mod = def.modifiers[entry.level - 1]; // index 0 = LV1
    melee += mod.melee;
    ranged += mod.ranged;
    spirit += mod.spirit;
    action += mod.action;
    hp += mod.hp;
    focus += mod.focus;
    defense += mod.defense;
  }

  return Object.freeze({ melee, ranged, spirit, action, hp, focus, defense });
}

// === Final Combat Values ===

export function computeFinalCombat(
  baseCombat: CombatModifiers,
  levelModifiers: CombatModifiers,
): CombatModifiers {
  return Object.freeze({
    melee: baseCombat.melee + levelModifiers.melee,
    ranged: baseCombat.ranged + levelModifiers.ranged,
    spirit: baseCombat.spirit + levelModifiers.spirit,
    action: baseCombat.action + levelModifiers.action,
    hp: baseCombat.hp + levelModifiers.hp,
    focus: baseCombat.focus + levelModifiers.focus,
    defense: baseCombat.defense + levelModifiers.defense,
  });
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
