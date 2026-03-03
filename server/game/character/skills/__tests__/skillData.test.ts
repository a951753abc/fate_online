import { describe, it, expect } from "vitest";
import {
  ALL_SKILLS,
  MAGICIAN_SKILLS,
  EXECUTOR_SKILLS,
  SWORDSMAN_SKILLS,
  FIGHTER_SKILLS,
  HUNTER_SKILLS,
  ESPER_SKILLS,
  getSkillDef,
  findSkillDef,
  getClassSkills,
  getClassNormalSkills,
  getClassExtraSkills,
} from "../index.js";

describe("技能資料完整性", () => {
  it("6 個級別的技能總數為 199", () => {
    expect(ALL_SKILLS.length).toBe(199);
  });

  it("各級別技能數量正確", () => {
    expect(MAGICIAN_SKILLS.length).toBe(37);
    expect(EXECUTOR_SKILLS.length).toBe(37);
    expect(SWORDSMAN_SKILLS.length).toBe(35);
    expect(FIGHTER_SKILLS.length).toBe(33);
    expect(HUNTER_SKILLS.length).toBe(28);
    expect(ESPER_SKILLS.length).toBe(29);
  });

  it("每個技能都有唯一 ID", () => {
    const ids = ALL_SKILLS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("每個技能都有名稱和效果描述", () => {
    for (const skill of ALL_SKILLS) {
      expect(skill.nameCht).toBeTruthy();
      expect(skill.effectDescription).toBeTruthy();
    }
  });

  it("每個技能的 classId 與其所屬陣列對應", () => {
    for (const skill of MAGICIAN_SKILLS) {
      expect(skill.classId).toBe("magician");
    }
    for (const skill of EXECUTOR_SKILLS) {
      expect(skill.classId).toBe("executor");
    }
    for (const skill of SWORDSMAN_SKILLS) {
      expect(skill.classId).toBe("swordsman");
    }
    for (const skill of FIGHTER_SKILLS) {
      expect(skill.classId).toBe("fighter");
    }
    for (const skill of HUNTER_SKILLS) {
      expect(skill.classId).toBe("hunter");
    }
    for (const skill of ESPER_SKILLS) {
      expect(skill.classId).toBe("esper");
    }
  });
});

describe("技能查詢", () => {
  it("getSkillDef 可以查到魔術迴路", () => {
    const skill = getSkillDef("mag-magic-circuit");
    expect(skill.nameCht).toBe("魔術迴路");
    expect(skill.classId).toBe("magician");
    expect(skill.trigger).toBe("constant");
  });

  it("getSkillDef 查不到不存在的技能時拋出錯誤", () => {
    expect(() => getSkillDef("nonexistent")).toThrow("Unknown skill");
  });

  it("findSkillDef 查不到時回傳 undefined", () => {
    expect(findSkillDef("nonexistent")).toBeUndefined();
  });

  it("getClassSkills 取得指定級別全部技能", () => {
    const skills = getClassSkills("magician");
    expect(skills.length).toBe(37);
  });

  it("getClassNormalSkills 只取得一般特技", () => {
    const normals = getClassNormalSkills("magician");
    expect(normals.every((s) => !s.isExtra)).toBe(true);
  });

  it("getClassExtraSkills 只取得額外特技", () => {
    const extras = getClassExtraSkills("magician");
    expect(extras.every((s) => s.isExtra)).toBe(true);
  });

  it("getClassSkills 對未知級別拋出錯誤", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => getClassSkills("invalid" as any)).toThrow("Unknown class");
  });
});

describe("關鍵技能存在性", () => {
  it("魔術師必取技能: 魔術迴路", () => {
    expect(findSkillDef("mag-magic-circuit")).toBeDefined();
  });

  it("劍士必取技能: 段位 + 三個流派", () => {
    expect(findSkillDef("swd-rank")).toBeDefined();
    expect(findSkillDef("swd-school-nitenichi")).toBeDefined();
    expect(findSkillDef("swd-school-ittou")).toBeDefined();
    expect(findSkillDef("swd-school-musou")).toBeDefined();
  });

  it("武鬥家必取技能: 武道", () => {
    expect(findSkillDef("ftr-martial-way")).toBeDefined();
  });

  it("超能力者起源二選一: 一代變異 / 血脈", () => {
    expect(findSkillDef("esp-first-generation")).toBeDefined();
    expect(findSkillDef("esp-bloodline")).toBeDefined();
  });

  it("狩人弓系/槍系技能存在", () => {
    expect(findSkillDef("hnt-bow")).toBeDefined();
    expect(findSkillDef("hnt-gun")).toBeDefined();
    expect(findSkillDef("hnt-gunner-instinct")).toBeDefined();
    expect(findSkillDef("hnt-battlefield-control")).toBeDefined();
  });

  it("代行者關鍵技能存在", () => {
    expect(findSkillDef("exe-black-key")).toBeDefined();
    expect(findSkillDef("exe-heresy-judge")).toBeDefined();
    expect(findSkillDef("exe-baptism-chant")).toBeDefined();
  });
});

describe("技能分類正確性", () => {
  it("魔術師的要素構成技能屬於 special 或 attack trigger", () => {
    // 要素構成技能以「要素：」開頭（排除「屬性強化」等非要素構成技能）
    const elementSkills = MAGICIAN_SKILLS.filter((s) => s.nameCht.startsWith("要素："));
    expect(elementSkills.length).toBe(14);
    for (const skill of elementSkills) {
      // 「要素：攻擊類型」原始分類包含「攻擊類型」，解析為 attack
      expect(["special", "attack"]).toContain(skill.trigger);
    }
  });

  it("劍士流派技能全部是 attack 類型", () => {
    const schoolSkills = SWORDSMAN_SKILLS.filter(
      (s) =>
        s.id === "swd-school-nitenichi" ||
        s.id === "swd-school-ittou" ||
        s.id === "swd-school-musou",
    );
    expect(schoolSkills.length).toBe(3);
    for (const skill of schoolSkills) {
      expect(skill.trigger).toBe("attack");
    }
  });

  it("額外特技數量在合理範圍", () => {
    for (const classId of [
      "magician",
      "executor",
      "swordsman",
      "fighter",
      "hunter",
      "esper",
    ] as const) {
      const extras = getClassExtraSkills(classId);
      expect(extras.length).toBeGreaterThan(0);
      expect(extras.length).toBeLessThanOrEqual(20);
    }
  });
});
