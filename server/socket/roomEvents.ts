import type { Server, Socket } from "socket.io";
import { ClientEvents } from "./events.js";
import {
  emitRoomCreated,
  emitRoomJoined,
  emitRoomState,
  emitRoomError,
  emitRoomStarted,
} from "./emitter.js";
import {
  createRoom,
  joinRoom,
  leaveRoom,
  setRolePreference,
  getRoomState,
  getPlayerRoom,
  canStartGame,
  startGame,
  getInternalPlayers,
  setPlayerConnection,
} from "../room/roomManager.js";
import { assignRoles } from "../room/roleAssignment.js";
import type { RoomJoinPayload, SetRolePayload, KickPayload } from "../shared/protocol.js";

// Track disconnect timers for reconnection grace period
const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function registerRoomEvents(io: Server, socket: Socket): void {
  const playerId: string = socket.data.playerId;

  socket.on(ClientEvents.ROOM_CREATE, async () => {
    try {
      const { code } = await createRoom(playerId, socket.id, socket.data.nickname);
      socket.join(code);
      emitRoomCreated(socket, { code, playerId });

      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    } catch {
      emitRoomError(socket, { message: "Failed to create room" });
    }
  });

  socket.on(ClientEvents.ROOM_JOIN, async (payload: RoomJoinPayload) => {
    try {
      const code = payload.code.toUpperCase();
      const result = await joinRoom(code, playerId, socket.id, socket.data.nickname);

      if (!result.success) {
        emitRoomError(socket, { message: result.error! });
        return;
      }

      socket.join(code);
      emitRoomJoined(socket, { code, playerId });

      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    } catch {
      emitRoomError(socket, { message: "Failed to join room" });
    }
  });

  socket.on(ClientEvents.ROOM_LEAVE, async () => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    await leaveRoom(code, playerId);
    socket.leave(code);

    const state = await getRoomState(code);
    if (state) emitRoomState(io, code, state);
  });

  socket.on(ClientEvents.ROOM_SET_ROLE, async (payload: SetRolePayload) => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    await setRolePreference(code, playerId, payload.rolePreference);

    const state = await getRoomState(code);
    if (state) emitRoomState(io, code, state);
  });

  socket.on(ClientEvents.ROOM_START, async () => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    const state = await getRoomState(code);
    if (!state) return;

    // Only host can start
    const player = state.players.find((p) => p.id === playerId);
    if (!player?.isHost) {
      emitRoomError(socket, { message: "Only host can start the game" });
      return;
    }

    const check = await canStartGame(code);
    if (!check.canStart) {
      emitRoomError(socket, { message: check.error! });
      return;
    }

    await startGame(code);
    const players = await getInternalPlayers(code);
    const pairing = assignRoles(players, state.maxGroups);
    emitRoomStarted(io, code, pairing);
  });

  socket.on(ClientEvents.ROOM_KICK, async (payload: KickPayload) => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    const state = await getRoomState(code);
    if (!state) return;

    const player = state.players.find((p) => p.id === playerId);
    if (!player?.isHost) {
      emitRoomError(socket, { message: "Only host can kick players" });
      return;
    }

    if (payload.targetPlayerId === playerId) {
      emitRoomError(socket, { message: "Cannot kick yourself" });
      return;
    }

    await leaveRoom(code, payload.targetPlayerId);
    // Notify kicked player's socket to leave room
    const kickedSockets = await io.in(code).fetchSockets();
    for (const s of kickedSockets) {
      if (s.data.playerId === payload.targetPlayerId) {
        s.leave(code);
        s.emit("room:error", { message: "You have been kicked from the room" });
      }
    }

    const updatedState = await getRoomState(code);
    if (updatedState) emitRoomState(io, code, updatedState);
  });

  // Handle disconnect with 5s grace period
  socket.on("disconnect", async () => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    await setPlayerConnection(code, playerId, false);
    const state = await getRoomState(code);
    if (state) emitRoomState(io, code, state);

    const timer = setTimeout(async () => {
      disconnectTimers.delete(playerId);
      await leaveRoom(code, playerId);
      const updatedState = await getRoomState(code);
      if (updatedState) emitRoomState(io, code, updatedState);
    }, 5000);

    disconnectTimers.set(playerId, timer);
  });

  // Check if reconnecting
  const existingTimer = disconnectTimers.get(playerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    disconnectTimers.delete(playerId);

    getPlayerRoom(playerId).then(async (code) => {
      if (!code) return;
      await setPlayerConnection(code, playerId, true);
      socket.join(code);
      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    });
  }
}
