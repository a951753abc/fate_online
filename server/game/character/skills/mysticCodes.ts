// === 禮裝目錄（千夜月姫 TRPG）===
//
// 資料來源: https://yumehiru.link/wiki/千夜月姬禮裝
// 消耗品 13 個 + 裝備品 14 個 = 27 個

export interface MysticCodeDef {
  readonly id: string;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly category: "consumable" | "equipment";
  readonly effectDescription: string;
  readonly quantityFormula?: string; // 消耗品初期數量公式
}

const mc = (def: MysticCodeDef): MysticCodeDef => Object.freeze(def);

// --- 消耗品（13 個）---

const CONSUMABLES: readonly MysticCodeDef[] = Object.freeze([
  mc({
    id: "mc-magic-crystal",
    nameJa: "魔晶石",
    nameCht: "魔晶石",
    category: "consumable",
    effectDescription: "抵銷 10 點代價傷害，或回復 10 點 HP。",
    quantityFormula: "理智",
  }),
  mc({
    id: "mc-suggestion-incense",
    nameJa: "暗示之香",
    nameCht: "暗示之香",
    category: "consumable",
    effectDescription: "焚燒 10 分鐘以上，目標按指示行動 1 小時；知覺判定目標值 8。",
  }),
  mc({
    id: "mc-white-phantom",
    nameJa: "白之幻澄",
    nameCht: "白之幻澄",
    category: "consumable",
    effectDescription: "操縱死者作為傀儡，獲得「不屬此世者」。",
  }),
  mc({
    id: "mc-orange-phantom",
    nameJa: "澄之幻澄",
    nameCht: "澄之幻澄",
    category: "consumable",
    effectDescription: "準備階段召喚幻燈之貓。",
  }),
  mc({
    id: "mc-black-phantom",
    nameJa: "黒之幻澄",
    nameCht: "黑之幻澄",
    category: "consumable",
    effectDescription: "準備階段召喚漆黑者。",
  }),
  mc({
    id: "mc-lost-fog",
    nameJa: "迷途之霧",
    nameCht: "迷途之霧",
    category: "consumable",
    effectDescription: "準備階段使用；本次戰鬥所有參與角色命中判定 -3、追擊體力判定 -3。",
  }),
  mc({
    id: "mc-corrosion-rain",
    nameJa: "腐蝕雨",
    nameCht: "腐蝕雨",
    category: "consumable",
    effectDescription: "準備階段使用；除使用者外所有參與角色失去防禦點。",
  }),
  mc({
    id: "mc-panacea",
    nameJa: "萬能薬",
    nameCht: "萬能藥",
    category: "consumable",
    effectDescription: "恢復 10 點 HP，或恢復 5 點上限傷害。",
    quantityFormula: "體力",
  }),
  mc({
    id: "mc-mana-bomb",
    nameJa: "魔力爆弾",
    nameCht: "魔力炸彈",
    category: "consumable",
    effectDescription: "對相鄰區域所有角色造成 2D6 點傷害。",
    quantityFormula: "理智",
  }),
  mc({
    id: "mc-akasha-projection",
    nameJa: "アカシャ投影",
    nameCht: "阿卡夏投影",
    category: "consumable",
    effectDescription: "投影出此處過去的景象，持續 10 分鐘，最久 1 年以內。",
    quantityFormula: "意志",
  }),
  mc({
    id: "mc-white-feather",
    nameJa: "純白之羽",
    nameCht: "純白之羽",
    category: "consumable",
    effectDescription: "進行解除不良狀態判定時，判定達成值 +2。",
    quantityFormula: "意志",
  }),
  mc({
    id: "mc-homunculus-bottle",
    nameJa: "瓶中小人",
    nameCht: "瓶中小人",
    category: "consumable",
    effectDescription: "提出一個問題，GM 回答「對」、「錯」或「不重要」。",
  }),
  mc({
    id: "mc-spell-stone",
    nameJa: "呪術石",
    nameCht: "咒術石",
    category: "consumable",
    effectDescription: "每消耗 1 顆減少待機延遲 1 點，上限為魔術師等級。",
    quantityFormula: "50",
  }),
]);

// --- 裝備品（14 個）---

