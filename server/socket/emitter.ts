import type { Server, Socket } from "socket.io";
import { ServerEvents } from "./events.js";
import type {
  RoomState,
  RoomCreatedPayload,
  RoomJoinedPayload,
  RoomErrorPayload,
  DiceRollResult,
  PairingResult,
} from "../shared/protocol.js";

export function emitRoomCreated(socket: Socket, payload: RoomCreatedPayload): void {
  socket.emit(ServerEvents.ROOM_CREATED, payload);
}

export function emitRoomJoined(socket: Socket, payload: RoomJoinedPayload): void {
  socket.emit(ServerEvents.ROOM_JOINED, payload);
}

export function emitRoomState(io: Server, code: string, state: RoomState): void {
  io.to(code).emit(ServerEvents.ROOM_STATE, state);
}

export function emitRoomError(socket: Socket, payload: RoomErrorPayload): void {
  socket.emit(ServerEvents.ROOM_ERROR, payload);
}

export function emitRoomStarted(io: Server, code: string, pairing: PairingResult): void {
  io.to(code).emit(ServerEvents.ROOM_STARTED, pairing);
}

export function emitDiceResult(socket: Socket, result: DiceRollResult): void {
  socket.emit(ServerEvents.DICE_RESULT, result);
}
