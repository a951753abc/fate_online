// === 級別技能系統 (千夜月姫 TRPG) ===
//
// 核心原則：技能不是自動取得，而是玩家按照規則確認點選。
// 即使是「必須」技能（如魔術迴路、段位），玩家仍需主動選擇確認。

import type { MasterLevelId, StyleId } from "../masterTypes.js";

// --- 技能基本型別 ---

export type SkillId = string;

/** 技能觸發類型（對應千夜月姫 TRPG 的「分類」欄位） */
export type SkillTrigger =
  | "constant" // 常時（持續生效）
  | "general" // 通用（主動宣言使用）
  | "attack" // 攻擊類型（決定攻擊判定方式）
  | "offense" // 進攻（攻擊命中後追加效果）
  | "defense" // 防禦（迴避/減傷）
  | "preparation" // 準備階段（回合開始時使用）
  | "interrupt" // 中斷（反應觸發）
  | "special"; // 特殊（要素構成等非標準分類）

/** 攻擊判定使用的戰鬥值 */
export type AttackDomain = "melee" | "ranged" | "spirit" | "common";

// --- 前置條件 ---

export type SkillPrereqType =
  | "class_level" // 需要特定級別 ≥ 指定等級
  | "skill" // 需要先取得指定技能
  | "skill_any" // 需要指定技能中的任一個
  | "skill_count" // 需要 N 個指定類別的技能
  | "rank" // 劍士：需達指定段位
  | "school" // 劍士：需選擇指定流派
  | "creation_only" // 僅限角色創建時取得
  | "class_exclusive" // 僅限「純單一級別」角色（不可混合）
  | "not_skill" // 不可持有指定技能（互斥）
  | "style"; // 需要特定風格

export interface SkillPrereq {
  readonly type: SkillPrereqType;
  readonly classId?: MasterLevelId;
  readonly minLevel?: number;
  readonly skillId?: SkillId;
  readonly skillIds?: readonly SkillId[]; // for skill_any / skill_count
  readonly count?: number; // for skill_count
  readonly rankId?: SwordsmanRank;
  readonly schoolId?: SwordsmanSchool;
  readonly styleId?: StyleId;
}

// --- 技能定義 ---

/** 取得時需要的子選擇類型 */
export type SkillConfigType =
  | "familiar" // 使魔：選類型
  | "mystic_code" // 禮裝所持：選禮裝
  | "composition" // 魔術構成：選 N 個要素
  | "attribute_distribution"; // 魔術迴路：分配屬性點

export interface SkillDef {
  readonly id: SkillId;
  readonly classId: MasterLevelId | "shared";
  readonly nameJa: string;
  readonly nameCht: string;
  readonly trigger: SkillTrigger;
  readonly attackDomain?: AttackDomain;
  readonly prerequisites: readonly SkillPrereq[];
  readonly isExtra: boolean; // 額外特技（有進階門檻）
  readonly costDescription: string; // 代價描述（原始文字，如「代價傷害10」）
  readonly effectDescription: string;
  readonly tpReward: number; // TP（情緒）獎勵
  readonly endlessDestructionEligible: boolean; // 可登錄無盡破壊
  readonly repeatable?: boolean; // 可重複取得（使魔、禮裝所持、魔術構成等）
  readonly compositionOnly?: boolean; // 僅作為魔術構成部件（要素系列），不佔技能槽位
  readonly configType?: SkillConfigType; // 取得時需要子選擇
}

// --- 級別技能取得規則 ---

/**
 * 初期取得的單步規則
 *
 * 每個級別的初期取得由多個步驟組成，玩家依序完成每一步：
 * - "required": 規則規定必須選擇的技能（玩家確認點選）
 * - "choose_one": 從指定選項中選擇一個
 * - "free": 從該級別可用技能中自由選擇 N 個
 */
export type InitialSkillStepType = "required" | "choose_one" | "free";

export interface InitialSkillStep {
  readonly type: InitialSkillStepType;
  readonly skillIds?: readonly SkillId[]; // required: 必選的技能; choose_one: 可選的技能池
  readonly count?: number; // free: 自選數量
  readonly label?: string; // UI 顯示用標籤
}

