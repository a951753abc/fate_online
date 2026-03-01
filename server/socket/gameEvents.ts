import type { Server, Socket } from "socket.io";
import { ClientEvents, ServerEvents } from "./events.js";
import { getPlayerRoom } from "../room/roomManager.js";
import { submitMove, getGameState } from "../game/gameStateManager.js";
import type { GameMovePayload } from "../shared/protocol.js";

export function registerGameEvents(io: Server, socket: Socket): void {
  const playerId: string = socket.data.playerId;

  socket.on(ClientEvents.GAME_MOVE, async (payload: GameMovePayload) => {
    try {
      const code = await getPlayerRoom(playerId);
      if (!code) {
        socket.emit(ServerEvents.GAME_MOVE_RESULT, { success: false, error: "不在任何房間中" });
        return;
      }

      const state = await getGameState(code);
      if (!state || state.status !== "active") {
        socket.emit(ServerEvents.GAME_MOVE_RESULT, { success: false, error: "遊戲未在進行中" });
        return;
      }

      // Find this player's character
      const character = state.characters.find((c) => c.characterId === playerId);
      if (!character) {
        socket.emit(ServerEvents.GAME_MOVE_RESULT, {
          success: false,
          error: "找不到角色",
        });
        return;
      }

      const result = await submitMove(code, playerId, payload.targetLocation);
      socket.emit(ServerEvents.GAME_MOVE_RESULT, {
        success: result.success,
        error: result.error,
        newLocation: result.success ? payload.targetLocation : undefined,
      });
    } catch {
      socket.emit(ServerEvents.GAME_MOVE_RESULT, {
        success: false,
        error: "移動處理失敗",
      });
    }
  });
}
