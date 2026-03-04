// === 魔術構成 要素衝突規則（shared between server validation & client UI）===

/** 觸發類型要素 — 準備/攻擊類型/進攻 三者互斥 */
export const TRIGGER_ELEMENT_IDS = Object.freeze([
  "mag-element-prep",
  "mag-element-attack-type",
  "mag-element-offense",
] as const);

/** 輔助類型要素 — 防禦/增益/治療/減益/異常狀態 */
export const SUPPORT_ELEMENT_IDS = Object.freeze([
  "mag-element-defense",
  "mag-element-buff",
  "mag-element-heal",
  "mag-element-debuff",
  "mag-element-status",
] as const);

/** 各構成技能需要的要素數量 */
export function getRequiredElementCount(skillId: string): number {
  if (skillId === "mag-magic-composition") return 3;
  return 2; // mag-item-creation, mag-mystic-eyes
}

/** 只有魔術構成可以擴充既有構成 */
export function canExpandComposition(skillId: string): boolean {
  return skillId === "mag-magic-composition";
}

export interface CompositionWarning {
  readonly rule: string;
  readonly message: string;
}

/**
 * 檢查要素組合衝突（R1~R4）。
 * 回傳所有違反的警告；空陣列 = 無衝突。
 */
export function checkCompositionConflicts(
  elementIds: ReadonlySet<string>,
): readonly CompositionWarning[] {
  const warns: CompositionWarning[] = [];

  // R1: 觸發類型互斥
  const selectedTriggers = TRIGGER_ELEMENT_IDS.filter((t) => elementIds.has(t));
  if (selectedTriggers.length > 1) {
    warns.push({ rule: "R1", message: "準備/攻擊類型/進攻 三者最多選一個" });
  }

  // R2: 傷害需搭配攻擊類型或進攻
  if (elementIds.has("mag-element-damage")) {
    if (!elementIds.has("mag-element-attack-type") && !elementIds.has("mag-element-offense")) {
      warns.push({ rule: "R2", message: "傷害 須搭配攻擊類型或進攻" });
    }
  }

  // R3 & R4: 防禦/增益需搭配其他輔助要素
  const selectedSupport = SUPPORT_ELEMENT_IDS.filter((s) => elementIds.has(s));

  if (elementIds.has("mag-element-defense")) {
    if (selectedSupport.filter((s) => s !== "mag-element-defense").length === 0) {
      warns.push({ rule: "R3", message: "防禦 須搭配其他輔助要素" });
    }
  }

  if (elementIds.has("mag-element-buff")) {
    if (selectedSupport.filter((s) => s !== "mag-element-buff").length === 0) {
      warns.push({ rule: "R4", message: "增益 須搭配其他輔助要素" });
    }
  }

  return warns;
}
