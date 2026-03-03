// === 魔術師技能子選擇定義 ===
//
// 定義使魔類型選項和要素子選擇選項，
// 供 UI 和驗證使用。

import type { FamiliarType } from "./types.js";

// --- 使魔類型選項 ---

export interface FamiliarOptionDef {
  readonly type: FamiliarType;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly description: string;
}

export const FAMILIAR_OPTIONS: readonly FamiliarOptionDef[] = Object.freeze([
  Object.freeze({
    type: "dog" as const,
    nameJa: "狗",
    nameCht: "狗",
    description: "陸上追蹤、戰鬥向使魔。",
  }),
  Object.freeze({
    type: "crow" as const,
    nameJa: "烏鴉",
    nameCht: "烏鴉",
    description: "空中偵察、遠距情報向使魔。",
  }),
  Object.freeze({
    type: "cat" as const,
    nameJa: "灰猫",
    nameCht: "灰貓",
    description: "潛入、隱密行動向使魔。",
  }),
]);

// --- 要素子選擇定義 ---

export interface ElementSubChoiceOption {
  readonly value: string;
  readonly labelJa: string;
  readonly labelCht: string;
}

export interface ElementSubChoiceDef {
  readonly elementSkillId: string;
  readonly choiceKey: string; // 子選擇鍵名（用於 CompositionElementEntry.subChoice）
  readonly labelJa: string;
  readonly labelCht: string;
  readonly options: readonly ElementSubChoiceOption[];
}

/**
 * 需要永久子選擇的要素定義
 *
 * 規則書原文：
 * - 要素：攻擊類型 → 選擇近戰/射擊/精神，選擇後無法更改
 * - 要素：進攻 → 選擇近戰/射擊/精神，選擇後無法更改
 * - 要素：減益 → 判定方式選擇 攻擊/精神，選擇後無法更改
 * - 要素：異常狀態 → 選擇一種狀態效果，選擇後無法更改
 */
export const ELEMENT_SUB_CHOICES: readonly ElementSubChoiceDef[] = Object.freeze([
  Object.freeze({
    elementSkillId: "mag-element-attack-type",
    choiceKey: "attackSubType",
    labelJa: "攻擊類型",
    labelCht: "選擇攻擊類型",
    options: Object.freeze([
      Object.freeze({ value: "melee", labelJa: "近戰", labelCht: "近戰" }),
      Object.freeze({ value: "ranged", labelJa: "射撃", labelCht: "射擊" }),
      Object.freeze({ value: "spirit", labelJa: "精神", labelCht: "精神" }),
    ]),
  }),
  Object.freeze({
    elementSkillId: "mag-element-offense",
    choiceKey: "offenseSubType",
    labelJa: "進攻類型",
    labelCht: "選擇進攻類型",
    options: Object.freeze([
      Object.freeze({ value: "melee", labelJa: "近戰", labelCht: "近戰" }),
      Object.freeze({ value: "ranged", labelJa: "射撃", labelCht: "射擊" }),
      Object.freeze({ value: "spirit", labelJa: "精神", labelCht: "精神" }),
    ]),
  }),
  Object.freeze({
    elementSkillId: "mag-element-debuff",
    choiceKey: "debuffJudgment",
    labelJa: "判定方式",
    labelCht: "選擇判定方式",
    options: Object.freeze([
      Object.freeze({
        value: "attack",
        labelJa: "攻擊",
        labelCht: "攻擊（造成實際傷害後發揮作用）",
      }),
      Object.freeze({
        value: "spirit",
        labelJa: "精神",
        labelCht: "精神（精神對決成功後發揮作用）",
      }),
    ]),
  }),
  Object.freeze({
    elementSkillId: "mag-element-status",
    choiceKey: "statusAilment",
    labelJa: "異常状態",
    labelCht: "選擇異常狀態",
    options: Object.freeze([
      Object.freeze({
        value: "paralysis",
        labelJa: "痲痹",
        labelCht: "痲痹（行動值變為1，不能移動）",
      }),
      Object.freeze({ value: "lock", labelJa: "鎖定", labelCht: "鎖定（鎖定者命中+3，會心-1）" }),
      Object.freeze({ value: "burn", labelJa: "燃焼", labelCht: "燃燒（結束階段受火屬性傷害）" }),
      Object.freeze({ value: "bind", labelJa: "束縛", labelCht: "束縛（所有達成值-3）" }),
      Object.freeze({ value: "daze", labelJa: "恍惚", labelCht: "恍惚（無法使用常時以外技能）" }),
      Object.freeze({
        value: "poison",
        labelJa: "中毒",
        labelCht: "中毒（結束階段承受10%最大HP傷害）",
      }),
    ]),
  }),
]);

/** 要素子選擇查詢（elementSkillId → SubChoiceDef） */
const SUB_CHOICE_BY_ELEMENT: ReadonlyMap<string, ElementSubChoiceDef> = new Map(
  ELEMENT_SUB_CHOICES.map((sc) => [sc.elementSkillId, sc]),
);

/** 查詢指定要素是否需要子選擇 */
export function getElementSubChoice(elementSkillId: string): ElementSubChoiceDef | undefined {
  return SUB_CHOICE_BY_ELEMENT.get(elementSkillId);
}

/** 驗證要素子選擇值是否合法 */
export function isValidSubChoice(elementSkillId: string, value: string): boolean {
  const def = SUB_CHOICE_BY_ELEMENT.get(elementSkillId);
  if (!def) return true; // 不需要子選擇 = 任何值都不應出現，但這裡寬容處理
  return def.options.some((opt) => opt.value === value);
}

/** 所有需要子選擇的要素 ID */
export const ELEMENTS_WITH_SUB_CHOICE: readonly string[] = Object.freeze(
  ELEMENT_SUB_CHOICES.map((sc) => sc.elementSkillId),
);

/** 有效的使魔類型集合（衍生自 FAMILIAR_OPTIONS） */
export const VALID_FAMILIAR_TYPES: ReadonlySet<string> = new Set(
  FAMILIAR_OPTIONS.map((f) => f.type),
);
