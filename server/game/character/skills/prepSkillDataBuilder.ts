// === 技能資料 → 客戶端 View 轉換 ===
//
// 將後端 SkillDef / ClassSkillAcquisition 轉換為 protocol 定義的輕量 View 型別，
// 用於 PrepConfig 傳送給前端。

import type { SkillDef, SkillPrereq, ClassSkillAcquisition } from "./types.js";
import type {
  SkillView,
  SkillPrereqView,
  ClassAcquisitionView,
  InitialStepView,
  MysticCodeView,
  FamiliarOptionView,
  ElementSubChoiceView,
} from "../../../shared/protocol.js";
import { getClassSkills } from "./index.js";
import { CLASS_SKILL_ACQUISITIONS } from "./acquisitionRules.js";
import type { MasterLevelId } from "../masterTypes.js";
import { getMasterLevelDef, MASTER_LEVEL_IDS } from "../masterLevels.js";
import { MYSTIC_CODES } from "./mysticCodes.js";
import { FAMILIAR_OPTIONS, ELEMENT_SUB_CHOICES } from "./magicianConfigs.js";

// --- 前置條件 → 人類可讀描述 ---

function prereqToView(prereq: SkillPrereq): SkillPrereqView {
  switch (prereq.type) {
    case "class_level": {
      let className = prereq.classId ?? "";
      try {
        if (prereq.classId) className = getMasterLevelDef(prereq.classId as MasterLevelId).nameJa;
      } catch {
        /* fallback to raw classId */
      }
      return {
        type: prereq.type,
        description: `${className} 等級 ${prereq.minLevel ?? 1}+`,
      };
    }
    case "skill":
      return {
        type: prereq.type,
        description: `需要先取得 ${prereq.skillId}`,
      };
    case "skill_any":
      return {
        type: prereq.type,
        description: `需要以下任一：${(prereq.skillIds ?? []).join("、")}`,
      };
    case "skill_count":
      return {
        type: prereq.type,
        description: `需要 ${prereq.count ?? 0} 個指定技能`,
      };
    case "rank":
      return {
        type: prereq.type,
        description: `需達段位：${prereq.rankId ?? ""}`,
      };
    case "school":
      return {
        type: prereq.type,
        description: `需選擇流派：${prereq.schoolId ?? ""}`,
      };
    case "creation_only":
      return {
        type: prereq.type,
        description: "僅限角色創建時取得",
      };
    case "class_exclusive":
      return {
        type: prereq.type,
        description: "僅限純單一級別角色",
      };
    case "not_skill":
      return {
        type: prereq.type,
        description: `與 ${prereq.skillId} 互斥`,
      };
    case "style":
      return {
        type: prereq.type,
        description: `需要風格：${prereq.styleId ?? ""}`,
      };
    default:
      return {
        type: prereq.type,
        description: "未知條件",
      };
  }
}

// --- SkillDef → SkillView ---

function skillDefToView(def: SkillDef): SkillView {
  return Object.freeze({
    id: def.id,
    classId: def.classId,
    nameJa: def.nameJa,
    nameCht: def.nameCht,
    trigger: def.trigger,
    ...(def.attackDomain ? { attackDomain: def.attackDomain } : {}),
    isExtra: def.isExtra,
    costDescription: def.costDescription,
    effectDescription: def.effectDescription,
    tpReward: def.tpReward,
    prerequisites: Object.freeze(def.prerequisites.map(prereqToView)),
    ...(def.repeatable ? { repeatable: def.repeatable } : {}),
    ...(def.compositionOnly ? { compositionOnly: def.compositionOnly } : {}),
    ...(def.configType ? { configType: def.configType } : {}),
  });
}

// --- ClassSkillAcquisition → ClassAcquisitionView ---

function acquisitionToView(acq: ClassSkillAcquisition): ClassAcquisitionView {
  return Object.freeze({
    classId: acq.classId,
    initialSteps: Object.freeze(
      acq.initialSteps.map(
        (step): InitialStepView =>
          Object.freeze({
            type: step.type,
            ...(step.skillIds ? { skillIds: step.skillIds } : {}),
            ...(step.count !== undefined ? { count: step.count } : {}),
            ...(step.label ? { label: step.label } : {}),
          }),
      ),
    ),
    perLevelUpCount: acq.perLevelUpCount,
    bonusLevels: [...acq.bonusLevels],
  });
}

// --- 公開 API ---

/** 建構所有級別的 SkillView 資料（classId → SkillView[]） */
export function buildAllClassSkillViews(): Readonly<Record<string, readonly SkillView[]>> {
  const result: Record<string, readonly SkillView[]> = {};
  for (const classId of MASTER_LEVEL_IDS) {
    result[classId] = Object.freeze(getClassSkills(classId).map(skillDefToView));
  }
  return Object.freeze(result);
}

/** 建構所有級別的取得規則 View */
export function buildAllClassAcquisitionViews(): readonly ClassAcquisitionView[] {
  return Object.freeze(CLASS_SKILL_ACQUISITIONS.map(acquisitionToView));
}

/** 建構禮裝目錄 View */
export function buildMysticCodeViews(): readonly MysticCodeView[] {
  return Object.freeze(
    MYSTIC_CODES.map((mc) =>
      Object.freeze({
        id: mc.id,
        nameJa: mc.nameJa,
        nameCht: mc.nameCht,
        category: mc.category,
        effectDescription: mc.effectDescription,
      }),
    ),
  );
}

/** 建構使魔選項 View */
export function buildFamiliarOptionViews(): readonly FamiliarOptionView[] {
  return Object.freeze(
    FAMILIAR_OPTIONS.map((fo) =>
      Object.freeze({
        type: fo.type,
        nameJa: fo.nameJa,
        nameCht: fo.nameCht,
        description: fo.description,
      }),
    ),
  );
}

/** 建構要素子選擇 View */
export function buildElementSubChoiceViews(): readonly ElementSubChoiceView[] {
  return Object.freeze(
    ELEMENT_SUB_CHOICES.map((sc) =>
      Object.freeze({
        elementSkillId: sc.elementSkillId,
        choiceKey: sc.choiceKey,
        label: sc.labelCht,
        options: Object.freeze(
          sc.options.map((opt) =>
            Object.freeze({
              value: opt.value,
              label: opt.labelCht,
            }),
          ),
        ),
      }),
    ),
  );
}