/**
 * 級別等級達到特定值時的特殊規則
 * 例如：狩人 LV3 純狩人時，〈槍手本能〉或〈戰場掌握〉等級 +1
 */
export interface SpecialLevelRule {
  readonly level: number;
  readonly description: string;
  readonly condition?: string; // 條件描述（如「初期級別皆為狩人」）
}

/**
 * 各級別的技能取得規則（完全遵循千夜月姫 TRPG 規則書）
 *
 * 所有技能取得都是玩家主動選擇，系統只負責：
 * 1. 呈現可選技能（根據前置條件過濾）
 * 2. 驗證選擇是否符合規則
 * 3. 記錄選擇結果
 */
export interface ClassSkillAcquisition {
  readonly classId: MasterLevelId;
  readonly initialSteps: readonly InitialSkillStep[]; // LV1 創建時的選擇步驟
  readonly perLevelUpCount: number; // 每升一級自選數量
  readonly bonusLevels: readonly number[]; // 獎勵額外 +1 技能的級別等級
  readonly specialRules: readonly SpecialLevelRule[]; // 級別專屬特殊規則
}

// --- 技能實例配置（取得時的子選擇）---

/** 魔術屬性（地/水/火/風/空） */
export type MagicAttribute = "earth" | "water" | "fire" | "wind" | "void";

/** 有效的魔術屬性值（衍生自 MagicAttribute 型別） */
export const VALID_MAGIC_ATTRIBUTES: readonly MagicAttribute[] = Object.freeze([
  "earth",
  "water",
  "fire",
  "wind",
  "void",
]);

/** 使魔類型 */
export type FamiliarType = "dog" | "crow" | "cat";

/** 使魔配置 */
export interface FamiliarConfig {
  readonly type: "familiar";
  readonly familiarType: FamiliarType;
}

/** 禮裝配置 */
export interface MysticCodeConfig {
  readonly type: "mystic_code";
  readonly mysticCodeId: string;
}

/** 魔術構成的要素條目 */
export interface CompositionElementEntry {
  readonly elementSkillId: SkillId;
  readonly subChoice?: string; // 要素內的永久選擇（如 要素：攻擊類型 → "melee"）
}

/** 魔術構成配置 */
export interface CompositionConfig {
  readonly type: "composition";
  readonly mode: "new" | "expand"; // 新建構成 or 擴充既有構成
  readonly targetIndex?: number; // expand 時：擴充哪個既有構成（在同技能的 configs 中的 index）
  readonly elements: readonly CompositionElementEntry[];
}

/** 屬性分配配置（魔術迴路） */
export interface AttributeDistributionConfig {
  readonly type: "attribute_distribution";
  readonly distribution: Readonly<Partial<Record<MagicAttribute, number>>>;
}

/** 技能實例配置（discriminated union） */
export type SkillInstanceConfig =
  | FamiliarConfig
  | MysticCodeConfig
  | CompositionConfig
  | AttributeDistributionConfig;

// --- 玩家技能選擇 ---

/** 單一級別的技能選擇結果 */
export interface SkillSelection {
  readonly classId: MasterLevelId;
  readonly classLevel: number;
  readonly selectedSkillIds: readonly SkillId[]; // 允許重複（repeatable 技能）
  readonly skillConfigs?: Readonly<Record<SkillId, readonly SkillInstanceConfig[]>>;
  // key = skillId, value = 每個實例的配置（按 selectedSkillIds 中的出現順序對應）
}

/** 無盡破壞登錄 slot */
export interface EndlessDestructionSlot {
  readonly skillId: SkillId;
  readonly uses: number; // 同一技能可重複登錄，每次 +1 使用次數
}

// --- 劍士專用子系統 ---

export type SwordsmanSchool = "nitenichi" | "ittou" | "musou";

export type SwordsmanRank =
  | "kirigami" // 切紙
  | "mokuroku" // 目錄
  | "inka" // 印可
  | "daimokuroku" // 大目錄
  | "menkyokaiden"; // 免許皆傳

/** 劍士段位定義（依學會的流派招式數自動晉升） */
export interface SwordsmanRankDef {
  readonly id: SwordsmanRank;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly requiredSkillCount: number; // 需習得的該流派招式數
}
