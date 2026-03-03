// === 技能系統統一匯出 ===

export type {
  SkillId,
  SkillTrigger,
  AttackDomain,
  SkillPrereqType,
  SkillPrereq,
  SkillConfigType,
  SkillDef,
  InitialSkillStepType,
  InitialSkillStep,
  SpecialLevelRule,
  ClassSkillAcquisition,
  MagicAttribute,
  FamiliarType,
  FamiliarConfig,
  MysticCodeConfig,
  CompositionElementEntry,
  CompositionConfig,
  AttributeDistributionConfig,
  SkillInstanceConfig,
  SkillSelection,
  EndlessDestructionSlot,
  SwordsmanSchool,
  SwordsmanRank,
  SwordsmanRankDef,
} from "./types.js";

export {
  CLASS_SKILL_ACQUISITIONS,
  getClassSkillAcquisition,
  computeExpectedSkillCount,
} from "./acquisitionRules.js";

export { MAGICIAN_SKILLS } from "./magicianSkills.js";
export { EXECUTOR_SKILLS } from "./executorSkills.js";
export { SWORDSMAN_SKILLS } from "./swordsmanSkills.js";
export { FIGHTER_SKILLS } from "./fighterSkills.js";
export { HUNTER_SKILLS } from "./hunterSkills.js";
export { ESPER_SKILLS } from "./esperSkills.js";

export { MYSTIC_CODES, MYSTIC_CODE_IDS, findMysticCode, getMysticCode } from "./mysticCodes.js";
export type { MysticCodeDef } from "./mysticCodes.js";

export {
  FAMILIAR_OPTIONS,
  ELEMENT_SUB_CHOICES,
  ELEMENTS_WITH_SUB_CHOICE,
  getElementSubChoice,
  isValidSubChoice,
} from "./magicianConfigs.js";
export type {
  FamiliarOptionDef,
  ElementSubChoiceDef,
  ElementSubChoiceOption,
} from "./magicianConfigs.js";

import type { SkillDef, SkillId } from "./types.js";
import type { MasterLevelId } from "../masterTypes.js";
import { MAGICIAN_SKILLS } from "./magicianSkills.js";
import { EXECUTOR_SKILLS } from "./executorSkills.js";
import { SWORDSMAN_SKILLS } from "./swordsmanSkills.js";
import { FIGHTER_SKILLS } from "./fighterSkills.js";
import { HUNTER_SKILLS } from "./hunterSkills.js";
import { ESPER_SKILLS } from "./esperSkills.js";

/** 所有技能的統一集合 */
export const ALL_SKILLS: readonly SkillDef[] = Object.freeze([
  ...MAGICIAN_SKILLS,
  ...EXECUTOR_SKILLS,
  ...SWORDSMAN_SKILLS,
  ...FIGHTER_SKILLS,
  ...HUNTER_SKILLS,
  ...ESPER_SKILLS,
]);

const SKILL_BY_ID: ReadonlyMap<SkillId, SkillDef> = new Map(ALL_SKILLS.map((s) => [s.id, s]));

const SKILLS_BY_CLASS: ReadonlyMap<string, readonly SkillDef[]> = new Map([
  ["magician", MAGICIAN_SKILLS],
  ["executor", EXECUTOR_SKILLS],
  ["swordsman", SWORDSMAN_SKILLS],
  ["fighter", FIGHTER_SKILLS],
  ["hunter", HUNTER_SKILLS],
  ["esper", ESPER_SKILLS],
]);

/** 根據 ID 查詢單一技能 */
export function getSkillDef(id: SkillId): SkillDef {
  const skill = SKILL_BY_ID.get(id);
  if (!skill) throw new Error(`Unknown skill: ${id}`);
  return skill;
}

/** 查詢單一技能（不存在時回傳 undefined） */
export function findSkillDef(id: SkillId): SkillDef | undefined {
  return SKILL_BY_ID.get(id);
}

/** 取得指定級別的所有技能 */
export function getClassSkills(classId: MasterLevelId): readonly SkillDef[] {
  const skills = SKILLS_BY_CLASS.get(classId);
  if (!skills) throw new Error(`Unknown class: ${classId}`);
  return skills;
}

const NORMAL_SKILLS_BY_CLASS: ReadonlyMap<string, readonly SkillDef[]> = new Map(
  [...SKILLS_BY_CLASS.entries()].map(([id, skills]) => [
    id,
    Object.freeze(skills.filter((s) => !s.isExtra)),
  ]),
);

const EXTRA_SKILLS_BY_CLASS: ReadonlyMap<string, readonly SkillDef[]> = new Map(
  [...SKILLS_BY_CLASS.entries()].map(([id, skills]) => [
    id,
    Object.freeze(skills.filter((s) => s.isExtra)),
  ]),
);

/** 取得指定級別的一般特技（非額外） */
export function getClassNormalSkills(classId: MasterLevelId): readonly SkillDef[] {
  const skills = NORMAL_SKILLS_BY_CLASS.get(classId);
  if (!skills) throw new Error(`Unknown class: ${classId}`);
  return skills;
}

/** 取得指定級別的額外特技 */
export function getClassExtraSkills(classId: MasterLevelId): readonly SkillDef[] {
  const skills = EXTRA_SKILLS_BY_CLASS.get(classId);
  if (!skills) throw new Error(`Unknown class: ${classId}`);
  return skills;
}
