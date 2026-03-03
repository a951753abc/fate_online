import { useMemo } from "react";
import type {
  SkillView,
  ClassAcquisitionView,
  InitialStepView,
  SkillInstanceConfigPayload,
  MysticCodeView,
  FamiliarOptionView,
} from "../../types/protocol.js";
import { computeExpectedSkillCount } from "../../utils/skillUtils.js";

// --- Trigger type labels ---

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

// --- Attribute labels (for config summary) ---

const ATTRIBUTE_LABELS: Readonly<Record<string, string>> = {
  earth: "地",
  water: "水",
  fire: "火",
  wind: "風",
  void: "空",
};

// --- Props ---

interface SkillSelectionPanelProps {
  readonly classId: string;
  readonly classDisplayName: string;
  readonly classLevel: number;
  readonly skills: readonly SkillView[];
  readonly acquisition: ClassAcquisitionView;
  readonly selectedSkillIds: readonly string[];
  readonly skillConfigs?: Readonly<Record<string, readonly SkillInstanceConfigPayload[]>>;
  readonly mysticCodes?: readonly MysticCodeView[];
  readonly familiarOptions?: readonly FamiliarOptionView[];
  readonly onSelectionChange: (classId: string, skillIds: readonly string[]) => void;
  readonly onConfigRequest?: (skillId: string, instanceIndex?: number) => void;
  readonly onRemoveInstance?: (skillId: string, instanceIndex: number) => void;
}

// --- Component ---

