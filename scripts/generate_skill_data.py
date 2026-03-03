"""Generate TypeScript skill definition files from parsed_skills.json."""

import json
import re
import os

# Class ID prefix mapping
CLASS_PREFIXES = {
    "magician": "mag",
    "executor": "exe",
    "swordsman": "swd",
    "fighter": "ftr",
    "hunter": "hnt",
    "esper": "esp",
}

# Trigger mapping from Chinese to TypeScript
TRIGGER_MAP = {
    "常時": "constant",
    "通用": "general",
    "通常": "general",
    "準備階段": "preparation",
    "中斷": "interrupt",
    "防禦": "defense",
    "特殊": "special",
}

# Attack domain mapping
DOMAIN_MAP = {
    "近戰": "melee",
    "射擊": "ranged",
    "精神": "spirit",
    "共通": "common",
    "共用": "common",
}


def to_kebab(name: str) -> str:
    """Convert Chinese skill name to a kebab-case ID."""
    # Manual mapping for well-known skills
    MANUAL_IDS = {
        "魔術迴路": "magic-circuit",
        "思考的並列演算": "parallel-computation",
        "強化": "reinforcement",
        "防禦結界": "defense-barrier",
        "魔術刻印": "magic-crest",
        "使魔": "familiar",
        "禮裝所持": "mystic-code",
        "暗示": "suggestion",
        "防禦魔術": "defense-magic",
        "魔術構成": "magic-composition",
        "道具作成": "item-creation",
        "魔眼保持": "mystic-eyes",
        "反咒": "counter-spell",
        "解咒": "dispel",
        "陣地作成": "territory-creation",
        "多重屬性": "multi-element",
        "召喚專精": "summon-mastery",
        "治癒魔術": "healing-magic",
        "完全解析": "full-analysis",
        "高效率迴路運轉": "efficient-circuit",
        "高速詠唱": "high-speed-chant",
        "肉體改造": "body-modification",
        "屬性強化": "element-enhancement",
        # 要素構成
        "要素：傷害": "element-damage",
        "要素：準備": "element-prep",
        "要素：攻擊類型": "element-attack-type",
        "要素：進攻": "element-offense",
        "要素：詠唱": "element-chant",
        "要素：連續發動": "element-chain",
        "要素：區域": "element-area",
        "要素：防禦": "element-defense",
        "要素：增益": "element-buff",
        "要素：持續效果": "element-duration",
        "要素：複數目標": "element-multi-target",
        "要素：減益": "element-debuff",
        "要素：異常狀態": "element-status",
        "要素：治療": "element-heal",
        # 代行者
        "黑鍵持有": "black-key",
        "異端審判人": "heresy-judge",
        "秘跡封印": "sacrament-seal",
        "聖痕持有": "stigmata",
        "異端消抹偏執：竭誠信仰": "heresy-zealot-faith",
        "異端消抹偏執：不信者": "heresy-zealot-infidel",
        "所持：秘跡": "possession-sacrament",
        "影縫": "shadow-stitch",
        "強化式典": "enhanced-rite",
        "多重投擲": "multi-throw",
        "固定式典": "anchor-rite",
        "黑鍵製作": "black-key-craft",
        "火葬式典": "cremation-rite",
        "土葬式典": "burial-rite",
        "風葬式典": "wind-burial-rite",
        "水葬式典": "water-burial-rite",
        "鳥葬式典": "sky-burial-rite",
        "神威之鎖": "divine-chain",
        "洗禮詠唱": "baptism-chant",
        "真實確在的恩膏": "true-anointing",
        "式典魔術": "ritual-magic",
        "強制洗禮": "forced-baptism",
        "埋葬機關候補": "burial-agency-candidate",
        "所持：聖典": "possession-scripture",
        "鐵甲作用": "iron-plate",
        "聖典制御刻印": "scripture-control-crest",
        "戰鬥反應": "combat-reaction",
        "黑鍵抵禦": "black-key-parry",
        "第八秘跡會所屬": "eighth-sacrament-member",
        "釘刑": "crucifixion",
        "快速執行": "quick-execution",
        "黑鍵製作‧進階": "black-key-craft-advanced",
        "不存在的恩典": "nonexistent-grace",
        "不潔之物": "impure-thing",
        "秘跡執行‧上下同位": "sacrament-execution-homoousios",
        "秘跡破壞": "sacrament-destroy",
        "異物認定": "foreign-body-recognition",
        # 劍士
        "段位": "rank",
        "流派": "school",
        "二天一流": "school-nitenichi",
        "一刀流": "school-ittou",
        "夢想流": "school-musou",
        "圓極": "enkyoku",
        "左右反打": "sayuu-handa",
        "陰陽雙舞": "inyou-soumu",
        "紅葉疊舞": "momiji-kasanemai",
        "組太刀": "kumitachi",
        "二刀八相": "nitou-hassou",
        "轉變落打": "tenpen-rakuda",
        "觀見": "kanmi",
        "本覺": "hongaku",
        "八相陰劍": "hassou-inken",
        "圓流": "enryuu",
        "飛鳥": "hichou",
        "霞青眼": "kasumi-seigan",
        "真劍": "shinken",
        "松風": "matsukaze",
        "葉切": "hakiri",
        "納刀": "noutou",
        "夢想流居合一本目": "musou-iai-1",
        "夢想流居合二本目": "musou-iai-2",
        "夢想流居合三本目": "musou-iai-3",
        "夢想流居合四本目": "musou-iai-4",
        "夢想流居合五本目": "musou-iai-5",
        "夢想流居合六本目": "musou-iai-6",
        "夢想流居合七本目": "musou-iai-7",
        "五輪太刀": "gorin-tachi",
        "奧義‧一吋劍理": "ougi-issun-kenri",
        "金翅烏王劍": "kinjichou-ouken",
        "奧義‧夢想劍": "ougi-musou-ken",
        "夢想流居合八本目": "musou-iai-8",
        "奧義‧無拍拔刀": "ougi-muhyou-battou",
        # 武鬥家
        "武道": "martial-way",
        "蛇咬": "snake-bite",
        "滲透勁": "penetrating-force",
        "武心": "martial-heart",
        "貼打": "close-strike",
        "發勁": "release-force",
        "破打": "shatter-strike",
        "不屈": "unyielding",
        "硬氣功": "hard-qigong",
        "超反應": "hyper-reaction",
        "精神統一": "mental-focus",
        "震腳": "stomp",
        "真氣統合": "true-qi-unify",
        "先手必勝": "preemptive-strike",
        "連環掌": "chain-palm",
        "合氣投": "aikido-throw",
        "散打": "sanda",
        "一擊脫離": "hit-and-run",
        "武神的呼吸": "war-god-breath",
        "真氣爆發‧虎襲": "qi-burst-tiger",
        "真氣制御‧天人合一": "qi-control-unity",
        "真氣爆發‧狼影": "qi-burst-wolf",
        "真氣制御‧浮生": "qi-control-float",
        "超凡": "transcendence",
        "自然之體": "natural-body",
        "氣入": "qi-charge",
        "縫之牢": "stitch-prison",
        "伏龍滅": "crouching-dragon",
        "三絕掌": "triple-palm",
        "悟天霞": "enlightened-mist",
        "八極拳": "bajiquan",
        "七脈淨氣": "seven-meridians",
        "武練": "martial-training",
        # 狩人
        "弓": "bow",
        "弩弓": "crossbow",
        "意外之擊": "surprise-shot",
        "戰場掌握": "battlefield-control",
        "R．弓弦改造": "r-string-mod",
        "Ｒ．弓體改造": "r-body-mod",
        "射擊技巧．牽制": "shot-technique-suppression",
        "射擊技巧．強力": "shot-technique-power",
        "射擊技巧．先制": "shot-technique-initiative",
        "射擊技巧．迅速": "shot-technique-rapid",
        "射擊技巧．曲射": "shot-technique-arc",
        "槍手本能": "gunner-instinct",
        "槍": "gun",
        "彈幕支援": "barrage-support",
        "戰場威脅": "battlefield-threat",
        "沉默的狙擊手": "silent-sniper",
        "射擊穩定器": "aim-stabilizer",
        "致殘射擊": "crippling-shot",
        "快速裝填": "quick-reload",
        "C．快速武裝配件": "c-quick-weapon-mod",
        "C．輕武裝配件": "c-light-weapon-mod",
        "C．重武裝配件": "c-heavy-weapon-mod",
        "矢林彈雨": "arrow-storm",
        "槍劍之舞": "gun-sword-dance",
        "百步穿楊": "hundred-pace-shot",
        "致死射擊": "lethal-shot",
        "技近乎道": "skill-near-dao",
        "長距離射擊": "long-range-shot",
        # 超能力者
        "一代變異": "first-generation",
        "血脈": "bloodline",
        "過去視": "retrocognition",
        "未來視──預測": "precognition-prediction",
        "未來視──測定": "precognition-measurement",
        "現在視": "clairvoyance",
        "感應": "telepathy",
        "透視": "see-through",
        "念寫": "psychography",
        "念附": "psychic-attach",
        "能力封印": "ability-seal",
        "概念破壞": "concept-destruction",
        "念動": "telekinesis",
        "體術": "martial-arts",
        "淨眼": "pure-eyes",
        "退魔衝動": "exorcism-impulse",
        "擬似元素": "pseudo-element",
        "咒視": "curse-sight",
        "阿賴耶識的抑止力": "alaya-counter-force",
        "極限": "limit-break",
        "生命的光輝": "life-radiance",
        "幻想之瞳（偽）": "mystic-eyes-fake",
        "未來視──神知": "precognition-divine",
        "現象干涉": "phenomenon-interference",
        "心靈鎖鏈": "psychic-chain",
        "魔之混血": "demon-blood",
        "第十二頻道": "twelfth-channel",
        "雙重存在": "dual-existence",
        "偽‧生之魔眼": "pseudo-mystic-eyes-life",
    }
    return MANUAL_IDS.get(name, name)


