// === executor 特技定義（千夜月姫 TRPG）===
// 資料來源: senya_tsukihime PHP data files
//
// 取得規則: 取得特技 ▲ 初期取得： 選擇兩個自己喜歡的特技。 升級： 等級上升之時、選取一個喜歡的特技。5等、10等時，可以額外再取得一個特技。

import type { SkillDef } from "./types.js";

const sk = (def: SkillDef): SkillDef => Object.freeze(def);

export const EXECUTOR_SKILLS: readonly SkillDef[] = Object.freeze([
  // --- 一般特技 ---

  // 黑鍵持有
  sk({
    id: "exe-black-key",
    classId: "executor",
    nameJa: "黑鍵持有",
    nameCht: "黑鍵持有",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "劇本開始時，你得到［你的代行者等級X2］數量黑鍵。黑鍵具有1D6+4傷害。並為概念武裝。但是無論拿來揮砍或是投擲，皆會因本體精煉度低而損毀。受到黑鍵命中的對象，獲得不良狀態【復原詛咒無效化】。 【復原詛咒無效化】： 你無法因為自己的技能 獲得HP回復，此效果持續到下個回合終了。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 異端審判人
  sk({
    id: "exe-heresy-judge",
    classId: "executor",
    nameJa: "異端審判人",
    nameCht: "異端審判人",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "通過聖堂教會層層磨練，以將體術昇華至頂點。你的近戰與射擊常時+1。生命力提升［你的總等級X2］，集中力提升［你的總等級X2］。防禦點+1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 秘跡封印
  sk({
    id: "exe-sacrament-seal",
    classId: "executor",
    nameJa: "秘跡封印",
    nameCht: "秘跡封印",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "對象身上所持：秘跡獲得不良狀態【封印】。 發動此特技必須接觸到目標物品，或是與持有者進行近戰命中對抗。 【封印】：秘跡失去其效果，此效果持續到下個回合／場景結束終了。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 聖痕持有
  sk({
    id: "exe-stigmata",
    classId: "executor",
    nameJa: "聖痕持有",
    nameCht: "聖痕持有",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你獲得以下常時： 從【生命力】跟【集中力】選擇一項減少（你的代行者級別），從【近戰】跟【射擊】選擇一項增加（你的代行者級別）。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 異端消抹偏執：竭誠信仰
  sk({
    id: "exe-heresy-zealot-faith",
    classId: "executor",
    nameJa: "異端消抹偏執：竭誠信仰",
    nameCht: "異端消抹偏執：竭誠信仰",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "取得此特技後，不得取得其他〈異端消抹偏執〉特技。 對非人、魔術師傷害追加2D6點；其他傷害減1D6點。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 異端消抹偏執：不信者
  sk({
    id: "exe-heresy-zealot-infidel",
    classId: "executor",
    nameJa: "異端消抹偏執：不信者",
    nameCht: "異端消抹偏執：不信者",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "取得此特技後，不得取得其他〈異端消抹偏執〉特技。 傷害常時增加1D6點。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 所持：秘跡
  sk({
    id: "exe-possession-sacrament",
    classId: "executor",
    nameJa: "所持：秘跡",
    nameCht: "所持：秘跡",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "你可以持有一秘跡，此特技可重複取得。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 影縫
  sk({
    id: "exe-shadow-stitch",
    classId: "executor",
    nameJa: "影縫",
    nameCht: "影縫",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "實傷後效果，對象獲得不良狀態【痲痹】、【鎖定】。 【痲痹】：【行動值】會變成1，而且不能進行移動宣言。 【鎖定】：當你受到來自鎖定者的攻擊時，鎖定者的命中判定+3，會心-1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 強化式典
  sk({
    id: "exe-enhanced-rite",
    classId: "executor",
    nameJa: "強化式典",
    nameCht: "強化式典",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代機延遲2",
    effectDescription:
      "你的傷害追加《1D6+1》點，若對象為死徒則傷害追加《2D6+1》點。 宣言反擊時此特技失去效果。",
    tpReward: 2,
    endlessDestructionEligible: true,
  }),

  // 多重投擲
  sk({
    id: "exe-multi-throw",
    classId: "executor",
    nameJa: "多重投擲",
    nameCht: "多重投擲",
    trigger: "offense",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代機延遲3",
    effectDescription:
      "你可以一次使用【你的總等級】黑鍵進行攻擊，此數值不得大於6。攻擊對象可為不同人。宣言反擊時此特技失去效果。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 固定式典
  sk({
    id: "exe-anchor-rite",
    classId: "executor",
    nameJa: "固定式典",
    nameCht: "固定式典",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "一把黑鍵代價傷害2",
    effectDescription: "使你的黑鍵損毀率變為二分之一。這回合使用黑鍵時，命中+《1》，傷害+3。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 黑鍵製作
  sk({
    id: "exe-black-key-craft",
    classId: "executor",
    nameJa: "黑鍵製作",
    nameCht: "黑鍵製作",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "戰鬥外時可使用，每一天可得到［你的代行者等級／2］數量的黑鍵，四捨五入去小數點。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 火葬式典
  sk({
    id: "exe-cremation-rite",
    classId: "executor",
    nameJa: "火葬式典",
    nameCht: "火葬式典",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "一把黑鍵代價傷害5",
    effectDescription:
      "你的黑鍵增加以下效果「實際傷害後效果，對象獲得不良狀態命中後對象得到不良狀態【燃燒】」。 【燃燒】：每到回合結束時，受到《【你的代行者等級】*6》的最大生命值百分比傷害。」",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 土葬式典
  sk({
    id: "exe-burial-rite",
    classId: "executor",
    nameJa: "土葬式典",
    nameCht: "土葬式典",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "一把黑鍵代價傷害5",
    effectDescription:
      "你的黑鍵增加以下效果「實際傷害後效果，對象獲得不良狀態【石化】」 【石化】：你的防禦值上升10，除了解除不良狀態，無法進行任何動作。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 風葬式典
  sk({
    id: "exe-wind-burial-rite",
    classId: "executor",
    nameJa: "風葬式典",
    nameCht: "風葬式典",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "一把黑鍵代價傷害5",
    effectDescription:
      "你的射擊命中額外增加【你的代行者等級】，會心-1，黑鍵增加以下效果「使用黑鍵的特技，其待機延遲減少【你的代行者等級】點。」",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 水葬式典
  sk({
    id: "exe-water-burial-rite",
    classId: "executor",
    nameJa: "水葬式典",
    nameCht: "水葬式典",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "一把黑鍵代價傷害5",
    effectDescription:
      "你的黑鍵增加以下效果「實際傷害後效果，對象所有下回合結束之不良狀態延長［你的代行者等級／2］回合，四捨五入。且所有不良狀態解除判定的達成值變為10。」",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 鳥葬式典
  sk({
    id: "exe-sky-burial-rite",
    classId: "executor",
    nameJa: "鳥葬式典",
    nameCht: "鳥葬式典",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "一把黑鍵代價傷害2，待機延遲2",
    effectDescription: "你的黑鍵增加以下效果「實際傷害效果後，對象下回行動點-6」。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 神威之鎖
  sk({
    id: "exe-divine-chain",
    classId: "executor",
    nameJa: "神威之鎖",
    nameCht: "神威之鎖",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害15",
    effectDescription:
      "指定一對象，與其進行【精神】對決。對象失敗的話，此回合行動力-《10》，非人者的話-《15》。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 洗禮詠唱
  sk({
    id: "exe-baptism-chant",
    classId: "executor",
    nameJa: "洗禮詠唱",
    nameCht: "洗禮詠唱",
    trigger: "offense",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "待機延遲12",
    effectDescription:
      "指定一對象，給予不良狀態【洗禮】。 【洗禮】：對象行動力-5，非人者的話-10。若為非人，每回合另外減少5TP。 背反律「死之轉生」、特技「起源覺醒：靜止」、「於世所不容者」失效。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 真實確在的恩膏
  sk({
    id: "exe-true-anointing",
    classId: "executor",
    nameJa: "真實確在的恩膏",
    nameCht: "真實確在的恩膏",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "從基本能力值體力、知覺、理智、意志選擇一項減少［你的代行者等級］，選擇任意兩個魔術師以外級別之特技或選擇一個風格與感情。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // --- 額外特技 ---

  // 式典魔術
  sk({
    id: "exe-ritual-magic",
    classId: "executor",
    nameJa: "式典魔術",
    nameCht: "式典魔術",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "一把黑鍵代價傷害7",
    effectDescription: "你可以同時賦予黑鍵火葬、土葬、風葬的效果。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 強制洗禮
  sk({
    id: "exe-forced-baptism",
    classId: "executor",
    nameJa: "強制洗禮",
    nameCht: "強制洗禮",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害10",
    effectDescription:
      "實傷後效果，對象獲得不良狀態【洗禮】。如果為非人者，追加受到2D6傷害。 【洗禮】：對象行動力-5，非人者的話-10。若為非人，每回合另外減少5TP。 背反律「死之轉生」、特技「起源覺醒：靜止」、「於世所不容者」失效。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 埋葬機關候補
  sk({
    id: "exe-burial-agency-candidate",
    classId: "executor",
    nameJa: "埋葬機關候補",
    nameCht: "埋葬機關候補",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你的近戰與射擊常時+2，生命力提升【你的總等級X2】，集中力提升【你的總等級X2】。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 所持：聖典
  sk({
    id: "exe-possession-scripture",
    classId: "executor",
    nameJa: "所持：聖典",
    nameCht: "所持：聖典",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "此技能可重複取得。 從下列擇一【聖典】持有： ■聖葬砲典 分類：攻撃類型／射撃 代價：待機延遲10 效果：當你具有「聖典制御刻印」時可使用。 指定對象1人，給予【你的代行者等級】D6的傷害，本次傷害為概念武裝。 宣言反擊時，傷害須扣減未待機完畢之行動點。 ■第七聖典 分類：攻撃類型／共通 代價：待價傷害12 效果：當你具有「聖典制御刻印」時可使用。 指定對象1人，給予4D6+【你的代行者等級...",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 鐵甲作用
  sk({
    id: "exe-iron-plate",
    classId: "executor",
    nameJa: "鐵甲作用",
    nameCht: "鐵甲作用",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "待機延遲10",
    effectDescription: "此技能可與式典技能併用。你的傷害追加【你的代行者等級】點。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 聖典制御刻印
  sk({
    id: "exe-scripture-control-crest",
    classId: "executor",
    nameJa: "聖典制御刻印",
    nameCht: "聖典制御刻印",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "你的防禦值上升4，當你丟出大失敗時，可以重新擲骰。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 戰鬥反應
  sk({
    id: "exe-combat-reaction",
    classId: "executor",
    nameJa: "戰鬥反應",
    nameCht: "戰鬥反應",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害15",
    effectDescription:
      "在聖堂教會的層層磨練下，身經無數的戰場並習慣之，無論怎樣突發狀況都可以精準判斷、下達命令，甚至是依槍聲聽出敵方武器種類。 在你戰鬥判定之後使用，達成值+【你的總等級】。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 黑鍵抵禦
  sk({
    id: "exe-black-key-parry",
    classId: "executor",
    nameJa: "黑鍵抵禦",
    nameCht: "黑鍵抵禦",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "在自身的迴避判定後使用，你可以使用【你的總等級】把黑鍵進行抵禦，此數值不可超過6。 一把黑鍵可以抵擋攻擊類型／射擊結算前的1D6+4點傷害。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 第八秘跡會所屬
  sk({
    id: "exe-eighth-sacrament-member",
    classId: "executor",
    nameJa: "第八秘跡會所屬",
    nameCht: "第八秘跡會所屬",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你可以再持有［你的代行者等級／2］個秘跡，四捨五入。 你可以得知任何處於【封印】狀態的裝備品或消耗品的位置。 一個劇本可以使用［你的代行者等級］次，接觸該物品或與該物持有者近戰命中對抗成功後，回收處於【封印】狀態的該裝備品或消耗品。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 釘刑
  sk({
    id: "exe-crucifixion",
    classId: "executor",
    nameJa: "釘刑",
    nameCht: "釘刑",
    trigger: "offense",
    attackDomain: "ranged",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你可以一次使用【你的總等級】把投擲物進行攻擊，此數值不得大於6，此特技只會對對方造成一次傷害，一次所造成的傷害為所有投擲物傷害之總和。 宣言反擊時此特技失去效果。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 快速執行
  sk({
    id: "exe-quick-execution",
    classId: "executor",
    nameJa: "快速執行",
    nameCht: "快速執行",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "你的黑鍵上所有實際傷害後效果的敘述轉變為命中後效果。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 黑鍵製作‧進階
  sk({
    id: "exe-black-key-craft-advanced",
    classId: "executor",
    nameJa: "黑鍵製作‧進階",
    nameCht: "黑鍵製作‧進階",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "每天可得到的黑鍵數量變為［你的代行者等級］、準備階段與結束階段皆能獲得一把黑鍵。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 不存在的恩典
  sk({
    id: "exe-nonexistent-grace",
    classId: "executor",
    nameJa: "不存在的恩典",
    nameCht: "不存在的恩典",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "在符合取得限制下，取得兩個魔術師特技。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 不潔之物
  sk({
    id: "exe-impure-thing",
    classId: "executor",
    nameJa: "不潔之物",
    nameCht: "不潔之物",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害3",
    effectDescription:
      "一天可以使用［你的代行者等級］次，消耗一把黑鍵你可以指定破壞刻有盧文字的物件、人偶、使魔或異界之獸。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 秘跡執行‧上下同位
  sk({
    id: "exe-sacrament-execution-homoousios",
    classId: "executor",
    nameJa: "秘跡執行‧上下同位",
    nameCht: "秘跡執行‧上下同位",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害30",
    effectDescription:
      "破壞一個你所持有分類為裝備品的秘跡，你其中一個關於秘跡類特技中需要接觸的敘述變為直接宣告即可，且不須進行判定，此效果僅止於該回。 此技能在整個劇本中只得使用一次，若登錄為無盡破壞可再繼續使用。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 秘跡破壞
  sk({
    id: "exe-sacrament-destroy",
    classId: "executor",
    nameJa: "秘跡破壞",
    nameCht: "秘跡破壞",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害5",
    effectDescription:
      "一個劇本可以使用［你的代行者等級］次，破壞一個所持：秘跡分類的裝備品或消耗品。 發動此特技必須接觸到目標物品，或是與持有者進行近戰命中對抗。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 異物認定
  sk({
    id: "exe-foreign-body-recognition",
    classId: "executor",
    nameJa: "異物認定",
    nameCht: "異物認定",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "秘跡破壞、秘跡封印中關於所持：秘跡的敘述皆變為所持：任意。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),
]);
