import { useState, useMemo } from "react";
import type {
  PrepConfig,
  PrepSubmitPayload,
  PrepResultPayload,
  PrepStatePayload,
  PrepStatus,
  MasterLevelView,
} from "../../types/protocol.js";

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

  // Derive isReady from server state to avoid client-server desync
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
      <div style={containerStyle}>
        <h2 style={headerStyle}>準備階段</h2>
        <p style={{ color: "#8b949e", textAlign: "center" }}>
          サーヴァント角色系統尚未開放，請等待マスター完成創角。
        </p>
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
      // +1 to existing class
      setSelected(selected.map((s) => (s.id === id ? { ...s, level: s.level + 1 } : s)));
    } else if (selected.length < prepConfig.maxClasses) {
      // Add new class at LV1
      setSelected([...selected, { id, level: 1 }]);
    }
  };

  const handleResetUpgrade = () => {
    // Revert to starting allocation (remove upgrade)
    const startingTotal = prepConfig.startingPoints;
    let pointsToRemove = totalAllocated - startingTotal;
    // Remove from last added levels
    const reverted = [...selected].reverse().reduce<SelectedLevel[]>((acc, s) => {
      if (pointsToRemove > 0) {
        const reduce = Math.min(pointsToRemove, s.level - (s.level > 1 ? 1 : 0));
        // If this would drop to 0 and was a newly added class (level=1), remove it
        if (s.level - reduce < 1) {
          pointsToRemove -= s.level;
          return acc; // drop this class
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

  const stepLabel =
    step === "starting"
      ? `Step 1: 起始配點（${prepConfig.startingPoints} 等）`
      : `Step 2: 升級（+${upgradeLevels}）`;

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>マスター創角</h2>
      <div style={stepIndicatorStyle}>{stepLabel}</div>

      {/* Step 1: Level Selection (locked in step 2) */}
      <section style={sectionStyle}>
        <h3 style={subHeaderStyle}>
          級別選擇（{selected.length}/{prepConfig.maxClasses}）
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {prepConfig.availableLevels.map((lv) => {
            const isSelected = selected.some((s) => s.id === lv.id);
            return (
              <button
                key={lv.id}
                onClick={() => toggleLevel(lv.id)}
                disabled={locked}
                style={{
                  ...levelCardStyle,
                  background: isSelected ? "#1f6feb" : "#21262d",
                  border: isSelected ? "1px solid #388bfd" : "1px solid #30363d",
                  opacity: locked ? 0.6 : 1,
                }}
              >
                <strong>{lv.nameJa}</strong>
                <div style={{ fontSize: "0.8em", color: "#8b949e", marginTop: "4px" }}>
                  體{lv.baseStats.body} 知{lv.baseStats.perception} 理{lv.baseStats.reason} 意
                  {lv.baseStats.will}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 1: Level Allocation */}
      {selected.length > 0 && step === "starting" && (
        <section style={sectionStyle}>
          <h3 style={subHeaderStyle}>起始等級分配（剩餘 {remaining} 點）</h3>
          {selected.map((s) => {
            const def = levelMap.get(s.id);
            return (
              <div key={s.id} style={allocationRowStyle}>
                <span style={{ minWidth: "80px" }}>{def?.nameJa ?? s.id}</span>
                <button
                  onClick={() => adjustLevel(s.id, -1)}
                  disabled={s.level <= 1}
                  style={pmButtonStyle}
                >
                  -
                </button>
                <span style={{ minWidth: "30px", textAlign: "center", fontWeight: "bold" }}>
                  LV{s.level}
                </span>
                <button
                  onClick={() => adjustLevel(s.id, 1)}
                  disabled={remaining <= 0}
                  style={pmButtonStyle}
                >
                  +
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* Step 1: Free Point */}
      {selected.length > 0 && step === "starting" && (
        <section style={sectionStyle}>
          <h3 style={subHeaderStyle}>自由配點（+1）</h3>
          <div style={{ display: "flex", gap: "8px" }}>
            {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setFreePoint(key)}
                style={{
                  ...freePointButtonStyle,
                  background: freePoint === key ? "#1f6feb" : "#21262d",
                  border: freePoint === key ? "1px solid #388bfd" : "1px solid #30363d",
                }}
              >
                {ABILITY_LABELS[key]}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 1: Confirm Starting */}
      {step === "starting" && (
        <div style={{ marginTop: "16px" }}>
          <button
            onClick={handleConfirmStarting}
            disabled={!canConfirmStarting}
            style={{
              ...actionButtonStyle,
              background: canConfirmStarting ? "#238636" : "#21262d",
              cursor: canConfirmStarting ? "pointer" : "not-allowed",
            }}
          >
            確認起始能力
          </button>
        </div>
      )}

      {/* Step 2: Upgrade Selection */}
      {step === "upgrade" && !isReady && remaining > 0 && (
        <section style={sectionStyle}>
          <h3 style={subHeaderStyle}>
            選擇升級（+{upgradeLevels}，剩餘 {remaining}）
          </h3>
          <p style={{ fontSize: "0.85em", color: "#8b949e", marginBottom: "8px" }}>
            選擇一個級別升級，可以是既有級別 +1 或新級別 LV1。
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {prepConfig.availableLevels.map((lv) => {
              const existing = selected.find((s) => s.id === lv.id);
              const canAdd = existing || selected.length < prepConfig.maxClasses;
              return (
                <button
                  key={lv.id}
                  onClick={() => handleUpgradeSelect(lv.id)}
                  disabled={!canAdd || remaining <= 0}
                  style={{
                    ...levelCardStyle,
                    background: existing ? "#1f6feb" : "#21262d",
                    border: existing ? "1px solid #388bfd" : "1px solid #30363d",
                    opacity: !canAdd || remaining <= 0 ? 0.4 : 1,
                  }}
                >
                  <strong>{lv.nameJa}</strong>
                  <div style={{ fontSize: "0.8em", color: "#8b949e", marginTop: "4px" }}>
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
        <section style={sectionStyle}>
          <h3 style={subHeaderStyle}>最終等級配置</h3>
          {selected.map((s) => {
            const def = levelMap.get(s.id);
            return (
              <div key={s.id} style={allocationRowStyle}>
                <span style={{ minWidth: "80px" }}>{def?.nameJa ?? s.id}</span>
                <span style={{ fontWeight: "bold" }}>LV{s.level}</span>
              </div>
            );
          })}
          <div style={{ marginTop: "4px", fontSize: "0.85em", color: "#8b949e" }}>
            自由配點: {ABILITY_LABELS[freePoint]} +1
          </div>
        </section>
      )}

      {/* Step 2: Actions */}
      {step === "upgrade" && !isReady && (
        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
          <button
            onClick={handleResetUpgrade}
            style={{
              ...actionButtonStyle,
              background: "#21262d",
              border: "1px solid #30363d",
              cursor: "pointer",
            }}
          >
            重新選擇
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...actionButtonStyle,
              background: canSubmit ? "#238636" : "#21262d",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            送出
          </button>
        </div>
      )}

      {/* Ready button (after server confirms build) */}
      {hasStats && !isReady && (
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={onReady}
            style={{ ...actionButtonStyle, background: "#1f6feb", cursor: "pointer" }}
          >
            確認就緒
          </button>
        </div>
      )}

      {/* Error */}
      {buildResult && !buildResult.success && (
        <div style={{ marginTop: "8px", color: "#f85149" }}>{buildResult.error}</div>
      )}

      {/* Stats Display */}
      {hasStats && buildResult.stats && <StatsPanel stats={buildResult.stats} />}

      {/* Ready Status */}
      {isReady && (
        <div style={{ marginTop: "12px", color: "#58a6ff", textAlign: "center" }}>
          已就緒，等待其他玩家...
        </div>
      )}

      {/* Prep Status */}
      {prepState && <PrepStatusList prepState={prepState} myCharacterId={myCharacterId} />}
    </div>
  );
}

// === Sub-components ===

function StatsPanel({ stats }: { readonly stats: NonNullable<PrepResultPayload["stats"]> }) {
  return (
    <div style={{ marginTop: "16px" }}>
      <h3 style={subHeaderStyle}>數值計算結果</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {/* Base Abilities + Bonuses */}
        <div style={statBoxStyle}>
          <h4 style={statBoxHeaderStyle}>基本能力値 / 能力紅利</h4>
          {(Object.keys(ABILITY_LABELS) as AbilityKey[]).map((key) => (
            <div key={key} style={statRowStyle}>
              <span>{ABILITY_LABELS[key]}</span>
              <span>
                {stats.baseAbilities[key]}{" "}
                <span style={{ color: "#8b949e" }}>（+{stats.bonuses[key]}）</span>
              </span>
            </div>
          ))}
        </div>

        {/* Final Combat */}
        <div style={statBoxStyle}>
          <h4 style={statBoxHeaderStyle}>最終戰鬥値</h4>
          {Object.entries(COMBAT_LABELS).map(([key, label]) => (
            <div key={key} style={statRowStyle}>
              <span>{label}</span>
              <span>
                {stats.finalCombat[key as keyof typeof stats.finalCombat]}{" "}
                <span style={{ color: "#8b949e" }}>
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

const STATUS_COLORS: Record<PrepStatus, string> = {
  pending: "#8b949e",
  submitted: "#d29922",
  ready: "#3fb950",
};

function PrepStatusList({
  prepState,
  myCharacterId,
}: {
  readonly prepState: PrepStatePayload;
  readonly myCharacterId: string;
}) {
  return (
    <div style={{ marginTop: "16px" }}>
      <h3 style={subHeaderStyle}>準備狀態</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {prepState.players
          .filter((p) => p.role === "master")
          .map((p) => (
            <span
              key={p.characterId}
              style={{
                padding: "4px 10px",
                borderRadius: "12px",
                fontSize: "0.85em",
                background: p.characterId === myCharacterId ? "#30363d" : "#21262d",
                color: STATUS_COLORS[p.status],
                border: `1px solid ${STATUS_COLORS[p.status]}`,
                fontWeight: p.characterId === myCharacterId ? "bold" : "normal",
              }}
            >
              {p.characterId.startsWith("npc-") ? "NPC" : p.characterId.slice(0, 8)}{" "}
              {STATUS_LABELS[p.status]}
            </span>
          ))}
      </div>
    </div>
  );
}

// === Styles ===

const containerStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "20px auto",
  padding: "24px",
  color: "#c9d1d9",
};

const headerStyle: React.CSSProperties = {
  color: "#f0f6fc",
  marginBottom: "20px",
  borderBottom: "1px solid #30363d",
  paddingBottom: "12px",
};

const stepIndicatorStyle: React.CSSProperties = {
  color: "#58a6ff",
  fontSize: "0.9em",
  marginBottom: "12px",
  padding: "6px 12px",
  background: "#161b22",
  borderRadius: "6px",
  border: "1px solid #21262d",
};

const subHeaderStyle: React.CSSProperties = {
  color: "#c9d1d9",
  fontSize: "1em",
  marginBottom: "8px",
};

const sectionStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "12px 16px",
  background: "#161b22",
  borderRadius: "8px",
  border: "1px solid #30363d",
};

const levelCardStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "6px",
  color: "#c9d1d9",
  cursor: "pointer",
  textAlign: "left",
  minWidth: "110px",
};

const allocationRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "6px 0",
};

const pmButtonStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "6px",
  border: "1px solid #30363d",
  background: "#21262d",
  color: "#c9d1d9",
  cursor: "pointer",
  fontSize: "1.1em",
  fontWeight: "bold",
};

const freePointButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  color: "#c9d1d9",
  cursor: "pointer",
};

const actionButtonStyle: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: "6px",
  border: "none",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "1em",
};

const statBoxStyle: React.CSSProperties = {
  padding: "12px",
  background: "#161b22",
  borderRadius: "8px",
  border: "1px solid #30363d",
};

const statBoxHeaderStyle: React.CSSProperties = {
  color: "#58a6ff",
  fontSize: "0.9em",
  marginBottom: "8px",
  borderBottom: "1px solid #21262d",
  paddingBottom: "4px",
};

const statRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "2px 0",
  fontSize: "0.9em",
};
