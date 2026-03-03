import { useState } from "react";
import type { MysticCodeView, SkillInstanceConfigPayload } from "../../types/protocol.js";

interface MysticCodePickerProps {
  readonly mysticCodes: readonly MysticCodeView[];
  readonly existingConfig?: SkillInstanceConfigPayload;
  readonly onConfirm: (config: SkillInstanceConfigPayload) => void;
  readonly onCancel: () => void;
}

export function MysticCodePicker({
  mysticCodes,
  existingConfig,
  onConfirm,
  onCancel,
}: MysticCodePickerProps) {
  const [selected, setSelected] = useState<string>((existingConfig?.mysticCodeId as string) ?? "");

  const consumables = mysticCodes.filter((mc) => mc.category === "consumable");
  const equipment = mysticCodes.filter((mc) => mc.category === "equipment");

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm({ type: "mystic_code", mysticCodeId: selected });
  };

  return (
    <div className="mc-config-content">
      <h3 className="mc-config-title">禮裝選擇</h3>
      <p className="mc-config-desc">選擇一個禮裝。消耗品在使用後消失，裝備品可持續使用。</p>

      {/* Equipment */}
      <div className="mc-mystic-section">
        <h4 className="mc-mystic-section-title">裝備品</h4>
        <div className="mc-mystic-grid">
          {equipment.map((mc) => (
            <button
              key={mc.id}
              className={`mc-mystic-card ${selected === mc.id ? "selected" : ""}`}
              onClick={() => setSelected(mc.id)}
              type="button"
            >
              <div className="mc-mystic-name">{mc.nameJa}</div>
              {mc.nameJa !== mc.nameCht && <div className="mc-mystic-name-sub">{mc.nameCht}</div>}
              <div className="mc-mystic-desc">{mc.effectDescription}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Consumables */}
      <div className="mc-mystic-section">
        <h4 className="mc-mystic-section-title">消耗品</h4>
        <div className="mc-mystic-grid">
          {consumables.map((mc) => (
            <button
              key={mc.id}
              className={`mc-mystic-card ${selected === mc.id ? "selected" : ""}`}
              onClick={() => setSelected(mc.id)}
              type="button"
            >
              <div className="mc-mystic-name">{mc.nameJa}</div>
              {mc.nameJa !== mc.nameCht && <div className="mc-mystic-name-sub">{mc.nameCht}</div>}
              <div className="mc-mystic-desc">{mc.effectDescription}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mc-config-actions">
        <button onClick={onCancel} className="mc-btn mc-btn-secondary" type="button">
          取消
        </button>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="mc-btn mc-btn-confirm"
          type="button"
        >
          確認
        </button>
      </div>
    </div>
  );
}
