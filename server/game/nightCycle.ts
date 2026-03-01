import type { Server } from "socket.io";
import type { NightPhase } from "./types.js";
import {
  setPhase,
  advanceNight,
  resolveMovement,
  updateOccupations,
  getAllCharacters,
  getGameState,
  setGameStatus,
  destroyLocations,
} from "./gameStateManager.js";
import { detectEncounters } from "./encounterDetection.js";
import { shortestPathDistance, getManaDistanceMultiplier } from "./map/mapUtils.js";

export interface NightCycleConfig {
  readonly freeActionDurationMs: number;
  readonly encounterDurationMs: number;
  readonly settlementDelayMs: number;
  readonly maxNights: number;
}

export const DEFAULT_NIGHT_CONFIG: NightCycleConfig = Object.freeze({
  freeActionDurationMs: 300_000,
  encounterDurationMs: 180_000,
  settlementDelayMs: 10_000,
  maxNights: 14,
});

export class NightCycleEngine {
  private readonly roomCode: string;
  private readonly io: Server;
  private readonly config: NightCycleConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  constructor(roomCode: string, io: Server, config: NightCycleConfig = DEFAULT_NIGHT_CONFIG) {
    this.roomCode = roomCode;
    this.io = io;
    this.config = config;
  }

  start(): void {
    this.stopped = false;
    this.beginFreeAction(1);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private emit(event: string, payload: unknown): void {
    this.io.to(this.roomCode).emit(event, payload);
  }

  private beginFreeAction(nightNumber: number): void {
    if (this.stopped) return;

    const endsAt = Date.now() + this.config.freeActionDurationMs;
    setPhase(this.roomCode, "free_action", endsAt)
      .then(() => {
        if (this.stopped) return;
        this.emit("game:phaseChange", {
          nightNumber,
          phase: "free_action" as NightPhase,
          phaseEndsAt: endsAt,
        });

        this.timer = setTimeout(() => {
          this.onFreeActionEnd(nightNumber).catch(console.error);
        }, this.config.freeActionDurationMs);
      })
      .catch(console.error);
  }

  private async onFreeActionEnd(nightNumber: number): Promise<void> {
    if (this.stopped) return;

    // Resolve all movements
    const characters = await resolveMovement(this.roomCode);

    // Broadcast updated positions
    this.emit("game:positions", {
      positions: characters.map((c) => ({
        characterId: c.characterId,
        location: c.location,
        type: c.type,
        groupIndex: c.groupIndex,
      })),
    });

    // Detect encounters
    const state = await getGameState(this.roomCode);
    if (!state) return;

    const encounters = detectEncounters(characters, state.groups);
    for (const encounter of encounters) {
      this.emit("game:encounter", encounter);
    }

    // Begin encounter phase
    const endsAt = Date.now() + this.config.encounterDurationMs;
    await setPhase(this.roomCode, "encounter", endsAt);
    this.emit("game:phaseChange", {
      nightNumber,
      phase: "encounter" as NightPhase,
      phaseEndsAt: endsAt,
    });

    this.timer = setTimeout(() => {
      this.onEncounterEnd(nightNumber).catch(console.error);
    }, this.config.encounterDurationMs);
  }

  private async onEncounterEnd(nightNumber: number): Promise<void> {
    if (this.stopped) return;

    // Begin settlement
    const endsAt = Date.now() + this.config.settlementDelayMs;
    await setPhase(this.roomCode, "settlement", endsAt);
    this.emit("game:phaseChange", {
      nightNumber,
      phase: "settlement" as NightPhase,
      phaseEndsAt: endsAt,
    });

    this.timer = setTimeout(() => {
      this.onSettlementEnd(nightNumber).catch(console.error);
    }, this.config.settlementDelayMs);
  }

  private async onSettlementEnd(nightNumber: number): Promise<void> {
    if (this.stopped) return;

    // Update occupations
    const occupations = await updateOccupations(this.roomCode);
    this.emit("game:occupations", {
      occupations: occupations.map((o) => ({
        locationId: o.locationId,
        groupIndex: o.groupIndex,
        occupiedBy: o.occupiedBy,
      })),
    });

    // Calculate mana distances
    const state = await getGameState(this.roomCode);
    if (!state) return;

    const events: string[] = [];
    for (const group of state.groups) {
      if (group.isEliminated) continue;
      const master = state.characters.find((c) => c.characterId === group.masterId);
      const servant = state.characters.find((c) => c.characterId === group.servantId);
      if (master && servant) {
        const dist = shortestPathDistance(master.location, servant.location);
        const mult = getManaDistanceMultiplier(dist);
        if (mult > 1) {
          events.push(`Group ${group.groupIndex}: 魔力供給距離 ${dist}（×${mult}）`);
        }
      }
    }

    // Night report
    this.emit("game:nightReport", { nightNumber, events });

    // Check if Night 14 (game over)
    if (nightNumber >= this.config.maxNights) {
      await setGameStatus(this.roomCode, "ended");
      this.emit("game:ended", { reason: "grail_rampage" });
      this.stop();
      return;
    }

    // Night 10+: destroy locations before next night
    const nextNight = nightNumber + 1;
    if (nextNight >= 10) {
      const destroyed = await destroyLocations(this.roomCode, 2, nextNight);
      if (destroyed.length > 0) {
        this.emit("game:locationDestroyed", { locationIds: destroyed });

        // Broadcast updated positions after scatter
        const updatedChars = await getAllCharacters(this.roomCode);
        this.emit("game:positions", {
          positions: updatedChars.map((c) => ({
            characterId: c.characterId,
            location: c.location,
            type: c.type,
            groupIndex: c.groupIndex,
          })),
        });
      }
    }

    // Advance to next night
    await advanceNight(this.roomCode);
    this.beginFreeAction(nextNight);
  }
}