def parse_trigger(raw: str) -> tuple[str, str | None]:
    """Parse trigger string, returning (trigger, attackDomain)."""
    raw = raw.strip()

    # Handle compound triggers like "攻擊類型／近戰"
    if "攻擊" in raw or "攻撃" in raw:
        # Extract domain
        for zh, en in DOMAIN_MAP.items():
            if zh in raw:
                return "attack", en
        return "attack", None

    if "進攻" in raw:
        for zh, en in DOMAIN_MAP.items():
            if zh in raw:
                return "offense", en
        return "offense", None

    # Handle multiple triggers like "常時／通用"
    parts = re.split(r"[／/]", raw)
    first = parts[0].strip()

    for zh, en in TRIGGER_MAP.items():
        if zh in first:
            return en, None

    # Try second part
    if len(parts) > 1:
        second = parts[1].strip()
        for zh, en in TRIGGER_MAP.items():
            if zh in second:
                return en, None

    # Default
    return "general", None


def make_skill_id(prefix: str, name: str) -> str:
    """Create a skill ID from class prefix and skill name."""
    kebab = to_kebab(name)
    return f"{prefix}-{kebab}"


def generate_skill_ts(class_id: str, prefix: str, skills: list[dict], is_extra: bool, section_name: str) -> list[str]:
    """Generate TypeScript skill definition lines."""
    lines = []

    for s in skills:
        name = s.get("name", "")
        if not name:
            continue

        skill_id = make_skill_id(prefix, name)
        trigger_raw = s.get("trigger", "常時")
        trigger, domain = parse_trigger(trigger_raw)
        cost = s.get("cost", "-")
        if cost == "-":
            cost = ""
        effect = s.get("effect", "")
        tp_str = s.get("tpReward", "0")
        restriction = s.get("restriction", "無")

        # Parse TP reward
        try:
            tp = int(tp_str)
        except (ValueError, TypeError):
            tp = 0

        lines.append(f"  // {name}")
        lines.append(f"  sk({{")
        lines.append(f'    id: "{skill_id}",')
        lines.append(f'    classId: "{class_id}",')
        lines.append(f'    nameJa: "{name}",')
        lines.append(f'    nameCht: "{name}",')
        lines.append(f'    trigger: "{trigger}",')
        if domain:
            lines.append(f'    attackDomain: "{domain}",')

        # Prerequisites
        prereqs = []
        if restriction and restriction != "無" and restriction != "-":
            prereqs.append(f'    // 取得限制: {restriction}')
        lines.append(f"    prerequisites: Object.freeze([]),")

        lines.append(f'    isExtra: {str(is_extra).lower()},')
        lines.append(f'    costDescription: "{cost}",')

        # Truncate very long effects
        effect_escaped = effect.replace('"', '\\"').replace("\n", " ")
        if len(effect_escaped) > 200:
            effect_escaped = effect_escaped[:197] + "..."
        lines.append(f'    effectDescription: "{effect_escaped}",')
        lines.append(f"    tpReward: {tp},")
        lines.append(f"    endlessDestructionEligible: true,")
        lines.append(f"  }}),")
        lines.append("")

    return lines


