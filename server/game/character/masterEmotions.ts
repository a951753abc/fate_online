// === 情緒系統（千夜月姫 TRPG 自由扮演系統）===
// 資料結構先行定義，運行時機制（TP 消耗、感情觸發）留 Phase 3

import type { EmotionDef, EmotionId } from "./masterTypes.js";

// Helper: freeze an emotion definition
const e = (
  id: EmotionId,
  nameJa: string,
  nameCht: string,
  variant: "normal" | "black",
  defaultBond: number,
): EmotionDef => Object.freeze({ id, nameJa, nameCht, variant, defaultBond });

/**
 * 感情一覽
 * 風格背反律中引用的感情 + 遊戲中可能使用的基礎感情
 */
export const EMOTIONS: readonly EmotionDef[] = Object.freeze([
  // --- 一般感情（normal）---
  e("prey", "獲物", "獵物", "normal", 0),
  e("apathy", "無関心", "無關心", "normal", 1),
  e("possessiveness", "独占欲", "獨佔欲", "normal", 10),
  e("atonement", "贖罪", "贖罪", "normal", 0),
  e("yearning", "渇愛", "渴愛", "normal", 0),
  e("responsibility", "責任", "責任", "normal", 0),
  e("ordinary", "普通", "普通", "normal", 50),
  e("distance", "距離", "距離", "normal", 0),
  e("anxiety", "不安", "不安", "normal", 0),
  e("redemption", "救済", "救贖", "normal", 2),
  e("composure", "冷静", "冷靜", "normal", 0),
  e("self-recognition", "自己認識", "自我認識", "normal", 0),
  e("warmth-unreachable", "届かない温もり", "無法傳遞的溫暖", "normal", 0),

  // --- 黑色感情（black）---
  e("rivalry-black", "敵手・黒", "敵手（黑）", "black", 0),
  e("superiority-black", "優越感・黒", "優越感（黑）", "black", 0),
  e("self-contradiction-black", "自己矛盾・黒", "自我矛盾（黑）", "black", 0),
  e("dependence-black", "仰頼者・黒", "仰賴者（黑）", "black", 1),
  e("unlucky-black", "衰小・黒", "衰小（黑）", "black", 0),
  e("blind-faith-black", "盲信・黒", "盲信（黑）", "black", 0),
  e("electromagnetic-black", "電波・黒", "電波（黑）", "black", 0),
  e("hatred-black", "憎悪・黒", "憎惡（黑）", "black", 0),
]);

const EMOTION_BY_ID: ReadonlyMap<EmotionId, EmotionDef> = new Map(EMOTIONS.map((e) => [e.id, e]));

/**
 * 根據 ID 取得感情定義
 * @throws 若 ID 不存在
 */
export function getEmotionDef(id: EmotionId): EmotionDef {
  const def = EMOTION_BY_ID.get(id);
  if (!def) {
    throw new Error(`Unknown emotion ID: ${id}`);
  }
  return def;
}
