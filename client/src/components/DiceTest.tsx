import { useState, useEffect } from "react";
import type { Socket } from "socket.io-client";
import type { DiceRollResult } from "../types/protocol.js";

interface DiceTestProps {
  readonly socket: Socket | null;
}

export function DiceTest({ socket }: DiceTestProps) {
  const [result, setResult] = useState<DiceRollResult | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onResult = (data: DiceRollResult) => {
      setResult(data);
    };

    socket.on("dice:result", onResult);
    return () => {
      socket.off("dice:result", onResult);
    };
  }, [socket]);

  const roll = () => {
    socket?.emit("dice:roll", { count: 2, sides: 6, modifier: 0 });
  };

  return (
    <div style={{ padding: "16px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h3>Dice Test (Dev)</h3>
      <button onClick={roll} style={{ padding: "8px 16px", cursor: "pointer" }}>
        Roll 2D6
      </button>
      {result && (
        <div style={{ marginTop: "8px" }}>
          <p>
            {result.formula}: [{result.dice.join(", ")}] = {result.total}
          </p>
        </div>
      )}
    </div>
  );
}
