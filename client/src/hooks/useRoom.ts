import { useEffect, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { RoomState, RolePreference, PairingResult } from "../types/protocol.js";

export function useRoom(socket: Socket | null) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pairing, setPairing] = useState<PairingResult | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onCreated = (payload: { code: string; playerId: string }) => {
      setRoomCode(payload.code);
      setPlayerId(payload.playerId);
      setError(null);
    };

    const onJoined = (payload: { code: string; playerId: string }) => {
      setRoomCode(payload.code);
      setPlayerId(payload.playerId);
      setError(null);
    };

    const onState = (state: RoomState) => {
      setRoomState(state);
    };

    const onError = (payload: { message: string }) => {
      setError(payload.message);
    };

    const onStarted = (result: PairingResult) => {
      setPairing(result);
    };

    socket.on("room:created", onCreated);
    socket.on("room:joined", onJoined);
    socket.on("room:state", onState);
    socket.on("room:error", onError);
    socket.on("room:started", onStarted);

    return () => {
      socket.off("room:created", onCreated);
      socket.off("room:joined", onJoined);
      socket.off("room:state", onState);
      socket.off("room:error", onError);
      socket.off("room:started", onStarted);
    };
  }, [socket]);

  const createRoom = useCallback(() => {
    socket?.emit("room:create", {});
  }, [socket]);

  const joinRoom = useCallback(
    (code: string) => {
      socket?.emit("room:join", { code });
    },
    [socket],
  );

  const leaveRoom = useCallback(() => {
    socket?.emit("room:leave");
    setRoomState(null);
    setRoomCode(null);
    setPairing(null);
  }, [socket]);

  const setRole = useCallback(
    (rolePreference: RolePreference) => {
      socket?.emit("room:setRole", { rolePreference });
    },
    [socket],
  );

  const startGame = useCallback(() => {
    socket?.emit("room:start");
  }, [socket]);

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      socket?.emit("room:kick", { targetPlayerId });
    },
    [socket],
  );

  return {
    roomState,
    roomCode,
    playerId,
    error,
    pairing,
    createRoom,
    joinRoom,
    leaveRoom,
    setRole,
    startGame,
    kickPlayer,
  };
}