export function SkillSelectionPanel({
  classId,
  classDisplayName,
  classLevel,
  skills,
  acquisition,
  selectedSkillIds,
  skillConfigs = {},
  mysticCodes = [],
  familiarOptions = [],
  onSelectionChange,
  onConfigRequest,
  onRemoveInstance,
}: SkillSelectionPanelProps) {
  const expectedTotal = useMemo(
    () => computeExpectedSkillCount(acquisition, classLevel),
    [acquisition, classLevel],
  );

  const skillMap = useMemo(() => {
    const map = new Map<string, SkillView>();
    for (const s of skills) map.set(s.id, s);
    return map;
  }, [skills]);

  // Count occurrences of each skill in selectedSkillIds (supports repeatable)
  const selectedCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const id of selectedSkillIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [selectedSkillIds]);

  // Single pass: separate normal, extra, and composition-only skills
  const { normalSkills, extraSkills } = useMemo(() => {
    const normal: SkillView[] = [];
    const extra: SkillView[] = [];
    for (const s of skills) {
      if (s.compositionOnly) continue; // Filter out compositionOnly
      (s.isExtra ? extra : normal).push(s);
    }
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

  // --- Click handlers ---

  /** Handle click on a skill card (dispatches based on skill type) */
  const handleSkillClick = (skill: SkillView) => {
    // ConfigType skills: delegate to parent for config panel
    if (skill.configType) {
      onConfigRequest?.(skill.id);
      return;
    }

    // Repeatable without configType: always add (no toggle off from pool)
    if (skill.repeatable) {
      if (selectedSkillIds.length < expectedTotal) {
        onSelectionChange(classId, [...selectedSkillIds, skill.id]);
      }
      return;
    }

    // Normal toggle
    const count = selectedCounts.get(skill.id) ?? 0;
    if (count > 0) {
      onSelectionChange(
        classId,
        selectedSkillIds.filter((id) => id !== skill.id),
      );
    } else if (selectedSkillIds.length < expectedTotal) {
      onSelectionChange(classId, [...selectedSkillIds, skill.id]);
    }
  };

  const handleChooseOne = (step: InitialStepView, skillId: string) => {
    const stepOptions = new Set(step.skillIds ?? []);
    // Remove any currently selected option from this step, then add the new one
    const without = selectedSkillIds.filter((id) => !stepOptions.has(id));
    onSelectionChange(classId, [...without, skillId]);
  };

  // Precompute Maps for config summary lookups
  const mysticCodeMap = useMemo(() => new Map(mysticCodes.map((m) => [m.id, m])), [mysticCodes]);
  const familiarMap = useMemo(
    () => new Map(familiarOptions.map((f) => [f.type, f])),
    [familiarOptions],
  );

  // --- Config summary items ---

  const configSummaryItems = useMemo(() => {
    const items: {
      skillId: string;
      name: string;
      instanceIndex: number;
      configSummary: string;
      hasConfig: boolean;
    }[] = [];
    const instanceCounters = new Map<string, number>();

    for (const skillId of selectedSkillIds) {
      const skill = skillMap.get(skillId);
      if (!skill?.configType) continue;

      const idx = instanceCounters.get(skillId) ?? 0;
      instanceCounters.set(skillId, idx + 1);

      const configs = skillConfigs[skillId] ?? [];
      const config = configs[idx];
      const isRepeatable = skill.repeatable;
      const instanceLabel =
        isRepeatable && (idx > 0 || (selectedCounts.get(skillId) ?? 0) > 1) ? ` #${idx + 1}` : "";

      items.push({
        skillId,
        name: skill.nameJa + instanceLabel,
        instanceIndex: idx,
        configSummary: config
          ? formatConfigSummary(config, skillMap, mysticCodeMap, familiarMap)
          : "未設定",
        hasConfig: !!config,
      });
    }
    return items;
  }, [selectedSkillIds, skillMap, skillConfigs, selectedCounts, mysticCodeMap, familiarMap]);

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

      {/* Config Summary (for skills with configType) */}
      {configSummaryItems.length > 0 && (
        <div className="mc-skill-summary">
          <div className="mc-skill-summary-label">已設定技能</div>
          {configSummaryItems.map((item) => (
            <div
              key={`${item.skillId}-${item.instanceIndex}`}
              className={`mc-skill-summary-item ${item.hasConfig ? "" : "unconfigured"}`}
            >
              <span className="mc-skill-summary-name">{item.name}</span>
              <span className="mc-skill-summary-config">{item.configSummary}</span>
              <div className="mc-skill-summary-actions">
                <button
                  onClick={() => onConfigRequest?.(item.skillId, item.instanceIndex)}
                  className="mc-skill-summary-edit"
                  type="button"
                  title="編輯"
                >
                  ✎
                </button>
                <button
                  onClick={() => onRemoveInstance?.(item.skillId, item.instanceIndex)}
                  className="mc-skill-summary-remove"
                  type="button"
                  title="移除"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Initial Steps */}
      {acquisition.initialSteps.map((step, stepIdx) => (
        <div key={stepIdx} className="mc-skill-step">
          <div className="mc-skill-step-label">{step.label ?? `步驟 ${stepIdx + 1}`}</div>

          {step.type === "required" && (
            <div className="mc-skill-step-grid">
              {(step.skillIds ?? []).map((sid) => {
                const skill = skillMap.get(sid);
                if (!skill) return null;
                const isSelected = (selectedCounts.get(sid) ?? 0) > 0;
                return (
                  <button
                    key={sid}
                    className={`mc-skill-card required ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSkillClick(skill)}
                    type="button"
                  >
                    <SkillCardContent skill={skill} />
                    {skill.configType && (
                      <span className="mc-skill-config-indicator">
                        {isSelected && (skillConfigs[sid]?.length ?? 0) > 0 ? "✓" : "⚙"}
                      </span>
                    )}
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
                const isSelected = (selectedCounts.get(sid) ?? 0) > 0;
                return (
                  <button
                    key={sid}
                    className={`mc-skill-card choice ${isSelected ? "selected" : ""}`}
                    onClick={() =>
                      skill.configType ? handleSkillClick(skill) : handleChooseOne(step, sid)
                    }
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

              const count = selectedCounts.get(skill.id) ?? 0;
              const isSelected = count > 0;

              const canSelect = isSelected || selectedSkillIds.length < expectedTotal;

              return (
                <SkillPoolCard
                  key={skill.id}
                  skill={skill}
                  count={count}
                  isSelected={isSelected}
                  canSelect={canSelect}
                  onClickCard={handleSkillClick}
                />
              );
            })}
          </div>

          {/* Extra skills */}
          {extraSkills.length > 0 && (
            <>
              <div className="mc-skill-extra-label">額外特技</div>
              <div className="mc-skill-pool-grid">
                {extraSkills.map((skill) => {
                  const count = selectedCounts.get(skill.id) ?? 0;
                  const isSelected = count > 0;
                  const canSelect = isSelected || selectedSkillIds.length < expectedTotal;

                  return (
                    <SkillPoolCard
                      key={skill.id}
                      skill={skill}
                      count={count}
                      isSelected={isSelected}
                      canSelect={canSelect}
                      variant="extra"
                      onClickCard={handleSkillClick}
                    />
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

// --- Config summary formatter ---

function formatConfigSummary(
  config: SkillInstanceConfigPayload,
  skillMap: ReadonlyMap<string, SkillView>,
  mysticCodeMap: ReadonlyMap<string, MysticCodeView>,
  familiarMap: ReadonlyMap<string, FamiliarOptionView>,
): string {
  switch (config.type) {
    case "attribute_distribution": {
      const dist = config.distribution as Readonly<Record<string, number>> | undefined;
      if (!dist) return "";
      return Object.entries(dist)
        .filter(([, v]) => v > 0)
        .map(([attr, val]) => `${ATTRIBUTE_LABELS[attr] ?? attr}${val}`)
        .join(" ");
    }
    case "familiar": {
      const ft = config.familiarType as string;
      return familiarMap.get(ft)?.nameCht ?? ft;
    }
    case "mystic_code": {
      const mcId = config.mysticCodeId as string;
      return mysticCodeMap.get(mcId)?.nameCht ?? mcId;
    }
    case "composition": {
      const elements = config.elements as
        | readonly { elementSkillId: string; subChoice?: string }[]
        | undefined;
      if (!elements) return "";
      return elements
        .map((e) => {
          const eDef = skillMap.get(e.elementSkillId);
          let name = eDef?.nameCht ?? e.elementSkillId;
          if (e.subChoice) name += `(${e.subChoice})`;
          return name;
        })
        .join(" + ");
    }
    default:
      return "";
  }
}

// --- Skill Pool Card (shared for normal + extra pools) ---

function SkillPoolCard({
  skill,
  count,
  isSelected,
  canSelect,
  variant,
  onClickCard,
}: {
  readonly skill: SkillView;
  readonly count: number;
  readonly isSelected: boolean;
  readonly canSelect: boolean;
  readonly variant?: "extra";
  readonly onClickCard: (skill: SkillView) => void;
}) {
  const variantClass = variant ? ` ${variant}` : "";
  return (
    <button
      className={`mc-skill-card${variantClass} ${isSelected && !skill.repeatable ? "selected" : ""} ${!canSelect ? "disabled" : ""}`}
      onClick={() => canSelect && onClickCard(skill)}
      disabled={!canSelect && !isSelected}
      type="button"
    >
      <SkillCardContent skill={skill} />
      {skill.repeatable && count > 0 && <span className="mc-skill-count-badge">×{count}</span>}
      {skill.configType && <span className="mc-skill-config-badge">⚙</span>}
    </button>
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