const EQUIPMENT: readonly MysticCodeDef[] = Object.freeze([
  mc({
    id: "mc-azoth-sword",
    nameJa: "アゾット剣",
    nameCht: "Azoth劍",
    category: "equipment",
    effectDescription: "魔術師技能、禮裝內的《》（骰數）+1。",
  }),
  mc({
    id: "mc-mithril-robe",
    nameJa: "ミスリルの衣",
    nameCht: "米斯里魯之衣",
    category: "equipment",
    effectDescription: "防禦點 +2；攻擊側為概念武裝時仍有效。",
  }),
  mc({
    id: "mc-anti-magic-charm",
    nameJa: "抗魔護符",
    nameCht: "抗魔護符",
    category: "equipment",
    effectDescription: "精神抵抗判定達成值 +3；抵抗魔術額外再 +3。",
  }),
  mc({
    id: "mc-catalyst",
    nameJa: "触媒石",
    nameCht: "催化石",
    category: "equipment",
    effectDescription: "使用魔術師技能時達成值 +2。",
  }),
  mc({
    id: "mc-ritual-sword",
    nameJa: "儀式剣",
    nameCht: "儀式劍",
    category: "equipment",
    effectDescription: "進行一次成功的對抗判定時獲得 1D6 的 TP。",
  }),
  mc({
    id: "mc-gem-pendant",
    nameJa: "宝石吊墜",
    nameCht: "寶石吊墜",
    category: "equipment",
    effectDescription: "1 劇本 1 次，行動不能時自動發動，恢復清醒並回到 HP 1。",
  }),
  mc({
    id: "mc-angel-poem",
    nameJa: "天使之詩",
    nameCht: "天使之詩",
    category: "equipment",
    effectDescription: "準備階段消耗 10 TP，本次戰鬥傷害增加《1D6》。",
  }),
  mc({
    id: "mc-arquet-stone",
    nameJa: "アルキュエト原石",
    nameCht: "阿爾奎特原石",
    category: "equipment",
    effectDescription: "使用魔術師技能時，代價傷害減少 2。",
  }),
  mc({
    id: "mc-perseus-boots",
    nameJa: "ペルセウスの靴",
    nameCht: "珀修斯之靴",
    category: "equipment",
    effectDescription: "地圖移動時間 -70%；戰鬥時行動點 +5；每天消耗 10 TP 激活。",
  }),
  mc({
    id: "mc-false-mirror",
    nameJa: "虚偽之鏡",
    nameCht: "虛假之鏡",
    category: "equipment",
    effectDescription: "2D6 +【魔術師等級】對抗目標的理智，判斷對方是否在說謊。",
  }),
  mc({
    id: "mc-inscription-stone",
    nameJa: "刻印石",
    nameCht: "刻印石",
    category: "equipment",
    effectDescription: "記錄一個技能，預先支付代價，之後可免費使用一次該技能。",
  }),
  mc({
    id: "mc-attribute-glove",
    nameJa: "属性手袋",
    nameCht: "屬性手套",
    category: "equipment",
    effectDescription: "獲得一點新屬性（無→+1），或已有屬性 +2。",
  }),
  mc({
    id: "mc-forged-origin",
    nameJa: "偽造之源",
    nameCht: "偽造之源",
    category: "equipment",
    effectDescription: "外觀可任意設定，擁有與你相同的魔力反應。",
    quantityFormula: "理智",
  }),
  mc({
    id: "mc-false-mask",
    nameJa: "虚偽面具",
    nameCht: "虛偽面具",
    category: "equipment",
    effectDescription: "2D6 +【魔術師等級】對抗目標的知覺，隱藏魔力反應和等級。",
  }),
]);

// --- 統一匯出 ---

export const MYSTIC_CODES: readonly MysticCodeDef[] = Object.freeze([...CONSUMABLES, ...EQUIPMENT]);

const MYSTIC_CODE_BY_ID: ReadonlyMap<string, MysticCodeDef> = new Map(
  MYSTIC_CODES.map((mc) => [mc.id, mc]),
);

/** 根據 ID 查詢禮裝（不存在時回傳 undefined） */
export function findMysticCode(id: string): MysticCodeDef | undefined {
  return MYSTIC_CODE_BY_ID.get(id);
}

/** 根據 ID 查詢禮裝（不存在時拋錯） */
export function getMysticCode(id: string): MysticCodeDef {
  const mc = MYSTIC_CODE_BY_ID.get(id);
  if (!mc) throw new Error(`Unknown mystic code: ${id}`);
  return mc;
}

/** 所有禮裝 ID */
export const MYSTIC_CODE_IDS: readonly string[] = Object.freeze(MYSTIC_CODES.map((mc) => mc.id));
