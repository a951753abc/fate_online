import { describe, it, expect } from "vitest";
import {
  validateAllocation,
  computeBaseAbilities,
  computeBonuses,
  computeBaseCombat,
  computeLevelModifiers,
  computeFinalCombat,
  computeAllStats,
} from "../masterStats.js";
import type { LevelAllocation, LevelConfig } from "../masterTypes.js";

// === validateAllocation ===

describe("validateAllocation", () => {
  it("accepts single level matching gameLevel", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 4 }];
    expect(validateAllocation(alloc)).toBeNull();
  });

  it("accepts two levels summing to gameLevel", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "magician", level: 2 },
      { levelId: "swordsman", level: 2 },
    ];
    expect(validateAllocation(alloc)).toBeNull();
  });

  it("accepts three levels summing to gameLevel", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "magician", level: 2 },
      { levelId: "swordsman", level: 1 },
      { levelId: "hunter", level: 1 },
    ];
    expect(validateAllocation(alloc)).toBeNull();
  });

  it("rejects empty allocation", () => {
    expect(validateAllocation([])).toBe("至少需要選擇一個級別");
  });

  it("rejects more than 3 classes", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "magician", level: 1 },
      { levelId: "swordsman", level: 1 },
      { levelId: "hunter", level: 1 },
      { levelId: "fighter", level: 1 },
    ];
    expect(validateAllocation(alloc)).toContain("最多只能選擇");
  });

  it("rejects duplicate level IDs", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "magician", level: 2 },
      { levelId: "magician", level: 2 },
    ];
    expect(validateAllocation(alloc)).toContain("不可重複");
  });

  it("rejects non-integer level", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 2.5 }];
    expect(validateAllocation(alloc)).toContain("整數");
  });

  it("rejects fractional level below 1 with integer error (not minimum error)", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 0.5 }];
    expect(validateAllocation(alloc)).toContain("整數");
  });

  it("rejects level < 1", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 0 }];
    expect(validateAllocation(alloc)).toContain("至少為 1");
  });

  it("rejects level > 10", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 11 }];
    expect(validateAllocation(alloc)).toContain("最多為 10");
  });

  it("rejects total != gameLevel", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 3 }];
    expect(validateAllocation(alloc)).toContain("等級總和必須為 4");
  });

  it("rejects unknown level ID", () => {
    const alloc = [{ levelId: "unknown" as never, level: 4 }];
    expect(validateAllocation(alloc)).toContain("未知的級別");
  });

  it("works with custom config (gameLevel=6)", () => {
    const config: LevelConfig = { startingPoints: 3, gameLevel: 6, maxClasses: 3 };
    const alloc: LevelAllocation[] = [
      { levelId: "magician", level: 3 },
      { levelId: "swordsman", level: 3 },
    ];
    expect(validateAllocation(alloc, config)).toBeNull();
  });

  it("works with custom config (gameLevel=3, starting)", () => {
    const config: LevelConfig = { startingPoints: 3, gameLevel: 3, maxClasses: 3 };
    const alloc: LevelAllocation[] = [{ levelId: "fighter", level: 3 }];
    expect(validateAllocation(alloc, config)).toBeNull();
  });
});

// === computeBaseAbilities ===

describe("computeBaseAbilities", () => {
  it("single level magician LV3: (2×3, 3×3, 5×3, 2×3) = 6/9/15/6", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 3 }];
    const stats = computeBaseAbilities(alloc, "body");
    expect(stats).toEqual({ body: 7, perception: 9, reason: 15, will: 6 }); // +1 body
  });

  it("single level magician LV3, free point on reason", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 3 }];
    const stats = computeBaseAbilities(alloc, "reason");
    expect(stats).toEqual({ body: 6, perception: 9, reason: 16, will: 6 });
  });

  it("dual level: fighter LV2 + esper LV1", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "fighter", level: 2 },
      { levelId: "esper", level: 1 },
    ];
    // fighter: 5×2=10, 2×2=4, 2×2=4, 3×2=6
    // esper:   2×1=2,  2×1=2, 2×1=2, 2×1=2
    // sum:     12, 6, 6, 8
    const stats = computeBaseAbilities(alloc, "will");
    expect(stats).toEqual({ body: 12, perception: 6, reason: 6, will: 9 }); // +1 will
  });

  it("triple level: magician LV2 + swordsman LV1 + hunter LV1 (gameLevel=4)", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "magician", level: 2 },
      { levelId: "swordsman", level: 1 },
      { levelId: "hunter", level: 1 },
    ];
    // magician:  2×2=4, 3×2=6, 5×2=10, 2×2=4
    // swordsman: 4×1=4, 4×1=4, 2×1=2,  2×1=2
    // hunter:    3×1=3, 3×1=3, 3×1=3,  3×1=3
    // sum:       11, 13, 15, 9
    const stats = computeBaseAbilities(alloc, "body");
    expect(stats).toEqual({ body: 12, perception: 13, reason: 15, will: 9 });
  });

  it("result is frozen", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 4 }];
    expect(Object.isFrozen(computeBaseAbilities(alloc, "body"))).toBe(true);
  });
});

