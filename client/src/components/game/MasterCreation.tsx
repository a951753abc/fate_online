import { useState, useMemo, useCallback } from "react";
import type {
  PrepConfig,
  PrepSubmitPayload,
  PrepResultPayload,
  PrepStatePayload,
  PrepStatus,
  MasterLevelView,
  ClassAcquisitionView,
  SkillInstanceConfigPayload,
  SkillView,
} from "../../types/protocol.js";
import { computeExpectedSkillCount } from "../../utils/skillUtils.js";
import { SkillSelectionPanel } from "./SkillSelectionPanel.js";
import { AttributeDistPanel } from "./AttributeDistPanel.js";
import { FamiliarPicker } from "./FamiliarPicker.js";
import { MysticCodePicker } from "./MysticCodePicker.js";
import { CompositionBuilder } from "./CompositionBuilder.js";
import "./MasterCreation.css";

type AbilityKey = PrepSubmitPayload["freePoint"];

const ABILITY_LABELS: Record<AbilityKey, string> = {
  body: "體力",
  perception: "知覺",
  reason: "理智",
  will: "意志",
};

const COMBAT_LABELS: Record<string, string> = {
  melee: "近戰",
  ranged: "射撃",
  spirit: "精神",
  action: "行動",
  hp: "生命力",
  focus: "集中力",
  defense: "防禦點",
};

/** Visual max for stat bars (base stats range 0-5 per class) */
const STAT_BAR_MAX = 6;

interface SelectedLevel {
  readonly id: string;
  readonly level: number;
}

type CreationStep = "starting" | "upgrade" | "skills";

interface ConfigModalState {
  readonly classId: string;
  readonly skillId: string;
  readonly editIndex?: number;
}

interface MasterCreationProps {
  readonly prepConfig: PrepConfig;
  readonly prepState: PrepStatePayload | null;
  readonly buildResult: PrepResultPayload | null;
  readonly myCharacterId: string;
  readonly myRole: "master" | "servant";
  readonly onSubmit: (payload: PrepSubmitPayload) => void;
  readonly onReady: () => void;
}

