import type { LocationId } from "./map/types.js";

export type NightPhase = "free_action" | "encounter" | "settlement";
export type GameStatus = "initializing" | "active" | "ended";
export type CharacterType = "master" | "servant";

export interface CharacterState {
  readonly characterId: string;
  readonly type: CharacterType;
  readonly groupIndex: number;
  readonly location: LocationId;
  readonly isNpc: boolean;
}

export interface GroupState {
  readonly groupIndex: number;
  readonly masterId: string;
  readonly servantId: string;
  readonly isNpc: boolean;
  readonly isEliminated: boolean;
}

export interface OccupationEntry {
  readonly locationId: LocationId;
  readonly groupIndex: number;
  readonly occupiedBy: CharacterType | "both";
}

export interface NightState {
  readonly nightNumber: number;
  readonly phase: NightPhase;
  readonly phaseEndsAt: number;
}

export interface GameState {
  readonly roomCode: string;
  readonly status: GameStatus;
  readonly groups: readonly GroupState[];
  readonly characters: readonly CharacterState[];
  readonly occupations: readonly OccupationEntry[];
  readonly night: NightState;
  readonly destroyedLocations: readonly LocationId[];
}
