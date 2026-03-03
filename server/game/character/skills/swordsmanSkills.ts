// === swordsman 特技定義（千夜月姫 TRPG）===
// 資料來源: senya_tsukihime PHP data files
//
// 取得規則: 取得特技 ▲ 初期取得： 得到「段位」、「流派」。 升級： 等級上升之時、選取一個喜歡的特技。每逢5等、10等時，可以額外再取得一個特技。

import type { SkillDef } from "./types.js";

const sk = (def: SkillDef): SkillDef => Object.freeze(def);

export const SWORDSMAN_SKILLS: readonly SkillDef[] = Object.freeze([
  // --- 一般特技 ---

  // 段位
  sk({
    id: "swd-rank",
    classId: "swordsman",
    nameJa: "段位",
    nameCht: "段位",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你身為劍士的段位資格，會隨著同一流派相關技能數而改變。 一到二：切紙 三到四：目錄 五到六：印可 七到八：大目錄 九以上：免許皆傳。 此技能本身不算在相關技能數。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 流派
  sk({
    id: "swd-school",
    classId: "swordsman",
    nameJa: "流派",
    nameCht: "流派",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "從以下流派中擇一入門，此特技可重複取得。此技能計算在相關技能數。 二天一流： 你獲得技能■二天一流。 一刀流： 你獲得技能■一刀流。 夢想流： 你獲得技能■夢想流。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 二天一流
  sk({
    id: "swd-school-nitenichi",
    classId: "swordsman",
    nameJa: "二天一流",
    nameCht: "二天一流",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "使用大小太刀的攻擊。指定一對象造成2D6傷害，並可宣言任一架式。〈上段〉本次傷害追加1D6。〈下段〉本次命中達成值追加2。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 一刀流
  sk({
    id: "swd-school-ittou",
    classId: "swordsman",
    nameJa: "一刀流",
    nameCht: "一刀流",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "使用中、或是小太刀進行攻擊。指定一對象造成2D6+4傷害，並可宣言任一架式。〈背車刀〉本次命中追加1。〈切落〉你切換到待機狀態，並且可反擊任何攻擊，若是反擊時的命中值高於對手命中，跳過雙方傷害階段直接結束，此架式進行完後你不會進入已行動狀態。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 夢想流
  sk({
    id: "swd-school-musou",
    classId: "swordsman",
    nameJa: "夢想流",
    nameCht: "夢想流",
    trigger: "attack",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "使用居合刀進行的攻擊。指定一對象造成《1D6》傷害。並可宣言任一架式。〈跪座〉待機延遲4，本次攻擊傷害追加2D6，你與對方皆無法宣言反擊。〈站姿〉本次命中值追加3。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 圓極
  sk({
    id: "swd-enkyoku",
    classId: "swordsman",
    nameJa: "圓極",
    nameCht: "圓極",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5",
    effectDescription: "二刀流的起手架式。回合終了為止你的命中達成值+2，防禦值+2。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 左右反打
  sk({
    id: "swd-sayuu-handa",
    classId: "swordsman",
    nameJa: "左右反打",
    nameCht: "左右反打",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你可針對朝你發出的攻擊進行以下宣言：〈左反打〉對手此次攻擊的傷害與命中+2，在你被攻擊或是迴避之後，你可以無視行動狀態，以對手為對象進行攻擊，此次攻擊命中+4。〈右反打〉對手此次攻擊的傷害與命中+4，在你被攻擊或是迴避之後，你可以無視行動狀態，以對手為對象進行攻擊，此次攻擊傷害+2D6。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 陰陽雙舞
  sk({
    id: "swd-inyou-soumu",
    classId: "swordsman",
    nameJa: "陰陽雙舞",
    nameCht: "陰陽雙舞",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "二天一流的招式變化，你可以進行以下宣言：〈陽舞〉以大太刀為主，本次傷害追加1D6。〈陰舞〉以小太刀為主，本次命中達成值+3。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 紅葉疊舞
  sk({
    id: "swd-momiji-kasanemai",
    classId: "swordsman",
    nameJa: "紅葉疊舞",
    nameCht: "紅葉疊舞",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害3",
    effectDescription:
      "對手迴避攻擊之後，你可以命中達成值-6再次進行攻擊。此技能一回合只能使用一次。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 組太刀
  sk({
    id: "swd-kumitachi",
    classId: "swordsman",
    nameJa: "組太刀",
    nameCht: "組太刀",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5",
    effectDescription: "二天一流的起手架式變化。回合終了為止你可以對朝你而來攻擊進行兩次迴避。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 二刀八相
  sk({
    id: "swd-nitou-hassou",
    classId: "swordsman",
    nameJa: "二刀八相",
    nameCht: "二刀八相",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "宮本武藏創造的架式。你的二天一流敘述文追加「本次攻擊你額外進行兩回命中擲骰，每成功一次傷害追加1D6」。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 轉變落打
  sk({
    id: "swd-tenpen-rakuda",
    classId: "swordsman",
    nameJa: "轉變落打",
    nameCht: "轉變落打",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害15",
    effectDescription:
      "當你受到來自同區域的傷害後，你可以無視行動狀態，以對手為對象進行攻擊，第一次承受這技能造成反擊的對手無法迴避，第二次以後須受到迴避達成值-4的懲罰。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 觀見
  sk({
    id: "swd-kanmi",
    classId: "swordsman",
    nameJa: "觀見",
    nameCht: "觀見",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "你手上有大小太刀時，防禦點+2。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 本覺
  sk({
    id: "swd-hongaku",
    classId: "swordsman",
    nameJa: "本覺",
    nameCht: "本覺",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害3",
    effectDescription: "一刀流的起手架式。回合終了為止你的防禦值+1，使用〈切落〉時，命中值+1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 八相陰劍
  sk({
    id: "swd-hassou-inken",
    classId: "swordsman",
    nameJa: "八相陰劍",
    nameCht: "八相陰劍",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害8+N",
    effectDescription:
      "一刀流的起手架式變化。回合終了為止你的命中+2，傷害增加1D6，攻擊無視Ｎ-5以下防禦值。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 圓流
  sk({
    id: "swd-enryuu",
    classId: "swordsman",
    nameJa: "圓流",
    nameCht: "圓流",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "以像是畫圓般的動作承受對手的攻擊，防禦值+2。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 飛鳥
  sk({
    id: "swd-hichou",
    classId: "swordsman",
    nameJa: "飛鳥",
    nameCht: "飛鳥",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription: "跳躍切砍的劍技，傷害追加1D6，另外，攻擊後你可以無視阻礙，移動到其他區域。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 霞青眼
  sk({
    id: "swd-kasumi-seigan",
    classId: "swordsman",
    nameJa: "霞青眼",
    nameCht: "霞青眼",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "你的架式〈切落〉敘述文新增「本次攻擊你的命中達成值+2」。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 真劍
  sk({
    id: "swd-shinken",
    classId: "swordsman",
    nameJa: "真劍",
    nameCht: "真劍",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "你手上拿的是真刀時，傷害額外增加4。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 松風
  sk({
    id: "swd-matsukaze",
    classId: "swordsman",
    nameJa: "松風",
    nameCht: "松風",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription: "你的架式〈切落〉敘述文新增「本次攻擊成功後，你的行動點+2」。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 葉切
  sk({
    id: "swd-hakiri",
    classId: "swordsman",
    nameJa: "葉切",
    nameCht: "葉切",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10",
    effectDescription: "你的技能〈飛鳥〉敘述文新增「本次攻擊你的命中達成值+3，實際傷害+3」。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 納刀
  sk({
    id: "swd-noutou",
    classId: "swordsman",
    nameJa: "納刀",
    nameCht: "納刀",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "夢想流的起手架式，你得把刀子收起來才可以拔。回合終了為止你的流派──夢想流技能命中會心-1。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合一本目
  sk({
    id: "swd-musou-iai-1",
    classId: "swordsman",
    nameJa: "夢想流居合一本目",
    nameCht: "夢想流居合一本目",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5點",
    effectDescription:
      "夢想流拔刀術，以電光石火速度拔刀斬向敵人，只能搭配夢想流技能使用。本次攻擊傷害增加［你減去對手的行動點］。傷害限制： 〈切紙〉最大上限傷害4 〈目錄〉技能名稱改為「始」1／2拍子，最大上限傷害8 〈印可〉技能名稱改為「始」1／4拍子，最大上限傷害12 〈大目錄〉技能名稱改為「始」1／16拍子，最大上限傷害20 〈免許皆傳〉技能名稱改為「始」1／32拍子，無最大上限傷害。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合二本目
  sk({
    id: "swd-musou-iai-2",
    classId: "swordsman",
    nameJa: "夢想流居合二本目",
    nameCht: "夢想流居合二本目",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你手上的武器不是刀，而是其他諸如竹刀、鐵管之類的非利刃物品時，可以無視傷害懲罰使用夢想流。使用後該物品損毀。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合三本目
  sk({
    id: "swd-musou-iai-3",
    classId: "swordsman",
    nameJa: "夢想流居合三本目",
    nameCht: "夢想流居合三本目",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5",
    effectDescription:
      "對手是空手攻擊時才能使用。你的迴避達成值+2，成功迴避的話，你可以無視行動狀態，以2D6傷害的打砍進行一次攻擊，此次攻擊不得附加其他進攻特技。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合四本目
  sk({
    id: "swd-musou-iai-4",
    classId: "swordsman",
    nameJa: "夢想流居合四本目",
    nameCht: "夢想流居合四本目",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的夢想流可同時以同區域兩人為對象進行攻擊，位於左邊敵人受到的實際傷害會減半。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合五本目
  sk({
    id: "swd-musou-iai-5",
    classId: "swordsman",
    nameJa: "夢想流居合五本目",
    nameCht: "夢想流居合五本目",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "配合夢想流一本目，拔刀時甩出劍鞘進行長度補正的遠距離攻擊。你的本次攻擊成為全區域射程。但是要記住劍鞘甩出去不會自己飛回來。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合六本目
  sk({
    id: "swd-musou-iai-6",
    classId: "swordsman",
    nameJa: "夢想流居合六本目",
    nameCht: "夢想流居合六本目",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10",
    effectDescription:
      "你的技能〈夢想流居合一本目〉敘述文新增「通過一個難易度15的精神判定，你本次的傷害追加此判定數值，失敗的話本次傷害減去此數值。當你段位達到免許皆傳時，可改以額外兩倍支付代價傷害代替判定」。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合七本目
  sk({
    id: "swd-musou-iai-7",
    classId: "swordsman",
    nameJa: "夢想流居合七本目",
    nameCht: "夢想流居合七本目",
    trigger: "defense",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "以真刀刀柄強行阻擋對方的攻擊。抵銷一次空手以外的近戰攻擊，使用後武器損毀。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // --- 額外特技 ---

  // 五輪太刀
  sk({
    id: "swd-gorin-tachi",
    classId: "swordsman",
    nameJa: "五輪太刀",
    nameCht: "五輪太刀",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你手上有大小太刀時，傷害增加2D6，攻擊範圍可包含相鄰區域。並得到以下架式： 〈地太刀〉你可以付出20點行動點使本次攻擊的命中值+［你的劍士等級］。 〈火太刀〉你可以付出20點行動點使本次攻擊的實際傷害成為兩倍。 〈風太刀〉你可以付出20點行動點使本次攻擊射程成為全區域。 〈水太刀〉你可以付出20點行動點進行兩次攻擊。 〈空太刀〉你可以付出20點行動點，反擊即使不以你為對象的技能。空太刀反擊...",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 奧義‧一吋劍理
  sk({
    id: "swd-ougi-issun-kenri",
    classId: "swordsman",
    nameJa: "奧義‧一吋劍理",
    nameCht: "奧義‧一吋劍理",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害30",
    effectDescription:
      "指定一名對手，從該對手而來的攻擊到戰鬥結束前你獲得【你劍士等級】的防禦值修正，這效果無法對同樣的對手疊加。可以對不同角色複數使用。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 金翅烏王劍
  sk({
    id: "swd-kinjichou-ouken",
    classId: "swordsman",
    nameJa: "金翅烏王劍",
    nameCht: "金翅烏王劍",
    trigger: "offense",
    attackDomain: "melee",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害25",
    effectDescription:
      "以飛鳥為底，發展到最終形式的一刀流劍技，此次傷害追加《3》D6+《3》，命中達成值+《3》。另外，攻擊後你可以無視阻礙移動。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 奧義‧夢想劍
  sk({
    id: "swd-ougi-musou-ken",
    classId: "swordsman",
    nameJa: "奧義‧夢想劍",
    nameCht: "奧義‧夢想劍",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害50",
    effectDescription:
      "你的傷害追加《你的劍士等級》D6，攻擊射程成為全區域。獲得此技能後不需支付代價也有常時效果──你不會被［你的劍士等級］以下的角色奇襲成功，即便你在睡覺中遇襲，身體也能自動擺出架式應戰。你在準備階段能夠使用所有的一刀流起手架式效果。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 夢想流居合八本目
  sk({
    id: "swd-musou-iai-8",
    classId: "swordsman",
    nameJa: "夢想流居合八本目",
    nameCht: "夢想流居合八本目",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "當你行動點在20以上的時候，技能〈夢想流居合一本目「始」〉攻擊射程成為全區域。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 奧義‧無拍拔刀
  sk({
    id: "swd-ougi-muhyou-battou",
    classId: "swordsman",
    nameJa: "奧義‧無拍拔刀",
    nameCht: "奧義‧無拍拔刀",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "通過一個難易度17的精神判定與難易度20的行動判定，本次攻擊命中以會心計算，傷害追加《你的劍士等級》。精神判定可以兩倍代價傷害支付，行動判定可以行動點支付。獲得此技能後擁有以下常時效果──你的【行動】、【精神】常時+3。此技能一劇本限用兩回。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),
]);
