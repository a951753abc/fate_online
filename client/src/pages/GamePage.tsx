import { useParams, useLocation } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext.js";
import { useGameState } from "../hooks/useGameState.js";
import { MapView } from "../components/game/MapView.js";
import { NightHud } from "../components/game/NightHud.js";
import type { LocationId, GameInitializedPayload } from "../types/protocol.js";

// Adjacency data for valid move calculation (matches server mapData)
const ADJACENCY: Record<string, readonly string[]> = {
  "water-tower": ["old-residential", "mountain-path"],
  "old-residential": ["water-tower", "mountain-path", "shopping"],
  "mountain-path": ["water-tower", "old-residential", "upstream", "bridge"],
  upstream: ["mountain-path", "aqueduct"],
  church: ["bridge"],
  bridge: ["church", "mountain-path", "shopping", "station", "warehouse"],
  shopping: ["old-residential", "bridge", "station"],
  station: ["bridge", "shopping", "port"],
  port: ["station", "warehouse", "river-mouth"],
  warehouse: ["bridge", "port", "river-mouth"],
  "river-mouth": ["warehouse", "port", "aqueduct"],
  aqueduct: ["upstream", "river-mouth"],
};

function getValidMoves(current: LocationId): LocationId[] {
  const adjacent = (ADJACENCY[current] ?? []) as LocationId[];
  if (current === "station") {
    // 2-step BFS from station
    const visited = new Set<string>(["station"]);
    const queue = [{ loc: "station", dist: 0 }];
    const reachable: LocationId[] = [];
    while (queue.length > 0) {
      const { loc, dist } = queue.shift()!;
      if (dist > 0) reachable.push(loc as LocationId);
      if (dist >= 2) continue;
      for (const n of ADJACENCY[loc] ?? []) {
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

  if (!socket) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px" }}>
        <p>Not connected.</p>
      </div>
    );
  }

  if (!game.gameData) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "24px" }}>
        <p>Loading game {code}...</p>
      </div>
    );
  }

  const myLocation =
    game.positions.find((p) => p.characterId === game.gameData!.yourCharacterId)?.location ??
    game.gameData.yourLocation;

  const canMove = game.nightState?.phase === "free_action" && !game.moveSubmitted;
  const validMoves = canMove ? getValidMoves(myLocation) : [];

  // Find partner distance
  const myGroup = game.gameData.yourGroupIndex;
  const partner = game.positions.find(
    (p) => p.groupIndex === myGroup && p.characterId !== game.gameData!.yourCharacterId,
  );

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
            Role: <strong>{game.gameData.yourRole}</strong>
          </span>
          <span>
            Group: <strong>{myGroup}</strong>
          </span>
          <span>
            Position: <strong>{myLocation}</strong>
          </span>
          {partner && (
            <span>
              Partner: <strong>{partner.location}</strong>
            </span>
          )}
        </div>

        {game.moveSubmitted && (
          <div style={{ marginTop: "8px", color: "#58a6ff" }}>Move submitted. Waiting...</div>
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
          <strong>Encounters:</strong>
          {game.encounters.map((e, i) => (
            <div key={i}>
              {e.locationId}: Groups {e.groupIndices.join(" vs ")}
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
          <strong>Night {game.nightReport.nightNumber} Report:</strong>
          {game.nightReport.events.length > 0 ? (
            game.nightReport.events.map((e, i) => <div key={i}>{e}</div>)
          ) : (
            <div>A quiet night.</div>
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
          <strong>Game Over</strong>
          <div>
            {game.gameEnded.reason === "grail_rampage"
              ? "聖杯暴走 — 全員敗北"
              : game.gameEnded.reason === "last_pair"
                ? `Group ${game.gameEnded.winnerGroupIndex} wins!`
                : "All eliminated"}
          </div>
        </div>
      )}
    </div>
  );
}
