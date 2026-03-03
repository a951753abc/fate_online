import { useState } from "react";
import type { FamiliarOptionView, SkillInstanceConfigPayload } from "../../types/protocol.js";

interface FamiliarPickerProps {
  readonly familiarOptions: readonly FamiliarOptionView[];
  readonly existingConfig?: SkillInstanceConfigPayload;
  readonly onConfirm: (config: SkillInstanceConfigPayload) => void;
  readonly onCancel: () => void;
}

export function FamiliarPicker({
  familiarOptions,
  existingConfig,
  onConfirm,
  onCancel,
}: FamiliarPickerProps) {
  const [selected, setSelected] = useState<string>((existingConfig?.familiarType as string) ?? "");

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm({ type: "familiar", familiarType: selected });
  };

  return (
    <div className="mc-config-content">
      <h3 className="mc-config-title">使魔選擇</h3>
      <p className="mc-config-desc">選擇使魔的類型。每個使魔有不同的偵察與戰鬥特性。</p>

      <div className="mc-familiar-grid">
        {familiarOptions.map((fam) => (
          <button
            key={fam.type}
            className={`mc-familiar-card ${selected === fam.type ? "selected" : ""}`}
            onClick={() => setSelected(fam.type)}
            type="button"
          >
            <div className="mc-familiar-name">{fam.nameJa}</div>
            {fam.nameJa !== fam.nameCht && (
              <div className="mc-familiar-name-sub">{fam.nameCht}</div>
            )}
            <div className="mc-familiar-desc">{fam.description}</div>
          </button>
        ))}
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
