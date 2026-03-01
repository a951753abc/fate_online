import type { PlayerInfo } from "../types/protocol.js";

interface PlayerListProps {
  readonly players: readonly PlayerInfo[];
  readonly currentPlayerId: string | null;
  readonly isHost: boolean;
  readonly onKick?: (playerId: string) => void;
}

export function PlayerList({ players, currentPlayerId, isHost, onKick }: PlayerListProps) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {players.map((player) => (
        <li
          key={player.id}
          style={{
            padding: "8px 12px",
            marginBottom: "4px",
            background: player.id === currentPlayerId ? "#e3f2fd" : "#f5f5f5",
            borderRadius: "4px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: player.isConnected ? 1 : 0.5,
          }}
        >
          <span>
            {player.nickname}
            {player.isHost && " [Host]"}
            {!player.isConnected && " (disconnected)"}
          </span>
          <span style={{ fontSize: "0.85em", color: "#666" }}>
            {player.rolePreference.toUpperCase()}
            {isHost && player.id !== currentPlayerId && onKick && (
              <button
                onClick={() => onKick(player.id)}
                style={{ marginLeft: "8px", cursor: "pointer" }}
              >
                Kick
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
