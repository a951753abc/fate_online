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

// === Game Types (Phase 1) ===

export type LocationId =
  | "water-tower"
  | "old-residential"
  | "mountain-path"
  | "upstream"
  | "church"
  | "bridge"
  | "shopping"
  | "station"
  | "port"
  | "warehouse"
  | "river-mouth"
  | "aqueduct";

export type NightPhase = "free_action" | "encounter" | "settlement";

// === Game Client → Server Payloads ===

export interface GameMovePayload {
  readonly targetLocation: LocationId;
}

// === Game Server → Client Payloads ===

export interface CharacterPositionView {
  readonly characterId: string;
  readonly location: LocationId;
  readonly type: "master" | "servant";
  readonly groupIndex: number;
}

export interface GroupView {
  readonly groupIndex: number;
  readonly masterNickname: string;
  readonly servantNickname: string;
}

export interface GameInitializedPayload {
  readonly yourCharacterId: string;
  readonly yourGroupIndex: number;
  readonly yourRole: "master" | "servant";
  readonly yourLocation: LocationId;
  readonly groups: readonly GroupView[];
  readonly positions: readonly CharacterPositionView[];
  readonly night: NightStateView;
}

export interface NightStateView {
  readonly nightNumber: number;
  readonly phase: NightPhase;
  readonly phaseEndsAt: number;
}

export interface GamePhaseChangePayload {
  readonly nightNumber: number;
  readonly phase: NightPhase;
  readonly phaseEndsAt: number;
}

export interface PositionsPayload {
  readonly positions: readonly CharacterPositionView[];
}

export interface OccupationsPayload {
  readonly occupations: readonly {
    readonly locationId: LocationId;
    readonly groupIndex: number;
    readonly occupiedBy: "master" | "servant" | "both";
  }[];
}

export interface MoveResultPayload {
  readonly success: boolean;
  readonly error?: string;
  readonly newLocation?: LocationId;
}

export interface EncounterPayload {
  readonly locationId: LocationId;
  readonly groupIndices: readonly number[];
}

export interface NightReportPayload {
  readonly nightNumber: number;
  readonly events: readonly string[];
}

export interface LocationDestroyedPayload {
  readonly locationIds: readonly LocationId[];
}

export interface GameEndedPayload {
  readonly reason: "last_pair" | "grail_rampage" | "all_eliminated";
  readonly winnerGroupIndex?: number;
}