// === computeBonuses ===

describe("computeBonuses", () => {
  it("floor(12/3)=4, floor(6/3)=2, floor(6/3)=2, floor(9/3)=3", () => {
    const bonuses = computeBonuses({ body: 12, perception: 6, reason: 6, will: 9 });
    expect(bonuses).toEqual({ body: 4, perception: 2, reason: 2, will: 3 });
  });

  it("floor(7/3)=2, floor(9/3)=3, floor(15/3)=5, floor(6/3)=2", () => {
    const bonuses = computeBonuses({ body: 7, perception: 9, reason: 15, will: 6 });
    expect(bonuses).toEqual({ body: 2, perception: 3, reason: 5, will: 2 });
  });

  it("handles values not divisible by 3", () => {
    const bonuses = computeBonuses({ body: 11, perception: 13, reason: 15, will: 9 });
    expect(bonuses).toEqual({
      body: 3, // floor(11/3) = 3
      perception: 4, // floor(13/3) = 4
      reason: 5, // floor(15/3) = 5
      will: 3, // floor(9/3) = 3
    });
  });

  it("result is frozen", () => {
    expect(Object.isFrozen(computeBonuses({ body: 6, perception: 6, reason: 6, will: 6 }))).toBe(
      true,
    );
  });
});

// === computeBaseCombat ===

describe("computeBaseCombat", () => {
  it("computes correctly from TRPG example bonuses (4/2/2/3)", () => {
    const combat = computeBaseCombat({ body: 4, perception: 2, reason: 2, will: 3 });
    expect(combat).toEqual({
      melee: 6, // 4+2
      ranged: 4, // 2+2
      spirit: 5, // 2+3
      action: 7, // 4+3
      hp: 30, // (4+2)×5
      focus: 25, // (2+3)×5
      defense: 0,
    });
  });

  it("defense is always 0 at base", () => {
    const combat = computeBaseCombat({ body: 10, perception: 10, reason: 10, will: 10 });
    expect(combat.defense).toBe(0);
  });

  it("result is frozen", () => {
    expect(Object.isFrozen(computeBaseCombat({ body: 1, perception: 1, reason: 1, will: 1 }))).toBe(
      true,
    );
  });
});

// === computeLevelModifiers ===

describe("computeLevelModifiers", () => {
  it("single level: magician LV4 modifiers", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 4 }];
    const mods = computeLevelModifiers(alloc);
    expect(mods).toEqual({
      melee: 2,
      ranged: 3,
      spirit: 3,
      action: 2,
      hp: 15,
      focus: 15,
      defense: 0,
    });
  });

  it("multi level: fighter LV2 + esper LV1", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "fighter", level: 2 },
      { levelId: "esper", level: 1 },
    ];
    // fighter LV2: melee=1, ranged=0, spirit=0, action=2, hp=10, focus=8, defense=1
    // esper LV1:   melee=0, ranged=0, spirit=1, action=0, hp=0,  focus=0, defense=0
    const mods = computeLevelModifiers(alloc);
    expect(mods).toEqual({
      melee: 1,
      ranged: 0,
      spirit: 1,
      action: 2,
      hp: 10,
      focus: 8,
      defense: 1,
    });
  });

  it("triple level sums all modifiers", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "executor", level: 1 },
      { levelId: "hunter", level: 1 },
      { levelId: "esper", level: 1 },
    ];
    // executor LV1: 1,1,1,1,2,2,0
    // hunter LV1:   -2,2,-2,-2,0,0,0
    // esper LV1:    0,0,1,0,0,0,0
    const mods = computeLevelModifiers(alloc);
    expect(mods).toEqual({
      melee: -1,
      ranged: 3,
      spirit: 0,
      action: -1,
      hp: 2,
      focus: 2,
      defense: 0,
    });
  });

  it("result is frozen", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 4 }];
    expect(Object.isFrozen(computeLevelModifiers(alloc))).toBe(true);
  });
});

