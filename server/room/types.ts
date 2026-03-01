import type { RolePreference, RoomStatus } from "../shared/protocol.js";

export interface InternalPlayer {
  readonly id: string;
  readonly socketId: string;
  readonly nickname: string;
  readonly rolePreference: RolePreference;
  readonly isHost: boolean;
  readonly isConnected: boolean;
}

export interface InternalRoom {
  readonly code: string;
  readonly hostPlayerId: string;
  readonly status: RoomStatus;
  readonly maxGroups: number;
  readonly minHumanPairs: number;
  readonly createdAt: string;
  readonly players: ReadonlyMap<string, InternalPlayer>;
}