export function MasterCreation({
  prepConfig,
  prepState,
  buildResult,
  myCharacterId,
  myRole,
  onSubmit,
  onReady,
}: MasterCreationProps) {
  const [selected, setSelected] = useState<SelectedLevel[]>([]);
  const [freePoint, setFreePoint] = useState<AbilityKey>("body");
  const [step, setStep] = useState<CreationStep>("starting");
  const [skillSelections, setSkillSelections] = useState<
    Readonly<Record<string, readonly string[]>>
  >({});
  const [skillConfigs, setSkillConfigs] = useState<
    Readonly<Record<string, Readonly<Record<string, readonly SkillInstanceConfigPayload[]>>>>
  >({});
  const [startingLevels, setStartingLevels] = useState<Readonly<Record<string, number>>>({});
  const [configModal, setConfigModal] = useState<ConfigModalState | null>(null);

  const isReady =
    prepState?.players.find((p) => p.characterId === myCharacterId)?.status === "ready";

  const totalAllocated = selected.reduce((sum, s) => sum + s.level, 0);
  const upgradeLevels = prepConfig.gameLevel - prepConfig.startingPoints;
  const budget = step === "starting" ? prepConfig.startingPoints : prepConfig.gameLevel;
  const remaining = budget - totalAllocated;

  const levelMap = useMemo(() => {
    const map = new Map<string, MasterLevelView>();
    for (const lv of prepConfig.availableLevels) {
      map.set(lv.id, lv);
    }
    return map;
  }, [prepConfig.availableLevels]);

  const acquisitionMap = useMemo(() => {
    const map = new Map<string, ClassAcquisitionView>();
    for (const acq of prepConfig.classAcquisitions) {
      map.set(acq.classId, acq);
    }
    return map;
  }, [prepConfig.classAcquisitions]);

  // Build skill maps per class for config type lookup
  const classSkillMaps = useMemo(() => {
    const maps: Record<string, Map<string, SkillView>> = {};
    for (const [classId, skills] of Object.entries(prepConfig.classSkills)) {
      const map = new Map<string, SkillView>();
      for (const s of skills) map.set(s.id, s);
      maps[classId] = map;
    }
    return maps;
  }, [prepConfig.classSkills]);

  const canConfirmStarting = step === "starting" && selected.length > 0 && remaining === 0;
  const canAdvanceToSkills = step === "upgrade" && remaining === 0;
  const hasStats = buildResult?.success && buildResult.stats;
  const locked = isReady || step === "upgrade" || step === "skills";

  // Check if all skill selections are complete (including configs)
  const allSkillsComplete = useMemo(() => {
    if (step !== "skills") return false;
    for (const s of selected) {
      const acq = acquisitionMap.get(s.id);
      if (!acq) return false;
      const skills = skillSelections[s.id] ?? [];
      const expected = computeExpectedSkillCount(acq, s.level);
      if (skills.length !== expected) return false;

      // Check all configType skills have configs
      const classSkillMap = classSkillMaps[s.id];
      if (!classSkillMap) continue;
      const classConfs = skillConfigs[s.id] ?? {};

      const configSkillCounts = new Map<string, number>();
      for (const skillId of skills) {
        const def = classSkillMap.get(skillId);
        if (def?.configType) {
          configSkillCounts.set(skillId, (configSkillCounts.get(skillId) ?? 0) + 1);
        }
      }
      for (const [skillId, count] of configSkillCounts) {
        const configs = classConfs[skillId] ?? [];
        if (configs.length !== count) return false;
      }
    }
    return true;
  }, [step, selected, acquisitionMap, skillSelections, skillConfigs, classSkillMaps]);

  const canSubmit = step === "skills" && allSkillsComplete;

  // --- Skill selection handlers ---

  const handleSkillChange = useCallback((classId: string, skillIds: readonly string[]) => {
    setSkillSelections((prev) => ({ ...prev, [classId]: skillIds }));
  }, []);

  const handleConfigRequest = useCallback(
    (classId: string, skillId: string, instanceIndex?: number) => {
      setConfigModal({ classId, skillId, editIndex: instanceIndex });
    },
    [],
  );

  const handleConfigConfirm = useCallback(
    (config: SkillInstanceConfigPayload) => {
      if (!configModal) return;
      const { classId, skillId, editIndex } = configModal;

      if (editIndex !== undefined) {
        // Editing existing instance — update config only
        setSkillConfigs((prev) => {
          const classConfs = { ...(prev[classId] ?? {}) };
          const skillConfs = [...(classConfs[skillId] ?? [])];
          skillConfs[editIndex] = config;
          return { ...prev, [classId]: { ...classConfs, [skillId]: skillConfs } };
        });
      } else {
        // New instance — add to selectedSkillIds AND config
        setSkillSelections((prev) => ({
          ...prev,
          [classId]: [...(prev[classId] ?? []), skillId],
        }));
        setSkillConfigs((prev) => {
          const classConfs = { ...(prev[classId] ?? {}) };
          const skillConfs = [...(classConfs[skillId] ?? []), config];
          return { ...prev, [classId]: { ...classConfs, [skillId]: skillConfs } };
        });
      }

      setConfigModal(null);
    },
    [configModal],
  );

  const handleConfigCancel = useCallback(() => {
    setConfigModal(null);
  }, []);

  const handleRemoveInstance = useCallback(
    (classId: string, skillId: string, instanceIndex: number) => {
      // Remove one occurrence of skillId from selectedSkillIds
      setSkillSelections((prev) => {
        const ids = [...(prev[classId] ?? [])];
        let count = 0;
        const removeIdx = ids.findIndex((id) => {
          if (id !== skillId) return false;
          if (count === instanceIndex) return true;
          count++;
          return false;
        });
        if (removeIdx >= 0) ids.splice(removeIdx, 1);
        return { ...prev, [classId]: ids };
      });

      // Remove corresponding config
      setSkillConfigs((prev) => {
        const classConfs = { ...(prev[classId] ?? {}) };
        const skillConfs = [...(classConfs[skillId] ?? [])];
        skillConfs.splice(instanceIndex, 1);
        if (skillConfs.length === 0) {
          const rest = Object.fromEntries(
            Object.entries(classConfs).filter(([k]) => k !== skillId),
          );
          return { ...prev, [classId]: rest };
        }
        return { ...prev, [classId]: { ...classConfs, [skillId]: skillConfs } };
      });
    },
    [],
  );

  // Servant waiting view
  if (myRole === "servant") {
    return (
      <div className="mc-container">
        <div className="mc-header">
          <h2 className="mc-title">準備階段</h2>
          <div className="mc-divider" />
        </div>
        <div className="mc-servant-wait">
          <p className="mc-servant-text">サーヴァント角色系統尚未開放，請等待マスター完成創角。</p>
        </div>
        {prepState && <PrepStatusList prepState={prepState} myCharacterId={myCharacterId} />}
      </div>
    );
  }

  const toggleLevel = (id: string) => {
    const exists = selected.find((s) => s.id === id);
    if (exists) {
      setSelected(selected.filter((s) => s.id !== id));
    } else if (selected.length < prepConfig.maxClasses) {
      setSelected([...selected, { id, level: 1 }]);
    }
  };

  const adjustLevel = (id: string, delta: number) => {
    setSelected(
      selected.map((s) => {
        if (s.id !== id) return s;
        const newLevel = s.level + delta;
        if (newLevel < 1) return s;
        if (delta > 0 && remaining <= 0) return s;
        return { ...s, level: newLevel };
      }),
    );
  };

  const handleConfirmStarting = () => {
    const levels: Record<string, number> = {};
    for (const s of selected) levels[s.id] = s.level;
    setStartingLevels(levels);
    setStep("upgrade");
  };

  const handleUpgradeSelect = (id: string) => {
    if (remaining <= 0) return;
    const exists = selected.find((s) => s.id === id);
    if (exists) {
      setSelected(selected.map((s) => (s.id === id ? { ...s, level: s.level + 1 } : s)));
    } else if (selected.length < prepConfig.maxClasses) {
      setSelected([...selected, { id, level: 1 }]);
    }
  };

  const adjustUpgradeLevel = (id: string, delta: number) => {
    const minLevel = startingLevels[id] ?? 0;
    setSelected((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== id) return s;
        const newLevel = s.level + delta;
        if (newLevel < minLevel) return s;
        if (delta > 0 && remaining <= 0) return s;
        return { ...s, level: newLevel };
      });
      return updated.filter((s) => s.level > 0);
    });
  };

  const handleAdvanceToSkills = () => {
    // Initialize empty skill selections for each class
    const initial: Record<string, readonly string[]> = {};
    for (const s of selected) {
      initial[s.id] = skillSelections[s.id] ?? [];
    }
    setSkillSelections(initial);
    setStep("skills");
  };

  const handleResetUpgrade = () => {
    setSelected(Object.entries(startingLevels).map(([id, level]) => ({ id, level })));
    setSkillSelections({});
    setSkillConfigs({});
  };

  const handleBackToStarting = () => {
    setSelected([]);
    setStartingLevels({});
    setSkillSelections({});
    setSkillConfigs({});
    setStep("starting");
  };

  const handleBackToUpgrade = () => {
    setStep("upgrade");
  };

  const handleSubmit = () => {
    const allocation = selected.map((s) => ({
      levelId: s.id,
      level: s.level,
      startingLevel: startingLevels[s.id] ?? 0,
    }));
    const selections = selected.map((s) => {
      const classConfs = skillConfigs[s.id] ?? {};
      const hasConfigs = Object.keys(classConfs).length > 0;
      return {
        classId: s.id,
        classLevel: s.level,
        selectedSkillIds: [...(skillSelections[s.id] ?? [])],
        ...(hasConfigs ? { skillConfigs: classConfs } : {}),
      };
    });
    onSubmit({ allocation, freePoint, skillSelections: selections });
  };

  // --- Config modal rendering ---

  const renderConfigModal = () => {
    if (!configModal) return null;
    const { classId, skillId, editIndex } = configModal;
    const classSkillMap = classSkillMaps[classId];
    const skillDef = classSkillMap?.get(skillId);
    if (!skillDef) return null;

    const classConfs = skillConfigs[classId] ?? {};
    const existingConfig =
      editIndex !== undefined ? (classConfs[skillId] ?? [])[editIndex] : undefined;

    const classLevel = selected.find((s) => s.id === classId)?.level ?? 1;

    let content: React.ReactNode = null;

    switch (skillDef.configType) {
      case "attribute_distribution": {
        const selectedIds = skillSelections[classId] ?? [];
        const hasMultiElement = selectedIds.includes("mag-multi-element");
        content = (
          <AttributeDistPanel
            classLevel={classLevel}
            hasMultiElement={hasMultiElement}
            existingConfig={existingConfig}
            onConfirm={handleConfigConfirm}
            onCancel={handleConfigCancel}
          />
        );
        break;
      }
      case "familiar":
        content = (
          <FamiliarPicker
            familiarOptions={prepConfig.familiarOptions}
            existingConfig={existingConfig}
            onConfirm={handleConfigConfirm}
            onCancel={handleConfigCancel}
          />
        );
        break;
      case "mystic_code":
        content = (
          <MysticCodePicker
            mysticCodes={prepConfig.mysticCodes}
            existingConfig={existingConfig}
            onConfirm={handleConfigConfirm}
            onCancel={handleConfigCancel}
          />
        );
        break;
      case "composition": {
        // Get compositionOnly elements for this class
        const classSkills = prepConfig.classSkills[classId] ?? [];
        const elements = classSkills.filter((s) => s.compositionOnly);
        // Get existing compositions for expand mode
        const compositionSkillId = "mag-magic-composition";
        const existingCompositions = (classConfs[compositionSkillId] ?? []).filter(
          (c) => c.type === "composition",
        );
        content = (
          <CompositionBuilder
            skillId={skillId}
            elements={elements}
            elementSubChoices={prepConfig.elementSubChoices}
            existingCompositions={existingCompositions}
            existingConfig={existingConfig}
            onConfirm={handleConfigConfirm}
            onCancel={handleConfigCancel}
          />
        );
        break;
      }
    }

    if (!content) return null;

    return (
      <div className="mc-config-overlay" onClick={handleConfigCancel}>
        <div className="mc-config-panel" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="mc-container">
      {/* Header */}
      <div className="mc-header">
        <h2 className="mc-title">マスター創角</h2>
        <div className="mc-divider" />
      </div>

      {/* Stepper */}
      <div className="mc-stepper">
        <div className="mc-step">
          <span className={`mc-step-num ${step === "starting" ? "active" : "done"}`}>1</span>
          <span className={`mc-step-label ${step === "starting" ? "active" : ""}`}>
            {`起始配點（${prepConfig.startingPoints} 等）`}
          </span>
        </div>
        <div className={`mc-step-line ${step !== "starting" ? "done" : ""}`} />
        <div className="mc-step">
          <span
            className={`mc-step-num ${step === "upgrade" ? "active" : step === "skills" ? "done" : ""}`}
          >
            2
          </span>
          <span className={`mc-step-label ${step === "upgrade" ? "active" : ""}`}>
            {`升級（+${upgradeLevels}）`}
          </span>
        </div>
        <div className={`mc-step-line ${step === "skills" ? "done" : ""}`} />
        <div className="mc-step">
          <span className={`mc-step-num ${step === "skills" ? "active" : ""}`}>3</span>
          <span className={`mc-step-label ${step === "skills" ? "active" : ""}`}>技能選擇</span>
        </div>
      </div>

      {/* Step 1: Level Selection (locked in step 2) */}
      <section className="mc-section">
        <h3 className="mc-section-title">
          級別選擇（{selected.length}/{prepConfig.maxClasses}）
        </h3>
        <div className="mc-level-grid">
          {prepConfig.availableLevels.map((lv) => {
            const isSelected = selected.some((s) => s.id === lv.id);
            return (
              <button
                key={lv.id}
                onClick={() => toggleLevel(lv.id)}
                disabled={locked}
                className={`mc-level-card ${isSelected ? "selected" : ""}`}
                aria-pressed={isSelected}
              >
                <div className="mc-level-name">
                  <strong>{lv.nameJa}</strong>
                </div>
                <div className="mc-level-stats">
                  <StatBarItem label="體" value={lv.baseStats.body} />
                  <StatBarItem label="知" value={lv.baseStats.perception} />
                  <StatBarItem label="理" value={lv.baseStats.reason} />
                  <StatBarItem label="意" value={lv.baseStats.will} />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 1: Level Allocation */}
      {selected.length > 0 && step === "starting" && (
        <section className="mc-section">
          <h3 className="mc-section-title">起始等級分配（剩餘 {remaining} 點）</h3>
          <div className="mc-alloc-list">
            {selected.map((s) => {
              const def = levelMap.get(s.id);
              return (
                <div key={s.id} className="mc-alloc-row">
                  <span className="mc-alloc-name">{def?.nameJa ?? s.id}</span>
                  <div className="mc-alloc-controls">
                    <button
                      onClick={() => adjustLevel(s.id, -1)}
                      disabled={s.level <= 1}
                      className="mc-pm-btn"
                    >
                      -
                    </button>
                    <span className="mc-alloc-level">LV{s.level}</span>
                    <button
                      onClick={() => adjustLevel(s.id, 1)}
                      disabled={remaining <= 0}
                      className="mc-pm-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 1: Free Point */}
      {selected.length > 0 && step === "starting" && (
        <section className="mc-section">
          <h3 className="mc-section-title">自由配點（+1）</h3>
          <div className="mc-free-group">
            {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setFreePoint(key)}
                className={`mc-free-btn ${freePoint === key ? "active" : ""}`}
                aria-pressed={freePoint === key}
              >
                {ABILITY_LABELS[key]}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 1: Confirm Starting */}
      {step === "starting" && (
        <div className="mc-actions">
          <button
            onClick={handleConfirmStarting}
            disabled={!canConfirmStarting}
            className="mc-btn mc-btn-confirm"
          >
            確認起始能力
          </button>
        </div>
      )}

      {/* Step 2: Upgrade Selection */}
      {step === "upgrade" && !isReady && remaining > 0 && (
        <section className="mc-section">
          <h3 className="mc-section-title">
            選擇升級（+{upgradeLevels}，剩餘 {remaining}）
          </h3>
          <p className="mc-upgrade-desc">選擇一個級別升級，可以是既有級別 +1 或新級別 LV1。</p>
          <div className="mc-level-grid">
            {prepConfig.availableLevels.map((lv) => {
              const existing = selected.find((s) => s.id === lv.id);
              const canAdd = existing || selected.length < prepConfig.maxClasses;
              return (
                <button
                  key={lv.id}
                  onClick={() => handleUpgradeSelect(lv.id)}
                  disabled={!canAdd || remaining <= 0}
                  className={`mc-level-card ${existing ? "selected" : ""}`}
                >
                  <div className="mc-level-name">
                    <strong>{lv.nameJa}</strong>
                  </div>
                  <div className={`mc-level-hint ${existing ? "upgrade" : "new"}`}>
                    {existing ? `LV${existing.level} → LV${existing.level + 1}` : "新規 LV1"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 2: Current Allocation (editable) */}
      {step === "upgrade" && (
        <section className="mc-section">
          <h3 className="mc-section-title">目前等級配置</h3>
          <div className="mc-alloc-list">
            {selected.map((s) => {
              const def = levelMap.get(s.id);
              const min = startingLevels[s.id] ?? 0;
              return (
                <div key={s.id} className="mc-alloc-row">
                  <span className="mc-alloc-name">{def?.nameJa ?? s.id}</span>
                  <div className="mc-alloc-controls">
                    <button
                      onClick={() => adjustUpgradeLevel(s.id, -1)}
                      disabled={s.level <= min}
                      className="mc-pm-btn"
                    >
                      -
                    </button>
                    <span className="mc-alloc-level">LV{s.level}</span>
                    <button
                      onClick={() => adjustUpgradeLevel(s.id, 1)}
                      disabled={remaining <= 0}
                      className="mc-pm-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mc-summary-free">自由配點: {ABILITY_LABELS[freePoint]} +1</div>
        </section>
      )}

      {/* Step 2: Actions */}
      {step === "upgrade" && !isReady && (
        <div className="mc-actions">
          <button onClick={handleBackToStarting} className="mc-btn mc-btn-secondary">
            返回起始配點
          </button>
          <button onClick={handleResetUpgrade} className="mc-btn mc-btn-secondary">
            重置升級
          </button>
          <button
            onClick={handleAdvanceToSkills}
            disabled={!canAdvanceToSkills}
            className="mc-btn mc-btn-confirm"
          >
            下一步：技能選擇
          </button>
        </div>
      )}

      {/* Step 3: Skill Selection */}
      {step === "skills" && !isReady && (
        <>
          {selected.map((s) => {
            const acq = acquisitionMap.get(s.id);
            const classSkills = prepConfig.classSkills[s.id] ?? [];
            if (!acq) return null;
            const def = levelMap.get(s.id);
            return (
              <SkillSelectionPanel
                key={s.id}
                classId={s.id}
                classDisplayName={def?.nameJa ?? s.id}
                classLevel={s.level}
                skills={classSkills}
                acquisition={acq}
                selectedSkillIds={skillSelections[s.id] ?? []}
                skillConfigs={skillConfigs[s.id] ?? {}}
                mysticCodes={prepConfig.mysticCodes}
                familiarOptions={prepConfig.familiarOptions}
                onSelectionChange={handleSkillChange}
                onConfigRequest={(skillId, instanceIndex) =>
                  handleConfigRequest(s.id, skillId, instanceIndex)
                }
                onRemoveInstance={(skillId, instanceIndex) =>
                  handleRemoveInstance(s.id, skillId, instanceIndex)
                }
              />
            );
          })}

          <div className="mc-actions">
            <button onClick={handleBackToUpgrade} className="mc-btn mc-btn-secondary">
              返回升級
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="mc-btn mc-btn-confirm">
              送出
            </button>
          </div>
        </>
      )}

      {/* Ready button (after server confirms build) */}
      {hasStats && !isReady && (
        <div className="mc-actions">
          <button onClick={onReady} className="mc-btn mc-btn-ready">
            確認就緒
          </button>
        </div>
      )}

      {/* Error */}
      {buildResult && !buildResult.success && <div className="mc-error">{buildResult.error}</div>}

      {/* Stats Display */}
      {hasStats && buildResult.stats && <StatsPanel stats={buildResult.stats} />}

      {/* Ready Status */}
      {isReady && <div className="mc-ready-msg">已就緒，等待其他玩家...</div>}

      {/* Prep Status */}
      {prepState && <PrepStatusList prepState={prepState} myCharacterId={myCharacterId} />}

      {/* Config Modal Overlay */}
      {renderConfigModal()}
    </div>
  );
}

// === Sub-components ===

/** Mini stat bar for level cards */
function StatBarItem({ label, value }: { readonly label: string; readonly value: number }) {
  const pct = Math.min((value / STAT_BAR_MAX) * 100, 100);
  return (
    <div className="mc-stat-item">
      <span className="mc-stat-item-label">{label}</span>
      <div className="mc-stat-item-bar">
        <div className="mc-stat-item-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="mc-stat-item-val">{value}</span>
    </div>
  );
}

/** Stat bar tier for the result panel */
function statBarTier(value: number, max: number): string {
  const ratio = value / max;
  if (ratio >= 0.65) return "high";
  if (ratio >= 0.35) return "mid";
  return "low";
}

function StatsPanel({ stats }: { readonly stats: NonNullable<PrepResultPayload["stats"]> }) {
  const abilityMax = Math.max(
    ...Object.values(stats.baseAbilities),
    8, // minimum visual ceiling
  );

  return (
    <div>
      <div className="mc-section mc-stats-section">
        <h3 className="mc-section-title">數值計算結果</h3>
      </div>
      <div className="mc-stats-grid">
        {/* Base Abilities + Bonuses */}
        <div className="mc-stat-box">
          <h4 className="mc-stat-box-header">基本能力値 / 能力紅利</h4>
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => (
            <div key={key} className="mc-stat-row">
              <span className="mc-stat-label">{ABILITY_LABELS[key]}</span>
              <div className="mc-stat-bar">
                <div
                  className={`mc-stat-bar-fill ${statBarTier(stats.baseAbilities[key], abilityMax)}`}
                  style={{ width: `${(stats.baseAbilities[key] / abilityMax) * 100}%` }}
                />
              </div>
              <span>
                <span className="mc-stat-value">{stats.baseAbilities[key]}</span>
                <span className="mc-stat-detail">（+{stats.bonuses[key]}）</span>
              </span>
            </div>
          ))}
        </div>

        {/* Final Combat */}
        <div className="mc-stat-box">
          <h4 className="mc-stat-box-header">最終戰鬥値</h4>
          {Object.entries(COMBAT_LABELS).map(([key, label]) => (
            <div key={key} className="mc-stat-row">
              <span className="mc-stat-label">{label}</span>
              <span>
                <span className="mc-stat-value">
                  {stats.finalCombat[key as keyof typeof stats.finalCombat]}
                </span>
                <span className="mc-stat-detail">
                  ({stats.baseCombat[key as keyof typeof stats.baseCombat]}+
                  {stats.levelModifiers[key as keyof typeof stats.levelModifiers]})
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<PrepStatus, string> = {
  pending: "未提交",
  submitted: "已提交",
  ready: "就緒",
};

function PrepStatusList({
  prepState,
  myCharacterId,
}: {
  readonly prepState: PrepStatePayload;
  readonly myCharacterId: string;
}) {
  const masters = prepState.players.filter((p) => p.role === "master");
  return (
    <div className="mc-prep">
      <div className="mc-section">
        <h3 className="mc-section-title">準備狀態</h3>
        <div className="mc-prep-badges">
          {masters.map((p, i) => {
            // Never reveal NPC identity — all non-self players show as "玩家 N"
            const displayName = p.characterId === myCharacterId ? "你" : `玩家 ${i + 1}`;
            return (
              <span
                key={p.characterId}
                className={`mc-prep-badge ${p.characterId === myCharacterId ? "me" : ""}`}
              >
                <span className={`mc-prep-dot ${p.status}`} />
                {displayName} {STATUS_LABELS[p.status]}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
