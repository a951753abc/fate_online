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

export type NightPhase = "preparation" | "free_action" | "encounter" | "settlement";

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
  readonly prepConfig?: PrepConfig;
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

// === Preparation Types (Phase 2-3a) ===

export type PrepStatus = "pending" | "submitted" | "ready";

export interface MasterLevelView {
  readonly id: string;
  readonly nameJa: string;
  readonly baseStats: {
    readonly body: number;
    readonly perception: number;
    readonly reason: number;
    readonly will: number;
  };
}

// --- Skill Views (client-facing) ---

export interface SkillPrereqView {
  readonly type: string;
  readonly description: string;
}

export interface SkillView {
  readonly id: string;
  readonly classId: string;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly trigger: string;
  readonly attackDomain?: string;
  readonly isExtra: boolean;
  readonly costDescription: string;
  readonly effectDescription: string;
  readonly tpReward: number;
  readonly prerequisites: readonly SkillPrereqView[];
  readonly repeatable?: boolean;
  readonly compositionOnly?: boolean;
  readonly configType?: string;
}

export interface InitialStepView {
  readonly type: "required" | "choose_one" | "free";
  readonly skillIds?: readonly string[];
  readonly count?: number;
  readonly label?: string;
}

export interface ClassAcquisitionView {
  readonly classId: string;
  readonly initialSteps: readonly InitialStepView[];
  readonly perLevelUpCount: number;
  readonly bonusLevels: readonly number[];
}

// --- Skill config view types (client-facing) ---

export interface MysticCodeView {
  readonly id: string;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly category: "consumable" | "equipment";
  readonly effectDescription: string;
}

export interface FamiliarOptionView {
  readonly type: string;
  readonly nameJa: string;
  readonly nameCht: string;
  readonly description: string;
}

export interface ElementSubChoiceOptionView {
  readonly value: string;
  readonly label: string;
}

export interface ElementSubChoiceView {
  readonly elementSkillId: string;
  readonly choiceKey: string;
  readonly label: string;
  readonly options: readonly ElementSubChoiceOptionView[];
}

export interface SkillInstanceConfigPayload {
  readonly type: string;
  readonly [key: string]: unknown;
}

export interface PrepConfig {
  readonly startingPoints: number;
  readonly gameLevel: number;
  readonly maxClasses: number;
  readonly availableLevels: readonly MasterLevelView[];
  readonly classSkills: Readonly<Record<string, readonly SkillView[]>>;
  readonly classAcquisitions: readonly ClassAcquisitionView[];
  readonly mysticCodes: readonly MysticCodeView[];
  readonly familiarOptions: readonly FamiliarOptionView[];
  readonly elementSubChoices: readonly ElementSubChoiceView[];
}

// Client → Server

export interface SkillSelectionPayload {
  readonly classId: string;
  readonly classLevel: number;
  readonly selectedSkillIds: readonly string[];
  readonly skillConfigs?: Readonly<Record<string, readonly SkillInstanceConfigPayload[]>>;
}

export interface PrepSubmitPayload {
  readonly allocation: readonly {
    readonly levelId: string;
    readonly level: number;
    readonly startingLevel: number;
  }[];
  readonly freePoint: "body" | "perception" | "reason" | "will";
  readonly skillSelections: readonly SkillSelectionPayload[];
}

// Server → Client
export interface PrepResultPayload {
  readonly success: boolean;
  readonly error?: string;
  readonly stats?: {
    readonly baseAbilities: {
      readonly body: number;
      readonly perception: number;
      readonly reason: number;
      readonly will: number;
    };
    readonly bonuses: {
      readonly body: number;
      readonly perception: number;
      readonly reason: number;
      readonly will: number;
    };
    readonly baseCombat: {
      readonly melee: number;
      readonly ranged: number;
      readonly spirit: number;
      readonly action: number;
      readonly hp: number;
      readonly focus: number;
      readonly defense: number;
    };
    readonly levelModifiers: {
      readonly melee: number;
      readonly ranged: number;
      readonly spirit: number;
      readonly action: number;
      readonly hp: number;
      readonly focus: number;
      readonly defense: number;
    };
    readonly finalCombat: {
      readonly melee: number;
      readonly ranged: number;
      readonly spirit: number;
      readonly action: number;
      readonly hp: number;
      readonly focus: number;
      readonly defense: number;
    };
  };
}

export interface PrepPlayerState {
  readonly characterId: string;
  readonly role: "master" | "servant";
  readonly status: PrepStatus;
}

export interface PrepStatePayload {
  readonly players: readonly PrepPlayerState[];
}
