// === 級別技能取得規則（千夜月姫 TRPG 規則書原文忠實移植）===
//
// 每個級別的取得規則都是「玩家選擇」，不是「系統自動給予」。
// 規則書原文中的「得到 X」意味著「規則要求你選擇 X」。

import type { ClassSkillAcquisition } from "./types.js";

/**
 * 魔術師
 * 原文：初期取得：得到「魔術迴路」、然後再選擇一個自己喜歡的特技。
 * 升級：等級上升之時、選取一個喜歡的特技。5等、10等時，可以額外再取得一個特技。
 */
const MAGICIAN_ACQUISITION: ClassSkillAcquisition = Object.freeze({
  classId: "magician" as const,
  initialSteps: Object.freeze([
    Object.freeze({
      type: "required" as const,
      skillIds: Object.freeze(["mag-magic-circuit"]),
      label: "魔術迴路（必選）",
    }),
    Object.freeze({
      type: "free" as const,
      count: 1,
      label: "自選一個魔術師特技",
    }),
  ]),
  perLevelUpCount: 1,
  bonusLevels: Object.freeze([5, 10]),
  specialRules: Object.freeze([]),
});

/**
 * 代行者
 * 原文：初期取得：選擇兩個自己喜歡的特技。
 * 升級：等級上升之時、選取一個喜歡的特技。5等、10等時，可以額外再取得一個特技。
 */
const EXECUTOR_ACQUISITION: ClassSkillAcquisition = Object.freeze({
  classId: "executor" as const,
  initialSteps: Object.freeze([
    Object.freeze({
      type: "free" as const,
      count: 2,
      label: "自選兩個代行者特技",
    }),
  ]),
  perLevelUpCount: 1,
  bonusLevels: Object.freeze([5, 10]),
  specialRules: Object.freeze([]),
});

/**
 * 劍士
 * 原文：初期取得：得到「段位」、「流派」。
 * 升級：等級上升之時、選取一個喜歡的特技。每逢5等、10等時，可以額外再取得一個特技。
 *
 * 注意：「流派」是三選一（二天一流/一刀流/夢想流），選擇後決定整個技能樹走向。
 */
const SWORDSMAN_ACQUISITION: ClassSkillAcquisition = Object.freeze({
  classId: "swordsman" as const,
  initialSteps: Object.freeze([
    Object.freeze({
      type: "required" as const,
      skillIds: Object.freeze(["swd-rank"]),
      label: "段位（必選）",
    }),
    Object.freeze({
      type: "choose_one" as const,
      skillIds: Object.freeze(["swd-school-nitenichi", "swd-school-ittou", "swd-school-musou"]),
      label: "流派（三選一）",
    }),
  ]),
  perLevelUpCount: 1,
  bonusLevels: Object.freeze([5, 10]),
  specialRules: Object.freeze([]),
});

/**
 * 武鬥家
 * 原文：初期取得：得到「武道」，然後再選擇一個自己喜歡的特技。
 * 升級：等級上升之時、選取一個喜歡的特技。5等、10等時，可以額外再取得一個特技。
 */
const FIGHTER_ACQUISITION: ClassSkillAcquisition = Object.freeze({
  classId: "fighter" as const,
  initialSteps: Object.freeze([
    Object.freeze({
      type: "required" as const,
      skillIds: Object.freeze(["ftr-martial-way"]),
      label: "武道（必選）",
    }),
    Object.freeze({
      type: "free" as const,
      count: 1,
      label: "自選一個武鬥家特技",
    }),
  ]),
  perLevelUpCount: 1,
  bonusLevels: Object.freeze([5, 10]),
  specialRules: Object.freeze([]),
});

/**
 * 狩人
 * 原文：初期取得：任兩個喜歡的特技；
 * 特殊：三級建立角色時初期級別是狩人等級三的話，〈槍手本能〉或〈戰場掌握〉額外給予一級。
 * 升級：等級上升時，選擇一個喜歡的特技，等級五和十時再選一個；
 * 狩人等級六時若只持〈槍手本能〉或〈戰場掌握〉任一，那特技等級+1
 */
const HUNTER_ACQUISITION: ClassSkillAcquisition = Object.freeze({
  classId: "hunter" as const,
  initialSteps: Object.freeze([
    Object.freeze({
      type: "free" as const,
      count: 2,
      label: "自選兩個狩人特技",
    }),
  ]),
  perLevelUpCount: 1,
  bonusLevels: Object.freeze([5, 10]),
  specialRules: Object.freeze([
    Object.freeze({
      level: 3,
      description: "〈槍手本能〉或〈戰場掌握〉額外 +1 級",
      condition: "初期級別皆為狩人（純狩人 LV3）",
    }),
    Object.freeze({
      level: 6,
      description: "若只持〈槍手本能〉或〈戰場掌握〉任一，該特技等級 +1",
    }),
  ]),
});

/**
 * 超能力者
 * 原文：初期取得：從「一代變異」「血脈」中選一，而後再選擇一個自己喜歡的特技。
 * 升級：等級上升之時、選取一個喜歡的特技。每逢5等、10等時，可以額外再取得一個特技。
 */
const ESPER_ACQUISITION: ClassSkillAcquisition = Object.freeze({
  classId: "esper" as const,
  initialSteps: Object.freeze([
    Object.freeze({
      type: "choose_one" as const,
      skillIds: Object.freeze(["esp-first-generation", "esp-bloodline"]),
      label: "起源（二選一）",
    }),
    Object.freeze({
      type: "free" as const,
      count: 1,
      label: "自選一個超能力者特技",
    }),
  ]),
  perLevelUpCount: 1,
  bonusLevels: Object.freeze([5, 10]),
  specialRules: Object.freeze([]),
});

/** 所有級別的技能取得規則 */
export const CLASS_SKILL_ACQUISITIONS: readonly ClassSkillAcquisition[] = Object.freeze([
  MAGICIAN_ACQUISITION,
  EXECUTOR_ACQUISITION,
  SWORDSMAN_ACQUISITION,
  FIGHTER_ACQUISITION,
  HUNTER_ACQUISITION,
  ESPER_ACQUISITION,
]);

const ACQUISITION_MAP: ReadonlyMap<string, ClassSkillAcquisition> = new Map(
  CLASS_SKILL_ACQUISITIONS.map((a) => [a.classId, a]),
);

export function getClassSkillAcquisition(classId: string): ClassSkillAcquisition {
  const acq = ACQUISITION_MAP.get(classId);
  if (!acq) throw new Error(`Unknown class: ${classId}`);
  return acq;
}

/**
 * 計算指定級別等級應擁有的技能總數（不含特殊規則加成）
 *
 * = 初期步驟產生的技能數 + (classLevel - 1) × perLevelUpCount + bonus
 */
export function computeExpectedSkillCount(classId: string, classLevel: number): number {
  const acq = getClassSkillAcquisition(classId);

  // 初期步驟產生的技能數
  let initialCount = 0;
  for (const step of acq.initialSteps) {
    switch (step.type) {
      case "required":
        initialCount += step.skillIds?.length ?? 0;
        break;
      case "choose_one":
        initialCount += 1;
        break;
      case "free":
        initialCount += step.count ?? 0;
        break;
    }
  }

  // 升級取得
  const levelUpCount = Math.max(0, classLevel - 1) * acq.perLevelUpCount;

  // 獎勵等級
  const bonusCount = acq.bonusLevels.filter((lv) => lv <= classLevel).length;

  return initialCount + levelUpCount + bonusCount;
}
