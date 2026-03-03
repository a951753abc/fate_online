import { useMemo } from "react";
import type { SkillView, ClassAcquisitionView, InitialStepView } from "../../types/protocol.js";
import { computeExpectedSkillCount } from "../../utils/skillUtils.js";

// --- 觸發類型中文標籤 ---

const TRIGGER_LABELS: Readonly<Record<string, string>> = {
  constant: "常時",
  general: "通用",
  attack: "攻擊",
  offense: "進攻",
  defense: "防禦",
  preparation: "準備",
  interrupt: "中斷",
  special: "特殊",
};

// --- Props ---

interface SkillSelectionPanelProps {
  readonly classId: string;
  readonly classDisplayName: string;
  readonly classLevel: number;
  readonly skills: readonly SkillView[];
  readonly acquisition: ClassAcquisitionView;
  readonly selectedSkillIds: readonly string[];
  readonly onSelectionChange: (classId: string, skillIds: readonly string[]) => void;
}

// --- Component ---

export function SkillSelectionPanel({
  classId,
  classDisplayName,
  classLevel,
  skills,
  acquisition,
  selectedSkillIds,
  onSelectionChange,
}: SkillSelectionPanelProps) {
  const expectedTotal = useMemo(
    () => computeExpectedSkillCount(acquisition, classLevel),
    [acquisition, classLevel],
  );

  const selectedSet = useMemo(() => new Set(selectedSkillIds), [selectedSkillIds]);

  const skillMap = useMemo(() => {
    const map = new Map<string, SkillView>();
    for (const s of skills) map.set(s.id, s);
    return map;
  }, [skills]);

  // Single pass: separate normal and extra skills
  const { normalSkills, extraSkills } = useMemo(() => {
    const normal: SkillView[] = [];
    const extra: SkillView[] = [];
    for (const s of skills) (s.isExtra ? extra : normal).push(s);
    return { normalSkills: normal, extraSkills: extra };
  }, [skills]);

  // Precompute ALL initial step skill IDs (required + choose_one pools) for O(1) lookup
  const allInitialStepSkillIds = useMemo(() => {
    const ids = new Set<string>();
    for (const step of acquisition.initialSteps) {
      if (step.type === "required" || step.type === "choose_one") {
        for (const sid of step.skillIds ?? []) ids.add(sid);
      }
    }
    return ids;
  }, [acquisition.initialSteps]);

  // Count how many selected skills belong to initial steps
  const { freeSlots, remainingFree } = useMemo(() => {
    let initialPickedCount = 0;
    for (const id of selectedSkillIds) {
      if (allInitialStepSkillIds.has(id)) initialPickedCount++;
    }

    // Initial slots = skills consumed by required + choose_one + free steps
    let initialSlotCount = 0;
    for (const step of acquisition.initialSteps) {
      switch (step.type) {
        case "required":
          initialSlotCount += step.skillIds?.length ?? 0;
          break;
        case "choose_one":
          initialSlotCount += 1;
          break;
        case "free":
          initialSlotCount += step.count ?? 0;
          break;
      }
    }
    const free = expectedTotal - initialSlotCount;
    const freePickedCount = selectedSkillIds.length - initialPickedCount;
    return { freeSlots: free, remainingFree: Math.max(0, free - freePickedCount) };
  }, [selectedSkillIds, allInitialStepSkillIds, acquisition.initialSteps, expectedTotal]);

  const isComplete = selectedSkillIds.length === expectedTotal;

  const toggleSkill = (skillId: string) => {
    if (selectedSet.has(skillId)) {
      onSelectionChange(
        classId,
        selectedSkillIds.filter((id) => id !== skillId),
      );
    } else if (selectedSkillIds.length < expectedTotal) {
      onSelectionChange(classId, [...selectedSkillIds, skillId]);
    }
  };

  const handleChooseOne = (step: InitialStepView, skillId: string) => {
    const stepOptions = new Set(step.skillIds ?? []);
    // Remove any currently selected option from this step, then add the new one
    const without = selectedSkillIds.filter((id) => !stepOptions.has(id));
    onSelectionChange(classId, [...without, skillId]);
  };

  return (
    <div className="mc-skill-panel">
      <div className="mc-skill-panel-header">
        <h4 className="mc-skill-panel-title">
          {classDisplayName} LV{classLevel}
        </h4>
        <span className={`mc-skill-counter ${isComplete ? "complete" : ""}`}>
          {selectedSkillIds.length} / {expectedTotal}
        </span>
      </div>

      {/* Initial Steps */}
      {acquisition.initialSteps.map((step, stepIdx) => (
        <div key={stepIdx} className="mc-skill-step">
          <div className="mc-skill-step-label">{step.label ?? `步驟 ${stepIdx + 1}`}</div>

          {step.type === "required" && (
            <div className="mc-skill-step-grid">
              {(step.skillIds ?? []).map((sid) => {
                const skill = skillMap.get(sid);
                if (!skill) return null;
                const isSelected = selectedSet.has(sid);
                return (
                  <button
                    key={sid}
                    className={`mc-skill-card required ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSkill(sid)}
                    type="button"
                  >
                    <SkillCardContent skill={skill} />
                  </button>
                );
              })}
            </div>
          )}

          {step.type === "choose_one" && (
            <div className="mc-skill-step-grid">
              {(step.skillIds ?? []).map((sid) => {
                const skill = skillMap.get(sid);
                if (!skill) return null;
                const isSelected = selectedSet.has(sid);
                return (
                  <button
                    key={sid}
                    className={`mc-skill-card choice ${isSelected ? "selected" : ""}`}
                    onClick={() => handleChooseOne(step, sid)}
                    type="button"
                  >
                    <SkillCardContent skill={skill} />
                  </button>
                );
              })}
            </div>
          )}

          {step.type === "free" && (
            <div className="mc-skill-step-info">自選 {step.count ?? 0} 個（從下方技能池選擇）</div>
          )}
        </div>
      ))}

      {/* Free Pick Pool — normal skills */}
      {freeSlots > 0 && (
        <div className="mc-skill-step">
          <div className="mc-skill-step-label">自由選擇（剩餘 {remainingFree} 個）</div>
          <div className="mc-skill-pool-grid">
            {normalSkills.map((skill) => {
              // Skip skills that belong to initial steps (required + choose_one)
              if (allInitialStepSkillIds.has(skill.id)) return null;

              const isSelected = selectedSet.has(skill.id);
              const canSelect = isSelected || selectedSkillIds.length < expectedTotal;

              return (
                <button
                  key={skill.id}
                  className={`mc-skill-card ${isSelected ? "selected" : ""} ${!canSelect ? "disabled" : ""}`}
                  onClick={() => canSelect && toggleSkill(skill.id)}
                  disabled={!canSelect && !isSelected}
                  type="button"
                >
                  <SkillCardContent skill={skill} />
                </button>
              );
            })}
          </div>

          {/* Extra skills */}
          {extraSkills.length > 0 && (
            <>
              <div className="mc-skill-extra-label">額外特技</div>
              <div className="mc-skill-pool-grid">
                {extraSkills.map((skill) => {
                  const isSelected = selectedSet.has(skill.id);
                  const canSelect = isSelected || selectedSkillIds.length < expectedTotal;

                  return (
                    <button
                      key={skill.id}
                      className={`mc-skill-card extra ${isSelected ? "selected" : ""} ${!canSelect ? "disabled" : ""}`}
                      onClick={() => canSelect && toggleSkill(skill.id)}
                      disabled={!canSelect && !isSelected}
                      type="button"
                    >
                      <SkillCardContent skill={skill} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- Skill Card Content (shared sub-component) ---

function SkillCardContent({ skill }: { readonly skill: SkillView }) {
  return (
    <>
      <div className="mc-skill-card-header">
        <span className="mc-skill-name-ja">{skill.nameJa}</span>
        <span className={`mc-skill-trigger ${skill.trigger}`}>
          {TRIGGER_LABELS[skill.trigger] ?? skill.trigger}
        </span>
      </div>
      {skill.nameJa !== skill.nameCht && <div className="mc-skill-name-cht">{skill.nameCht}</div>}
      {skill.costDescription && <div className="mc-skill-cost">{skill.costDescription}</div>}
      <div className="mc-skill-desc">{skill.effectDescription}</div>
      {skill.tpReward > 0 && <div className="mc-skill-tp">TP +{skill.tpReward}</div>}
    </>
  );
}
