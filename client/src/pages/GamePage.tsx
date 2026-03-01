import { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext.js";
import { useGameState } from "../hooks/useGameState.js";
import { MapView } from "../components/game/MapView.js";
import { NightHud } from "../components/game/NightHud.js";
import type { LocationId, GameInitializedPayload } from "../types/protocol.js";
import mapData from "../../../map/map-data.json";

// Derive adjacency from the shared map-data.json (single source of truth)
const ADJACENCY: ReadonlyMap<string, readonly string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const loc of mapData.locations) {
    map.set(loc.id, []);
  }
  for (const conn of mapData.connections) {
    map.get(conn.from)!.push(conn.to);
    map.get(conn.to)!.push(conn.from);
  }
  return map;
})();

function getValidMoves(current: LocationId): LocationId[] {
  const adjacent = (ADJACENCY.get(current) ?? []) as LocationId[];
  if (current === "station") {
    // 2-step BFS from station
    const visited = new Set<string>(["station"]);
    const queue = [{ loc: "station", dist: 0 }];
    const reachable: LocationId[] = [];
    while (queue.length > 0) {
      const { loc, dist } = queue.shift()!;
      if (dist > 0) reachable.push(loc as LocationId);
      if (dist >= 2) continue;
      for (const n of ADJACENCY.get(loc) ?? []) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push({ loc: n, dist: dist + 1 });
        }
      }
    }
    return [current, ...reachable];
  }
  return [current, ...adjacent];
}

export function GamePage() {
  const { code } = useParams<{ code: string }>();
  const location = useLocation();
  const { socket } = useSocketContext();
  const navGameInit = (location.state as { gameInit?: GameInitializedPayload } | null)?.gameInit;
  const game = useGameState(socket, navGameInit);

  const myLocation =
    game.gameData && game.positions.length > 0
      ? (game.positions.find((p) => p.characterId === game.gameData!.yourCharacterId)?.location ??
        game.gameData.yourLocation)
      : (game.gameData?.yourLocation ?? ("bridge" as LocationId));

  const canMove =
    !!game.gameData && game.nightState?.phase === "free_action" && !game.moveSubmitted;
  const validMoves = useMemo(
    () => (canMove ? getValidMoves(myLocation) : []),
    [canMove, myLocation],
  );

  if (!socket) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px" }}>
        <p>尚未連線。</p>
      </div>
    );
  }

  if (!game.gameData) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px" }}>
        <p>載入遊戲 {code}...</p>
      </div>
    );
  }

  const myGroup = game.gameData.yourGroupIndex;
  const partnerPos = game.positions.find(
    (p) => p.groupIndex === myGroup && p.characterId !== game.gameData!.yourCharacterId,
  );
  const myGroupData = game.gameData.groups.find((g) => g.groupIndex === myGroup);
  const partnerNickname = myGroupData
    ? game.gameData.yourRole === "master"
      ? myGroupData.servantNickname
      : myGroupData.masterNickname
    : undefined;

  const handleLocationClick = (id: LocationId) => {
    if (canMove && validMoves.includes(id)) {
      game.submitMove(id);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "20px auto", padding: "16px" }}>
      {/* Night HUD */}
      {game.nightState && (
        <NightHud
          nightNumber={game.nightState.nightNumber}
          phase={game.nightState.phase}
          phaseEndsAt={game.nightState.phaseEndsAt}
        />
      )}

      {/* Map */}
      <div style={{ marginTop: "12px" }}>
        <MapView
          positions={game.positions}
          occupations={game.occupations}
          myCharacterId={game.gameData.yourCharacterId}
          myLocation={myLocation}
          validMoves={validMoves}
          canMove={canMove}
          destroyedLocations={game.destroyedLocations}
          onLocationClick={handleLocationClick}
        />
      </div>

      {/* Status Bar */}
      <div
        style={{
          marginTop: "12px",
          padding: "12px 16px",
          background: "#161b22",
          color: "#c9d1d9",
          borderRadius: "8px",
          fontSize: "0.9em",
        }}
      >
        <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
          <span>
            角色：
            <strong>{game.gameData.yourRole === "master" ? "マスター" : "サーヴァント"}</strong>
          </span>
          <span>
            組別：<strong>{myGroup}</strong>
          </span>
          <span>
            位置：<strong>{myLocation}</strong>
          </span>
          {partnerPos && (
            <span>
              搭檔：<strong>{partnerNickname ?? partnerPos.characterId}</strong>
            </span>
          )}
        </div>

        {game.moveSubmitted && (
          <div style={{ marginTop: "8px", color: "#58a6ff" }}>移動已提交，等待結算...</div>
        )}
        {game.moveError && (
          <div style={{ marginTop: "8px", color: "#f85149" }}>{game.moveError}</div>
        )}
      </div>

      {/* Encounters */}
      {game.encounters.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#2d1b1b",
            borderRadius: "8px",
            color: "#f85149",
          }}
        >
          <strong>遭遇：</strong>
          {game.encounters.map((e, i) => (
            <div key={i}>
              {e.locationId}：第 {e.groupIndices.join(" 組 vs 第 ")} 組
            </div>
          ))}
        </div>
      )}

      {/* Night Report */}
      {game.nightReport && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "#1b2d1b",
            borderRadius: "8px",
            color: "#7ee787",
          }}
        >
          <strong>第 {game.nightReport.nightNumber} 夜報告：</strong>
          {game.nightReport.events.length > 0 ? (
            game.nightReport.events.map((e, i) => <div key={i}>{e}</div>)
          ) : (
            <div>平靜的一夜。</div>
          )}
        </div>
      )}

      {/* Game Ended */}
      {game.gameEnded && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            background: "#2d1b2d",
            borderRadius: "8px",
            color: "#d2a8ff",
            textAlign: "center",
            fontSize: "1.2em",
          }}
        >
          <strong>遊戲結束</strong>
          <div>
            {game.gameEnded.reason === "grail_rampage"
              ? "聖杯暴走 — 全員敗北"
              : game.gameEnded.reason === "last_pair"
                ? `第 ${game.gameEnded.winnerGroupIndex} 組勝利！`
                : "全員脫落"}
          </div>
        </div>
      )}
    </div>
  );
}
