import { useState, useMemo } from "react";
import type {
  SkillView,
  SkillInstanceConfigPayload,
  ElementSubChoiceView,
} from "../../types/protocol.js";
import {
  getRequiredElementCount,
  canExpandComposition,
  checkCompositionConflicts,
} from "@server-shared/compositionRules.js";

interface CompositionElementEntry {
  readonly elementSkillId: string;
  readonly subChoice?: string;
}

interface CompositionBuilderProps {
  /** The skill being configured (determines element count) */
  readonly skillId: string;
  /** compositionOnly skills from the class */
  readonly elements: readonly SkillView[];
  /** Sub-choice definitions for elements that require permanent choices */
  readonly elementSubChoices: readonly ElementSubChoiceView[];
  /** Existing compositions in this class (for expand mode) */
  readonly existingCompositions: readonly SkillInstanceConfigPayload[];
  readonly existingConfig?: SkillInstanceConfigPayload;
  readonly onConfirm: (config: SkillInstanceConfigPayload) => void;
  readonly onCancel: () => void;
}

export function CompositionBuilder({
  skillId,
  elements,
  elementSubChoices,
  existingCompositions,
  existingConfig,
  onConfirm,
  onCancel,
}: CompositionBuilderProps) {
  const requiredCount = getRequiredElementCount(skillId);
  const allowExpand = canExpandComposition(skillId) && existingCompositions.length > 0;

  const [mode, setMode] = useState<"new" | "expand">(
    (existingConfig?.mode as "new" | "expand") ?? "new",
  );
  const [expandTargetIndex, setExpandTargetIndex] = useState<number>(
    (existingConfig?.targetIndex as number) ?? 0,
  );
  const [selectedElements, setSelectedElements] = useState<readonly CompositionElementEntry[]>(
    () => {
      if (existingConfig?.elements) {
        return existingConfig.elements as readonly CompositionElementEntry[];
      }
      return [];
    },
  );

  // Element lookup by ID
  const elementMap = useMemo(() => {
    const map = new Map<string, SkillView>();
    for (const el of elements) map.set(el.id, el);
    return map;
  }, [elements]);

  // Sub-choice lookup
  const subChoiceMap = useMemo(() => {
    const map = new Map<string, ElementSubChoiceView>();
    for (const sc of elementSubChoices) map.set(sc.elementSkillId, sc);
    return map;
  }, [elementSubChoices]);

  // Currently editing sub-choice for which element?
  const [pendingSubChoice, setPendingSubChoice] = useState<{
    elementSkillId: string;
    insertIndex: number;
  } | null>(null);

  const targetCount = mode === "expand" ? 1 : requiredCount;
  const isComplete = selectedElements.length === targetCount;

  const selectedElementIds = useMemo(
    () => new Set(selectedElements.map((e) => e.elementSkillId)),
    [selectedElements],
  );

  // --- 要素衝突檢查 (R1~R4) ---
  const warnings = useMemo(() => {
    if (mode === "expand") return [];
    return checkCompositionConflicts(selectedElementIds).map((w) => w.message);
  }, [selectedElementIds, mode]);

  const handleElementClick = (elementSkillId: string) => {
    // If already selected, remove it
    if (selectedElementIds.has(elementSkillId)) {
      setSelectedElements(selectedElements.filter((e) => e.elementSkillId !== elementSkillId));
      return;
    }

    // If already at target count, can't add more
    if (selectedElements.length >= targetCount) return;

    // Check if this element needs a sub-choice
    const subChoice = subChoiceMap.get(elementSkillId);
    if (subChoice) {
      // Show sub-choice picker before adding
      setPendingSubChoice({
        elementSkillId,
        insertIndex: selectedElements.length,
      });
      return;
    }

    // Add directly
    setSelectedElements([...selectedElements, { elementSkillId }]);
  };

  const handleSubChoiceSelect = (value: string) => {
    if (!pendingSubChoice) return;
    setSelectedElements([
      ...selectedElements,
      { elementSkillId: pendingSubChoice.elementSkillId, subChoice: value },
    ]);
    setPendingSubChoice(null);
  };

  const handleConfirm = () => {
    if (!isComplete) return;
    const config: Record<string, unknown> = {
      type: "composition",
      mode,
      elements: selectedElements,
    };
    if (mode === "expand") {
      config.targetIndex = expandTargetIndex;
    }
    onConfirm(config as SkillInstanceConfigPayload);
  };

  // Format existing composition summary for expand mode
  const formatCompositionSummary = (comp: SkillInstanceConfigPayload, idx: number): string => {
    const elems = comp.elements as readonly CompositionElementEntry[] | undefined;
    if (!elems) return `構成 #${idx + 1}`;
    const names = elems.map((e) => {
      const def = elementMap.get(e.elementSkillId);
      let name = def?.nameCht ?? e.elementSkillId;
      if (e.subChoice) name += `(${e.subChoice})`;
      return name;
    });
    return `構成 #${idx + 1}: ${names.join(" + ")}`;
  };

  return (
    <div className="mc-config-content">
      <h3 className="mc-config-title">
        {skillId === "mag-magic-composition"
          ? "魔術構成"
          : skillId === "mag-item-creation"
            ? "道具作成"
            : "魔眼保有"}
      </h3>
      <p className="mc-config-desc">
        選擇 {targetCount} 個要素組合。
        {mode === "expand" && "選擇 1 個要素擴充既有構成。"}
      </p>

      {/* Mode toggle (only for mag-magic-composition with existing compositions) */}
      {allowExpand && (
        <div className="mc-comp-mode">
          <button
            className={`mc-comp-mode-btn ${mode === "new" ? "active" : ""}`}
            onClick={() => {
              setMode("new");
              setSelectedElements([]);
            }}
            type="button"
          >
            新建構成
          </button>
          <button
            className={`mc-comp-mode-btn ${mode === "expand" ? "active" : ""}`}
            onClick={() => {
              setMode("expand");
              setSelectedElements([]);
            }}
            type="button"
          >
            擴充既有
          </button>
        </div>
      )}

      {/* Expand target selection */}
      {mode === "expand" && (
        <div className="mc-comp-targets">
          <div className="mc-comp-targets-label">選擇要擴充的構成：</div>
          {existingCompositions.map((comp, idx) => (
            <button
              key={idx}
              className={`mc-comp-target-btn ${expandTargetIndex === idx ? "active" : ""}`}
              onClick={() => setExpandTargetIndex(idx)}
              type="button"
            >
              {formatCompositionSummary(comp, idx)}
            </button>
          ))}
        </div>
      )}

      {/* Selected elements summary — prominent position above grid */}
      {selectedElements.length > 0 && (
        <div className="mc-comp-selected mc-comp-selected-top">
          <div className="mc-comp-selected-label">已選要素：</div>
          {selectedElements.map((entry, idx) => {
            const def = elementMap.get(entry.elementSkillId);
            const subDef = entry.subChoice ? subChoiceMap.get(entry.elementSkillId) : undefined;
            const subLabel =
              entry.subChoice && subDef
                ? subDef.options.find((o) => o.value === entry.subChoice)?.label
                : entry.subChoice;
            return (
              <span key={idx} className="mc-comp-selected-tag">
                {def?.nameCht ?? entry.elementSkillId}
                {subLabel && <span className="mc-comp-selected-sub">({subLabel})</span>}
              </span>
            );
          })}
        </div>
      )}

      {/* Element selection */}
      <div className="mc-comp-elements">
        <div className="mc-comp-elements-label">
          選擇要素（{selectedElements.length}/{targetCount}）
        </div>
        <div className="mc-comp-element-grid">
          {elements.map((elem) => {
            const isSelected = selectedElementIds.has(elem.id);
            const canSelect = isSelected || selectedElements.length < targetCount;
            return (
              <button
                key={elem.id}
                className={`mc-comp-element-card ${isSelected ? "selected" : ""} ${!canSelect ? "disabled" : ""}`}
                onClick={() => canSelect && handleElementClick(elem.id)}
                disabled={!canSelect && !isSelected}
                type="button"
              >
                <div className="mc-comp-element-name">{elem.nameCht}</div>
                {elem.costDescription && (
                  <div className="mc-comp-element-cost">{elem.costDescription}</div>
                )}
                <div className="mc-comp-element-desc">{elem.effectDescription}</div>
                {subChoiceMap.has(elem.id) && (
                  <span className="mc-comp-element-choice-hint">需選擇</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-choice modal */}
      {pendingSubChoice && (
        <div className="mc-comp-subchoice">
          <div className="mc-comp-subchoice-label">
            {subChoiceMap.get(pendingSubChoice.elementSkillId)?.label ?? "選擇"}：
          </div>
          <div className="mc-comp-subchoice-options">
            {subChoiceMap.get(pendingSubChoice.elementSkillId)?.options.map((opt) => (
              <button
                key={opt.value}
                className="mc-comp-subchoice-btn"
                onClick={() => handleSubChoiceSelect(opt.value)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPendingSubChoice(null)}
            className="mc-btn mc-btn-secondary mc-comp-subchoice-cancel"
            type="button"
          >
            取消
          </button>
        </div>
      )}

      {/* 衝突警告 */}
      {warnings.length > 0 && (
        <div className="mc-comp-warnings">
          {warnings.map((w, i) => (
            <div key={i} className="mc-comp-warning">
              {w}
            </div>
          ))}
        </div>
      )}

      <div className="mc-config-actions">
        <button onClick={onCancel} className="mc-btn mc-btn-secondary" type="button">
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isComplete || warnings.length > 0}
          className="mc-btn mc-btn-confirm"
          type="button"
        >
          確認
        </button>
      </div>
    </div>
  );
}
