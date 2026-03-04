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
import { initializePrep } from "../game/prepManager.js";
import { PREP_CONFIG } from "../game/prepConfig.js";
import type { NightState } from "../game/types.js";

// Track disconnect timers for reconnection grace period
const disconnectTimers = new Map<string, NodeJS.Timeout>();

/** Wrap async socket handler — log Redis/DB errors instead of crashing */
function safe(fn: () => Promise<void>): void {
  fn().catch((err) => {
    console.error("[socket] handler error:", err);
  });
}

export function registerRoomEvents(io: Server, socket: Socket): void {
  const playerId: string = socket.data.playerId;

  socket.on(ClientEvents.ROOM_CREATE, () =>
    safe(async () => {
      try {
        const { code } = await createRoom(playerId, socket.id, socket.data.nickname);
        socket.join(code);
        emitRoomCreated(socket, { code, playerId });

        const state = await getRoomState(code);
        if (state) emitRoomState(io, code, state);
      } catch {
        emitRoomError(socket, { message: "建立房間失敗" });
      }
    }),
  );

  socket.on(ClientEvents.ROOM_JOIN, (payload: RoomJoinPayload) =>
    safe(async () => {
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
    }),
  );

  socket.on(ClientEvents.ROOM_LEAVE, () =>
    safe(async () => {
      const code = await getPlayerRoom(playerId);
      if (!code) return;

      await leaveRoom(code, playerId);
      socket.leave(code);

      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    }),
  );

  socket.on(ClientEvents.ROOM_SET_ROLE, (payload: SetRolePayload) =>
    safe(async () => {
      const code = await getPlayerRoom(playerId);
      if (!code) return;

      await setRolePreference(code, playerId, payload.rolePreference);

      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    }),
  );

  socket.on(ClientEvents.ROOM_START, () =>
    safe(async () => {
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

      // Inline validation (avoids redundant getRoomState call inside canStartGame)
      if (state.status !== "waiting") {
        emitRoomError(socket, { message: "遊戲已開始" });
        return;
      }
      const playerCount = state.players.length;
      if (playerCount < state.minHumanPairs * 2) {
        emitRoomError(socket, {
          message: `至少需要 ${state.minHumanPairs * 2} 名玩家（目前 ${playerCount} 人）`,
        });
        return;
      }
      const masters = state.players.filter((p) => p.rolePreference === "master").length;
      const servants = state.players.filter((p) => p.rolePreference === "servant").length;
      const anyRole = state.players.filter((p) => p.rolePreference === "any").length;
      const pairs = Math.floor(playerCount / 2);
      if (Math.max(0, pairs - masters) + Math.max(0, pairs - servants) > anyRole) {
        emitRoomError(socket, { message: "無法以目前的偏好分配角色" });
        return;
      }

      await startGame(code);
      const players = await getInternalPlayers(code);
      const pairing = assignRoles(players, state.maxGroups);
      emitRoomStarted(io, code, pairing);

      // Initialize game in preparation phase
      const groups = buildGroupsFromPairing(pairing);
      const startingPositions = assignStartingPositions(groups.length);
      const characters = buildCharactersFromGroups(groups, startingPositions);
      const prepNight: NightState = { nightNumber: 0, phase: "preparation", phaseEndsAt: 0 };
      const gameState = await initializeGame(code, groups, characters, prepNight, "preparation");
      await initializePrep(code, groups);

      // Build nickname map for group views
      const nicknames = new Map<string, string>();
      for (const [id, player] of players) {
        nicknames.set(id, player.nickname);
      }
      const groupViews = buildGroupViews(groups, nicknames);

      // Emit personalized game:initialized to each player
      const sockets = await io.in(code).fetchSockets();
      for (const s of sockets) {
        const payload = buildInitPayloadForPlayer(
          s.data.playerId,
          groups,
          characters,
          groupViews,
          gameState.night,
          PREP_CONFIG,
        );
        if (payload) {
          s.emit(ServerEvents.GAME_INITIALIZED, payload);
        }
      }
    }),
  );

  socket.on(ClientEvents.ROOM_REQUEST_STATE, () =>
    safe(async () => {
      const code = await getPlayerRoom(playerId);
      if (!code) return;

      // Re-send playerId so the client can identify itself
      emitRoomJoined(socket, { code, playerId });

      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    }),
  );

  socket.on(ClientEvents.ROOM_KICK, (payload: KickPayload) =>
    safe(async () => {
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
          s.emit(ServerEvents.ROOM_ERROR, { message: "你已被踢出房間" });
        }
      }

      const updatedState = await getRoomState(code);
      if (updatedState) emitRoomState(io, code, updatedState);
    }),
  );

  // Handle disconnect with 5s grace period
  socket.on("disconnect", () =>
    safe(async () => {
      const code = await getPlayerRoom(playerId);
      if (!code) return;

      await setPlayerConnection(code, playerId, false);
      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);

      const timer = setTimeout(
        () =>
          safe(async () => {
            disconnectTimers.delete(playerId);
            await leaveRoom(code, playerId);
            const updatedState = await getRoomState(code);
            if (updatedState) emitRoomState(io, code, updatedState);
          }),
        5000,
      );

      disconnectTimers.set(playerId, timer);
    }),
  );

  // Check if reconnecting
  const existingTimer = disconnectTimers.get(playerId);
  if (existingTimer) {
    clearTimeout(existingTimer);
    disconnectTimers.delete(playerId);

    safe(async () => {
      const code = await getPlayerRoom(playerId);
      if (!code) return;
      await setPlayerConnection(code, playerId, true);
      socket.join(code);
      const state = await getRoomState(code);
      if (state) emitRoomState(io, code, state);
    });
  }
}
