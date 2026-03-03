import { describe, it, expect } from "vitest";
import {
  validateSkillSelection,
  validateInitialSteps,
  validateSkillCount,
  validateNoDuplicates,
} from "../skillValidation.js";

describe("validateNoDuplicates", () => {
  it("無重複時通過", () => {
    const result = validateNoDuplicates(["a", "b", "c"]);
    expect(result.valid).toBe(true);
  });

  it("有重複時失敗", () => {
    const result = validateNoDuplicates(["a", "b", "a"]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("DUPLICATE_SKILL");
  });
});

describe("validateSkillCount", () => {
  it("魔術師 LV1 選 2 個通過", () => {
    const result = validateSkillCount("magician", 1, ["mag-magic-circuit", "mag-reinforcement"]);
    expect(result.valid).toBe(true);
  });

  it("魔術師 LV1 選 1 個失敗", () => {
    const result = validateSkillCount("magician", 1, ["mag-magic-circuit"]);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("WRONG_SKILL_COUNT");
  });

  it("魔術師 LV3 選 4 個通過", () => {
    const result = validateSkillCount("magician", 3, ["a", "b", "c", "d"]);
    expect(result.valid).toBe(true);
  });
});

describe("validateInitialSteps — 魔術師", () => {
  it("包含魔術迴路時通過", () => {
    const result = validateInitialSteps("magician", ["mag-magic-circuit", "mag-reinforcement"]);
    expect(result.valid).toBe(true);
  });

  it("缺少魔術迴路時失敗", () => {
    const result = validateInitialSteps("magician", ["mag-reinforcement", "mag-familiar"]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_REQUIRED_SKILL")).toBe(true);
  });
});

describe("validateInitialSteps — 劍士", () => {
  it("有段位 + 一個流派時通過", () => {
    const result = validateInitialSteps("swordsman", ["swd-rank", "swd-school-nitenichi"]);
    expect(result.valid).toBe(true);
  });

  it("缺少段位時失敗", () => {
    const result = validateInitialSteps("swordsman", ["swd-school-nitenichi", "swd-enkyoku"]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_REQUIRED_SKILL")).toBe(true);
  });

  it("缺少流派選擇時失敗", () => {
    const result = validateInitialSteps("swordsman", ["swd-rank", "swd-enkyoku"]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_CHOICE")).toBe(true);
  });

  it("選了兩個流派時失敗", () => {
    const result = validateInitialSteps("swordsman", [
      "swd-rank",
      "swd-school-nitenichi",
      "swd-school-ittou",
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MULTIPLE_CHOICE")).toBe(true);
  });
});

describe("validateInitialSteps — 超能力者", () => {
  it("選一代變異 + 自選通過", () => {
    const result = validateInitialSteps("esper", ["esp-first-generation", "esp-retrocognition"]);
    expect(result.valid).toBe(true);
  });

  it("選血脈 + 自選通過", () => {
    const result = validateInitialSteps("esper", ["esp-bloodline", "esp-martial-arts"]);
    expect(result.valid).toBe(true);
  });

  it("兩個起源都沒選失敗", () => {
    const result = validateInitialSteps("esper", ["esp-retrocognition", "esp-telepathy"]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_CHOICE")).toBe(true);
  });

  it("兩個起源都選了失敗", () => {
    const result = validateInitialSteps("esper", ["esp-first-generation", "esp-bloodline"]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MULTIPLE_CHOICE")).toBe(true);
  });
});

describe("validateInitialSteps — 代行者", () => {
  it("自由選 2 個通過", () => {
    const result = validateInitialSteps("executor", ["exe-black-key", "exe-heresy-judge"]);
    expect(result.valid).toBe(true);
  });
});

describe("validateInitialSteps — 武鬥家", () => {
  it("武道 + 自選 1 通過", () => {
    const result = validateInitialSteps("fighter", ["ftr-martial-way", "ftr-snake-bite"]);
    expect(result.valid).toBe(true);
  });

  it("缺少武道失敗", () => {
    const result = validateInitialSteps("fighter", ["ftr-snake-bite", "ftr-unyielding"]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "MISSING_REQUIRED_SKILL")).toBe(true);
  });
});

describe("validateSkillSelection — 完整驗證", () => {
  it("魔術師 LV1 正確選擇通過", () => {
    const result = validateSkillSelection({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-magic-circuit", "mag-reinforcement"],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("魔術師 LV1 缺少必選技能失敗", () => {
    const result = validateSkillSelection({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-reinforcement", "mag-familiar"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("代行者 LV1 自由選 2 個通過", () => {
    const result = validateSkillSelection({
      classId: "executor",
      classLevel: 1,
      selectedSkillIds: ["exe-black-key", "exe-heresy-judge"],
    });
    expect(result.valid).toBe(true);
  });

  it("劍士 LV1 段位 + 流派通過", () => {
    const result = validateSkillSelection({
      classId: "swordsman",
      classLevel: 1,
      selectedSkillIds: ["swd-rank", "swd-school-musou"],
    });
    expect(result.valid).toBe(true);
  });

  it("武鬥家 LV3 武道 + 3 自選通過", () => {
    const result = validateSkillSelection({
      classId: "fighter",
      classLevel: 3,
      selectedSkillIds: [
        "ftr-martial-way",
        "ftr-snake-bite",
        "ftr-martial-heart",
        "ftr-unyielding",
      ],
    });
    expect(result.valid).toBe(true);
  });

  it("超能力者 LV1 血脈 + 自選通過", () => {
    const result = validateSkillSelection({
      classId: "esper",
      classLevel: 1,
      selectedSkillIds: ["esp-bloodline", "esp-pure-eyes"],
    });
    expect(result.valid).toBe(true);
  });

  it("重複選擇技能失敗", () => {
    const result = validateSkillSelection({
      classId: "executor",
      classLevel: 1,
      selectedSkillIds: ["exe-black-key", "exe-black-key"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "DUPLICATE_SKILL")).toBe(true);
  });

  it("選擇其他級別技能失敗", () => {
    const result = validateSkillSelection({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-magic-circuit", "exe-black-key"],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "SKILL_NOT_IN_CLASS")).toBe(true);
  });
});
