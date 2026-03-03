import type { Server, Socket } from "socket.io";
import { ClientEvents, ServerEvents } from "./events.js";
import { getPlayerRoom } from "../room/roomManager.js";
import { getNightPhase, getCharacter, setGameStatus } from "../game/gameStateManager.js";
import { submitMasterBuild, confirmReady, getPrepState } from "../game/prepManager.js";
import { NightCycleEngine } from "../game/nightCycle.js";
import { registerGame } from "../game/activeGames.js";
import type { PrepSubmitPayload } from "../shared/protocol.js";
import type { AbilityStatKey, LevelAllocation } from "../game/character/masterTypes.js";

export function registerPrepEvents(io: Server, socket: Socket): void {
  const playerId: string = socket.data.playerId;

  socket.on(ClientEvents.PREP_SUBMIT, async (payload: PrepSubmitPayload) => {
    try {
      const code = await getPlayerRoom(playerId);
      if (!code) {
        socket.emit(ServerEvents.PREP_RESULT, { success: false, error: "不在任何房間中" });
        return;
      }

      // Targeted reads: only nightPhase + character type (not full game state)
      const [phase, myChar] = await Promise.all([
        getNightPhase(code),
        getCharacter(code, playerId),
      ]);
      if (phase !== "preparation") {
        socket.emit(ServerEvents.PREP_RESULT, { success: false, error: "不在準備階段" });
        return;
      }
      if (!myChar || myChar.type !== "master") {
        socket.emit(ServerEvents.PREP_RESULT, { success: false, error: "只有マスター可以創角" });
        return;
      }

      const allocation = payload.allocation as readonly LevelAllocation[];
      const freePoint = payload.freePoint as AbilityStatKey;

      const result = await submitMasterBuild(code, playerId, allocation, freePoint);
      socket.emit(ServerEvents.PREP_RESULT, result);

      // Broadcast updated prep state
      const prepState = await getPrepState(code);
      io.to(code).emit(ServerEvents.PREP_STATE, { players: prepState });
    } catch (err) {
      console.error("[prep:submit] error:", err);
      socket.emit(ServerEvents.PREP_RESULT, { success: false, error: "提交處理失敗" });
    }
  });

  socket.on(ClientEvents.PREP_READY, async () => {
    try {
      const code = await getPlayerRoom(playerId);
      if (!code) return;

      const phase = await getNightPhase(code);
      if (phase !== "preparation") return;

      const readyResult = await confirmReady(code, playerId);
      if (!readyResult.success) {
        socket.emit(ServerEvents.PREP_RESULT, { success: false, error: "確認就緒失敗" });
        return;
      }

      // Broadcast updated prep state (reuses data already read by confirmReady)
      io.to(code).emit(ServerEvents.PREP_STATE, { players: readyResult.players });

      if (readyResult.allReady) {
        // Transition to Night 1
        await setGameStatus(code, "active");

        const engine = new NightCycleEngine(code, io);
        registerGame(code, engine);
        engine.start();
      }
    } catch (err) {
      console.error("[prep:ready] error:", err);
    }
  });
}
