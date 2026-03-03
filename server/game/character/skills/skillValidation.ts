// === 技能選擇驗證（千夜月姫 TRPG）===
//
// 驗證玩家的技能選擇是否符合規則書規定。
// 所有技能都是玩家主動選擇——系統只負責驗證，不自動給予。

import type { SkillId, InitialSkillStep, SkillSelection, SkillInstanceConfig } from "./types.js";
import { VALID_MAGIC_ATTRIBUTES } from "./types.js";
import type { MasterLevelId } from "../masterTypes.js";
import { getClassSkillAcquisition, computeExpectedSkillCount } from "./acquisitionRules.js";
import { getClassSkills, findSkillDef } from "./index.js";
import { findMysticCode } from "./mysticCodes.js";
import { isValidSubChoice, getElementSubChoice, VALID_FAMILIAR_TYPES } from "./magicianConfigs.js";

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
 * 驗證是否有不允許重複的技能被重複選擇。
 * repeatable 技能允許重複。
 */
export function validateNoDuplicates(selectedSkillIds: readonly SkillId[]): ValidationResult {
  const counts = new Map<SkillId, number>();
  const errors: ValidationError[] = [];

  for (const skillId of selectedSkillIds) {
    counts.set(skillId, (counts.get(skillId) ?? 0) + 1);
  }

  for (const [skillId, count] of counts) {
    if (count > 1) {
      const def = findSkillDef(skillId);
      if (!def?.repeatable) {
        errors.push(err("DUPLICATE_SKILL", `技能 ${skillId} 被重複選擇`, { skillId }));
      }
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

// --- compositionOnly 技能排除 ---

/**
 * 驗證 compositionOnly 技能不出現在 selectedSkillIds 中。
 * 要素類技能只能作為魔術構成的部件，不佔技能槽。
 */
export function validateNoCompositionOnly(selectedSkillIds: readonly SkillId[]): ValidationResult {
  const errors: ValidationError[] = [];

  for (const skillId of selectedSkillIds) {
    const def = findSkillDef(skillId);
    if (def?.compositionOnly) {
      errors.push(
        err("COMPOSITION_ONLY_SKILL", `技能 ${skillId} 僅作為魔術構成部件，不可直接選擇`, {
          skillId,
        }),
      );
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

// --- 技能配置驗證 ---

/**
 * 驗證技能配置是否正確。
 * - 有 configType 的技能必須有對應的 skillConfigs 項目
 * - repeatable 技能出現 N 次 → 須有 N 個配置
 * - 各配置型別有各自的驗證規則
 */
export function validateSkillConfigs(selection: SkillSelection): ValidationResult {
  const { classId, classLevel, selectedSkillIds } = selection;
  const skillConfigs = selection.skillConfigs ?? {};
  const errors: ValidationError[] = [];

  // 統計每個技能出現次數
  const skillCounts = new Map<SkillId, number>();
  for (const skillId of selectedSkillIds) {
    skillCounts.set(skillId, (skillCounts.get(skillId) ?? 0) + 1);
  }

  for (const [skillId, count] of skillCounts) {
    const def = findSkillDef(skillId);
    if (!def) continue;

    if (!def.configType) continue;

    const configs = skillConfigs[skillId];
    if (!configs || configs.length !== count) {
      errors.push(
        err(
          "MISSING_SKILL_CONFIG",
          `技能 ${skillId} 出現 ${count} 次，但配置有 ${configs?.length ?? 0} 個`,
          {
            skillId,
            expectedCount: count,
            actualCount: configs?.length ?? 0,
          },
        ),
      );
      continue;
    }

    // 驗證每個配置
    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const configErrors = validateSingleConfig(
        skillId,
        def.configType,
        config,
        classId,
        classLevel,
        selectedSkillIds,
      );
      errors.push(...configErrors);
    }
  }

  return errors.length === 0 ? ok() : fail(...errors);
}

function validateSingleConfig(
  skillId: SkillId,
  expectedType: string,
  config: SkillInstanceConfig,
  classId: MasterLevelId,
  classLevel: number,
  selectedSkillIds: readonly SkillId[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (config.type !== expectedType) {
    errors.push(
      err(
        "WRONG_CONFIG_TYPE",
        `技能 ${skillId} 預期配置類型 ${expectedType}，但得到 ${config.type}`,
        {
          skillId,
          expected: expectedType,
          actual: config.type,
        },
      ),
    );
    return errors;
  }

  switch (config.type) {
    case "attribute_distribution": {
      const hasMultiElement = selectedSkillIds.includes("mag-multi-element" as SkillId);
      errors.push(
        ...validateAttributeDistribution(
          skillId,
          config.distribution,
          classId,
          classLevel,
          hasMultiElement,
        ),
      );
      break;
    }
    case "familiar":
      if (!VALID_FAMILIAR_TYPES.has(config.familiarType)) {
        errors.push(
          err("INVALID_FAMILIAR_TYPE", `無效的使魔類型: ${config.familiarType}`, { skillId }),
        );
      }
      break;
    case "mystic_code":
      if (!findMysticCode(config.mysticCodeId)) {
        errors.push(err("INVALID_MYSTIC_CODE", `無效的禮裝: ${config.mysticCodeId}`, { skillId }));
      }
      break;
    case "composition":
      errors.push(...validateComposition(skillId, config));
      break;
  }

  return errors;
}

function validateAttributeDistribution(
  skillId: SkillId,
  distribution: Readonly<Partial<Record<string, number>>>,
  classId: MasterLevelId,
  classLevel: number,
  hasMultiElement: boolean,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const validAttributeSet = new Set<string>(VALID_MAGIC_ATTRIBUTES);
  const entries = Object.entries(distribution).filter(([, v]) => v !== undefined && v > 0);

  const maxTypes = hasMultiElement ? 5 : 3;
  if (entries.length < 1 || entries.length > maxTypes) {
    errors.push(
      err(
        "ATTR_DIST_TYPE_COUNT",
        `屬性分配須選 1~${maxTypes} 種屬性，但選了 ${entries.length} 種`,
        { skillId },
      ),
    );
  }

  let totalPoints = 0;
  for (const [attr, pts] of entries) {
    if (!validAttributeSet.has(attr)) {
      errors.push(err("INVALID_ATTRIBUTE", `無效的魔術屬性: ${attr}`, { skillId, attr }));
    }
    if (typeof pts !== "number" || pts < 1) {
      errors.push(err("ATTR_DIST_MIN_ONE", `屬性 ${attr} 至少分配 1 點`, { skillId, attr }));
    }
    totalPoints += pts ?? 0;
  }

  // 計算魔術師等級（classId 可能不是 magician，需要正確的 level）
  const magicianLevel = classId === "magician" ? classLevel : 0;
  const bonusPoints = hasMultiElement ? 2 : 0;
  const expectedPoints = magicianLevel + 1 + bonusPoints;

  if (totalPoints !== expectedPoints) {
    errors.push(
      err(
        "ATTR_DIST_WRONG_TOTAL",
        `屬性點數應為 ${expectedPoints}（魔術師等級+1${hasMultiElement ? "+多重屬性2" : ""}），但分配了 ${totalPoints}`,
        { skillId, expected: expectedPoints, actual: totalPoints },
      ),
    );
  }

  return errors;
}

function validateComposition(
  skillId: SkillId,
  config: {
    readonly mode: "new" | "expand";
    readonly targetIndex?: number;
    readonly elements: readonly { readonly elementSkillId: SkillId; readonly subChoice?: string }[];
  },
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 決定預期要素數量
  let expectedElementCount: number;
  if (config.mode === "expand") {
    expectedElementCount = 1;
  } else if (skillId === "mag-item-creation" || skillId === "mag-mystic-eyes") {
    expectedElementCount = 2; // 道具作成/魔眼保持 = 2 要素
  } else {
    expectedElementCount = 3; // 魔術構成 = 3 要素
  }

  if (config.elements.length !== expectedElementCount) {
    errors.push(
      err(
        "COMPOSITION_WRONG_ELEMENT_COUNT",
        `${skillId} 預期 ${expectedElementCount} 個要素，但選了 ${config.elements.length} 個`,
        { skillId, expected: expectedElementCount, actual: config.elements.length },
      ),
    );
  }

  if (config.mode === "expand" && config.targetIndex === undefined) {
    errors.push(err("COMPOSITION_MISSING_TARGET", `擴充模式須指定目標構成的 index`, { skillId }));
  }

  // 驗證每個要素
  for (const elem of config.elements) {
    const elemDef = findSkillDef(elem.elementSkillId);
    if (!elemDef) {
      errors.push(err("UNKNOWN_ELEMENT", `要素不存在: ${elem.elementSkillId}`, { skillId }));
      continue;
    }
    if (!elemDef.compositionOnly) {
      errors.push(
        err("NOT_COMPOSITION_ELEMENT", `${elem.elementSkillId} 不是魔術構成要素`, { skillId }),
      );
    }

    // 驗證子選擇
    const subChoiceDef = getElementSubChoice(elem.elementSkillId);
    if (subChoiceDef) {
      if (!elem.subChoice) {
        errors.push(
          err(
            "MISSING_SUB_CHOICE",
            `要素 ${elem.elementSkillId} 需要子選擇（${subChoiceDef.labelCht}）`,
            {
              skillId,
              elementSkillId: elem.elementSkillId,
            },
          ),
        );
      } else if (!isValidSubChoice(elem.elementSkillId, elem.subChoice)) {
        errors.push(
          err(
            "INVALID_SUB_CHOICE",
            `要素 ${elem.elementSkillId} 的子選擇值 ${elem.subChoice} 無效`,
            {
              skillId,
              elementSkillId: elem.elementSkillId,
              subChoice: elem.subChoice,
            },
          ),
        );
      }
    }
  }

  // --- 要素衝突規則 (新建模式才檢查完整構成) ---
  if (config.mode === "new") {
    const elementIds = new Set(config.elements.map((e) => e.elementSkillId));

    // R1: 觸發類型互斥 — 準備/攻擊類型/進攻 三者最多出現一個
    const triggerTypes: SkillId[] = [
      "mag-element-prep" as SkillId,
      "mag-element-attack-type" as SkillId,
      "mag-element-offense" as SkillId,
    ];
    const selectedTriggers = triggerTypes.filter((t) => elementIds.has(t));
    if (selectedTriggers.length > 1) {
      errors.push(
        err(
          "COMPOSITION_TRIGGER_CONFLICT",
          `準備/攻擊類型/進攻 三者最多選一個，但選了: ${selectedTriggers.join(", ")}`,
          {
            skillId,
          },
        ),
      );
    }

    // R2: 傷害需搭配攻擊類型或進攻
    if (elementIds.has("mag-element-damage" as SkillId)) {
      if (
        !elementIds.has("mag-element-attack-type" as SkillId) &&
        !elementIds.has("mag-element-offense" as SkillId)
      ) {
        errors.push(
          err("COMPOSITION_DAMAGE_NEEDS_ATTACK", `要素：傷害 須搭配攻擊類型或進攻`, { skillId }),
        );
      }
    }

    // R3 & R4: 防禦/增益需搭配其他輔助要素
    const supportElements: SkillId[] = [
      "mag-element-defense" as SkillId,
      "mag-element-buff" as SkillId,
      "mag-element-heal" as SkillId,
      "mag-element-debuff" as SkillId,
      "mag-element-status" as SkillId,
    ];
    const selectedSupport = supportElements.filter((s) => elementIds.has(s));

    if (elementIds.has("mag-element-defense" as SkillId)) {
      if (selectedSupport.filter((s) => s !== ("mag-element-defense" as SkillId)).length === 0) {
        errors.push(
          err("COMPOSITION_DEFENSE_NEEDS_SUPPORT", `要素：防禦 須搭配其他輔助要素`, { skillId }),
        );
      }
    }
    if (elementIds.has("mag-element-buff" as SkillId)) {
      if (selectedSupport.filter((s) => s !== ("mag-element-buff" as SkillId)).length === 0) {
        errors.push(
          err("COMPOSITION_BUFF_NEEDS_SUPPORT", `要素：增益 須搭配其他輔助要素`, { skillId }),
        );
      }
    }
  }

  return errors;
}

// --- 完整驗證 ---

/**
 * 對一個級別的技能選擇進行完整驗證
 */
export function validateSkillSelection(selection: SkillSelection): ValidationResult {
  const { classId, classLevel, selectedSkillIds } = selection;
  const allErrors: ValidationError[] = [];

  // 1. 不允許重複（repeatable 除外）
  const dupResult = validateNoDuplicates(selectedSkillIds);
  allErrors.push(...dupResult.errors);

  // 2. compositionOnly 技能不可直接選擇
  const compResult = validateNoCompositionOnly(selectedSkillIds);
  allErrors.push(...compResult.errors);

  // 3. 數量正確
  const countResult = validateSkillCount(classId, classLevel, selectedSkillIds);
  allErrors.push(...countResult.errors);

  // 4. 初期步驟
  const initResult = validateInitialSteps(classId, selectedSkillIds);
  allErrors.push(...initResult.errors);

  // 5. 前置條件
  const prereqResult = validatePrerequisites(classId, classLevel, selectedSkillIds);
  allErrors.push(...prereqResult.errors);

  // 6. 技能配置
  const configResult = validateSkillConfigs(selection);
  allErrors.push(...configResult.errors);

  return allErrors.length === 0 ? ok() : fail(...allErrors);
}
