// === hunter 特技定義（千夜月姫 TRPG）===
// 資料來源: senya_tsukihime PHP data files
//
// 取得規則: 取得特技 ▲ 初期取得： 初期取得：任兩個喜歡的特技； 特殊：三級建立角色時初期級別是狩人等級三的話，〈槍手本能〉或〈戰場掌握〉額外給予一級。 升級： 等級上升時，選擇一個喜歡的特技，等級五和十時再選一個； 狩人等級六時若只持〈槍手本能〉或〈戰場掌握〉任一，那特技等級+1

import type { SkillDef } from "./types.js";

const sk = (def: SkillDef): SkillDef => Object.freeze(def);

export const HUNTER_SKILLS: readonly SkillDef[] = Object.freeze([
  // --- 一般特技-弓系 ---

  // 弓
  sk({
    id: "hnt-bow",
    classId: "hunter",
    nameJa: "弓",
    nameCht: "弓",
    trigger: "attack",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "造成《2D6-2》點傷害。 宣言讓自己延後一個行動順位時，［蓄力］+1。宣言意外之擊時只能從〈射擊技巧．迅速〉獲得蓄力。 每層［蓄力］命中+1、傷害+3，［蓄力］上限為戰場上的人數-1（自身）。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 弩弓
  sk({
    id: "hnt-crossbow",
    classId: "hunter",
    nameJa: "弩弓",
    nameCht: "弩弓",
    trigger: "attack",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "造成《2D6》傷害。 攻擊前每宣言一個射擊技巧，此特技會心-1(上限-3)。 你可以在準備階段宣言攻擊對象，而後行動點數-10，該次攻擊命中+2D6。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 意外之擊
  sk({
    id: "hnt-surprise-shot",
    classId: "hunter",
    nameJa: "意外之擊",
    nameCht: "意外之擊",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "偷襲判定在同一場景中最初有5點加成。 被偷襲側必須用2D6+【知覺】對抗你【理智】+［狩人等級］。 被偷襲側失敗後，能在準備階段用2D6+【體力】再度對抗，成功的話在你之後行動。 偷襲成功後，該回合可在結束階段額外進行一次逃跑判定。 一劇本最多1+［戰場掌握等級/2］回使用",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 戰場掌握
  sk({
    id: "hnt-battlefield-control",
    classId: "hunter",
    nameJa: "戰場掌握",
    nameCht: "戰場掌握",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "此特技可以重複取得，上限為［你的狩人等級］。 登場角色中此特技等級最高的人，無條件優先進行主要階段。 每等級［行動］+1、逃跑判定+1。 僅限最初的回合，逃跑判定額外+《5》。 劇本結束時可以選擇戰場掌握或槍手本能任一等級+1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // R．弓弦改造
  sk({
    id: "hnt-r-string-mod",
    classId: "hunter",
    nameJa: "R．弓弦改造",
    nameCht: "R．弓弦改造",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "〈弓〉和〈弩弓〉追加命中+1，射擊技巧代價傷害-5。 【R】特技的效果不能夠同時發動。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // Ｒ．弓體改造
  sk({
    id: "hnt-r-body-mod",
    classId: "hunter",
    nameJa: "Ｒ．弓體改造",
    nameCht: "Ｒ．弓體改造",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "〈弓〉和〈弩弓〉追加1D6傷害，可以同時使用兩種射擊技巧。 【R】特技的效果不能夠同時發動。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 射擊技巧．牽制
  sk({
    id: "hnt-shot-technique-suppression",
    classId: "hunter",
    nameJa: "射擊技巧．牽制",
    nameCht: "射擊技巧．牽制",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害15",
    effectDescription:
      "任意角色在戰鬥中進行以下行動時可以宣言。 ●進入［待機狀態］ ●從［行動完成狀態］恢復為［未行動狀態］ ●行動點數增加(含0以下變成1) 對該角色進行一次通常攻擊，不能組合進攻特技、待機或蓄力。 實際傷害後效果，防禦側成為［行動完成狀態］，效果發揮後你成為［行動完成狀態］。 一場戰鬥最多1+［你的狩人等級/3］回。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 射擊技巧．強力
  sk({
    id: "hnt-shot-technique-power",
    classId: "hunter",
    nameJa: "射擊技巧．強力",
    nameCht: "射擊技巧．強力",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "無",
    effectDescription:
      "使用［射擊］判定攻擊時可以使用。 傷害增加1D6+《射擊技巧數目x3》點。 武器選擇〈弓〉時取消上述效果，變更為攻擊順位移到最後並直接進入蓄力層數上限。 傷害增加［蓄力數x2］D6。 攻擊前不能宣言其他特技和迴避，否則中斷攻擊並進入［行動完成狀態］。 攻擊前如果受到實傷，［蓄力數］-2。 一場戰鬥最多1+［你的狩人等級/3］回。 此特技只有透過弓體改造效果才能與其他射擊技巧併用。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 射擊技巧．先制
  sk({
    id: "hnt-shot-technique-initiative",
    classId: "hunter",
    nameJa: "射擊技巧．先制",
    nameCht: "射擊技巧．先制",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10",
    effectDescription:
      "此技能只有戰鬥第一回合時可使用。 優先進行主要階段(但戰場掌握優先於這個效果)。 成功時下次攻擊命中和傷害增加［你持有的射擊技巧數］D6。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 射擊技巧．迅速
  sk({
    id: "hnt-shot-technique-rapid",
    classId: "hunter",
    nameJa: "射擊技巧．迅速",
    nameCht: "射擊技巧．迅速",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "被偷襲時，你能在偷襲者之後行動。 使用［射擊］判定攻擊時可以宣言： 你的命中+《射擊技巧數》點。 武器選擇〈弓〉時［蓄力］額外+1。 一場戰鬥最多1+［你的狩人等級/3］回。 此特技只有透過弓體改造效果才能與其他射擊技巧併用。",
    tpReward: 5,
    endlessDestructionEligible: true,
  }),

  // 射擊技巧．曲射
  sk({
    id: "hnt-shot-technique-arc",
    classId: "hunter",
    nameJa: "射擊技巧．曲射",
    nameCht: "射擊技巧．曲射",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "使用【射擊】判定攻擊時可以宣言。 此次攻擊不能被［掩護］也不受［分類：中斷］的特技影響。 戰鬥中初次使用時，防禦側迴避減少你的《射擊技巧數》點。 一場戰鬥最多1+［你的狩人等級/3］回。",
    tpReward: 5,
    endlessDestructionEligible: true,
  }),

  // --- 一般特技-槍系 ---

  // 槍手本能
  sk({
    id: "hnt-gunner-instinct",
    classId: "hunter",
    nameJa: "槍手本能",
    nameCht: "槍手本能",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "可以重複取得，特技上限為［狩人等級］。 你對進入［行動完成狀態］或在你行動前迴避失敗的對象，造成的傷害視為［會心傷害］。 每等級提供1點額外傷害和1D6額外會心傷害。 劇本結束時可以選擇戰場掌握或槍手本能任一等級+1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 槍
  sk({
    id: "hnt-gun",
    classId: "hunter",
    nameJa: "槍",
    nameCht: "槍",
    trigger: "attack",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "下回合行動點-6",
    effectDescription:
      "造成《2D6》傷害。 對有〈鎖定〉或該回合受到〈彈幕支援〉、〈戰場威脅〉實傷的對象，追加命中判定差值傷害。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 彈幕支援
  sk({
    id: "hnt-barrage-support",
    classId: "hunter",
    nameJa: "彈幕支援",
    nameCht: "彈幕支援",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "行動點10",
    effectDescription:
      "指定任一區域的敵方角色迴避判定-2、需要達成值的判定失敗時受到《1D6》傷害。 對［行動完成狀態］的對象效果變更為迴避-1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 戰場威脅
  sk({
    id: "hnt-battlefield-threat",
    classId: "hunter",
    nameJa: "戰場威脅",
    nameCht: "戰場威脅",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10點",
    effectDescription:
      "一回合一次，在任意角色主要階段結束時可以宣言。 對該角色進行一次通常攻擊，不能組合進攻特技和待機、蓄力。 如果你已進入［行動完成狀態］則不能宣言此特技。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 沉默的狙擊手
  sk({
    id: "hnt-silent-sniper",
    classId: "hunter",
    nameJa: "沉默的狙擊手",
    nameCht: "沉默的狙擊手",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10點",
    effectDescription:
      "你主要階段時【射擊】+3、射擊傷害增加《狩人等級》。 被攻擊時迴避-2、受到的攻擊傷害增加1D6。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 射擊穩定器
  sk({
    id: "hnt-aim-stabilizer",
    classId: "hunter",
    nameJa: "射擊穩定器",
    nameCht: "射擊穩定器",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "移除〈槍〉下回合行動降低的懲罰。 〈弓〉和〈槍〉追加效果：此回合使用其他狩人特技成功後，進攻特技的組合上限提高為2。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 致殘射擊
  sk({
    id: "hnt-crippling-shot",
    classId: "hunter",
    nameJa: "致殘射擊",
    nameCht: "致殘射擊",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10",
    effectDescription:
      "實傷後效果，防禦側受到你［槍手本能等級］D6的實際傷害。 若防禦側不是［行動完成狀態］，防禦側下次判定-4。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 快速裝填
  sk({
    id: "hnt-quick-reload",
    classId: "hunter",
    nameJa: "快速裝填",
    nameCht: "快速裝填",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害15",
    effectDescription:
      "一場戰鬥一次，因為自己的特技行動降低或進入［行動完成狀態］時，你的行動點數+10。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // C．快速武裝配件
  sk({
    id: "hnt-c-quick-weapon-mod",
    classId: "hunter",
    nameJa: "C．快速武裝配件",
    nameCht: "C．快速武裝配件",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "─",
    effectDescription:
      "你的〈槍〉追加以下效果： ●〈彈幕支援〉：追加10行動點，對象迴避-2。 ●攻擊該回合受到〈彈幕支援〉、〈戰場威脅〉實傷的對象時，命中+3。 【C】特技的效果同時只能存在一種，戰鬥外一天一次可更換適用效果",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // C．輕武裝配件
  sk({
    id: "hnt-c-light-weapon-mod",
    classId: "hunter",
    nameJa: "C．輕武裝配件",
    nameCht: "C．輕武裝配件",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的〈槍〉追加命中會心-1和以下效果： 〈致殘射擊〉：對象迴避-4，持續到防禦側的主要階段開始。 【C】特技的效果同時只能存在一種，戰鬥外一天一次可更換適用效果",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // C．重武裝配件
  sk({
    id: "hnt-c-heavy-weapon-mod",
    classId: "hunter",
    nameJa: "C．重武裝配件",
    nameCht: "C．重武裝配件",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的〈槍〉追加1D6傷害和以下效果： 〈戰場威脅〉：可組合進攻特技，效果發揮後你進入［行動完成狀態］。 【C】特技的效果同時只能存在一種，戰鬥外一天一次可更換適用效果",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // --- 額外特技 ---

  // 矢林彈雨
  sk({
    id: "hnt-arrow-storm",
    classId: "hunter",
    nameJa: "矢林彈雨",
    nameCht: "矢林彈雨",
    trigger: "offense",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害15",
    effectDescription:
      "指定任一區域內的所有敵方角色進行通常攻擊。當該處為〈彈幕支援〉的對象區域時，命中+《4》。 主要階段結束後，你變成［行動完成狀態］。 一場戰鬥最多［射擊技巧數］回使用。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 槍劍之舞
  sk({
    id: "hnt-gun-sword-dance",
    classId: "hunter",
    nameJa: "槍劍之舞",
    nameCht: "槍劍之舞",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害10",
    effectDescription:
      "［攻擊類型/近戰］的特技可視為［射擊］判定，［攻擊類型/射擊］的特技可視為［近戰］判定。 可通用搭配［射擊］與［近戰］的進攻特技。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 百步穿楊
  sk({
    id: "hnt-hundred-pace-shot",
    classId: "hunter",
    nameJa: "百步穿楊",
    nameCht: "百步穿楊",
    trigger: "offense",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20",
    effectDescription:
      "可以再組合一個進攻特技，並擁有以下效果： ●對逃跑的對象進行一次攻擊，不能組合其他進攻特技、待機或蓄力。 ●命中增加《戰場掌握等級》點，對逃跑的對象《》值成為兩倍。 ●可進行兩次命中骰取其高者。 一劇本最多1回使用，戰場掌握等級6以上額外增加1次。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 致死射擊
  sk({
    id: "hnt-lethal-shot",
    classId: "hunter",
    nameJa: "致死射擊",
    nameCht: "致死射擊",
    trigger: "offense",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20",
    effectDescription:
      "可以再組合一個進攻特技，並擁有以下效果： ●傷害骰是6的骰子，每一顆造成最大HP10%的上限傷害(最大50%)。 ●實傷後效果，當防禦側HP低於50%或50%上限傷害時直接戰鬥不能。 ●實傷後效果，防禦側一天內HP都無法回復、上限傷害不能移除。 一劇本最多1回使用，槍手本能等級6以上額外增加1次。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 技近乎道
  sk({
    id: "hnt-skill-near-dao",
    classId: "hunter",
    nameJa: "技近乎道",
    nameCht: "技近乎道",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "〈射擊技巧〉《》［］內的值都+2。 一劇本一回，你可以立刻讓待機時間結束，或是維持〈射擊技巧．強力〉的［蓄力數］同時取消行動順延。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 長距離射擊
  sk({
    id: "hnt-long-range-shot",
    classId: "hunter",
    nameJa: "長距離射擊",
    nameCht: "長距離射擊",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20",
    effectDescription:
      "一劇本最多［狩人等級-3］回使用。 戰鬥中可在準備階段進行一次通常攻擊，不能組合進攻特技、待機或蓄力。 戰鬥外： ●就算和防禦側不在同區域登場也可以進行攻擊。 ●進行蓄力或待機延遲的話，防禦側的感知判定可以進行兩次取其高者。 ●在戰鬥外只要沒被感知成功，防禦側就不能宣言任何特技、風格效果。 ●若防禦側感知成功，可獲得額外的［待機延遲/2］點或［蓄力數］點迴避獎勵。 ●武器選擇〈弓〉時，［蓄力...",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),
]);
