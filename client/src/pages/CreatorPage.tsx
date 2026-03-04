import { useState, useCallback, useMemo } from "react";
import type { PrepSubmitPayload, PrepResultPayload } from "../types/protocol.js";
import { MasterCreation } from "../components/game/MasterCreation.js";
import { PREP_CONFIG } from "@game/prepConfig.js";
import { validateAndComputeBuild } from "@game/prepValidation.js";
import type { LevelAllocation, AbilityStatKey } from "@game/character/masterTypes.js";

type CreatorPhase = "config" | "creating" | "done";

export function CreatorPage() {
  const [phase, setPhase] = useState<CreatorPhase>("config");

  // Configurable parameters (defaults from bundled config)
  const [startingPoints, setStartingPoints] = useState(PREP_CONFIG.startingPoints);
  const [gameLevel, setGameLevel] = useState(PREP_CONFIG.gameLevel);
  const [maxClasses, setMaxClasses] = useState(PREP_CONFIG.maxClasses);

  // Result state
  const [buildResult, setBuildResult] = useState<PrepResultPayload | null>(null);
  const [lastPayload, setLastPayload] = useState<PrepSubmitPayload | null>(null);

  // Build effective config with user overrides
  const effectiveConfig = useMemo(
    () => ({ ...PREP_CONFIG, startingPoints, gameLevel, maxClasses }),
    [startingPoints, gameLevel, maxClasses],
  );

  const handleSubmit = useCallback(
    (payload: PrepSubmitPayload) => {
      setLastPayload(payload);
      const result = validateAndComputeBuild(
        payload.allocation as unknown as readonly LevelAllocation[],
        payload.freePoint as AbilityStatKey,
        payload.skillSelections,
        effectiveConfig,
      );
      setBuildResult(result);
      if (result.success) {
        setPhase("done");
      }
    },
    [effectiveConfig],
  );

  const handleExportJson = useCallback(() => {
    if (!lastPayload || !buildResult?.success) return;
    const { startingPoints: sp, gameLevel: gl, maxClasses: mc } = effectiveConfig;
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      config: { startingPoints: sp, gameLevel: gl, maxClasses: mc },
      allocation: lastPayload.allocation,
      freePoint: lastPayload.freePoint,
      skillSelections: lastPayload.skillSelections,
      stats: buildResult.stats,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master-build-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [lastPayload, buildResult, effectiveConfig]);

  const handleReset = useCallback(() => {
    setPhase("config");
    setBuildResult(null);
    setLastPayload(null);
  }, []);

  return (
    <div className="creator-page">
      <h1>Master 角色創建工具</h1>

      {phase === "config" && (
        <div className="creator-config-panel">
          <h2>參數設定</h2>
          <div className="creator-config-fields">
            <label>
              起始等級點
              <input
                type="number"
                min={1}
                max={10}
                value={startingPoints}
                onChange={(e) => setStartingPoints(Number(e.target.value))}
              />
            </label>
            <label>
              遊戲等級
              <input
                type="number"
                min={1}
                max={10}
                value={gameLevel}
                onChange={(e) => setGameLevel(Number(e.target.value))}
              />
            </label>
            <label>
              最大級別數
              <input
                type="number"
                min={1}
                max={5}
                value={maxClasses}
                onChange={(e) => setMaxClasses(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            className="creator-start-btn"
            onClick={() => setPhase("creating")}
            disabled={startingPoints < 1 || gameLevel < startingPoints || maxClasses < 1}
          >
            開始創角
          </button>
          {startingPoints > gameLevel && (
            <p className="creator-warning">起始等級點不可大於遊戲等級</p>
          )}
        </div>
      )}

      {phase === "creating" && (
        <div className="creator-creation-panel">
          <div className="creator-params-bar">
            起始等級: {startingPoints} | 遊戲等級: {gameLevel} | 最大級別: {maxClasses}
            <button className="creator-back-btn" onClick={handleReset}>
              返回設定
            </button>
          </div>
          <MasterCreation
            prepConfig={effectiveConfig}
            prepState={null}
            buildResult={buildResult}
            myCharacterId="creator-standalone"
            myRole="master"
            onSubmit={handleSubmit}
            onReady={() => {}}
          />
        </div>
      )}

      {phase === "done" && buildResult?.success && (
        <div className="creator-result-panel">
          <h2>角色創建完成</h2>
          <pre className="creator-stats-preview">{JSON.stringify(buildResult.stats, null, 2)}</pre>
          <div className="creator-actions">
            <button className="creator-export-btn" onClick={handleExportJson}>
              匯出 JSON
            </button>
            <button className="creator-reset-btn" onClick={handleReset}>
              重新創角
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
