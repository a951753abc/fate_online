import type { NightCycleEngine } from "./nightCycle.js";

const engines = new Map<string, NightCycleEngine>();

export function registerGame(roomCode: string, engine: NightCycleEngine): void {
  engines.set(roomCode, engine);
}

export function getEngine(roomCode: string): NightCycleEngine | undefined {
  return engines.get(roomCode);
}

export function removeGame(roomCode: string): void {
  const engine = engines.get(roomCode);
  if (engine) {
    engine.stop();
    engines.delete(roomCode);
  }
}

export function getActiveGameCount(): number {
  return engines.size;
}
