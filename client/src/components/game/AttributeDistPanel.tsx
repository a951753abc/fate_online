import { useState, useMemo } from "react";
import type { SkillInstanceConfigPayload } from "../../types/protocol.js";

type MagicAttribute = "earth" | "water" | "fire" | "wind" | "void";

const ATTRIBUTES: readonly { key: MagicAttribute; label: string }[] = [
  { key: "earth", label: "地" },
  { key: "water", label: "水" },
  { key: "fire", label: "火" },
  { key: "wind", label: "風" },
  { key: "void", label: "空" },
];

interface AttributeDistPanelProps {
  readonly classLevel: number;
  readonly hasMultiElement?: boolean;
  readonly existingConfig?: SkillInstanceConfigPayload;
  readonly onConfirm: (config: SkillInstanceConfigPayload) => void;
  readonly onCancel: () => void;
}

export function AttributeDistPanel({
  classLevel,
  hasMultiElement = false,
  existingConfig,
  onConfirm,
  onCancel,
}: AttributeDistPanelProps) {
  const bonusPoints = hasMultiElement ? 2 : 0;
  const totalPoints = classLevel + 1 + bonusPoints;
  const maxTypes = hasMultiElement ? 5 : 3;

  const [distribution, setDistribution] = useState<Record<MagicAttribute, number>>(() => {
    if (existingConfig?.distribution) {
      const dist = existingConfig.distribution as Record<string, number>;
      return {
        earth: dist.earth ?? 0,
        water: dist.water ?? 0,
        fire: dist.fire ?? 0,
        wind: dist.wind ?? 0,
        void: dist.void ?? 0,
      };
    }
    return { earth: 0, water: 0, fire: 0, wind: 0, void: 0 };
  });

  const allocated = useMemo(
    () => Object.values(distribution).reduce((sum, v) => sum + v, 0),
    [distribution],
  );
  const remaining = totalPoints - allocated;
  const activeCount = useMemo(
    () => Object.values(distribution).filter((v) => v > 0).length,
    [distribution],
  );

  const canConfirm = remaining === 0 && activeCount >= 1 && activeCount <= maxTypes;

  const adjust = (attr: MagicAttribute, delta: number) => {
    setDistribution((prev) => {
      const newVal = prev[attr] + delta;
      if (newVal < 0) return prev;
      // Compute from prev to avoid stale closure
      const currentAllocated = Object.values(prev).reduce((s, v) => s + v, 0);
      const currentRemaining = totalPoints - currentAllocated;
      if (delta > 0 && currentRemaining <= 0) return prev;
      const currentActiveCount = Object.values(prev).filter((v) => v > 0).length;
      if (delta > 0 && newVal === 1 && currentActiveCount >= maxTypes) return prev;
      return { ...prev, [attr]: newVal };
    });
  };

  const handleConfirm = () => {
    // Build distribution with only non-zero attributes
    const dist: Record<string, number> = {};
    for (const [attr, val] of Object.entries(distribution)) {
      if (val > 0) dist[attr] = val;
    }
    onConfirm({ type: "attribute_distribution", distribution: dist });
  };

  return (
    <div className="mc-config-content">
      <h3 className="mc-config-title">魔術迴路 — 屬性分配</h3>
      <p className="mc-config-desc">
        分配 {totalPoints} 點屬性點數（LV{classLevel} + 1{hasMultiElement ? " + 多重屬性 2" : ""}
        ）。可選 1~{maxTypes} 種屬性，每種至少 1 點。
      </p>

      <div className="mc-attr-remaining">
        剩餘 <span className={remaining === 0 ? "complete" : ""}>{remaining}</span> 點
      </div>

      <div className="mc-attr-grid">
        {ATTRIBUTES.map(({ key, label }) => {
          const val = distribution[key];
          const isActive = val > 0;
          return (
            <div key={key} className={`mc-attr-row ${isActive ? "active" : ""}`}>
              <span className="mc-attr-label">{label}</span>
              <div className="mc-attr-controls">
                <button
                  onClick={() => adjust(key, -1)}
                  disabled={val <= 0}
                  className="mc-pm-btn"
                  type="button"
                >
                  -
                </button>
                <span className="mc-attr-value">{val}</span>
                <button
                  onClick={() => adjust(key, 1)}
                  disabled={remaining <= 0 || (val === 0 && activeCount >= maxTypes)}
                  className="mc-pm-btn"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mc-config-actions">
        <button onClick={onCancel} className="mc-btn mc-btn-secondary" type="button">
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="mc-btn mc-btn-confirm"
          type="button"
        >
          確認
        </button>
      </div>
    </div>
  );
}
