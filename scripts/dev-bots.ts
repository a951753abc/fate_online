/**
 * Dev Bot Script — spin up N socket.io clients to fill a room for testing.
 *
 * Usage:
 *   npx tsx scripts/dev-bots.ts --code ABC123 --bots 3   # join existing room
 *   npx tsx scripts/dev-bots.ts --create --bots 3         # bot creates room
 */

import { io, type Socket } from "socket.io-client";
import { ClientEvents, ServerEvents } from "../server/socket/events.js";
import mapData from "../map/map-data.json";

// ── Config ──────────────────────────────────────────────

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";

// Derive adjacency from the shared map-data.json (single source of truth)
const ADJACENCY: Record<string, readonly string[]> = (() => {
  const map: Record<string, string[]> = {};
  for (const loc of mapData.locations) map[loc.id] = [];
  for (const conn of mapData.connections) {
    map[conn.from].push(conn.to);
    map[conn.to].push(conn.from);
  }
  return map;
})();

const ROLE_CYCLE = ["master", "servant", "any"] as const;

const COLORS = [
  "\x1b[36m", // cyan
  "\x1b[33m", // yellow
  "\x1b[35m", // magenta
  "\x1b[32m", // green
  "\x1b[34m", // blue
  "\x1b[91m", // bright red
  "\x1b[93m", // bright yellow
] as const;
const RESET = "\x1b[0m";

// ── CLI args ────────────────────────────────────────────

function parseArgs(): { code: string | null; create: boolean; botCount: number } {
  const args = process.argv.slice(2);
  let code: string | null = null;
  let create = false;
  let botCount = 3;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--code" && args[i + 1]) {
      code = args[++i];
    } else if (args[i] === "--create") {
      create = true;
    } else if (args[i] === "--bots" && args[i + 1]) {
      botCount = parseInt(args[++i], 10);
    }
  }

  if (!code && !create) {
    console.log("Usage:");
    console.log("  npx tsx scripts/dev-bots.ts --code <ROOM_CODE> [--bots N]");
    console.log("  npx tsx scripts/dev-bots.ts --create [--bots N]");
    process.exit(1);
  }

  return { code, create, botCount };
}

// ── Bot ─────────────────────────────────────────────────

interface BotState {
  readonly index: number;
  readonly nickname: string;
  readonly color: string;
  readonly socket: Socket;
  location: string | null;
  role: string | null;
  groupIndex: number | null;
  characterId: string | null;
}

function log(bot: BotState, msg: string): void {
  console.log(`${bot.color}[${bot.nickname}]${RESET} ${msg}`);
}

function pickRandomMove(currentLocation: string): string {
  // 50% chance to stay
  if (Math.random() < 0.5) return currentLocation;
  const neighbors = ADJACENCY[currentLocation];
  if (!neighbors || neighbors.length === 0) return currentLocation;
  return neighbors[Math.floor(Math.random() * neighbors.length)];
}

