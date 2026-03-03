"""Parse senya_tsukihime PHP/HTML class files to extract skill data.

Uses custom tag structure: <skillbox> with div.skillTitle, div.skillTh/skillTd pairs.
"""

import os
import re
import json

_TMP = os.environ.get("TEMP", os.environ.get("TMP", "/tmp"))
_BASE = os.path.join(_TMP, "senya_tsukihime")

CLASS_FILES = {
    "magician": "majutushi.php",
    "executor": "daikousya.php",
    "swordsman": "kenshi.php",
    "fighter": "butouka.php",
    "hunter": "karyu.php",
    "esper": "tyouno.php",
}


def clean_text(html_fragment: str) -> str:
    """Remove HTML tags and normalize whitespace."""
    text = re.sub(r"<br\s*/?>", " ", html_fragment, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_between_anchors(html: str, start_id: str, end_ids: list[str]) -> str:
    """Extract HTML between anchor start_id and the first matching end_id."""
    start_match = re.search(rf'<a id="{start_id}">', html)
    if not start_match:
        return ""
    start = start_match.start()

    end = len(html)
    for eid in end_ids:
        m = re.search(rf'<a id="{eid}">', html[start_match.end():])
        if m:
            end = min(end, start_match.end() + m.start())

    return html[start:end]


def parse_skillboxes(section_html: str) -> list[dict]:
    """Parse <skillbox> elements into structured skill data."""
    skills = []

    # Split by skillbox tags
    boxes = re.split(r"<skillbox>", section_html)

    for box in boxes[1:]:  # skip everything before first skillbox
        # End at </skillbox>
        end = box.find("</skillbox>")
        if end > 0:
            box = box[:end]

        skill = {}

        # Extract skill name from h3.skillTitle
        name_match = re.search(r'<h3[^>]*class="skillTitle"[^>]*>(.*?)</h3>', box, re.DOTALL)
        if name_match:
            skill["name"] = clean_text(name_match.group(1))
        else:
            continue

        # Is it a dividepoint (mandatory) skill?
        skill["isDividepoint"] = "skillWrap_dividepoint" in box

        # Extract key-value pairs from skillTh/skillTd divs
        # Pattern: <div class="skillTh...">KEY</div> ... <div class="skillTd...">VALUE</div>
        th_pattern = r'<div\s+class="skillTh[^"]*"[^>]*>(.*?)</div>'
        td_pattern = r'<div\s+class="skillTd[^"]*"[^>]*>(.*?)</div>'

        ths = [clean_text(m.group(1)) for m in re.finditer(th_pattern, box, re.DOTALL)]
        tds = [clean_text(m.group(1)) for m in re.finditer(td_pattern, box, re.DOTALL)]

        # Also get skillTh2/skillTd3 pairs
        th2_pattern = r'<div\s+class="skillTh2[^"]*"[^>]*>(.*?)</div>'
        td3_pattern = r'<div\s+class="skillTd3[^"]*"[^>]*>(.*?)</div>'

        th2s = [clean_text(m.group(1)) for m in re.finditer(th2_pattern, box, re.DOTALL)]
        td3s = [clean_text(m.group(1)) for m in re.finditer(td3_pattern, box, re.DOTALL)]

        all_keys = ths + th2s
        all_vals = tds + td3s

        for k, v in zip(all_keys, all_vals):
            if k == "分類":
                skill["trigger"] = v
            elif k == "代價":
                skill["cost"] = v
            elif k == "TP獎勵":
                skill["tpReward"] = v
            elif k == "取得限制":
                skill["restriction"] = v
            elif k == "判定值":
                skill["checkValue"] = v
            elif k == "射程":
                skill["range"] = v
            elif k == "攻擊屬性":
                skill["attackType"] = v
            elif k == "會心加成":
                skill["critBonus"] = v
            elif k == "大失敗值":
                skill["fumbleValue"] = v
            else:
                skill[k] = v

        # Extract effect description
        effect_match = re.search(r'<p\s+class="skillFunction"[^>]*>(.*?)</p>', box, re.DOTALL)
        if effect_match:
            effect_text = clean_text(effect_match.group(1))
            # Remove leading "效果：" prefix
            effect_text = re.sub(r"^效果[：:]?\s*", "", effect_text)
            skill["effect"] = effect_text

        # Extract extra prerequisite (for 額外特技)
        prereq_match = re.search(r'<p\s+class="skillEXfunction"[^>]*>(.*?)</p>', box, re.DOTALL)
        if prereq_match:
            skill["extraPrereq"] = clean_text(prereq_match.group(1))

        skills.append(skill)

    return skills


def process_class(class_id: str, fname: str) -> dict:
    """Process a single class file."""
    fpath = os.path.join(_BASE, fname)
    html = open(fpath, "r", encoding="utf-8").read()

    # Extract acquisition rules
    all_end_ids = [f"description_rank{i}" for i in range(1, 10)] + \
                  [f"description_skill{i}" for i in range(1, 10)]
    rules_html = extract_between_anchors(html, "description_rank3", ["description_rank4"])
    rules_text = clean_text(rules_html)

    # Find all skill section anchors
    skill_section_ids = re.findall(r'<a id="(description_skill\d+)"></a>([^<]+)', html)

    sections = []
    for i, (sid, sname) in enumerate(skill_section_ids):
        sname = sname.strip()
        # End IDs: next skill section, or end of document
        next_ids = [s[0] for s in skill_section_ids[i+1:]]
        section_html = extract_between_anchors(html, sid, next_ids if next_ids else ["NEVER_MATCH"])

        skills = parse_skillboxes(section_html)
        is_extra = "額外" in sname

        sections.append({
            "sectionId": sid,
            "sectionName": sname,
            "isExtra": is_extra,
            "skillCount": len(skills),
            "skills": skills,
        })

    return {
        "classId": class_id,
        "acquisitionRules": rules_text,
        "sections": sections,
    }


def main():
    all_data = {}

    for class_id, fname in CLASS_FILES.items():
        data = process_class(class_id, fname)
        all_data[class_id] = data

    # Save full JSON
    output_path = os.path.join("L:/fate_online/scripts", "parsed_skills.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    # Also save a human-readable summary
    summary = []
    for class_id, data in all_data.items():
        summary.append(f"\n{'='*60}")
        summary.append(f"{class_id}")
        summary.append(f"{'='*60}")
        summary.append(f"Rules: {data['acquisitionRules']}")

        for sec in data["sections"]:
            summary.append(f"\n--- {sec['sectionName']} ({sec['skillCount']} skills) ---")
            for s in sec["skills"]:
                line = f"  [{s.get('trigger', '?')}] {s['name']}"
                if s.get("cost") and s["cost"] != "-":
                    line += f" (cost: {s['cost']})"
                if s.get("restriction") and s["restriction"] != "無":
                    line += f" [限制: {s['restriction']}]"
                if s.get("isDividepoint"):
                    line += " ★必取"
                summary.append(line)

    summary_path = os.path.join("L:/fate_online/scripts", "skills_summary.txt")
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write("\n".join(summary))

    print(f"JSON saved to {output_path}")
    print(f"Summary saved to {summary_path}")

    # Print stats
    for class_id, data in all_data.items():
        total = sum(s["skillCount"] for s in data["sections"])
        normals = sum(s["skillCount"] for s in data["sections"] if not s["isExtra"])
        extras = sum(s["skillCount"] for s in data["sections"] if s["isExtra"])
        print(f"  {class_id}: {total} total ({normals} normal + {extras} extra)")


if __name__ == "__main__":
    main()
