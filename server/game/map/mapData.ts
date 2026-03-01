import type { LocationId, LocationDef } from "./types.js";

export const LOCATIONS: readonly LocationDef[] = Object.freeze([
  {
    id: "water-tower",
    name: "配水塔",
    zone: "mountain",
    description: "情報據點：可查看全地圖模糊動態",
    stars: 4,
  },
  {
    id: "old-residential",
    name: "舊宅區",
    zone: "mountain",
    description: "防禦工事：守方戰鬥判定+2",
    stars: 3,
  },
  {
    id: "mountain-path",
    name: "山道",
    zone: "mountain",
    description: "伏擊地形：設伏方奇襲判定加成",
    stars: 2,
  },
  {
    id: "upstream",
    name: "奏琴川上流",
    zone: "mountain",
    description: "次級靈脈：每夜少量回復魔力，可進行魔術強化/製作",
    stars: 4,
  },
  {
    id: "church",
    name: "教會",
    zone: "town",
    description: "中立區域（前三夜不可戰鬥）、情報交換",
    stars: 3,
  },
  {
    id: "bridge",
    name: "奏琴橋",
    zone: "town",
    description: "咽喉要道：連接山側與海側的必經主幹道",
    stars: 4,
  },
  {
    id: "shopping",
    name: "商店街",
    zone: "town",
    description: "人群密集：戰鬥受限但奇襲加成高",
    stars: 2,
  },
  {
    id: "station",
    name: "月白駅前",
    zone: "town",
    description: "交通樞紐：可移動至 2 步內據點",
    stars: 4,
  },
  {
    id: "port",
    name: "港口",
    zone: "sea",
    description: "物資據點：佔領者每夜獲得消耗品",
    stars: 3,
  },
  {
    id: "warehouse",
    name: "倉庫區",
    zone: "sea",
    description: "鐵皮屋——無地形限制的正面決戰場",
    stars: 3,
  },
  {
    id: "river-mouth",
    name: "奏琴川河口",
    zone: "sea",
    description: "靈脈據點（主）：每夜回復魔力，可進行魔術強化/製作",
    stars: 5,
  },
  {
    id: "aqueduct",
    name: "暗渠",
    zone: "global",
    description: "隱密通道：可繞過奏琴橋連接山側與海側",
    stars: 4,
  },
]);

const adjacencyEntries: readonly (readonly [LocationId, readonly LocationId[]])[] = [
  ["water-tower", ["old-residential", "mountain-path"]],
  ["old-residential", ["water-tower", "mountain-path", "shopping"]],
  ["mountain-path", ["water-tower", "old-residential", "upstream", "bridge"]],
  ["upstream", ["mountain-path", "aqueduct"]],
  ["church", ["bridge"]],
  ["bridge", ["church", "mountain-path", "shopping", "station", "warehouse"]],
  ["shopping", ["old-residential", "bridge", "station"]],
  ["station", ["bridge", "shopping", "port"]],
  ["port", ["station", "warehouse", "river-mouth"]],
  ["warehouse", ["bridge", "port", "river-mouth"]],
  ["river-mouth", ["warehouse", "port", "aqueduct"]],
  ["aqueduct", ["upstream", "river-mouth"]],
];

export const ADJACENCY: ReadonlyMap<LocationId, readonly LocationId[]> = new Map(adjacencyEntries);

export const LOCATION_IDS: readonly LocationId[] = Object.freeze(LOCATIONS.map((loc) => loc.id));

export const LEY_LINE_LOCATIONS: readonly LocationId[] = Object.freeze(["upstream", "river-mouth"]);

export function getLocationDef(id: LocationId): LocationDef {
  const loc = LOCATIONS.find((l) => l.id === id);
  if (!loc) throw new Error(`Unknown location: ${id}`);
  return loc;
}
