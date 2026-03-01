import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext.js";
import { useRoom } from "../hooks/useRoom.js";
import { PlayerList } from "../components/PlayerList.js";
import { RoleSelector } from "../components/RoleSelector.js";
import { DiceTest } from "../components/DiceTest.js";

export function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { socket } = useSocketContext();
  const { roomState, playerId, error, pairing, setRole, startGame, leaveRoom, kickPlayer } =
    useRoom(socket);

  // Navigate to game page when game initializes
  useEffect(() => {
    if (!socket) return;
    const onGameInit = () => {
      navigate(`/game/${code}`);
    };
    socket.on("game:initialized", onGameInit);
    return () => {
      socket.off("game:initialized", onGameInit);
    };
  }, [socket, navigate, code]);

  const currentPlayer = roomState?.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
  };

  if (!socket) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "24px" }}>
        <p>Not connected. Please go back to lobby.</p>
        <button onClick={() => navigate("/")} style={{ padding: "8px 16px", cursor: "pointer" }}>
          Back to Lobby
        </button>
      </div>
    );
  }

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
        <button onClick={handleLeave} style={{ padding: "8px 16px", cursor: "pointer" }}>
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
