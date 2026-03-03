import type { ClassAcquisitionView } from "../types/protocol.js";

/** Compute expected total skill count for a class at a given level (mirrors server-side logic) */
export function computeExpectedSkillCount(acq: ClassAcquisitionView, classLevel: number): number {
  let initial = 0;
  for (const step of acq.initialSteps) {
    switch (step.type) {
      case "required":
        initial += step.skillIds?.length ?? 0;
        break;
      case "choose_one":
        initial += 1;
        break;
      case "free":
        initial += step.count ?? 0;
        break;
    }
  }
  const levelUp = Math.max(0, classLevel - 1) * acq.perLevelUpCount;
  const bonus = acq.bonusLevels.filter((lv) => lv <= classLevel).length;
  return initial + levelUp + bonus;
}
