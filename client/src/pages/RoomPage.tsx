import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket.js";
import { useRoom } from "../hooks/useRoom.js";
import { PlayerList } from "../components/PlayerList.js";
import { RoleSelector } from "../components/RoleSelector.js";
import { DiceTest } from "../components/DiceTest.js";

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const { socket } = useSocket(null); // Already connected from LobbyPage
  const { roomState, playerId, error, pairing, setRole, startGame, leaveRoom, kickPlayer } =
    useRoom(socket);

  const currentPlayer = roomState?.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  if (!roomState) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "24px" }}>
        <p>Loading room {code}...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Room: {roomState.code}</h1>
        <button onClick={leaveRoom} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Leave
        </button>
      </div>

      <p>
        Players: {roomState.players.length} / {roomState.maxGroups * 2}
      </p>

      <PlayerList
        players={roomState.players}
        currentPlayerId={playerId}
        isHost={isHost}
        onKick={kickPlayer}
      />

      <div style={{ marginTop: "16px" }}>
        <h3>Your Role Preference</h3>
        <RoleSelector current={currentPlayer?.rolePreference ?? "any"} onChange={setRole} />
      </div>

      {isHost && (
        <div style={{ marginTop: "24px" }}>
          <button
            onClick={startGame}
            disabled={roomState.players.length < roomState.minHumanPairs * 2}
            style={{
              padding: "12px 24px",
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1.1em",
            }}
          >
            Start Game
          </button>
        </div>
      )}

      {pairing && (
        <div
          style={{ marginTop: "24px", padding: "16px", background: "#e8f5e9", borderRadius: "8px" }}
        >
          <h3>Game Started!</h3>
          <p>Human pairs: {pairing.humanPairs.length}</p>
          <p>NPC groups: {pairing.npcGroupCount}</p>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: "16px" }}>{error}</p>}

      <div style={{ marginTop: "32px" }}>
        <DiceTest socket={socket} />
      </div>
    </div>
  );
}
