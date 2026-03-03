// === 技能選擇驗證（千夜月姫 TRPG）===
//
// 驗證玩家的技能選擇是否符合規則書規定。
// 所有技能都是玩家主動選擇——系統只負責驗證，不自動給予。

import type { SkillId, InitialSkillStep, SkillSelection } from "./types.js";
import type { MasterLevelId } from "../masterTypes.js";
import { getClassSkillAcquisition, computeExpectedSkillCount } from "./acquisitionRules.js";
import { getClassSkills, findSkillDef } from "./index.js";

// --- 驗證結果 ---

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
}

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

function err(code: string, message: string, details?: Record<string, unknown>): ValidationError {
  return { code, message, details };
}

// --- 初期步驟驗證 ---

/**
 * 驗證初期取得步驟是否被正確滿足
 */
export function validateInitialSteps(
  classId: MasterLevelId,
  selectedSkillIds: readonly SkillId[],
): ValidationResult {
  const acq = getClassSkillAcquisition(classId);
  const classSkills = getClassSkills(classId);
  const classSkillIds = new Set(classSkills.map((s) => s.id));
  const errors: ValidationError[] = [];

  for (const step of acq.initialSteps) {
    const stepErrors = validateStep(step, selectedSkillIds, classId);
    errors.push(...stepErrors.errors);
  }

  // 驗證選擇的技能全部屬於該級別
  for (const skillId of selectedSkillIds) {
    if (!classSkillIds.has(skillId)) {
      errors.push(
        err("SKILL_NOT_IN_CLASS", `技能 ${skillId} 不屬於 ${classId}`, { skillId, classId }),
      );
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

function validateStep(
  step: InitialSkillStep,
  selectedSkillIds: readonly SkillId[],
  classId: MasterLevelId,
): { errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  switch (step.type) {
    case "required": {
      // 規則要求的技能必須出現在選擇中
      const required = step.skillIds ?? [];
      for (const reqId of required) {
        if (!selectedSkillIds.includes(reqId)) {
          errors.push(
            err("MISSING_REQUIRED_SKILL", `${classId} 規則要求選擇 ${reqId}`, {
              skillId: reqId,
              classId,
            }),
          );
        }
      }
      break;
    }
    case "choose_one": {
      // 必須從指定選項中選擇恰好一個
      const options = step.skillIds ?? [];
      const chosen = selectedSkillIds.filter((id) => options.includes(id));
      if (chosen.length === 0) {
        errors.push(
          err(
            "MISSING_CHOICE",
            `${step.label ?? "選擇"}: 必須從 [${options.join(", ")}] 中選擇一個`,
            { options, classId },
          ),
        );
      } else if (chosen.length > 1) {
        errors.push(
          err(
            "MULTIPLE_CHOICE",
            `${step.label ?? "選擇"}: 只能選擇一個，但選了 ${chosen.length} 個`,
            { chosen, classId },
          ),
        );
      }
      break;
    }
    case "free": {
      // 自由選擇 N 個——這裡只驗證總數，不驗證具體選了什麼（前置條件另外驗證）
      // free choices 會在 validateSkillCount 中統一驗證
      break;
    }
  }

  return { errors };
}

// --- 技能總數驗證 ---

/**
 * 驗證技能數量是否正確
 */
export function validateSkillCount(
  classId: MasterLevelId,
  classLevel: number,
  selectedSkillIds: readonly SkillId[],
): ValidationResult {
  const expected = computeExpectedSkillCount(classId, classLevel);
  const actual = selectedSkillIds.length;

  if (actual !== expected) {
    return fail(
      err(
        "WRONG_SKILL_COUNT",
        `${classId} LV${classLevel} 應有 ${expected} 個技能，但選了 ${actual} 個`,
        { classId, classLevel, expected, actual },
      ),
    );
  }

  return ok();
}

// --- 前置條件驗證 ---

/**
 * 驗證所有選擇的技能的前置條件是否滿足
 */
export function validatePrerequisites(
  classId: MasterLevelId,
  classLevel: number,
  selectedSkillIds: readonly SkillId[],
): ValidationResult {
  const errors: ValidationError[] = [];
  const selectedSet = new Set(selectedSkillIds);

  for (const skillId of selectedSkillIds) {
    const skillDef = findSkillDef(skillId);
    if (!skillDef) {
      errors.push(err("UNKNOWN_SKILL", `技能不存在: ${skillId}`, { skillId }));
      continue;
    }

    for (const prereq of skillDef.prerequisites) {
      switch (prereq.type) {
        case "class_level": {
          const reqClass = prereq.classId ?? classId;
          const reqLevel = prereq.minLevel ?? 1;
          if (reqClass === classId && classLevel < reqLevel) {
            errors.push(
              err("PREREQ_CLASS_LEVEL", `${skillDef.nameCht} 需要 ${reqClass} 等級 ${reqLevel}+`, {
                skillId,
                reqClass,
                reqLevel,
                currentLevel: classLevel,
              }),
            );
          }
          break;
        }
        case "skill": {
          const reqSkill = prereq.skillId;
          if (reqSkill && !selectedSet.has(reqSkill)) {
            errors.push(
              err("PREREQ_SKILL", `${skillDef.nameCht} 需要先取得 ${reqSkill}`, {
                skillId,
                requiredSkillId: reqSkill,
              }),
            );
          }
          break;
        }
        case "not_skill": {
          const forbidden = prereq.skillId;
          if (forbidden && selectedSet.has(forbidden)) {
            errors.push(
              err("PREREQ_NOT_SKILL", `${skillDef.nameCht} 與 ${forbidden} 互斥`, {
                skillId,
                forbiddenSkillId: forbidden,
              }),
            );
          }
          break;
        }
        case "creation_only": {
          // 此條件需要在 UI 層確認——只在角色創建時可選
          break;
        }
        case "class_exclusive": {
          // 需要整個角色只有單一級別——需要外部上下文
          break;
        }
        default:
          break;
      }
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

// --- 重複選擇驗證 ---

/**
 * 驗證是否有重複選擇的技能
 */
export function validateNoDuplicates(selectedSkillIds: readonly SkillId[]): ValidationResult {
  const seen = new Set<SkillId>();
  const errors: ValidationError[] = [];

  for (const skillId of selectedSkillIds) {
    if (seen.has(skillId)) {
      errors.push(err("DUPLICATE_SKILL", `技能 ${skillId} 被重複選擇`, { skillId }));
    }
    seen.add(skillId);
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

// --- 完整驗證 ---

/**
 * 對一個級別的技能選擇進行完整驗證
 */
export function validateSkillSelection(selection: SkillSelection): ValidationResult {
  const { classId, classLevel, selectedSkillIds } = selection;
  const allErrors: ValidationError[] = [];

  // 1. 無重複
  const dupResult = validateNoDuplicates(selectedSkillIds);
  allErrors.push(...dupResult.errors);

  // 2. 數量正確
  const countResult = validateSkillCount(classId, classLevel, selectedSkillIds);
  allErrors.push(...countResult.errors);

  // 3. 初期步驟
  const initResult = validateInitialSteps(classId, selectedSkillIds);
  allErrors.push(...initResult.errors);

  // 4. 前置條件
  const prereqResult = validatePrerequisites(classId, classLevel, selectedSkillIds);
  allErrors.push(...prereqResult.errors);

  return allErrors.length === 0 ? ok() : fail(...allErrors);
}
