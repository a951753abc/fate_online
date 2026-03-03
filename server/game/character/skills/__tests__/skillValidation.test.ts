import { describe, it, expect } from "vitest";
import {
  validateSkillSelection,
  validateSkillConfigs,
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
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 2 } }],
      },
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

describe("validateSkillConfigs — 多重屬性", () => {
  it("無多重屬性時 LV1 totalPoints = 2（LV1+1）", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-magic-circuit", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 2 } }],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("有多重屬性時 LV1 totalPoints = 4（LV1+1+2）", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-magic-circuit", "mag-multi-element"],
      skillConfigs: {
        "mag-magic-circuit": [
          {
            type: "attribute_distribution",
            distribution: { earth: 1, water: 1, fire: 1, wind: 1 },
          },
        ],
      },
    });
    expect(result.valid).toBe(true);
  });

  it("有多重屬性時可選 4~5 種屬性", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-magic-circuit", "mag-multi-element"],
      skillConfigs: {
        "mag-magic-circuit": [
          {
            type: "attribute_distribution",
            distribution: { earth: 1, water: 1, fire: 1, void: 1 },
          },
        ],
      },
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("有多重屬性但點數不符失敗", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 1,
      selectedSkillIds: ["mag-magic-circuit", "mag-multi-element"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 2 } }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "ATTR_DIST_WRONG_TOTAL")).toBe(true);
  });

  it("無多重屬性時選 4 種屬性失敗", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 3,
      selectedSkillIds: [
        "mag-magic-circuit",
        "mag-reinforcement",
        "mag-familiar",
        "mag-bounded-field",
      ],
      skillConfigs: {
        "mag-magic-circuit": [
          {
            type: "attribute_distribution",
            distribution: { earth: 1, water: 1, fire: 1, wind: 1 },
          },
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "ATTR_DIST_TYPE_COUNT")).toBe(true);
  });
});

describe("validateSkillConfigs — 要素衝突", () => {
  const makeComposition = (elementIds: string[]) => ({
    type: "composition" as const,
    mode: "new" as const,
    elements: elementIds.map((id) => ({ elementSkillId: id })),
  });

  it("R1: 觸發類型互斥 — 準備 + 攻擊類型同時選失敗", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          makeComposition(["mag-element-prep", "mag-element-attack-type", "mag-element-chant"]),
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "COMPOSITION_TRIGGER_CONFLICT")).toBe(true);
  });

  it("R2: 傷害無攻擊類型/進攻失敗", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          makeComposition(["mag-element-damage", "mag-element-chant", "mag-element-area"]),
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "COMPOSITION_DAMAGE_NEEDS_ATTACK")).toBe(true);
  });

  it("R3: 防禦無其他輔助要素失敗", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          makeComposition(["mag-element-defense", "mag-element-chant", "mag-element-area"]),
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "COMPOSITION_DEFENSE_NEEDS_SUPPORT")).toBe(true);
  });

  it("R4: 增益無其他輔助要素失敗", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          makeComposition(["mag-element-buff", "mag-element-chant", "mag-element-area"]),
        ],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "COMPOSITION_BUFF_NEEDS_SUPPORT")).toBe(true);
  });

  it("合法組合 — 攻擊類型 + 傷害 + 詠唱 通過", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          makeComposition(["mag-element-attack-type", "mag-element-damage", "mag-element-chant"]),
        ],
      },
    });
    // Should not have any composition conflict errors
    const conflictErrors = result.errors.filter(
      (e) =>
        e.code.startsWith("COMPOSITION_TRIGGER") ||
        e.code.startsWith("COMPOSITION_DAMAGE") ||
        e.code.startsWith("COMPOSITION_DEFENSE") ||
        e.code.startsWith("COMPOSITION_BUFF"),
    );
    expect(conflictErrors).toHaveLength(0);
  });

  it("合法組合 — 防禦 + 增益（互為輔助）通過", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          makeComposition(["mag-element-defense", "mag-element-buff", "mag-element-chant"]),
        ],
      },
    });
    const conflictErrors = result.errors.filter(
      (e) => e.code.startsWith("COMPOSITION_DEFENSE") || e.code.startsWith("COMPOSITION_BUFF"),
    );
    expect(conflictErrors).toHaveLength(0);
  });

  it("擴充模式不檢查衝突規則", () => {
    const result = validateSkillConfigs({
      classId: "magician",
      classLevel: 2,
      selectedSkillIds: ["mag-magic-circuit", "mag-magic-composition", "mag-reinforcement"],
      skillConfigs: {
        "mag-magic-circuit": [{ type: "attribute_distribution", distribution: { earth: 3 } }],
        "mag-magic-composition": [
          {
            type: "composition",
            mode: "expand",
            targetIndex: 0,
            elements: [{ elementSkillId: "mag-element-damage" }],
          },
        ],
      },
    });
    const conflictErrors = result.errors.filter((e) => e.code.startsWith("COMPOSITION_DAMAGE"));
    expect(conflictErrors).toHaveLength(0);
  });
});
