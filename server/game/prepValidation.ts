import type {
  LevelAllocation,
  AbilityStatKey,
  MasterLevelId,
  LevelConfig,
} from "./character/masterTypes.js";
import type { SkillSelectionPayload, PrepResultPayload } from "../shared/protocol.js";
import type { SkillInstanceConfig } from "./character/skills/types.js";
import { validateAllocation, computeAllStats } from "./character/masterStats.js";
import { validateSkillSelection } from "./character/skills/skillValidation.js";

/**
 * 驗證 Master Build 並計算數值（純函式，不碰 Redis）
 *
 * @param config - 可選自訂 LevelConfig，預設用 DEFAULT_LEVEL_CONFIG
 */
export function validateAndComputeBuild(
  allocation: readonly LevelAllocation[],
  freePoint: AbilityStatKey,
  skillSelections: readonly SkillSelectionPayload[],
  config?: LevelConfig,
): PrepResultPayload {
  const validationError = validateAllocation(allocation, config);
  if (validationError) {
    return Object.freeze({ success: false, error: validationError });
  }

  const allocMap = new Map<string, number>(allocation.map((a) => [a.levelId, a.level]));
  if (skillSelections.length !== allocation.length) {
    return Object.freeze({
      success: false,
      error: `技能選擇數量不符：需要 ${allocation.length} 個級別，但收到 ${skillSelections.length} 個`,
    });
  }

  for (const sel of skillSelections) {
    if (!allocMap.has(sel.classId)) {
      return Object.freeze({
        success: false,
        error: `技能選擇的級別 ${sel.classId} 不在等級配置中`,
      });
    }

    const allocLevel = allocMap.get(sel.classId)!;
    if (sel.classLevel !== allocLevel) {
      return Object.freeze({
        success: false,
        error: `技能選擇的等級不符：${sel.classId} 應為 LV${allocLevel}，但收到 LV${sel.classLevel}`,
      });
    }

    const classId = sel.classId as MasterLevelId;
    const skillValidation = validateSkillSelection({
      classId,
      classLevel: sel.classLevel,
      selectedSkillIds: sel.selectedSkillIds,
      skillConfigs: sel.skillConfigs as unknown as
        | Readonly<Record<string, readonly SkillInstanceConfig[]>>
        | undefined,
    });
    if (!skillValidation.valid) {
      const firstError = skillValidation.errors[0];
      return Object.freeze({
        success: false,
        error: `技能驗證失敗（${sel.classId}）：${firstError.message}`,
      });
    }
  }

  const stats = computeAllStats(allocation, freePoint);
  return Object.freeze({ success: true, stats });
}
