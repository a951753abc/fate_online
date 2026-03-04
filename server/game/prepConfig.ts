import type { PrepConfig, MasterLevelView } from "../shared/protocol.js";
import { DEFAULT_LEVEL_CONFIG, getAvailableLevels } from "./character/masterLevels.js";
import {
  buildAllClassSkillViews,
  buildAllClassAcquisitionViews,
  buildMysticCodeViews,
  buildFamiliarOptionViews,
  buildElementSubChoiceViews,
} from "./character/skills/prepSkillDataBuilder.js";

/** Static PrepConfig — same for every game, compute once at module load */
export const PREP_CONFIG: PrepConfig = Object.freeze({
  startingPoints: DEFAULT_LEVEL_CONFIG.startingPoints,
  gameLevel: DEFAULT_LEVEL_CONFIG.gameLevel,
  maxClasses: DEFAULT_LEVEL_CONFIG.maxClasses,
  availableLevels: Object.freeze(
    getAvailableLevels().map((def) =>
      Object.freeze({
        id: def.id,
        nameJa: def.nameJa,
        baseStats: def.baseStats,
      }),
    ),
  ) as readonly MasterLevelView[],
  classSkills: buildAllClassSkillViews(),
  classAcquisitions: buildAllClassAcquisitionViews(),
  mysticCodes: buildMysticCodeViews(),
  familiarOptions: buildFamiliarOptionViews(),
  elementSubChoices: buildElementSubChoiceViews(),
});
