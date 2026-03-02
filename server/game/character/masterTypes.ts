// === Master Level System (千夜月姫 TRPG) ===

export type MasterLevelId = "magician" | "executor" | "swordsman" | "fighter" | "hunter" | "esper";

export type AbilityStatKey = "body" | "perception" | "reason" | "will";

export type CombatStatKey = "melee" | "ranged" | "spirit" | "action" | "hp" | "focus" | "defense";

/** 基本能力値 (體力/知覺/理智/意志) */
export interface MasterBaseStats {
  readonly body: number;
  readonly perception: number;
  readonly reason: number;
  readonly will: number;
}

/** 戰鬥値 (近戰/射撃/精神/行動/生命力/集中力/防禦點) */
export interface CombatModifiers {
  readonly melee: number;
  readonly ranged: number;
  readonly spirit: number;
  readonly action: number;
  readonly hp: number;
  readonly focus: number;
  readonly defense: number;
}

/** 級別定義 (基礎能力値 + LV1-10 修正表) */
export interface MasterLevelDef {
  readonly id: MasterLevelId;
  readonly nameJa: string;
  readonly archetype: string;
  readonly baseStats: MasterBaseStats;
  readonly modifiers: readonly CombatModifiers[]; // index 0 = LV1 ... index 9 = LV10
}

/** 單一級別的等級分配 */
export interface LevelAllocation {
  readonly levelId: MasterLevelId;
  readonly level: number; // ≥ 1
}

/** 等級分配設定 (房主控制) */
export interface LevelConfig {
  readonly startingPoints: number; // 起始等級 (固定 3)
  readonly gameLevel: number; // 遊戲等級 (預設 4)
  readonly maxClasses: number; // 最多級別數 (固定 3)
}

/** 完整計算結果 */
export interface ComputedStats {
  readonly baseAbilities: MasterBaseStats; // 基本能力値
  readonly bonuses: MasterBaseStats; // 能力紅利 = floor(base / 3)
  readonly baseCombat: CombatModifiers; // 基礎戰鬥値 (from 能力紅利)
  readonly levelModifiers: CombatModifiers; // 級別修正合計
  readonly finalCombat: CombatModifiers; // 最終戰鬥値
}