function createBot(index: number, roomCode: string | null, isCreator: boolean): BotState {
  const nickname = `Bot-${index + 1}`;
  const color = COLORS[index % COLORS.length];

  const socket = io(SERVER_URL, {
    auth: { nickname },
    transports: ["websocket", "polling"],
    autoConnect: false,
  });

  const bot: BotState = {
    index,
    nickname,
    color,
    socket,
    location: null,
    role: null,
    groupIndex: null,
    characterId: null,
  };

  // ── Connection ──

  socket.on("connect", () => {
    log(bot, "connected");
    if (isCreator) {
      socket.emit(ClientEvents.ROOM_CREATE, {});
    } else if (roomCode) {
      socket.emit(ClientEvents.ROOM_JOIN, { code: roomCode });
    }
  });

  socket.on("connect_error", (err) => {
    log(bot, `connection error: ${err.message}`);
  });

  socket.on("disconnect", (reason) => {
    log(bot, `disconnected: ${reason}`);
  });

  // ── Room events ──

  const onRoomEntered = (verb: string, code: string): void => {
    log(bot, `${verb} room ${code}`);
    const rolePref = ROLE_CYCLE[index % ROLE_CYCLE.length];
    socket.emit(ClientEvents.ROOM_SET_ROLE, { rolePreference: rolePref });
    log(bot, `role preference: ${rolePref}`);
  };

  socket.on(ServerEvents.ROOM_CREATED, ({ code }: { code: string }) =>
    onRoomEntered("created", code),
  );

  socket.on(ServerEvents.ROOM_JOINED, ({ code }: { code: string }) =>
    onRoomEntered("joined", code),
  );

  socket.on(
    ServerEvents.ROOM_STATE,
    (state: { players: readonly { id: string }[]; status: string }) => {
      log(bot, `room state: ${state.players.length} players, status=${state.status}`);
      // Auto-start if this bot is creator and enough players
      if (isCreator && state.players.length >= 4 && state.status === "waiting") {
        log(bot, "enough players, starting game...");
        socket.emit(ClientEvents.ROOM_START, {});
      }
    },
  );

  socket.on(ServerEvents.ROOM_ERROR, (payload: { message: string }) => {
    log(bot, `room error: ${payload.message}`);
  });

  socket.on(ServerEvents.ROOM_STARTED, () => {
    log(bot, "game started!");
  });

  // ── Game events ──

  socket.on(
    ServerEvents.GAME_INITIALIZED,
    (payload: {
      yourCharacterId: string;
      yourGroupIndex: number;
      yourRole: string;
      yourLocation: string;
    }) => {
      bot.characterId = payload.yourCharacterId;
      bot.groupIndex = payload.yourGroupIndex;
      bot.role = payload.yourRole;
      bot.location = payload.yourLocation;
      log(
        bot,
        `initialized: ${payload.yourRole} in group ${payload.yourGroupIndex}, location=${payload.yourLocation}`,
      );
    },
  );

  socket.on(
    ServerEvents.GAME_PHASE_CHANGE,
    (payload: { nightNumber: number; phase: string; phaseEndsAt: number }) => {
      const remaining = Math.round((payload.phaseEndsAt - Date.now()) / 1000);
      log(bot, `Night ${payload.nightNumber} | ${payload.phase} | ${remaining}s`);

      if (payload.phase === "free_action" && bot.location) {
        const delay = 1000 + Math.random() * 2000;
        setTimeout(() => {
          if (!bot.location) return;
          const target = pickRandomMove(bot.location);
          if (target !== bot.location) {
            log(bot, `moving: ${bot.location} -> ${target}`);
            socket.emit(ClientEvents.GAME_MOVE, { targetLocation: target });
          } else {
            log(bot, `staying at ${bot.location}`);
          }
        }, delay);
      }
    },
  );

  socket.on(
    ServerEvents.GAME_MOVE_RESULT,
    (payload: { success: boolean; newLocation?: string; error?: string }) => {
      if (payload.success && payload.newLocation) {
        bot.location = payload.newLocation;
        log(bot, `moved to ${payload.newLocation}`);
      } else {
        log(bot, `move failed: ${payload.error}`);
      }
    },
  );

  socket.on(
    ServerEvents.GAME_ENCOUNTER,
    (payload: { locationId: string; groupIndices: readonly number[] }) => {
      log(bot, `ENCOUNTER at ${payload.locationId}: groups ${payload.groupIndices.join(", ")}`);
    },
  );

  socket.on(
    ServerEvents.GAME_NIGHT_REPORT,
    (payload: { nightNumber: number; events: readonly string[] }) => {
      log(bot, `Night ${payload.nightNumber} report: ${payload.events.length} events`);
    },
  );

  socket.on(ServerEvents.GAME_LOCATION_DESTROYED, (payload: { locationIds: readonly string[] }) => {
    log(bot, `locations destroyed: ${payload.locationIds.join(", ")}`);
  });

  socket.on(ServerEvents.GAME_ENDED, (payload: { reason: string; winnerGroupIndex?: number }) => {
    if (payload.reason === "last_pair") {
      log(bot, `GAME OVER: group ${payload.winnerGroupIndex} wins!`);
    } else {
      log(bot, `GAME OVER: ${payload.reason}`);
    }
  });

  return bot;
}

// ── Main ────────────────────────────────────────────────

async function main(): Promise<void> {
  const { code, create, botCount } = parseArgs();

  console.log(`\x1b[1m--- Dev Bots ---${RESET}`);
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Mode: ${create ? "create room" : `join room ${code}`}`);
  console.log(`Bots: ${botCount}`);
  console.log("");

  const bots: BotState[] = [];

  if (create) {
    // First bot creates, rest wait for room code
    const creator = createBot(0, null, true);
    bots.push(creator);

    const roomCodePromise = new Promise<string>((resolve) => {
      creator.socket.once(ServerEvents.ROOM_CREATED, (payload: { code: string }) => {
        resolve(payload.code);
      });
    });

    creator.socket.connect();
    const roomCode = await roomCodePromise;

    // Remaining bots join
    for (let i = 1; i < botCount; i++) {
      const bot = createBot(i, roomCode, false);
      bots.push(bot);
      bot.socket.connect();
      // Stagger connections slightly
      await new Promise((r) => setTimeout(r, 200));
    }
  } else {
    // All bots join existing room
    for (let i = 0; i < botCount; i++) {
      const bot = createBot(i, code, false);
      bots.push(bot);
      bot.socket.connect();
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log(`\n${RESET}Disconnecting all bots...`);
    for (const bot of bots) {
      bot.socket.disconnect();
    }
    process.exit(0);
  });
}

main().catch(console.error);
