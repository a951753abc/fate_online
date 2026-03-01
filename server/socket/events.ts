// Client → Server events
export const ClientEvents = Object.freeze({
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_SET_ROLE: "room:setRole",
  ROOM_START: "room:start",
  ROOM_KICK: "room:kick",
  DICE_ROLL: "dice:roll",
} as const);

// Server → Client events
export const ServerEvents = Object.freeze({
  ROOM_CREATED: "room:created",
  ROOM_JOINED: "room:joined",
  ROOM_LEFT: "room:left",
  ROOM_STATE: "room:state",
  ROOM_ERROR: "room:error",
  ROOM_STARTED: "room:started",
  DICE_RESULT: "dice:result",
} as const);

export type ClientEventName = (typeof ClientEvents)[keyof typeof ClientEvents];
export type ServerEventName = (typeof ServerEvents)[keyof typeof ServerEvents];
