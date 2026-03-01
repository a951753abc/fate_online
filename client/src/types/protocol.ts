// Mirrored from server/shared/protocol.ts
// Keep in sync manually until shared package is set up

export type RolePreference = "master" | "servant" | "any";
export type RoomStatus = "waiting" | "starting" | "playing" | "ended";

export interface PlayerInfo {
  readonly id: string;
  readonly nickname: string;
  readonly rolePreference: RolePreference;
  readonly isHost: boolean;
  readonly isConnected: boolean;
}

export interface RoomState {
  readonly code: string;
  readonly status: RoomStatus;
  readonly players: readonly PlayerInfo[];
  readonly maxGroups: number;
  readonly minHumanPairs: number;
}

export interface RoomCreatedPayload {
  readonly code: string;
  readonly playerId: string;
}

export interface RoomJoinedPayload {
  readonly code: string;
  readonly playerId: string;
}

export interface RoomErrorPayload {
  readonly message: string;
}

export interface DiceRollResult {
  readonly dice: readonly number[];
  readonly total: number;
  readonly modifier: number;
  readonly formula: string;
}

export interface PairingResult {
  readonly humanPairs: readonly {
    readonly masterId: string;
    readonly servantId: string;
  }[];
  readonly npcGroupCount: number;
}
