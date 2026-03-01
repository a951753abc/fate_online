// === Player & Room Types ===

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

// === Client → Server Payloads ===

export interface RoomCreatePayload {
  readonly nickname: string;
}

export interface RoomJoinPayload {
  readonly code: string;
  readonly nickname: string;
}

export interface SetRolePayload {
  readonly rolePreference: RolePreference;
}

export interface KickPayload {
  readonly targetPlayerId: string;
}

// === Server → Client Payloads ===

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

// === Pairing Result ===

export interface PairingResult {
  readonly humanPairs: readonly {
    readonly masterId: string;
    readonly servantId: string;
  }[];
  readonly npcGroupCount: number;
}
