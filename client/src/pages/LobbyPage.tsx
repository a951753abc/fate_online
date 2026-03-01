import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext.js";
import { useRoom } from "../hooks/useRoom.js";

export function LobbyPage() {
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();

  const { socket, isConnected, connect } = useSocketContext();
  const { roomCode, error, createRoom, joinRoom } = useRoom(socket);

  useEffect(() => {
    if (roomCode) {
      navigate(`/room/${roomCode}`);
    }
  }, [roomCode, navigate]);

  const handleCreate = () => {
    if (!nickname.trim()) return;
    setIsConnecting(true);
    connect(nickname);
  };

  // Once connected, auto-create room
  useEffect(() => {
    if (isConnected && isConnecting && !joinCode) {
      createRoom();
    }
  }, [isConnected, isConnecting, joinCode, createRoom]);

  const handleJoin = () => {
    if (!nickname.trim() || !joinCode.trim()) return;
    setIsConnecting(true);
    connect(nickname);
  };

  // Once connected with joinCode, auto-join room
  useEffect(() => {
    if (isConnected && isConnecting && joinCode) {
      joinRoom(joinCode);
    }
  }, [isConnected, isConnecting, joinCode, joinRoom]);

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", padding: "24px" }}>
      <h1>聖杯戰爭 Online</h1>

      <div style={{ marginBottom: "24px" }}>
        <label>
          Nickname:
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <button
          onClick={handleCreate}
          disabled={!nickname.trim() || isConnecting}
          style={{ padding: "12px", cursor: "pointer" }}
        >
          Create Room
        </button>

        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            placeholder="Room Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ flex: 1, padding: "8px" }}
          />
          <button
            onClick={handleJoin}
            disabled={!nickname.trim() || !joinCode.trim() || isConnecting}
            style={{ padding: "12px", cursor: "pointer" }}
          >
            Join
          </button>
        </div>
      </div>

      {error && <p style={{ color: "red", marginTop: "16px" }}>{error}</p>}
    </div>
  );
}
