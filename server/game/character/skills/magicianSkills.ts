// === magician 特技定義（千夜月姫 TRPG）===
// 資料來源: senya_tsukihime PHP data files
//
// 取得規則: 取得特技 ▲ 初期取得： 得到「魔術迴路」、然後再選擇一個自己喜歡的特技。 升級： 等級上升之時、選取一個喜歡的特技。5等、10等時，可以額外再取得一個特技。

import type { SkillDef } from "./types.js";

const sk = (def: SkillDef): SkillDef => Object.freeze(def);

export const MAGICIAN_SKILLS: readonly SkillDef[] = Object.freeze([
  // --- 一般特技 ---

  // 魔術迴路
  sk({
    id: "mag-magic-circuit",
    classId: "magician",
    nameJa: "魔術迴路",
    nameCht: "魔術迴路",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的TP上限增加［魔術師等級*10］，每日結束時恢復最大值十分之一。你在魔力感知的判定常時+2。使用魔術師技能時，你的達成值額外增加［精神］／4。 你需要使用【意志】做情報判定時，達成值+《2》。 你獲得［魔術師等級+1］的屬性點。並指定1~3種屬性，分配屬性點。爾後每當魔術師等級上升，可獲得1點屬性點分配屬性。然而你不能透過升級取得的點數，得到新的屬性。",
    tpReward: 0,
    endlessDestructionEligible: true,
    configType: "attribute_distribution",
  }),

  // 思考的並列演算
  sk({
    id: "mag-parallel-computation",
    classId: "magician",
    nameJa: "思考的並列演算",
    nameCht: "思考的並列演算",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "你的【理智】判定達成值常時+2。 在你行為判定之後使用，達成值+1D6(這個數值不能超過你的魔術師等級)，使用後行動值-4。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 強化
  sk({
    id: "mag-reinforcement",
    classId: "magician",
    nameJa: "強化",
    nameCht: "強化",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10",
    effectDescription:
      "以同區域角色1人所持武器、或是分類：攻擊類型技能為對象。傷害+《4》，並具有概念武裝效果。此效果持續到結束階段。 在施放時，你可以以每回合5點的代價傷害將這個技能的效果回合數延長。 你可以在進行基本能力判定前使用，使該次達成值+3。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 防禦結界
  sk({
    id: "mag-defense-barrier",
    classId: "magician",
    nameJa: "防禦結界",
    nameCht: "防禦結界",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害15點",
    effectDescription:
      "因應你的屬性，展開保護自己的防禦式。若持有多種屬性，會同時發動。 結束階段需付出10點的代價傷害維持效果。每多支付15代價傷害，你可以增加一名隊友作為這個技能的目標對象。 ►地：你增加［地屬性點］防禦。 ►水：攻擊側的傷害減少［水屬性點］D6。 ►火：攻擊側實傷階段後受到(1D6-2)*［火屬性點］傷害。 ►風：你增加［風屬性點］迴避判定。 ►空&其他：請洽GM。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 魔術刻印
  sk({
    id: "mag-magic-crest",
    classId: "magician",
    nameJa: "魔術刻印",
    nameCht: "魔術刻印",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的魔術使用代價輕減四分之一（包含待機延遲）。 你的TP額外增加50點上限，每到準備階段，你會恢復［你的魔術師等級X3］點TP。每到結束階段，你會恢復［你的魔術師等級］點HP。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 使魔
  sk({
    id: "mag-familiar",
    classId: "magician",
    nameJa: "使魔",
    nameCht: "使魔",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你擁有共享五感的使魔。使魔的能力可以從「狗」、「烏鴉」、「灰貓」任選一。你可以重複取得此特技，使魔死亡的話會於下個劇本復活。 或是在戰鬥外支付30點代價傷害復活。",
    tpReward: 0,
    endlessDestructionEligible: true,
    repeatable: true,
    configType: "familiar",
  }),

  // 禮裝所持
  sk({
    id: "mag-mystic-code",
    classId: "magician",
    nameJa: "禮裝所持",
    nameCht: "禮裝所持",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "你得到一個魔術禮裝，此特技可以重複取得。",
    tpReward: 0,
    endlessDestructionEligible: true,
    repeatable: true,
    configType: "mystic_code",
  }),

  // 暗示
  sk({
    id: "mag-suggestion",
    classId: "magician",
    nameJa: "暗示",
    nameCht: "暗示",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害15點",
    effectDescription:
      "你可以使用暗示。戰鬥中使用時，你與對象進行精神對決，獲勝的話，對手的行動減去你的［魔術師等級］。這個技能的達成值，需扣減對象的［魔術師等級］。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 防禦魔術
  sk({
    id: "mag-defense-magic",
    classId: "magician",
    nameJa: "防禦魔術",
    nameCht: "防禦魔術",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "任意",
    effectDescription:
      "實際傷害前使用。你可以把攻擊側的傷害減去［本次支付代價／3］，在這之後，直到戰鬥結束前你的防禦點+2。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 魔術構成
  sk({
    id: "mag-magic-composition",
    classId: "magician",
    nameJa: "魔術構成",
    nameCht: "魔術構成",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "特殊",
    effectDescription:
      "選擇三個名稱中有「要素」的技能，此技能的各項內容為所選要素中相關內容的相加。 此技能可重複取得，你可以選擇重新取得一個「魔術構成」，或是為現有的「魔術構成」增加一個「構成要素」。 同一種「要素」可以重複取得。",
    tpReward: 0,
    endlessDestructionEligible: true,
    repeatable: true,
    configType: "composition",
  }),

  // 道具作成
  sk({
    id: "mag-item-creation",
    classId: "magician",
    nameJa: "道具作成",
    nameCht: "道具作成",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你可以設定一種消耗性道具，最大數量為1~［你的魔術師等級*4］。劇本開始時持有最大數量。 此技能視為一種「魔術構成」，可選取兩項「要素」。每次使用此技能，需消耗一個道具。 使同一「魔術構成」《》內的數字追加［25-道具最大數量］點。",
    tpReward: 0,
    endlessDestructionEligible: true,
    configType: "composition",
  }),

  // 魔眼保持
  sk({
    id: "mag-mystic-eyes",
    classId: "magician",
    nameJa: "魔眼保持",
    nameCht: "魔眼保持",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的TP上限增加［魔術師等級*5］。 此技能視為一種「魔術構成」，可選取兩項「要素」。並使該「魔術構成」《》內的數字追加［你的魔術師等級］點。",
    tpReward: 0,
    endlessDestructionEligible: true,
    configType: "composition",
  }),

  // 反咒
  sk({
    id: "mag-counter-spell",
    classId: "magician",
    nameJa: "反咒",
    nameCht: "反咒",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5點",
    effectDescription:
      "進行精神迴避時使用。 若此次迴避成功，攻擊側受到2D6+【理智】傷害。 若迴避失敗，額外受到1D6傷害。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 解咒
  sk({
    id: "mag-dispel",
    classId: "magician",
    nameJa: "解咒",
    nameCht: "解咒",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害7點",
    effectDescription:
      "進行一次目標值為7的2D6+【理智】判定。 成功則解除目標1個不良狀態。 支付代價時，每多支付3點可以追加解除1個不良狀態。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // --- 額外特技 ---

  // 陣地作成
  sk({
    id: "mag-territory-creation",
    classId: "magician",
    nameJa: "陣地作成",
    nameCht: "陣地作成",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20點",
    effectDescription:
      "在戰鬥外選擇一個地點，將你所持有的一個特技做為對象，將該對象「設置」。 被設置的特技、可以在設置的地點不支付代價而使用。 可以設置的特技個數上限、跟你的魔術師等級相同。 陣地有被發現而遭破壞可能，耐久度為你的《2D6》+［魔術師等級］+［精神/3］。 執行破壞陣地行動時，一律為(2D6+玩家精神/3)。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 多重屬性
  sk({
    id: "mag-multi-element",
    classId: "magician",
    nameJa: "多重屬性",
    nameCht: "多重屬性",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "你額外得到2點屬性點，可額外獲得0~2種屬性。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 召喚專精
  sk({
    id: "mag-summon-mastery",
    classId: "magician",
    nameJa: "召喚專精",
    nameCht: "召喚專精",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20",
    effectDescription:
      "你能召喚一體「異界之獸」。 召喚異界之獸時，你的行動點數增加1D6，並從以下效果選擇一個發動： 1.指定一對象，造成的傷害增加2D6。 2.指定一對象防禦增加［你的魔術師等級］點。 3.指定一對象，恢復他3D6HP。 附加的效果將會在回合結束，或是異界之獸死亡時消失，你可以支付20點代價傷害維持或再次啟動效果。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 治癒魔術
  sk({
    id: "mag-healing-magic",
    classId: "magician",
    nameJa: "治癒魔術",
    nameCht: "治癒魔術",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害15",
    effectDescription:
      "指定對象一人，使其恢復《［你的魔術師等級-2］D6》HP。每額外支付15點TP，增加1D6+［你的魔術師等級-3］點恢復量。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 完全解析
  sk({
    id: "mag-full-analysis",
    classId: "magician",
    nameJa: "完全解析",
    nameCht: "完全解析",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害25",
    effectDescription: "你這回合的戰鬥判定+《2》，傷害+《4》",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 高效率迴路運轉
  sk({
    id: "mag-efficient-circuit",
    classId: "magician",
    nameJa: "高效率迴路運轉",
    nameCht: "高效率迴路運轉",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你可以常時輕減代價傷害5（最低為1）。 魔術師等級6以上時，改為輕減10（最低為1）。 魔術師等級9以上時，改為輕減20（最低為1）。 如有任意支付代價的特技，計算時以輕減前數值適用。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 高速詠唱
  sk({
    id: "mag-high-speed-chant",
    classId: "magician",
    nameJa: "高速詠唱",
    nameCht: "高速詠唱",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription: "你所有的「要素：詠唱」，每小節待機延遲成為1。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 肉體改造
  sk({
    id: "mag-body-modification",
    classId: "magician",
    nameJa: "肉體改造",
    nameCht: "肉體改造",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20",
    effectDescription:
      "一天一次，你取得5點數，可自由分配在你的能力基本值上。 使用時進行達成值為(7+過去已使用次數)的理智判定。 失敗時你仍可得到點數，但你受到2D6點傷害。 改造疊加上限為你的［魔術師等級/3］次。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 屬性強化
  sk({
    id: "mag-element-enhancement",
    classId: "magician",
    nameJa: "屬性強化",
    nameCht: "屬性強化",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害12",
    effectDescription:
      "「要素：傷害」傷害追加你的任一屬性的屬性值，並成為該屬性傷害。 「防禦結界」效果增加兩回合。 「防禦魔術」對任一屬性傷害-4，你持有該屬性則-8。 代價傷害追加8點傷害時，持有的任一屬性值+2。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // --- 要素構成 ---

  // 要素：傷害
  sk({
    id: "mag-element-damage",
    classId: "magician",
    nameJa: "要素：傷害",
    nameCht: "要素：傷害",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害1~［你的魔術師等級］",
    effectDescription:
      "對目標造成《2D6》+ [本次支付代價+2]點傷害。 此要素須搭配攻擊類型或進攻類型。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：準備
  sk({
    id: "mag-element-prep",
    classId: "magician",
    nameJa: "要素：準備",
    nameCht: "要素：準備",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5",
    effectDescription: "此「魔術構成」的分類成為「準備階段」。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：攻擊類型
  sk({
    id: "mag-element-attack-type",
    classId: "magician",
    nameJa: "要素：攻擊類型",
    nameCht: "要素：攻擊類型",
    trigger: "attack",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "選擇近戰、射擊、精神其中一項，選擇後將無法更改。此「魔術構成」的分類成為「攻擊類型/(你選擇的分類)」。 選擇近戰時，此要素的代價傷害減少1點。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：進攻
  sk({
    id: "mag-element-offense",
    classId: "magician",
    nameJa: "要素：進攻",
    nameCht: "要素：進攻",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "選擇近戰、射擊、精神其中一項，選擇後將無法更改。此「魔術構成」的分類成為「進攻/(你選擇的分類)」。 選擇近戰時，此要素的代價傷害減少1點。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：詠唱
  sk({
    id: "mag-element-chant",
    classId: "magician",
    nameJa: "要素：詠唱",
    nameCht: "要素：詠唱",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "依工程區分，每小節待機延遲4、代價傷害5",
    effectDescription:
      "此「魔術構成」需要詠唱才能發動。 每小節詠唱使同一「魔術構成」《》內的數字追加1D6。 詠唱節數不能超過你的［魔術師等級］，因詠唱進入反擊階段時，未詠唱完的小節將不計入計算。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：連續發動
  sk({
    id: "mag-element-chain",
    classId: "magician",
    nameJa: "要素：連續發動",
    nameCht: "要素：連續發動",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "此「魔術構成」增加以下效果： 此技能使用後，你減少7點行動點，並且不會進入已行動狀態。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：區域
  sk({
    id: "mag-element-area",
    classId: "magician",
    nameJa: "要素：區域",
    nameCht: "要素：區域",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10",
    effectDescription:
      "此「魔術構成」的指定目標從單一角色改為一個區域內所有角色。 每多支付10點代價傷害，可多指定一個區域。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：防禦
  sk({
    id: "mag-element-defense",
    classId: "magician",
    nameJa: "要素：防禦",
    nameCht: "要素：防禦",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害1~［你的魔術師等級］",
    effectDescription:
      "減少目標本回合受到的傷害《2D6》+[本次支付代價+2]點。 此要素須搭配其他輔助要素。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：增益
  sk({
    id: "mag-element-buff",
    classId: "magician",
    nameJa: "要素：增益",
    nameCht: "要素：增益",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription: "增加目標本回合一項戰鬥能力值《1D6》點。 此要素須搭配其他輔助要素。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：持續效果
  sk({
    id: "mag-element-duration",
    classId: "magician",
    nameJa: "要素：持續效果",
    nameCht: "要素：持續效果",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription: "使此「魔術構成」內帶有「本回合」的效果，效力延長一回合。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：複數目標
  sk({
    id: "mag-element-multi-target",
    classId: "magician",
    nameJa: "要素：複數目標",
    nameCht: "要素：複數目標",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5",
    effectDescription: "使此「魔術構成」可以指定複數目標。 每多支付3點代價傷害，可多指定一個。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：減益
  sk({
    id: "mag-element-debuff",
    classId: "magician",
    nameJa: "要素：減益",
    nameCht: "要素：減益",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害2",
    effectDescription:
      "減少目標本回合一項戰鬥能力值《1D6》點。 此「魔術構成」判定從以下方式擇一，選擇後不能更改： 【攻擊】造成實際傷害後發揮作用。 【精神】精神對決成功後發揮作用。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：異常狀態
  sk({
    id: "mag-element-status",
    classId: "magician",
    nameJa: "要素：異常狀態",
    nameCht: "要素：異常狀態",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害3",
    effectDescription:
      "此「魔術構成」增加以下效果擇一，選擇後不能更改： 【痲痹】：【行動值】會變成1，而且不能進行移動宣言。 【鎖定】：當你受到來自鎖定者的攻擊時，鎖定者的命中判定+3，會心-1。 【燃燒】：結束階段時受到2D6+［你的魔術師等級〕點火屬性傷害。 【束縛】：所有動作和被動的達成值-3。 【恍惚】：無法使用分類：常時以外的特技。可透過消費15點TP解除。 【中毒】：結束階段時承受10%的最大HP百分...",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),

  // 要素：治療
  sk({
    id: "mag-element-heal",
    classId: "magician",
    nameJa: "要素：治療",
    nameCht: "要素：治療",
    trigger: "special",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害1~［你的魔術師等級］",
    effectDescription: "增加目標的HP《2D6》+ [本次支付代價*3]點。",
    tpReward: 0,
    endlessDestructionEligible: true,
    compositionOnly: true,
  }),
]);
