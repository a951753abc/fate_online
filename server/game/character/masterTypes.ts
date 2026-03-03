// === Master Level System (千夜月姫 TRPG) ===

export const MAX_LEVEL = 10;

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
  readonly level: number; // 總等級（起始+升級）≥ 1
  readonly startingLevel: number; // 起始等級（用於基本能力値）≥ 1, ≤ level
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

// === 情緒系統（資料結構先行，運行時機制留 Phase 3）===

export type EmotionId = string;
export type EmotionVariant = "normal" | "black";

/** 感情定義（千夜月姫 TRPG 自由扮演系統） */
export interface EmotionDef {
  readonly id: EmotionId;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly variant: EmotionVariant;
  readonly defaultBond: number;
}

// === 風格/背反律 ===

export type StyleId = string;
export type AntinomyTrigger = "constant" | "interrupt" | "general" | "preparation";

/** 風格的級別限制（有些風格需要特定級別才可選） */
export interface StyleClassRestriction {
  readonly classId: MasterLevelId;
  readonly minLevel?: number; // 未指定 = 持有該級別即可
}

/** 背反律定義（風格附帶的黑暗面能力） */
export interface AntinomyDef {
  readonly nameJa: string;
  readonly nameCht: string;
  readonly trigger: AntinomyTrigger;
  readonly emotionGained?: {
    readonly emotionId: EmotionId;
    readonly bond?: number;
  };
  readonly effectDescription: string;
  readonly effectParams: Readonly<Record<string, number | string>>;
}

/** 風格定義（角色先天性・根源性的性質傾向） */
export interface StyleDef {
  readonly id: StyleId;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly antinomy: AntinomyDef;
  readonly classRestrictions?: readonly StyleClassRestriction[]; // OR 邏輯：任一滿足即可
  readonly hasAwakening: boolean;
  readonly awakeningCondition?: string;
  readonly awakeningEffect?: string;
}
