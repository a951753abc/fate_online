import type { MasterLevelId, MasterLevelDef, LevelConfig, CombatModifiers } from "./masterTypes.js";

// Helper to freeze a modifier row
const m = (
  melee: number,
  ranged: number,
  spirit: number,
  action: number,
  hp: number,
  focus: number,
  defense: number,
): CombatModifiers => Object.freeze({ melee, ranged, spirit, action, hp, focus, defense });

export const MASTER_LEVELS: readonly MasterLevelDef[] = Object.freeze([
  Object.freeze({
    id: "magician" as MasterLevelId,
    nameJa: "魔術師",
    archetype: "遠坂凛型",
    baseStats: Object.freeze({ body: 2, perception: 3, reason: 5, will: 2 }),
    modifiers: Object.freeze([
      m(-1, 0, 0, -1, 0, 8, 0),
      m(0, 1, 1, 0, 3, 11, 0),
      m(1, 2, 2, 1, 9, 13, 0),
      m(2, 3, 3, 2, 15, 15, 0),
      m(3, 6, 6, 3, 20, 17, 0),
      m(4, 8, 8, 4, 22, 20, 0),
      m(5, 10, 10, 5, 24, 23, 0),
      m(6, 12, 12, 6, 26, 26, 0),
      m(7, 14, 14, 7, 28, 28, 0),
      m(8, 16, 16, 8, 30, 30, 1),
    ]),
  }),
  Object.freeze({
    id: "executor" as MasterLevelId,
    nameJa: "代行者",
    archetype: "言峰綺禮型",
    baseStats: Object.freeze({ body: 3, perception: 3, reason: 3, will: 3 }),
    modifiers: Object.freeze([
      m(1, 1, 1, 1, 2, 2, 0),
      m(2, 2, 2, 2, 4, 4, 0),
      m(3, 3, 3, 3, 6, 6, 0),
      m(4, 4, 4, 4, 8, 8, 0),
      m(5, 5, 5, 5, 10, 10, 1),
      m(6, 6, 6, 6, 12, 11, 1),
      m(7, 7, 8, 8, 14, 12, 1),
      m(8, 8, 10, 10, 16, 13, 1),
      m(9, 9, 12, 12, 18, 14, 1),
      m(10, 10, 14, 14, 20, 15, 1),
    ]),
  }),
  Object.freeze({
    id: "swordsman" as MasterLevelId,
    nameJa: "劍士",
    archetype: "葛木宗一郎型",
    baseStats: Object.freeze({ body: 4, perception: 4, reason: 2, will: 2 }),
    modifiers: Object.freeze([
      m(0, -2, -2, -1, 0, 0, 0),
      m(1, -1, -1, 0, 4, 8, 0),
      m(2, 0, 0, 1, 13, 8, 0),
      m(3, 1, 1, 2, 19, 11, 1),
      m(6, 2, 2, 5, 22, 12, 1),
      m(8, 3, 3, 7, 25, 14, 2),
      m(10, 4, 4, 9, 28, 15, 2),
      m(12, 5, 5, 11, 31, 18, 2),
      m(14, 6, 6, 13, 34, 18, 3),
      m(16, 7, 7, 15, 37, 21, 3),
    ]),
  }),
  Object.freeze({
    id: "fighter" as MasterLevelId,
    nameJa: "武鬥家",
    archetype: "バゼット型",
    baseStats: Object.freeze({ body: 5, perception: 2, reason: 2, will: 3 }),
    modifiers: Object.freeze([
      m(0, -1, -1, 1, 4, 5, 0),
      m(1, 0, 0, 2, 10, 8, 1),
      m(4, 2, 2, 5, 16, 8, 1),
      m(7, 3, 3, 8, 26, 11, 2),
      m(8, 4, 4, 9, 29, 11, 2),
      m(9, 5, 5, 10, 31, 14, 2),
      m(10, 6, 6, 11, 33, 16, 3),
      m(11, 7, 7, 12, 35, 18, 3),
      m(12, 8, 8, 13, 37, 18, 3),
      m(13, 9, 9, 14, 41, 21, 4),
    ]),
  }),
  Object.freeze({
    id: "hunter" as MasterLevelId,
    nameJa: "狩人",
    archetype: "衛宮切嗣型",
    baseStats: Object.freeze({ body: 3, perception: 3, reason: 3, will: 3 }),
    modifiers: Object.freeze([
      m(-2, 2, -2, -2, 0, 0, 0),
      m(-1, 3, -1, -1, 0, 5, 0),
      m(0, 4, 0, 0, 5, 5, 0),
      m(1, 5, 0, 1, 5, 8, 0),
      m(2, 6, 1, 3, 8, 8, 0),
      m(3, 8, 2, 5, 10, 12, 1),
      m(4, 10, 3, 7, 12, 15, 1),
      m(5, 12, 4, 9, 15, 18, 1),
      m(6, 14, 5, 11, 18, 18, 1),
      m(7, 16, 6, 12, 20, 20, 1),
    ]),
  }),
  Object.freeze({
    id: "esper" as MasterLevelId,
    nameJa: "超能力者",
    archetype: "淺上藤乃型",
    baseStats: Object.freeze({ body: 2, perception: 2, reason: 2, will: 2 }),
    modifiers: Object.freeze([
      m(0, 0, 1, 0, 0, 0, 0),
      m(0, 0, 2, 0, 0, 0, 0),
      m(0, 0, 3, 0, 0, 0, 0),
      m(0, 0, 4, 0, 0, 0, 0),
      m(0, 0, 6, 0, 1, 0, 0),
      m(0, 0, 8, 0, 2, 0, 0),
      m(0, 0, 10, 0, 3, 0, 0),
      m(0, 0, 12, 0, 4, 0, 0),
      m(0, 0, 14, 0, 5, 0, 0),
      m(1, 1, 16, 1, 6, 1, 1),
    ]),
  }),
]);

const LEVEL_MAP: ReadonlyMap<MasterLevelId, MasterLevelDef> = new Map(
  MASTER_LEVELS.map((level) => [level.id, level]),
);

export const MASTER_LEVEL_IDS: readonly MasterLevelId[] = Object.freeze(
  MASTER_LEVELS.map((l) => l.id),
);

export function getMasterLevelDef(id: MasterLevelId): MasterLevelDef {
  const level = LEVEL_MAP.get(id);
  if (!level) throw new Error(`Unknown master level: ${id}`);
  return level;
}

export function getAvailableLevels(): readonly MasterLevelDef[] {
  return MASTER_LEVELS;
}

export const DEFAULT_LEVEL_CONFIG: LevelConfig = Object.freeze({
  startingPoints: 3,
  gameLevel: 4,
  maxClasses: 3,
});
