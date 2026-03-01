import { useState, useEffect } from "react";
import type { NightPhase } from "../../types/protocol.js";

const PHASE_LABELS: Record<NightPhase, string> = {
  free_action: "自由行動期",
  encounter: "遭遇結算期",
  settlement: "夜間結算",
};

interface NightHudProps {
  readonly nightNumber: number;
  readonly phase: NightPhase;
  readonly phaseEndsAt: number;
}

export function NightHud({ nightNumber, phase, phaseEndsAt }: NightHudProps) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, phaseEndsAt - Date.now());
      const seconds = Math.ceil(diff / 1000);
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      setRemaining(`${min}:${String(sec).padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [phaseEndsAt]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        background: "#1a1a2e",
        color: "#e0e0e0",
        borderRadius: "8px",
        fontFamily: "monospace",
      }}
    >
      <span style={{ fontSize: "1.1em", fontWeight: "bold" }}>Night {nightNumber}</span>
      <span style={{ color: "#ffd700" }}>{PHASE_LABELS[phase]}</span>
      <span>{remaining}</span>
    </div>
  );
}
