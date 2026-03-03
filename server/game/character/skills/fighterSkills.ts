// === fighter 特技定義（千夜月姫 TRPG）===
// 資料來源: senya_tsukihime PHP data files
//
// 取得規則: 取得特技 ▲ 初期取得： 得到「武道」，然後再選擇一個自己喜歡的特技。 升級： 等級上升之時、選取一個喜歡的特技。5等、10等時，可以額外再取得一個特技。

import type { SkillDef } from "./types.js";

const sk = (def: SkillDef): SkillDef => Object.freeze(def);

export const FIGHTER_SKILLS: readonly SkillDef[] = Object.freeze([
  // --- 一般特技 ---

  // 武道
  sk({
    id: "ftr-martial-way",
    classId: "fighter",
    nameJa: "武道",
    nameCht: "武道",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5點",
    effectDescription: "以下三者擇一： 近戰相關判定+2。 近戰傷害+2。 【體力】判定達成值+《2》",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 蛇咬
  sk({
    id: "ftr-snake-bite",
    classId: "fighter",
    nameJa: "蛇咬",
    nameCht: "蛇咬",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "指定對象一人，給予2D6傷害。 戰鬥中你第一次施放此技能時，命中與傷害+《4》。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 滲透勁
  sk({
    id: "ftr-penetrating-force",
    classId: "fighter",
    nameJa: "滲透勁",
    nameCht: "滲透勁",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription: "指定對象一人，給予1D6+2傷害，此特技實際傷害為一點五倍（去小數點）。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 武心
  sk({
    id: "ftr-martial-heart",
    classId: "fighter",
    nameJa: "武心",
    nameCht: "武心",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "通過一個目標值為10的2D6+【武鬥家等級】判定。成功則你本回合判定會心下降《1》，全判定上升1，傷害增加《【你的武鬥家等級】》。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 貼打
  sk({
    id: "ftr-close-strike",
    classId: "fighter",
    nameJa: "貼打",
    nameCht: "貼打",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "實傷後效果，對手下回合結束前不能離開此區域。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 發勁
  sk({
    id: "ftr-release-force",
    classId: "fighter",
    nameJa: "發勁",
    nameCht: "發勁",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "通過一個目標值為10的2D6+【武鬥家等級】判定。成功則你本回合傷害增加《1D6》。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 破打
  sk({
    id: "ftr-shatter-strike",
    classId: "fighter",
    nameJa: "破打",
    nameCht: "破打",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "實傷後效果，對手的行動力減去《2D6+3》點，對手因為此特技進入行動完成狀態的話，下個回合無法動作。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 不屈
  sk({
    id: "ftr-unyielding",
    classId: "fighter",
    nameJa: "不屈",
    nameCht: "不屈",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你進入行動不能狀態時，在回合結束為止仍可行動。但是在這期間無法回復HP以及不良狀態。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 硬氣功
  sk({
    id: "ftr-hard-qigong",
    classId: "fighter",
    nameJa: "硬氣功",
    nameCht: "硬氣功",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害4",
    effectDescription: "你的迴避達成值成為1，防禦點+《4》。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 超反應
  sk({
    id: "ftr-hyper-reaction",
    classId: "fighter",
    nameJa: "超反應",
    nameCht: "超反應",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5點",
    effectDescription: "防禦時，無論攻擊側使用什麼你都能使用【近戰】-4進行迴避判定。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 精神統一
  sk({
    id: "ftr-mental-focus",
    classId: "fighter",
    nameJa: "精神統一",
    nameCht: "精神統一",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "你每消耗10點TP，就可以恢復《2D6+1》HP。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 震腳
  sk({
    id: "ftr-stomp",
    classId: "fighter",
    nameJa: "震腳",
    nameCht: "震腳",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害4",
    effectDescription: "實際傷害後，對方TP減去《3D6》。每當傷害骰出現一個6或5，額外增加1D6+1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 真氣統合
  sk({
    id: "ftr-true-qi-unify",
    classId: "fighter",
    nameJa: "真氣統合",
    nameCht: "真氣統合",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的武鬥家等級必須超過其他級別。 你將現有HP與TP加總後均分。均分後若回復超過原先HP5點，獲得狀態【真氣】。 【真氣】：傷害增加【武鬥家等級】，此回合戰鬥判定增加1D6。狀態持續到你遭受傷害為止。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // --- 額外特技 ---

  // 先手必勝
  sk({
    id: "ftr-preemptive-strike",
    classId: "fighter",
    nameJa: "先手必勝",
    nameCht: "先手必勝",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "通過一個目標值為12的2D6+【武鬥家等級】判定。此次攻擊因為對手技能而進入反擊處理時，你可以跳過命中過程，直接擲傷害骰給予對手傷害。 在這之後若對手未進入行動不能狀態，你也受到對手攻擊傷害。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 連環掌
  sk({
    id: "ftr-chain-palm",
    classId: "fighter",
    nameJa: "連環掌",
    nameCht: "連環掌",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害4",
    effectDescription:
      "通過一個目標值為12的2D6+【武鬥家等級】判定。成功後蛇咬與滲透勁於實傷階段給予對手《2D6》傷害。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 合氣投
  sk({
    id: "ftr-aikido-throw",
    classId: "fighter",
    nameJa: "合氣投",
    nameCht: "合氣投",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你的破打使對象變成行動完成的狀態時，追加《4D6》傷害，並可以使對象強制移動到相鄰區域。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 散打
  sk({
    id: "ftr-sanda",
    classId: "fighter",
    nameJa: "散打",
    nameCht: "散打",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "通過一個目標值為12的2D6+【武鬥家等級】判定。實傷後效果。對象下一次迴避判定時達成值-《4》。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 一擊脫離
  sk({
    id: "ftr-hit-and-run",
    classId: "fighter",
    nameJa: "一擊脫離",
    nameCht: "一擊脫離",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害10",
    effectDescription:
      "通過一個目標值為12的2D6+【武鬥家等級】判定。此次攻擊因為對手技能而進入反擊處理時，你可以選擇降低《2D6》傷害而迴避對手的反擊。對方的待機狀態並不會因此解除。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 武神的呼吸
  sk({
    id: "ftr-war-god-breath",
    classId: "fighter",
    nameJa: "武神的呼吸",
    nameCht: "武神的呼吸",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害30",
    effectDescription: "這個特技在決定階段使用。你無視行動點順序、行動與否取得主要階段。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 真氣爆發‧虎襲
  sk({
    id: "ftr-qi-burst-tiger",
    classId: "fighter",
    nameJa: "真氣爆發‧虎襲",
    nameCht: "真氣爆發‧虎襲",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "真氣狀態下使用。 命中後效果，選擇本次攻擊中尚未使用的攻擊類型／近戰技能，視同直接命中，傷害分段計算後加總。 使用後真氣狀態解除。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 真氣制御‧天人合一
  sk({
    id: "ftr-qi-control-unity",
    classId: "fighter",
    nameJa: "真氣制御‧天人合一",
    nameCht: "真氣制御‧天人合一",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "戰鬥中使用。 回合中輪到你行動時，可將剩餘行動點全數轉為TP。 回合結束前你的被動判定減少1D6，受到攻擊時傷害額外增加2D6-【武鬥家等級】。 結束階段你獲得〈真氣〉。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 真氣爆發‧狼影
  sk({
    id: "ftr-qi-burst-wolf",
    classId: "fighter",
    nameJa: "真氣爆發‧狼影",
    nameCht: "真氣爆發‧狼影",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "真氣狀態下使用。 受到近戰攻擊時，迴避判定+1D6。 迴避成功時，選擇一攻擊類型／近戰攻擊對手，無須擲骰直接命中，對方無法使用技能類型:防禦。 使用後真氣解除。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 真氣制御‧浮生
  sk({
    id: "ftr-qi-control-float",
    classId: "fighter",
    nameJa: "真氣制御‧浮生",
    nameCht: "真氣制御‧浮生",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "真氣狀態下使用，一劇本2次。 當你受到攻擊時，可將一半所受到的傷害由TP支付，並且保持〈真氣〉。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 超凡
  sk({
    id: "ftr-transcendence",
    classId: "fighter",
    nameJa: "超凡",
    nameCht: "超凡",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "一劇本1次，若達成所有取得限制，使用次數+1。 下列效果三擇一： ●無盡破壞或是一個特技的代價變成0。 ●限制次數的能力回數+1。 ●此回合判定不會遭受其他人的技能或背反律所影響。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 自然之體
  sk({
    id: "ftr-natural-body",
    classId: "fighter",
    nameJa: "自然之體",
    nameCht: "自然之體",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "你的所有屬性點+3，回合結束階段回復1D6TP。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 氣入
  sk({
    id: "ftr-qi-charge",
    classId: "fighter",
    nameJa: "氣入",
    nameCht: "氣入",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害2",
    effectDescription:
      "指定對象一人，給予其《1D6+[你的一屬性值]》傷害。若該屬性值高於5點，實傷階段額外造成[你的一屬性值]。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 縫之牢
  sk({
    id: "ftr-stitch-prison",
    classId: "fighter",
    nameJa: "縫之牢",
    nameCht: "縫之牢",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害7",
    effectDescription:
      "實傷後效果，對方下次逃跑判定達成值-《2》，命中後對象獲得不良狀態【鎖定】。 【鎖定】：當你受到來自鎖定者的攻擊時，鎖定者的命中判定+3，會心-1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 伏龍滅
  sk({
    id: "ftr-crouching-dragon",
    classId: "fighter",
    nameJa: "伏龍滅",
    nameCht: "伏龍滅",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害6",
    effectDescription:
      "攻擊範圍增加至鄰近區域，傷害增加《3》。搭配〈氣入〉合算為單一技能，且代價傷害改為4。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 三絕掌
  sk({
    id: "ftr-triple-palm",
    classId: "fighter",
    nameJa: "三絕掌",
    nameCht: "三絕掌",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害30",
    effectDescription:
      "攻擊類型／近戰技能命中後，可對同一目標選擇一個你本回尚未使用過的攻擊類型／近戰技能進行攻擊，若命中還能再次選擇一個本回合尚未使用過的攻擊類型／近戰技能進行一次攻擊。 實際傷害分開計算。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 悟天霞
  sk({
    id: "ftr-enlightened-mist",
    classId: "fighter",
    nameJa: "悟天霞",
    nameCht: "悟天霞",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "HP和TP增加（武鬥家等級*2），精神判定常時+3。失去所有的防禦點，換成等量的屬性技能點數，並可隨意分配到任意屬性上。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 八極拳
  sk({
    id: "ftr-bajiquan",
    classId: "fighter",
    nameJa: "八極拳",
    nameCht: "八極拳",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害8",
    effectDescription:
      "指定對象一人，造成1D6+【雙方防禦點差】的傷害。 武鬥家等級四時，此技能效果改為： 指定對象一人，造成2D6+【對手防禦點】的傷害。 武鬥家等級六時，此技能效果改為： 指定對象一人，造成3D6+【雙方防禦總合】的傷害。 武鬥家等級十時，此技能效果改為： 指定對象一人，造成4D6+【雙方防禦總合】的傷害，此技能實際傷害為兩倍。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 七脈淨氣
  sk({
    id: "ftr-seven-meridians",
    classId: "fighter",
    nameJa: "七脈淨氣",
    nameCht: "七脈淨氣",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害30",
    effectDescription:
      "此次傷害增加《4》D6+2的傷害，命中增加[你的一屬性值]。 額外支付10點代價傷害，本次攻擊增加攻擊範圍內一目標。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 武練
  sk({
    id: "ftr-martial-training",
    classId: "fighter",
    nameJa: "武練",
    nameCht: "武練",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害5",
    effectDescription: "一場戰鬥兩次。 命中或迴避時可骰兩次判定，擇較高數為達成值，但無法會心。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),
]);
