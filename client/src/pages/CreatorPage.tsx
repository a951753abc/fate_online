import { useState, useEffect, useCallback, useMemo } from "react";
import type { PrepConfig, PrepSubmitPayload, PrepResultPayload } from "../types/protocol.js";
import { MasterCreation } from "../components/game/MasterCreation.js";

type CreatorPhase = "config" | "creating" | "done";

export function CreatorPage() {
  const [phase, setPhase] = useState<CreatorPhase>("config");
  const [baseConfig, setBaseConfig] = useState<PrepConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configurable parameters
  const [startingPoints, setStartingPoints] = useState(3);
  const [gameLevel, setGameLevel] = useState(4);
  const [maxClasses, setMaxClasses] = useState(3);

  // Result state
  const [buildResult, setBuildResult] = useState<PrepResultPayload | null>(null);
  const [lastPayload, setLastPayload] = useState<PrepSubmitPayload | null>(null);

  // Fetch default config on mount
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/creator/config", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PrepConfig) => {
        setBaseConfig(data);
        setStartingPoints(data.startingPoints);
        setGameLevel(data.gameLevel);
        setMaxClasses(data.maxClasses);
        setLoading(false);
      })
      .catch((err) => {
        if ((err as DOMException).name === "AbortError") return;
        setError(`無法載入配置：${String(err)}`);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  // Build effective config with user overrides
  const effectiveConfig: PrepConfig | null = useMemo(
    () =>
      baseConfig
        ? {
            ...baseConfig,
            startingPoints,
            gameLevel,
            maxClasses,
          }
        : null,
    [baseConfig, startingPoints, gameLevel, maxClasses],
  );

  const handleSubmit = useCallback(
    async (payload: PrepSubmitPayload) => {
      setLastPayload(payload);
      try {
        const res = await fetch("/api/creator/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            allocation: payload.allocation,
            freePoint: payload.freePoint,
            skillSelections: payload.skillSelections,
            config: { startingPoints, gameLevel, maxClasses },
          }),
        });
        const result: PrepResultPayload = await res.json();
        setBuildResult(result);
        if (result.success) {
          setPhase("done");
        }
      } catch (err) {
        setBuildResult({ success: false, error: `提交失敗：${String(err)}` });
      }
    },
    [startingPoints, gameLevel, maxClasses],
  );

  const handleExportJson = useCallback(() => {
    if (!lastPayload || !buildResult?.success) return;
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      config: { startingPoints, gameLevel, maxClasses },
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
  }, [lastPayload, buildResult, startingPoints, gameLevel, maxClasses]);

  const handleReset = useCallback(() => {
    setPhase("config");
    setBuildResult(null);
    setLastPayload(null);
  }, []);

  if (loading) {
    return <div className="creator-page">載入中...</div>;
  }
  if (error || !effectiveConfig) {
    return <div className="creator-page creator-error">{error ?? "配置載入失敗"}</div>;
  }

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
