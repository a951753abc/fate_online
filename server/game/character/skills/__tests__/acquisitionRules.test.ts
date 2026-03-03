import { describe, it, expect } from "vitest";
import {
  CLASS_SKILL_ACQUISITIONS,
  getClassSkillAcquisition,
  computeExpectedSkillCount,
} from "../acquisitionRules.js";

describe("技能取得規則", () => {
  it("6 個級別的取得規則都存在", () => {
    expect(CLASS_SKILL_ACQUISITIONS.length).toBe(6);
    const classIds = CLASS_SKILL_ACQUISITIONS.map((a) => a.classId);
    expect(classIds).toContain("magician");
    expect(classIds).toContain("executor");
    expect(classIds).toContain("swordsman");
    expect(classIds).toContain("fighter");
    expect(classIds).toContain("hunter");
    expect(classIds).toContain("esper");
  });

  it("getClassSkillAcquisition 回傳正確規則", () => {
    const mag = getClassSkillAcquisition("magician");
    expect(mag.classId).toBe("magician");
  });

  it("getClassSkillAcquisition 對未知級別拋出錯誤", () => {
    expect(() => getClassSkillAcquisition("invalid")).toThrow("Unknown class");
  });
});

describe("魔術師取得規則", () => {
  const acq = getClassSkillAcquisition("magician");

  it("初期步驟: 必選魔術迴路 + 自選 1", () => {
    expect(acq.initialSteps.length).toBe(2);
    expect(acq.initialSteps[0].type).toBe("required");
    expect(acq.initialSteps[0].skillIds).toContain("mag-magic-circuit");
    expect(acq.initialSteps[1].type).toBe("free");
    expect(acq.initialSteps[1].count).toBe(1);
  });

  it("每級升級 +1 技能", () => {
    expect(acq.perLevelUpCount).toBe(1);
  });

  it("LV5/10 有額外技能", () => {
    expect(acq.bonusLevels).toContain(5);
    expect(acq.bonusLevels).toContain(10);
  });
});

describe("代行者取得規則", () => {
  const acq = getClassSkillAcquisition("executor");

  it("初期步驟: 自選 2（無必選）", () => {
    expect(acq.initialSteps.length).toBe(1);
    expect(acq.initialSteps[0].type).toBe("free");
    expect(acq.initialSteps[0].count).toBe(2);
  });
});

describe("劍士取得規則", () => {
  const acq = getClassSkillAcquisition("swordsman");

  it("初期步驟: 必選段位 + 三選一流派", () => {
    expect(acq.initialSteps.length).toBe(2);
    expect(acq.initialSteps[0].type).toBe("required");
    expect(acq.initialSteps[0].skillIds).toContain("swd-rank");
    expect(acq.initialSteps[1].type).toBe("choose_one");
    expect(acq.initialSteps[1].skillIds).toHaveLength(3);
  });
});

describe("武鬥家取得規則", () => {
  const acq = getClassSkillAcquisition("fighter");

  it("初期步驟: 必選武道 + 自選 1", () => {
    expect(acq.initialSteps.length).toBe(2);
    expect(acq.initialSteps[0].type).toBe("required");
    expect(acq.initialSteps[0].skillIds).toContain("ftr-martial-way");
    expect(acq.initialSteps[1].type).toBe("free");
    expect(acq.initialSteps[1].count).toBe(1);
  });
});

describe("狩人取得規則", () => {
  const acq = getClassSkillAcquisition("hunter");

  it("初期步驟: 自選 2（無必選）", () => {
    expect(acq.initialSteps.length).toBe(1);
    expect(acq.initialSteps[0].type).toBe("free");
    expect(acq.initialSteps[0].count).toBe(2);
  });

  it("有 LV3 和 LV6 的特殊規則", () => {
    expect(acq.specialRules.length).toBe(2);
    expect(acq.specialRules[0].level).toBe(3);
    expect(acq.specialRules[1].level).toBe(6);
  });
});

describe("超能力者取得規則", () => {
  const acq = getClassSkillAcquisition("esper");

  it("初期步驟: 起源二選一 + 自選 1", () => {
    expect(acq.initialSteps.length).toBe(2);
    expect(acq.initialSteps[0].type).toBe("choose_one");
    expect(acq.initialSteps[0].skillIds).toContain("esp-first-generation");
    expect(acq.initialSteps[0].skillIds).toContain("esp-bloodline");
    expect(acq.initialSteps[1].type).toBe("free");
    expect(acq.initialSteps[1].count).toBe(1);
  });
});

describe("computeExpectedSkillCount", () => {
  it("魔術師 LV1: 必選 1 + 自選 1 = 2", () => {
    expect(computeExpectedSkillCount("magician", 1)).toBe(2);
  });

  it("魔術師 LV3: 2 + 2 升級 = 4", () => {
    expect(computeExpectedSkillCount("magician", 3)).toBe(4);
  });

  it("魔術師 LV5: 2 + 4 升級 + 1 bonus = 7", () => {
    expect(computeExpectedSkillCount("magician", 5)).toBe(7);
  });

  it("魔術師 LV10: 2 + 9 升級 + 2 bonus = 13", () => {
    expect(computeExpectedSkillCount("magician", 10)).toBe(13);
  });

  it("代行者 LV1: 自選 2 = 2", () => {
    expect(computeExpectedSkillCount("executor", 1)).toBe(2);
  });

  it("代行者 LV4: 2 + 3 升級 = 5", () => {
    expect(computeExpectedSkillCount("executor", 4)).toBe(5);
  });

  it("劍士 LV1: 段位 1 + 流派 1 = 2", () => {
    expect(computeExpectedSkillCount("swordsman", 1)).toBe(2);
  });

  it("劍士 LV4: 2 + 3 升級 = 5", () => {
    expect(computeExpectedSkillCount("swordsman", 4)).toBe(5);
  });

  it("武鬥家 LV1: 武道 1 + 自選 1 = 2", () => {
    expect(computeExpectedSkillCount("fighter", 1)).toBe(2);
  });

  it("狩人 LV1: 自選 2 = 2", () => {
    expect(computeExpectedSkillCount("hunter", 1)).toBe(2);
  });

  it("超能力者 LV1: 起源 1 + 自選 1 = 2", () => {
    expect(computeExpectedSkillCount("esper", 1)).toBe(2);
  });

  it("超能力者 LV5: 2 + 4 升級 + 1 bonus = 7", () => {
    expect(computeExpectedSkillCount("esper", 5)).toBe(7);
  });
});