def main():
    data_path = os.path.join("L:/fate_online/scripts", "parsed_skills.json")
    with open(data_path, "r", encoding="utf-8") as f:
        all_data = json.load(f)

    for class_id, data in all_data.items():
        prefix = CLASS_PREFIXES[class_id]

        lines = []
        lines.append(f'// === {class_id} 特技定義（千夜月姫 TRPG）===')
        lines.append(f'// 資料來源: senya_tsukihime PHP data files')
        lines.append(f'//')
        lines.append(f'// 取得規則: {data["acquisitionRules"]}')
        lines.append(f'')
        lines.append(f'import type {{ SkillDef }} from "./types.js";')
        lines.append(f'')
        lines.append(f'const sk = (def: SkillDef): SkillDef => Object.freeze(def);')
        lines.append(f'')
        lines.append(f'export const {class_id.upper()}_SKILLS: readonly SkillDef[] = Object.freeze([')

        for sec in data["sections"]:
            section_name = sec["sectionName"]
            is_extra = sec["isExtra"]
            skills = sec["skills"]

            if skills:
                lines.append(f"  // --- {section_name} ---")
                lines.append("")
                skill_lines = generate_skill_ts(class_id, prefix, skills, is_extra, section_name)
                lines.extend(skill_lines)

        lines.append(f"]);")
        lines.append("")

        output_path = f"L:/fate_online/server/game/character/skills/{class_id}Skills.ts"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        skill_count = sum(s["skillCount"] for s in data["sections"])
        print(f"  {class_id}: {skill_count} skills -> {output_path}")


if __name__ == "__main__":
    main()
