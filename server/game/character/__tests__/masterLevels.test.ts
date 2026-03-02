import { describe, it, expect } from "vitest";
import {
  MASTER_LEVELS,
  MASTER_LEVEL_IDS,
  getMasterLevelDef,
  getAvailableLevels,
  DEFAULT_LEVEL_CONFIG,
} from "../masterLevels.js";

describe("MASTER_LEVELS", () => {
  it("has exactly 6 levels", () => {
    expect(MASTER_LEVELS).toHaveLength(6);
  });

  it("has unique IDs", () => {
    const ids = MASTER_LEVELS.map((l) => l.id);
    expect(new Set(ids).size).toBe(6);
  });

  it("each level has exactly 10 modifier entries", () => {
    for (const level of MASTER_LEVELS) {
      expect(level.modifiers).toHaveLength(10);
    }
  });

  it("is frozen", () => {
    expect(Object.isFrozen(MASTER_LEVELS)).toBe(true);
  });

  it("each level def is frozen", () => {
    for (const level of MASTER_LEVELS) {
      expect(Object.isFrozen(level)).toBe(true);
      expect(Object.isFrozen(level.baseStats)).toBe(true);
      expect(Object.isFrozen(level.modifiers)).toBe(true);
    }
  });

  it("each modifier row is frozen", () => {
    for (const level of MASTER_LEVELS) {
      for (const mod of level.modifiers) {
        expect(Object.isFrozen(mod)).toBe(true);
      }
    }
  });
});

describe("MASTER_LEVEL_IDS", () => {
  it("has 6 IDs matching MASTER_LEVELS", () => {
    expect(MASTER_LEVEL_IDS).toHaveLength(6);
    for (const level of MASTER_LEVELS) {
      expect(MASTER_LEVEL_IDS).toContain(level.id);
    }
  });

  it("is frozen", () => {
    expect(Object.isFrozen(MASTER_LEVEL_IDS)).toBe(true);
  });
});

describe("getMasterLevelDef", () => {
  it("returns correct def for each valid ID", () => {
    for (const level of MASTER_LEVELS) {
      expect(getMasterLevelDef(level.id)).toBe(level);
    }
  });

  it("throws for unknown ID", () => {
    expect(() => getMasterLevelDef("unknown" as never)).toThrow("Unknown master level");
  });
});

describe("getAvailableLevels", () => {
  it("returns all 6 levels", () => {
    expect(getAvailableLevels()).toBe(MASTER_LEVELS);
  });
});

describe("DEFAULT_LEVEL_CONFIG", () => {
  it("has correct defaults", () => {
    expect(DEFAULT_LEVEL_CONFIG.startingPoints).toBe(3);
    expect(DEFAULT_LEVEL_CONFIG.gameLevel).toBe(4);
    expect(DEFAULT_LEVEL_CONFIG.maxClasses).toBe(3);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(DEFAULT_LEVEL_CONFIG)).toBe(true);
  });
});

describe("base stats (spot checks from TRPG source)", () => {
  it("魔術師: 2/3/5/2", () => {
    const def = getMasterLevelDef("magician");
    expect(def.baseStats).toEqual({ body: 2, perception: 3, reason: 5, will: 2 });
  });

  it("劍士: 4/4/2/2", () => {
    const def = getMasterLevelDef("swordsman");
    expect(def.baseStats).toEqual({ body: 4, perception: 4, reason: 2, will: 2 });
  });

  it("武鬥家: 5/2/2/3", () => {
    const def = getMasterLevelDef("fighter");
    expect(def.baseStats).toEqual({ body: 5, perception: 2, reason: 2, will: 3 });
  });

  it("超能力者: 2/2/2/2", () => {
    const def = getMasterLevelDef("esper");
    expect(def.baseStats).toEqual({ body: 2, perception: 2, reason: 2, will: 2 });
  });
});

describe("modifier tables (spot checks from TRPG source)", () => {
  it("魔術師 LV3: 射撃=2, 精神=2, 生命力=9, 集中力=13", () => {
    const mod = getMasterLevelDef("magician").modifiers[2]; // index 2 = LV3
    expect(mod.ranged).toBe(2);
    expect(mod.spirit).toBe(2);
    expect(mod.hp).toBe(9);
    expect(mod.focus).toBe(13);
  });

  it("武鬥家 LV4: 近戰=7, 行動=8, 生命力=26, 防禦點=2", () => {
    const mod = getMasterLevelDef("fighter").modifiers[3]; // index 3 = LV4
    expect(mod.melee).toBe(7);
    expect(mod.action).toBe(8);
    expect(mod.hp).toBe(26);
    expect(mod.defense).toBe(2);
  });

  it("超能力者 LV1: 精神=1, all others 0", () => {
    const mod = getMasterLevelDef("esper").modifiers[0];
    expect(mod).toEqual({
      melee: 0,
      ranged: 0,
      spirit: 1,
      action: 0,
      hp: 0,
      focus: 0,
      defense: 0,
    });
  });

  it("劍士 LV5: 近戰=6, 行動=5, 防禦點=1", () => {
    const mod = getMasterLevelDef("swordsman").modifiers[4]; // index 4 = LV5
    expect(mod.melee).toBe(6);
    expect(mod.action).toBe(5);
    expect(mod.defense).toBe(1);
  });

  it("狩人 LV3: 射撃=4, 近戰=0, 精神=0", () => {
    const mod = getMasterLevelDef("hunter").modifiers[2]; // index 2 = LV3
    expect(mod.ranged).toBe(4);
    expect(mod.melee).toBe(0);
    expect(mod.spirit).toBe(0);
  });
});
