import { useState, useMemo } from "react";
import type {
  PrepConfig,
  PrepSubmitPayload,
  PrepResultPayload,
  PrepStatePayload,
  PrepStatus,
  MasterLevelView,
} from "../../types/protocol.js";
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

type CreationStep = "starting" | "upgrade";

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

  const canConfirmStarting = step === "starting" && selected.length > 0 && remaining === 0;
  const canSubmit = step === "upgrade" && remaining === 0;
  const hasStats = buildResult?.success && buildResult.stats;
  const locked = isReady || step === "upgrade";

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
    setStep("upgrade");
  };

  const handleUpgradeSelect = (id: string) => {
    const exists = selected.find((s) => s.id === id);
    if (exists) {
      setSelected(selected.map((s) => (s.id === id ? { ...s, level: s.level + 1 } : s)));
    } else if (selected.length < prepConfig.maxClasses) {
      setSelected([...selected, { id, level: 1 }]);
    }
  };

  const handleResetUpgrade = () => {
    const startingTotal = prepConfig.startingPoints;
    let pointsToRemove = totalAllocated - startingTotal;
    const reverted = [...selected].reverse().reduce<SelectedLevel[]>((acc, s) => {
      if (pointsToRemove > 0) {
        const reduce = Math.min(pointsToRemove, s.level - (s.level > 1 ? 1 : 0));
        if (s.level - reduce < 1) {
          pointsToRemove -= s.level;
          return acc;
        }
        pointsToRemove -= reduce;
        return [{ ...s, level: s.level - reduce }, ...acc];
      }
      return [s, ...acc];
    }, []);
    setSelected(reverted);
    setStep("starting");
  };

  const handleSubmit = () => {
    const allocation = selected.map((s) => ({ levelId: s.id, level: s.level }));
    onSubmit({ allocation, freePoint });
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
            {`Step 1: 起始配點（${prepConfig.startingPoints} 等）`}
          </span>
        </div>
        <div className={`mc-step-line ${step === "upgrade" ? "done" : ""}`} />
        <div className="mc-step">
          <span className={`mc-step-num ${step === "upgrade" ? "active" : ""}`}>2</span>
          <span className={`mc-step-label ${step === "upgrade" ? "active" : ""}`}>
            {`Step 2: 升級（+${upgradeLevels}）`}
          </span>
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

      {/* Step 2: Current Allocation Summary */}
      {step === "upgrade" && (
        <section className="mc-section">
          <h3 className="mc-section-title">最終等級配置</h3>
          {selected.map((s) => {
            const def = levelMap.get(s.id);
            return (
              <div key={s.id} className="mc-summary-row">
                <span className="mc-summary-name">{def?.nameJa ?? s.id}</span>
                <span className="mc-summary-level">LV{s.level}</span>
              </div>
            );
          })}
          <div className="mc-summary-free">自由配點: {ABILITY_LABELS[freePoint]} +1</div>
        </section>
      )}

      {/* Step 2: Actions */}
      {step === "upgrade" && !isReady && (
        <div className="mc-actions">
          <button onClick={handleResetUpgrade} className="mc-btn mc-btn-secondary">
            重新選擇
          </button>
          <button onClick={handleSubmit} disabled={!canSubmit} className="mc-btn mc-btn-confirm">
            送出
          </button>
        </div>
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
