import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Server } from "socket.io";
import { NightCycleEngine, type NightCycleConfig } from "../nightCycle.js";

// Mock all dependencies
vi.mock("../gameStateManager.js", () => ({
  setPhase: vi.fn(async () => {}),
  advanceNight: vi.fn(async () => ({ nightNumber: 2, phase: "free_action", phaseEndsAt: 0 })),
  resolveMovement: vi.fn(async () => [
    { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
    { characterId: "s0", type: "servant", groupIndex: 0, location: "port", isNpc: false },
  ]),
  updateOccupations: vi.fn(async () => []),
  getAllCharacters: vi.fn(async () => [
    { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
    { characterId: "s0", type: "servant", groupIndex: 0, location: "port", isNpc: false },
  ]),
  getGameState: vi.fn(async () => ({
    roomCode: "TEST",
    status: "active",
    groups: [{ groupIndex: 0, masterId: "m0", servantId: "s0", isNpc: false, isEliminated: false }],
    characters: [
      { characterId: "m0", type: "master", groupIndex: 0, location: "bridge", isNpc: false },
      { characterId: "s0", type: "servant", groupIndex: 0, location: "port", isNpc: false },
    ],
    occupations: [],
    night: { nightNumber: 1, phase: "free_action", phaseEndsAt: 0 },
    destroyedLocations: [],
  })),
  setGameStatus: vi.fn(async () => {}),
  destroyLocations: vi.fn(async () => []),
}));

vi.mock("../encounterDetection.js", () => ({
  detectEncounters: vi.fn(() => []),
}));

const emittedEvents: { event: string; payload: unknown }[] = [];

const mockIo = {
  to: vi.fn(() => ({
    emit: vi.fn((event: string, payload: unknown) => {
      emittedEvents.push({ event, payload });
    }),
  })),
} as unknown as Server;

const fastConfig: NightCycleConfig = Object.freeze({
  freeActionDurationMs: 100,
  encounterDurationMs: 50,
  settlementDelayMs: 30,
  maxNights: 14,
});

describe("NightCycleEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    emittedEvents.length = 0;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("emits game:phaseChange with free_action on start", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);

    const phaseEvents = emittedEvents.filter((e) => e.event === "game:phaseChange");
    expect(phaseEvents.length).toBeGreaterThanOrEqual(1);
    expect((phaseEvents[0].payload as { phase: string }).phase).toBe("free_action");
    expect((phaseEvents[0].payload as { nightNumber: number }).nightNumber).toBe(1);

    engine.stop();
  });

  it("transitions from free_action to encounter after timer", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0); // start
    await vi.advanceTimersByTimeAsync(fastConfig.freeActionDurationMs); // free_action ends

    const phaseEvents = emittedEvents.filter((e) => e.event === "game:phaseChange");
    const phases = phaseEvents.map((e) => (e.payload as { phase: string }).phase);
    expect(phases).toContain("free_action");
    expect(phases).toContain("encounter");

    engine.stop();
  });

  it("transitions through full cycle: free_action → encounter → settlement", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(fastConfig.freeActionDurationMs);
    await vi.advanceTimersByTimeAsync(fastConfig.encounterDurationMs);

    const phaseEvents = emittedEvents.filter((e) => e.event === "game:phaseChange");
    const phases = phaseEvents.map((e) => (e.payload as { phase: string }).phase);
    expect(phases).toContain("free_action");
    expect(phases).toContain("encounter");
    expect(phases).toContain("settlement");

    engine.stop();
  });

  it("emits game:positions after free_action ends", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(fastConfig.freeActionDurationMs);

    const posEvents = emittedEvents.filter((e) => e.event === "game:positions");
    expect(posEvents.length).toBeGreaterThanOrEqual(1);

    engine.stop();
  });

  it("emits game:occupations after settlement", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(fastConfig.freeActionDurationMs);
    await vi.advanceTimersByTimeAsync(fastConfig.encounterDurationMs);
    await vi.advanceTimersByTimeAsync(fastConfig.settlementDelayMs);

    const occEvents = emittedEvents.filter((e) => e.event === "game:occupations");
    expect(occEvents.length).toBeGreaterThanOrEqual(1);

    engine.stop();
  });

  it("emits game:nightReport after settlement", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(fastConfig.freeActionDurationMs);
    await vi.advanceTimersByTimeAsync(fastConfig.encounterDurationMs);
    await vi.advanceTimersByTimeAsync(fastConfig.settlementDelayMs);

    const reportEvents = emittedEvents.filter((e) => e.event === "game:nightReport");
    expect(reportEvents.length).toBeGreaterThanOrEqual(1);

    engine.stop();
  });

  it("stop() prevents further transitions", async () => {
    const engine = new NightCycleEngine("TEST", mockIo, fastConfig);
    engine.start();
    await vi.advanceTimersByTimeAsync(0);
    engine.stop();

    const countBefore = emittedEvents.length;
    await vi.advanceTimersByTimeAsync(fastConfig.freeActionDurationMs * 10);

    expect(emittedEvents.length).toBe(countBefore);
  });

  it("emits game:ended at Night 14", async () => {
    const shortConfig: NightCycleConfig = Object.freeze({
      freeActionDurationMs: 10,
      encounterDurationMs: 5,
      settlementDelayMs: 3,
      maxNights: 1, // end after first night
    });

    const engine = new NightCycleEngine("TEST", mockIo, shortConfig);
    engine.start();

    // Run through full Night 1
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(shortConfig.freeActionDurationMs);
    await vi.advanceTimersByTimeAsync(shortConfig.encounterDurationMs);
    await vi.advanceTimersByTimeAsync(shortConfig.settlementDelayMs);

    const endEvents = emittedEvents.filter((e) => e.event === "game:ended");
    expect(endEvents).toHaveLength(1);
    expect((endEvents[0].payload as { reason: string }).reason).toBe("grail_rampage");
  });
});
