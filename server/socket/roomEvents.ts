import type { Server, Socket } from "socket.io";
import { ClientEvents, ServerEvents } from "./events.js";
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
import { initializeGame } from "../game/gameStateManager.js";
import { assignStartingPositions } from "../game/startingPositions.js";
import {
  buildGroupsFromPairing,
  buildCharactersFromGroups,
  buildGroupViews,
  buildInitPayloadForPlayer,
} from "../game/initializeGame.js";
import { NightCycleEngine, DEFAULT_NIGHT_CONFIG } from "../game/nightCycle.js";
import { registerGame } from "../game/activeGames.js";

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
      emitRoomError(socket, { message: "建立房間失敗" });
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
      emitRoomError(socket, { message: "加入房間失敗" });
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
      emitRoomError(socket, { message: "只有房主可以開始遊戲" });
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

    // Phase 1: Initialize game state
    const groups = buildGroupsFromPairing(pairing);
    const startingPositions = assignStartingPositions(groups.length);
    const characters = buildCharactersFromGroups(groups, startingPositions);
    const phaseEndsAt = Date.now() + DEFAULT_NIGHT_CONFIG.freeActionDurationMs;
    const gameState = await initializeGame(code, groups, characters, phaseEndsAt);

    // Build nickname map for group views
    const nicknames = new Map<string, string>();
    for (const p of players) {
      nicknames.set(p.id, p.nickname);
    }
    const groupViews = buildGroupViews(groups, nicknames);

    // Start night cycle
    const engine = new NightCycleEngine(code, io);
    registerGame(code, engine);

    // Emit personalized game:initialized to each player
    const sockets = await io.in(code).fetchSockets();
    for (const s of sockets) {
      const payload = buildInitPayloadForPlayer(
        s.data.playerId,
        groups,
        characters,
        groupViews,
        gameState.night,
      );
      if (payload) {
        s.emit(ServerEvents.GAME_INITIALIZED, payload);
      }
    }

    engine.start();
  });

  socket.on(ClientEvents.ROOM_REQUEST_STATE, async () => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    // Re-send playerId so the client can identify itself
    emitRoomJoined(socket, { code, playerId });

    const state = await getRoomState(code);
    if (state) emitRoomState(io, code, state);
  });

  socket.on(ClientEvents.ROOM_KICK, async (payload: KickPayload) => {
    const code = await getPlayerRoom(playerId);
    if (!code) return;

    const state = await getRoomState(code);
    if (!state) return;

    const player = state.players.find((p) => p.id === playerId);
    if (!player?.isHost) {
      emitRoomError(socket, { message: "只有房主可以踢出玩家" });
      return;
    }

    if (payload.targetPlayerId === playerId) {
      emitRoomError(socket, { message: "無法踢出自己" });
      return;
    }

    await leaveRoom(code, payload.targetPlayerId);
    // Notify kicked player's socket to leave room
    const kickedSockets = await io.in(code).fetchSockets();
    for (const s of kickedSockets) {
      if (s.data.playerId === payload.targetPlayerId) {
        s.leave(code);
        s.emit("room:error", { message: "你已被踢出房間" });
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
