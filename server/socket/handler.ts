import crypto from "node:crypto";
import type { Server } from "socket.io";
import { registerRoomEvents } from "./roomEvents.js";
import { registerGameEvents } from "./gameEvents.js";
import { rollDice } from "../dice/engine.js";
import { ClientEvents } from "./events.js";
import { emitDiceResult, emitRoomError } from "./emitter.js";

export function setupSocketHandler(io: Server): void {
  // Auth middleware: validate nickname
  io.use((socket, next) => {
    const nickname = socket.handshake.auth.nickname;
    if (typeof nickname !== "string" || nickname.trim().length === 0) {
      return next(new Error("請輸入暱稱"));
    }
    if (nickname.length > 20) {
      return next(new Error("暱稱不可超過 20 字"));
    }

    socket.data.playerId = crypto.randomUUID();
    socket.data.nickname = nickname.trim();
    next();
  });

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.data.nickname} (${socket.data.playerId})`);

    registerRoomEvents(io, socket);
    registerGameEvents(io, socket);

    // Dice roll handler
    socket.on(
      ClientEvents.DICE_ROLL,
      (payload: { count?: number; sides?: number; modifier?: number }) => {
        try {
          const count = payload.count ?? 2;
          const sides = payload.sides ?? 6;
          const modifier = payload.modifier ?? 0;

          if (count < 1 || count > 10 || sides < 2 || sides > 100) {
            emitRoomError(socket, { message: "無效的骰子參數" });
            return;
          }

          const result = rollDice(count, sides, modifier);
          emitDiceResult(socket, result);
        } catch {
          emitRoomError(socket, { message: "擲骰失敗" });
        }
      },
    );
  });
}