// === computeFinalCombat ===

describe("computeFinalCombat", () => {
  it("adds base combat and level modifiers", () => {
    const base = { melee: 6, ranged: 4, spirit: 5, action: 7, hp: 30, focus: 25, defense: 0 };
    const mods = { melee: 1, ranged: 0, spirit: 1, action: 2, hp: 10, focus: 8, defense: 1 };
    const final = computeFinalCombat(base, mods);
    expect(final).toEqual({
      melee: 7,
      ranged: 4,
      spirit: 6,
      action: 9,
      hp: 40,
      focus: 33,
      defense: 1,
    });
  });

  it("handles negative modifiers", () => {
    const base = { melee: 2, ranged: 2, spirit: 2, action: 2, hp: 10, focus: 10, defense: 0 };
    const mods = { melee: -1, ranged: -2, spirit: 0, action: -1, hp: 0, focus: 0, defense: 0 };
    const final = computeFinalCombat(base, mods);
    expect(final.melee).toBe(1);
    expect(final.ranged).toBe(0);
  });

  it("result is frozen", () => {
    const base = { melee: 0, ranged: 0, spirit: 0, action: 0, hp: 0, focus: 0, defense: 0 };
    expect(Object.isFrozen(computeFinalCombat(base, base))).toBe(true);
  });
});

// === computeAllStats (integration) ===

describe("computeAllStats", () => {
  it("TRPG example: fighter LV2 + esper LV1, free→will", () => {
    const alloc: LevelAllocation[] = [
      { levelId: "fighter", level: 2 },
      { levelId: "esper", level: 1 },
    ];
    const result = computeAllStats(alloc, "will");

    expect(result.baseAbilities).toEqual({ body: 12, perception: 6, reason: 6, will: 9 });
    expect(result.bonuses).toEqual({ body: 4, perception: 2, reason: 2, will: 3 });
    expect(result.baseCombat).toEqual({
      melee: 6,
      ranged: 4,
      spirit: 5,
      action: 7,
      hp: 30,
      focus: 25,
      defense: 0,
    });
    expect(result.levelModifiers).toEqual({
      melee: 1,
      ranged: 0,
      spirit: 1,
      action: 2,
      hp: 10,
      focus: 8,
      defense: 1,
    });
    expect(result.finalCombat).toEqual({
      melee: 7,
      ranged: 4,
      spirit: 6,
      action: 9,
      hp: 40,
      focus: 33,
      defense: 1,
    });
  });

  it("specialist: magician LV4, free→reason", () => {
    const alloc: LevelAllocation[] = [{ levelId: "magician", level: 4 }];
    const result = computeAllStats(alloc, "reason");

    // base: 2×4=8, 3×4=12, 5×4+1=21, 2×4=8
    expect(result.baseAbilities).toEqual({ body: 8, perception: 12, reason: 21, will: 8 });
    // bonuses: 2, 4, 7, 2
    expect(result.bonuses).toEqual({ body: 2, perception: 4, reason: 7, will: 2 });
    // baseCombat: melee=6, ranged=11, spirit=9, action=4, hp=45, focus=30
    expect(result.baseCombat).toEqual({
      melee: 6,
      ranged: 11,
      spirit: 9,
      action: 4,
      hp: 45,
      focus: 30,
      defense: 0,
    });
    // magician LV4 modifiers
    expect(result.levelModifiers).toEqual({
      melee: 2,
      ranged: 3,
      spirit: 3,
      action: 2,
      hp: 15,
      focus: 15,
      defense: 0,
    });
    expect(result.finalCombat).toEqual({
      melee: 8,
      ranged: 14,
      spirit: 12,
      action: 6,
      hp: 60,
      focus: 45,
      defense: 0,
    });
  });

  it("all objects in the chain are frozen", () => {
    const alloc: LevelAllocation[] = [{ levelId: "executor", level: 4 }];
    const result = computeAllStats(alloc, "body");
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.baseAbilities)).toBe(true);
    expect(Object.isFrozen(result.bonuses)).toBe(true);
    expect(Object.isFrozen(result.baseCombat)).toBe(true);
    expect(Object.isFrozen(result.levelModifiers)).toBe(true);
    expect(Object.isFrozen(result.finalCombat)).toBe(true);
  });
});
