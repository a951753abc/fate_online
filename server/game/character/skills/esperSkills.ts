// === esper 特技定義（千夜月姫 TRPG）===
// 資料來源: senya_tsukihime PHP data files
//
// 取得規則: 取得特技 ▲ 初期取得： 從「一代變異」「血脈」中選一，而後再選擇一個自己喜歡的特技。 升級： 等級上升之時、選取一個喜歡的特技。每逢5等、10等時，可以額外再取得一個特技。

import type { SkillDef } from "./types.js";

const sk = (def: SkillDef): SkillDef => Object.freeze(def);

export const ESPER_SKILLS: readonly SkillDef[] = Object.freeze([
  // --- 一般特技 ---

  // 一代變異
  sk({
    id: "esp-first-generation",
    classId: "esper",
    nameJa: "一代變異",
    nameCht: "一代變異",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你天生就開啟著與眾不同的「頻道」。 所有判定常時+《1》。若你只擁有超能力者級別，《》的值更改為1D6。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 血脈
  sk({
    id: "esp-bloodline",
    classId: "esper",
    nameJa: "血脈",
    nameCht: "血脈",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你繼承著好幾代累積而來的「異能」。 你的近戰、射擊、行動、生命力、集中力修正值增加﹝【精神】/3﹞(去小數點)。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 過去視
  sk({
    id: "esp-retrocognition",
    classId: "esper",
    nameJa: "過去視",
    nameCht: "過去視",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你可窺視他人的記憶，化為自己的虛擬體驗。需要判定的場合使用精神。 這個技能一天可以使用【你的超能力等級】次數。 將這個技能以無盡破壞使用的話，可以在你的﹝【超能力等級】/3﹞回合內，拷貝使用對象所有非常時技能。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 未來視──預測
  sk({
    id: "esp-precognition-prediction",
    classId: "esper",
    nameJa: "未來視──預測",
    nameCht: "未來視──預測",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的理智判定常時+2。戰鬥中從第二回合開始，每回合你的命中與迴避判定達成值+1。 將這個技能以無盡破壞使用的話，在你的﹝【超能力者等級】/3﹞回合內，命中與迴避判定達成值額外增加【超能力者等級】。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 未來視──測定
  sk({
    id: "esp-precognition-measurement",
    classId: "esper",
    nameJa: "未來視──測定",
    nameCht: "未來視──測定",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的意志判定常時+2。你可以在任何判定的時候使用這個技能產生會心，這個會心一劇本只能使用一次。將這個技能以無盡破壞使用的話，可以再次會心，這個無盡破壞產生的會心沒有劇本使用限制。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 現在視
  sk({
    id: "esp-clairvoyance",
    classId: "esper",
    nameJa: "現在視",
    nameCht: "現在視",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你偶爾可以同時使用兩種以上的感覺來認識事物。能分辨文字裡包含的顏色、能聽見聲音的形狀、能感受語言的美味和苦味。此狀態面對問題時，不需特別思考也能直覺似地通曉答案。你的1、1視同6、6，將這技能以無盡破壞使用的話，可以在你的﹝【超能力等級】/3﹞回合內，你在4以下以及10以上的骰數都視為會心。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 感應
  sk({
    id: "esp-telepathy",
    classId: "esper",
    nameJa: "感應",
    nameCht: "感應",
    trigger: "general",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你每扣掉Ｎ點體力或是TP，就可以將同等戰鬥數值數值強化到他人身上。此數值不得超過你的【超能力者】級別。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 透視
  sk({
    id: "esp-see-through",
    classId: "esper",
    nameJa: "透視",
    nameCht: "透視",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的知覺判定常時+2。 即使人不在現場，你可以在一瞬間看見某個你去過地點的景象。 這個技能一天可以使用【超能力者等級】次。 將這個技能以無盡破壞使用的話，可以對你使用透視看到的目標進行一次攻擊。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 念寫
  sk({
    id: "esp-psychography",
    classId: "esper",
    nameJa: "念寫",
    nameCht: "念寫",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "將心中所想的事物顯現在紙張或其他媒介上的能力。 進行交流獲取情報的判定常時+2。 你可以把心中的想法化為不超過20字的文字傳送給肉眼所見的某人，需要判定的場合使用精神。 這個技能一天可以使用【超能力者等級】次。 將這個技能以無盡破壞使用的話，使一名對象命中和迴避下降【超能力者等級】直到戰鬥結束。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 念附
  sk({
    id: "esp-psychic-attach",
    classId: "esper",
    nameJa: "念附",
    nameCht: "念附",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害10點",
    effectDescription: "一戰鬥一次。在一回合內可以使用精神代替行動、近戰、射擊判定。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 能力封印
  sk({
    id: "esp-ability-seal",
    classId: "esper",
    nameJa: "能力封印",
    nameCht: "能力封印",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "選取一個你擁有的特技，將其內文數值+3，一個劇本只能使用三次。特技有疑慮問題由GM判定。 「嗚啊啊──我的右手......！！」",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 概念破壞
  sk({
    id: "esp-concept-destruction",
    classId: "esper",
    nameJa: "概念破壞",
    nameCht: "概念破壞",
    trigger: "attack",
    attackDomain: "spirit",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription: "指定全區域一對象造成《3D6》傷害。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 念動
  sk({
    id: "esp-telekinesis",
    classId: "esper",
    nameJa: "念動",
    nameCht: "念動",
    trigger: "offense",
    attackDomain: "common",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "與攻擊目標進行精神對抗，若成功，本次攻擊傷害追加對抗的差值；若失敗，本次攻擊命中失敗。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 體術
  sk({
    id: "esp-martial-arts",
    classId: "esper",
    nameJa: "體術",
    nameCht: "體術",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "",
    effectDescription:
      "你的空手傷害常時增加《超能力者等級》。 你的近戰和射擊常時+1，生命力和集中力常時+10。 當你進行高難度動作(例如爬樹、衝刺......)需要體力判定時，在GM認可的情況下可以視為直接成功。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 淨眼
  sk({
    id: "esp-pure-eyes",
    classId: "esper",
    nameJa: "淨眼",
    nameCht: "淨眼",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: false,
    costDescription: "代價傷害5點",
    effectDescription:
      "當你遇到其他角色時，你能得知該角色擁有的級別。 戰鬥中使用時，隨機得知對象的一項戰鬥數值。 需要判定的場合使用精神。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // --- 額外特技 ---

  // 退魔衝動
  sk({
    id: "esp-exorcism-impulse",
    classId: "esper",
    nameJa: "退魔衝動",
    nameCht: "退魔衝動",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你的近戰、射擊、行動、生命力、集中力級別修正值成為﹝【精神】/2﹞(去小數點)。 你面對混有【狩獵者】級別的PC、NPC戰鬥時，全判定+5。你能察覺有【狩獵者】級別者，初次接觸時立即進行【難易度10+對方狩獵者等級】的精神判定骰 ，失敗或放棄的話你會失去理智，不顧一切殺死對方。此效果維持到你行動不能或是對方死亡。 二次見面以後不需判定。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 擬似元素
  sk({
    id: "esp-pseudo-element",
    classId: "esper",
    nameJa: "擬似元素",
    nameCht: "擬似元素",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "取得此技能時，你獲得四點屬性點數。並可以隨意分配在任意屬性上。此屬性無法與【魔術師】級別獲得的屬性加算。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 咒視
  sk({
    id: "esp-curse-sight",
    classId: "esper",
    nameJa: "咒視",
    nameCht: "咒視",
    trigger: "attack",
    attackDomain: "spirit",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害10點",
    effectDescription: "造成《1D6》傷害，實傷階段賦予一名目標一種隨機不良狀態。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 阿賴耶識的抑止力
  sk({
    id: "esp-alaya-counter-force",
    classId: "esper",
    nameJa: "阿賴耶識的抑止力",
    nameCht: "阿賴耶識的抑止力",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "一劇本10人以上角色死亡時發動。 你到劇本結束為止，每到場景終了（戰鬥中是到回合終了為止）增加100點TP。 你的全判定+1D6(這個數值不能超過你的超能力者等級)，無盡破壞使用次數+1，已使用次數重置。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 極限
  sk({
    id: "esp-limit-break",
    classId: "esper",
    nameJa: "極限",
    nameCht: "極限",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "一劇本一次，你進入行動不能時自動發動，你回覆［正面感情TP總和］HP，並且此效果在你的﹝超能力等級/3﹞回合內不限次數發動。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 生命的光輝
  sk({
    id: "esp-life-radiance",
    classId: "esper",
    nameJa: "生命的光輝",
    nameCht: "生命的光輝",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你可以在任何時間點，使自己的HP上限剩下1。在場景結束前可以取得其他級別的任兩個特技(如果有取得條件，則必須滿足)並使用。場景結束前，你的判定增加你的【超能力者等級】。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 幻想之瞳（偽）
  sk({
    id: "esp-mystic-eyes-fake",
    classId: "esper",
    nameJa: "幻想之瞳（偽）",
    nameCht: "幻想之瞳（偽）",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "最大生命力／2",
    effectDescription: "你可以取得其他級別任何非額外技能的特技2個。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 未來視──神知
  sk({
    id: "esp-precognition-divine",
    classId: "esper",
    nameJa: "未來視──神知",
    nameCht: "未來視──神知",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "每當你的任何判定失敗時，達成值追加1D6。一個判定只能使用一次。 這個技能一天可以使用【你的超能力等級】次數。 將這個技能以無盡破壞使用的話，戰鬥中指定一個目標，在［【超能力者等級】/3］回合內你對他的所有對抗判定會心-3。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 現象干涉
  sk({
    id: "esp-phenomenon-interference",
    classId: "esper",
    nameJa: "現象干涉",
    nameCht: "現象干涉",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "傷害代價10點",
    effectDescription: "一劇本可以使用【超能力者等級-2】次。從以下效果擇一發動：",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 心靈鎖鏈
  sk({
    id: "esp-psychic-chain",
    classId: "esper",
    nameJa: "心靈鎖鏈",
    nameCht: "心靈鎖鏈",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害20",
    effectDescription:
      "指定兩名對象(不可為自己)，若其中一人受到實際傷害，另一人也會受到同等數值的實際傷害。 效果發揮或回合結束後解除。 「沒想到你可以到這裡來，不過就到此為止了，接下來就由我鎖鏈的......」",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 魔之混血
  sk({
    id: "esp-demon-blood",
    classId: "esper",
    nameJa: "魔之混血",
    nameCht: "魔之混血",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "你獲得特技【人外血脈：鬼種】，技能敘述裡的「鬼種技能」更改為「超能力者技能」，【狩獵者】更改為【超能力者】。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 第十二頻道
  sk({
    id: "esp-twelfth-channel",
    classId: "esper",
    nameJa: "第十二頻道",
    nameCht: "第十二頻道",
    trigger: "interrupt",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害50點",
    effectDescription:
      "一劇本一次，在本場景/戰鬥結束前，你可以使三次判定產生會心。場景/戰鬥結束後你的TP歸零並進入行動不能狀態。 將這個技能以無盡破壞使用的話，可以重置會心的使用次數。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 雙重存在
  sk({
    id: "esp-dual-existence",
    classId: "esper",
    nameJa: "雙重存在",
    nameCht: "雙重存在",
    trigger: "constant",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "",
    effectDescription:
      "創造一個等級相當於【超能力者等級-2】、但是不能擁有【超能力者】級別的角色，此角色是你的另一人格，且兩個人格的記憶互通，可以隨時隨地切換。戰鬥中則只能在結束階段切換。 該角色的等級隨著你的【超能力者等級】提升。不管是原本角色還是創造出來的角色，只要其中一個人格死亡，另一人格也會跟著死亡。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),

  // 偽‧生之魔眼
  sk({
    id: "esp-pseudo-mystic-eyes-life",
    classId: "esper",
    nameJa: "偽‧生之魔眼",
    nameCht: "偽‧生之魔眼",
    trigger: "preparation",
    prerequisites: Object.freeze([]),
    isExtra: true,
    costDescription: "代價傷害15",
    effectDescription:
      "一劇本【超能力者等級-5】次。你能短暫地看到生物的生之線。戰鬥中使用時，在戰鬥結束前，你的攻擊傷害增加對象最大生命值的五分之一。",
    tpReward: 0,
    endlessDestructionEligible: true,
  }),
]);
