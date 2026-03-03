// === 風格/背反律系統（千夜月姫 TRPG）===
// 33 種風格完整移植。資料來源: newskyle.php

import type { StyleDef } from "./masterTypes.js";

// Helper: freeze a style definition
const s = (def: StyleDef): StyleDef => Object.freeze(def);

/**
 * 33 種風格定義
 *
 * 每個風格包含：
 * - 風格名稱（日文/中文）
 * - 背反律名稱 + 觸發類型 + 效果
 * - 級別限制（若有）
 * - 覺醒條件/效果（若有）
 */
export const STYLES: readonly StyleDef[] = Object.freeze([
  // #1 起源：進食
  s({
    id: "origin-feeding",
    nameJa: "起源：進食",
    nameCht: "起源：進食",
    antinomy: {
      nameJa: "肉食獣の本能",
      nameCht: "肉食獸的本能",
      trigger: "constant",
      emotionGained: { emotionId: "prey" },
      effectDescription: "近戰 +6；發動後至戰鬥結束前只能使用近戰系特技",
      effectParams: { meleeBonus: 6, restrictToMelee: 1 },
    },
    hasAwakening: true,
    awakeningCondition: "在背反律生效中擊殺標記為「獵物」的目標",
    awakeningEffect: "生命力 +10（基礎）；劇本結束前需擊殺 1D6 個獵物目標",
  }),

  // #2 起源：虛無
  s({
    id: "origin-void",
    nameJa: "起源：虚無",
    nameCht: "起源：虛無",
    antinomy: {
      nameJa: "空虚な絆",
      nameCht: "空虛之絆",
      trigger: "constant",
      emotionGained: { emotionId: "apathy", bond: 1 },
      effectDescription:
        "只能從「無關心」感情獲得 TP；傷害 -3；對無「無關心」感情者：全判定 +1、傷害 +1",
      effectParams: { damagePenalty: -3, checkBonus: 1, damageBonus: 1 },
    },
    hasAwakening: true,
    awakeningCondition: "跨多劇本完成 3 次將感情轉化為「無關心」的情緒挑戰",
    awakeningEffect: "全判定/傷害 +5；無法登錄或轉換「無關心」給他人",
  }),

  // #3 起源：禁忌
  s({
    id: "origin-taboo",
    nameJa: "起源：禁忌",
    nameCht: "起源：禁忌",
    antinomy: {
      nameJa: "禁忌の愛",
      nameCht: "禁忌之愛",
      trigger: "constant",
      emotionGained: { emotionId: "possessiveness", bond: 10 },
      effectDescription: "指定血親一人；雙方皆在戰鬥中時全判定 +2；血親死亡時 -10",
      effectParams: { checkBonus: 2, deathPenalty: -10 },
    },
    hasAwakening: true,
    awakeningCondition: "與血親的「獨佔欲」進行情緒挑戰",
    awakeningEffect: "獨佔欲絆值變為 20；追加「獵物」感情；被拒絕時 2D6 ≤ 4 有殺害血親的風險",
  }),

  // #4 起源：靜止
  s({
    id: "origin-stasis",
    nameJa: "起源：静止",
    nameCht: "起源：靜止",
    antinomy: {
      nameJa: "静止した世界",
      nameCht: "靜止的世界",
      trigger: "interrupt",
      effectDescription: "將對手的達成值設為 0；劇本後 -2 經驗值",
      effectParams: { targetAchievement: 0, expPenalty: -2 },
    },
    hasAwakening: true,
    awakeningCondition: "使用此背反律兩次",
    awakeningEffect: "無視概念武器/致命傷害以外的所有傷害；無法獲得經驗值",
  }),

  // #5 俯瞰風景
  s({
    id: "overlooking-scenery",
    nameJa: "俯瞰風景",
    nameCht: "俯瞰風景",
    antinomy: {
      nameJa: "俯瞰風景",
      nameCht: "俯瞰風景",
      trigger: "constant",
      emotionGained: { emotionId: "dependence-black" },
      effectDescription: "產生漂浮在空中的幻覺；近戰 +3、射擊 -3，持續至場景結束",
      effectParams: { meleeBonus: 3, rangedPenalty: -3 },
    },
    hasAwakening: false,
  }),

  // #6 追星者
  s({
    id: "star-chaser",
    nameJa: "追星者",
    nameCht: "追星者",
    antinomy: {
      nameJa: "所見即得",
      nameCht: "所見即得",
      trigger: "constant",
      emotionGained: { emotionId: "self-contradiction-black" },
      effectDescription: "複製其他角色使用過的一個特技；可使用至劇本結束（不含紅利類特技）",
      effectParams: { copyCount: 1 },
    },
    hasAwakening: false,
  }),

  // #7 NOT
  s({
    id: "not",
    nameJa: "ＮＯＴ",
    nameCht: "NOT",
    antinomy: {
      nameJa: "憎悪の肖像",
      nameCht: "憎惡的肖像",
      trigger: "interrupt",
      emotionGained: { emotionId: "hatred-black" },
      effectDescription:
        "倒地時發動：回復 HP / 傷害上限 / 狀態；轉為敵對 NPC；對所有戰鬥者登錄負面感情",
      effectParams: { hpRestore: 1, becomeAdversary: 1 },
    },
    hasAwakening: false,
  }),

  // #8 被創造者
  s({
    id: "created-one",
    nameJa: "被創造者",
    nameCht: "被創造者",
    antinomy: {
      nameJa: "生命の意義",
      nameCht: "生命的意義",
      trigger: "interrupt",
      effectDescription: "TP 歸零；免費發動一次無盡破壞；發動後倒地",
      effectParams: { tpToZero: 1, freeEndlessDestruction: 1 },
    },
    hasAwakening: false,
  }),

  // #9 潔癖症
  s({
    id: "cleanliness",
    nameJa: "潔癖症",
    nameCht: "潔癖症",
    antinomy: {
      nameJa: "異性不信",
      nameCht: "異性不信",
      trigger: "constant",
      effectDescription: "對所有異性登錄「距離」感情；對有「距離」感情者額外傷害 +4",
      effectParams: { damageBonus: 4 },
    },
    hasAwakening: false,
  }),

  // #10 盲信者
  s({
    id: "blind-believer",
    nameJa: "盲信者",
    nameCht: "盲信者",
    antinomy: {
      nameJa: "愚忠",
      nameCht: "愚忠",
      trigger: "preparation",
      emotionGained: { emotionId: "blind-faith-black" },
      effectDescription: "回復 40 HP",
      effectParams: { hpRestore: 40 },
    },
    hasAwakening: false,
  }),

  // #11 天才
  s({
    id: "genius",
    nameJa: "天才",
    nameCht: "天才",
    antinomy: {
      nameJa: "強者の驕り",
      nameCht: "強者的驕傲",
      trigger: "interrupt",
      emotionGained: { emotionId: "superiority-black" },
      effectDescription: "在對抗判定中獲得會心一擊；對對手登錄「優越感」",
      effectParams: { criticalHit: 1 },
    },
    hasAwakening: false,
  }),

  // #12 罪惡感
  s({
    id: "guilt",
    nameJa: "罪悪感",
    nameCht: "罪惡感",
    antinomy: {
      nameJa: "贖罪の声",
      nameCht: "贖罪之聲",
      trigger: "general",
      emotionGained: { emotionId: "atonement" },
      effectDescription: "TP +40；戰鬥/場景結束時歸零",
      effectParams: { tpBonus: 40 },
    },
    hasAwakening: false,
  }),

  // #13 修羅
  s({
    id: "asura",
    nameJa: "修羅",
    nameCht: "修羅",
    classRestrictions: [{ classId: "swordsman" }, { classId: "fighter" }],
    antinomy: {
      nameJa: "与我一戦！",
      nameCht: "與我一戰！",
      trigger: "constant",
      emotionGained: { emotionId: "rivalry-black" },
      effectDescription: "對標記為「敵手」的目標：命中與傷害達成值 +1D6",
      effectParams: { hitBonus: "1D6", damageBonus: "1D6" },
    },
    hasAwakening: false,
  }),

  // #14 孤獨之頂
  s({
    id: "solitary-peak",
    nameJa: "孤独の頂",
    nameCht: "孤獨之頂",
    antinomy: {
      nameJa: "光の射す彼方",
      nameCht: "光所射向的彼方",
      trigger: "constant",
      emotionGained: { emotionId: "yearning" },
      effectDescription: "指定一名已完成行動的角色：賦予 10 行動點；自己變為行動完成狀態",
      effectParams: { actionPointsGiven: 10 },
    },
    hasAwakening: false,
  }),

  // #15 最古的血脈
  s({
    id: "ancient-bloodline",
    nameJa: "最古の血脈",
    nameCht: "最古的血脈",
    classRestrictions: [{ classId: "executor" }], // 原作限「神主」，對應代行者
    antinomy: {
      nameJa: "陰陽刻印",
      nameCht: "陰陽刻印",
      trigger: "constant",
      emotionGained: { emotionId: "responsibility" },
      effectDescription: "神主/代行者魔術等級 +1；須對自己登錄「責任」感情",
      effectParams: { magicLevelBonus: 1 },
    },
    hasAwakening: false,
  }),

  // #16 魔術家系
  s({
    id: "sorcerer-lineage",
    nameJa: "魔術家系",
    nameCht: "魔術家系",
    classRestrictions: [{ classId: "magician" }],
    antinomy: {
      nameJa: "魔術刻印",
      nameCht: "魔術刻印",
      trigger: "constant",
      emotionGained: { emotionId: "responsibility" },
      effectDescription: "獲得「魔術刻印」特技；須對自己登錄「責任」感情",
      effectParams: { grantSkill: "magic-crest" },
    },
    hasAwakening: false,
  }),

  // #17 雙面之鏡
  s({
    id: "twin-mirror",
    nameJa: "双面の鏡",
    nameCht: "雙面之鏡",
    antinomy: {
      nameJa: "鏡影",
      nameCht: "鏡影",
      trigger: "constant",
      effectDescription: "在他人進行判定時記憶其能力值；之後可複製該能力值使用（一次只能記憶一個）",
      effectParams: { memorizeCount: 1 },
    },
    hasAwakening: false,
  }),

  // #18 傲者之夢
  s({
    id: "arrogant-dream",
    nameJa: "傲者の夢",
    nameCht: "傲者之夢",
    antinomy: {
      nameJa: "真誥",
      nameCht: "真誥",
      trigger: "constant",
      emotionGained: { emotionId: "self-contradiction-black" },
      effectDescription: "每場戰鬥可重骰一次；使用後本場戰鬥無法給予致命一擊",
      effectParams: { rerollCount: 1, noKillingBlow: 1 },
    },
    hasAwakening: false,
  }),

  // #19 自我中心
  s({
    id: "self-centered",
    nameJa: "自己中心",
    nameCht: "自我中心",
    antinomy: {
      nameJa: "認知矛盾",
      nameCht: "認知矛盾",
      trigger: "constant",
      emotionGained: { emotionId: "self-contradiction-black" },
      effectDescription:
        "不從感情獲得絆值；知覺判定可識破 PC/NPC 的背反律可能性；猜對時對目標登錄「優越感」",
      effectParams: { zeroBond: 1, expBonusPerContest: 1 },
    },
    hasAwakening: false,
  }),

  // #20 起源：根源探求者
  s({
    id: "origin-root-seeker",
    nameJa: "起源：根源探求者",
    nameCht: "起源：根源探求者",
    antinomy: {
      nameJa: "空虚な追求",
      nameCht: "空虛的追求",
      trigger: "constant",
      emotionGained: { emotionId: "dependence-black", bond: 1 },
      effectDescription:
        "第一個感情必須是「仰賴者」；每日 1D6 影響心情（≤3 順利, ≥4 粗暴）；擲出 11 或 66 時改變感覺",
      effectParams: { dailyMoodRoll: 1 },
    },
    hasAwakening: true,
    awakeningCondition: "仰賴者死亡",
    awakeningEffect: "每日 1D6 判定增減 1D6（≤3 增加, ≥4 減少）；擲出 11 或 66 反轉效果",
  }),

  // #21 微小的絆腳石
  s({
    id: "stumbling-block",
    nameJa: "微小な躓き",
    nameCht: "微小的絆腳石",
    antinomy: {
      nameJa: "不運",
      nameCht: "不運",
      trigger: "constant",
      emotionGained: { emotionId: "unlucky-black" },
      effectDescription: "每日一次，2D6 ≥ 10 的判定反轉為 1.1；之後異性緣奇好",
      effectParams: { criticalFailThreshold: 10 },
    },
    hasAwakening: true,
    awakeningCondition: "反轉判定因任何原因未大失敗",
    awakeningEffect: "追加每日一次 2D6 ≤ 4 的判定反轉為 6.6",
  }),

  // #22 奉獻者
  s({
    id: "devotee",
    nameJa: "奉献者",
    nameCht: "奉獻者",
    classRestrictions: [{ classId: "esper" }],
    antinomy: {
      nameJa: "魂の頌歌",
      nameCht: "魂之頌歌",
      trigger: "constant",
      emotionGained: { emotionId: "warmth-unreachable" },
      effectDescription:
        "對使用感應者施放靈魂連結，死亡時可感覺；用生命使一角色恢復至生命力 1，發動後自己行動不能",
      effectParams: { targetHpRestore: 1, selfIncapacitate: 1 },
    },
    hasAwakening: false,
  }),

  // #23 異端
  s({
    id: "heresy",
    nameJa: "異端",
    nameCht: "異端",
    classRestrictions: [{ classId: "esper" }], // 需持有異端系特技
    antinomy: {
      nameJa: "狂気の色彩",
      nameCht: "瘋狂色彩",
      trigger: "constant",
      emotionGained: { emotionId: "electromagnetic-black" },
      effectDescription: "所有異端特技達成值 +1（含傷害）",
      effectParams: { heresySkillBonus: 1 },
    },
    hasAwakening: false,
  }),

  // #24 常識人
  s({
    id: "common-sense",
    nameJa: "常識人",
    nameCht: "常識人",
    classRestrictions: [{ classId: "esper", minLevel: 3 }], // 超能力者 LV3+、無血緣
    antinomy: {
      nameJa: "普通",
      nameCht: "普通",
      trigger: "constant",
      emotionGained: { emotionId: "ordinary", bond: 50 },
      effectDescription:
        "感情表內記錄自己得到「普通」；感情對決消失前不成為背反者、無法使用無盡破壞",
      effectParams: { preventAntinomyBreak: 1, preventEndlessDestruction: 1 },
    },
    hasAwakening: false,
  }),

  // #25 同性不信
  s({
    id: "same-sex-distrust",
    nameJa: "同性不信",
    nameCht: "同性不信",
    antinomy: {
      nameJa: "性別倒錯",
      nameCht: "性別倒錯",
      trigger: "constant",
      effectDescription:
        "遇同性必登記「距離」感情，須對自己設置「自我矛盾」；受「距離」感情對象對抗判定達成值 +3",
      effectParams: { oppositionBonus: 3 },
    },
    hasAwakening: false,
  }),

  // #26 無價值
  s({
    id: "worthless",
    nameJa: "無価値",
    nameCht: "無價值",
    antinomy: {
      nameJa: "運命への反抗者",
      nameCht: "命運的反抗者",
      trigger: "constant",
      effectDescription:
        "所有判定 -4，會心 -1；擲出 11 以上（不計額外骰）額外獲得突破狀態；每突破 +1 判定（最多 +7）",
      effectParams: { checkPenalty: -4, criticalPenalty: -1, breakthroughMaxBonus: 7 },
    },
    hasAwakening: false,
  }),

  // #27 斷魔之劍
  s({
    id: "demon-slaying-blade",
    nameJa: "断魔の剣",
    nameCht: "斷魔之劍",
    antinomy: {
      nameJa: "救済の刃",
      nameCht: "救贖之刃",
      trigger: "constant",
      emotionGained: { emotionId: "redemption", bond: 2 },
      effectDescription:
        "瘋狂色調絆值 -1、潔淨絆值 +1；對象有瘋狂感情時判定與傷害 +數量/2（四捨五入）",
      effectParams: { madnessBondReduce: -1, pureBondIncrease: 1 },
    },
    hasAwakening: false,
  }),

  // #28 平常心
  s({
    id: "calm-mind",
    nameJa: "平常心",
    nameCht: "平常心",
    antinomy: {
      nameJa: "標準手順",
      nameCht: "標準程序",
      trigger: "constant",
      emotionGained: { emotionId: "composure" },
      effectDescription: "失去會心機制；擲出 1.1 時可重骰",
      effectParams: { loseCritical: 1, rerollOnSnakeEyes: 1 },
    },
    hasAwakening: false,
  }),

  // #29 無銘傳承
  s({
    id: "nameless-legacy",
    nameJa: "無銘伝承",
    nameCht: "無銘傳承",
    classRestrictions: [{ classId: "swordsman" }], // 無名劍流派
    antinomy: {
      nameJa: "剣は本来名無し、人は自然に従う",
      nameCht: "劍本無名、人從自然",
      trigger: "constant",
      emotionGained: { emotionId: "self-recognition" },
      effectDescription: "Cost 上限 +1；每日開始額外獲得 1 Cost",
      effectParams: { costCapBonus: 1, dailyCostBonus: 1 },
    },
    hasAwakening: false,
  }),

  // #30 歷史的黑影
  s({
    id: "shadow-of-history",
    nameJa: "歴史の黒影",
    nameCht: "歷史的黑影",
    // 限制：策士或忍者（對應代行者/狩人的特定路線）
    antinomy: {
      nameJa: "英雄無名",
      nameCht: "英雄無名",
      trigger: "constant",
      emotionGained: { emotionId: "responsibility" },
      effectDescription:
        "每個新場景更換外觀，識破需知覺對抗理智；可要求 GM 以 NPC 敘述自己的動作台詞",
      effectParams: { disguisePerScene: 1 },
    },
    hasAwakening: false,
  }),

  // #31 阿芙蘿黛蒂的祝福
  s({
    id: "aphrodite-blessing",
    nameJa: "アフロディーテの祝福",
    nameCht: "阿芙蘿黛蒂的祝福",
    antinomy: {
      nameJa: "アスタロトの誘惑",
      nameCht: "阿斯塔洛特的誘惑",
      trigger: "constant",
      effectDescription: "同行者和自己潛行 -1；對話取得情報容易，意志情報判定 +2",
      effectParams: { stealthPenalty: -1, infoCheckBonus: 2 },
    },
    hasAwakening: false,
  }),

  // #32 懦弱
  s({
    id: "cowardice",
    nameJa: "臆病",
    nameCht: "懦弱",
    antinomy: {
      nameJa: "社会の歯車",
      nameCht: "社會的齒輪",
      trigger: "constant",
      emotionGained: { emotionId: "anxiety" },
      effectDescription: "感情表內記錄自己；主動判定 -1D6、被動判定 +1D6",
      effectParams: { activeCheckPenalty: "-1D6", passiveCheckBonus: "1D6" },
    },
    hasAwakening: false,
  }),

  // #33 天選之人
  s({
    id: "chosen-one",
    nameJa: "天選の人",
    nameCht: "天選之人",
    antinomy: {
      nameJa: "運命の女神の微笑み",
      nameCht: "命運女神的微笑",
      trigger: "constant",
      effectDescription:
        "會心 -1、會心上限 +1（變 4）；每劇本一次可在任意時刻判定大成功，發動後會心上限歸零；同場景有重複風格角色時會心上限皆歸零",
      effectParams: { criticalPenalty: -1, criticalCapBonus: 1, guaranteedCriticalPerScenario: 1 },
    },
    hasAwakening: false,
  }),
]);
