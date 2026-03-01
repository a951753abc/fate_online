import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { GamePage } from "./GamePage.js";
import type { GameStateHook } from "../hooks/useGameState.js";
import type { GameInitializedPayload } from "../types/protocol.js";

// Mutable mock state
let mockSocketValue: unknown = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
let mockGameState: GameStateHook;

vi.mock("../context/SocketContext.js", () => ({
  useSocketContext: () => ({
    socket: mockSocketValue,
    isConnected: mockSocketValue !== null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("../hooks/useGameState.js", () => ({
  useGameState: () => mockGameState,
}));

// Mock map-data.json (imported by GamePage for adjacency + by MapView for rendering)
vi.mock("../../../map/map-data.json", () => ({
  default: {
    meta: { canvas: { width: 800, height: 600 } },
    locations: [
      { id: "bridge", name: "奏琴橋", zone: "town", x: 400, y: 300 },
      { id: "port", name: "港口", zone: "sea", x: 500, y: 400 },
    ],
    connections: [{ from: "bridge", to: "port", type: "normal" }],
  },
}));

// Mock MapView to avoid rendering SVG in jsdom
vi.mock("../components/game/MapView.js", () => ({
  MapView: (props: { myLocation: string }) => (
    <div data-testid="map-view">MapView: {props.myLocation}</div>
  ),
}));

// Mock NightHud
vi.mock("../components/game/NightHud.js", () => ({
  NightHud: (props: { nightNumber: number; phase: string }) => (
    <div data-testid="night-hud">
      Night {props.nightNumber} | {props.phase}
    </div>
  ),
}));

const mockGameData: GameInitializedPayload = {
  yourCharacterId: "m0",
  yourGroupIndex: 0,
  yourRole: "master",
  yourLocation: "bridge",
  groups: [{ groupIndex: 0, masterNickname: "Alice", servantNickname: "Bob" }],
  positions: [
    { characterId: "m0", location: "bridge", type: "master", groupIndex: 0 },
    { characterId: "s0", location: "port", type: "servant", groupIndex: 0 },
  ],
  night: { nightNumber: 1, phase: "free_action", phaseEndsAt: Date.now() + 300000 },
};

function renderGamePage() {
  return render(
    <MemoryRouter initialEntries={["/game/ABC123"]}>
      <Routes>
        <Route path="/game/:code" element={<GamePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockSocketValue = { on: vi.fn(), off: vi.fn(), emit: vi.fn() };
  mockGameState = {
    gameData: null,
    nightState: null,
    positions: [],
    occupations: [],
    encounters: [],
    nightReport: null,
    destroyedLocations: [],
    gameEnded: null,
    moveSubmitted: false,
    moveError: null,
    submitMove: vi.fn(),
  };
});

describe("GamePage", () => {
  it("shows 'Not connected' when socket is null", () => {
    mockSocketValue = null;
    renderGamePage();
    expect(screen.getByText("尚未連線。")).toBeInTheDocument();
  });

  it("shows loading when no gameData", () => {
    renderGamePage();
    expect(screen.getByText("載入遊戲 ABC123...")).toBeInTheDocument();
  });

  it("renders NightHud when gameData and nightState exist", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    renderGamePage();

    expect(screen.getByTestId("night-hud")).toBeInTheDocument();
    expect(screen.getByText("Night 1 | free_action")).toBeInTheDocument();
  });

  it("renders MapView with correct location", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    renderGamePage();

    expect(screen.getByTestId("map-view")).toBeInTheDocument();
    expect(screen.getByText("MapView: bridge")).toBeInTheDocument();
  });

  it("renders status bar with role, group, and position", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    renderGamePage();

    expect(screen.getByText("マスター")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("bridge")).toBeInTheDocument();
  });

  it("shows partner nickname when partner exists", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    renderGamePage();

    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows move submitted message", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.moveSubmitted = true;
    renderGamePage();

    expect(screen.getByText("移動已提交，等待結算...")).toBeInTheDocument();
  });

  it("shows move error message", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.moveError = "Not adjacent";
    renderGamePage();

    expect(screen.getByText("Not adjacent")).toBeInTheDocument();
  });

  it("renders encounters panel when encounters exist", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.encounters = [{ locationId: "bridge", groupIndices: [0, 1] }];
    renderGamePage();

    expect(screen.getByText("遭遇：")).toBeInTheDocument();
    expect(screen.getByText(/bridge：第 0 組 vs 第 1 組/)).toBeInTheDocument();
  });

  it("renders night report panel", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.nightReport = { nightNumber: 1, events: ["平靜的一夜。"] };
    renderGamePage();

    expect(screen.getByText("第 1 夜報告：")).toBeInTheDocument();
    expect(screen.getByText("平靜的一夜。")).toBeInTheDocument();
  });

  it("renders quiet night message when report has no events", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.nightReport = { nightNumber: 1, events: [] };
    renderGamePage();

    expect(screen.getByText("平靜的一夜。")).toBeInTheDocument();
  });

  it("renders game ended overlay for grail_rampage", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.gameEnded = { reason: "grail_rampage" };
    renderGamePage();

    expect(screen.getByText("遊戲結束")).toBeInTheDocument();
    expect(screen.getByText("聖杯暴走 — 全員敗北")).toBeInTheDocument();
  });

  it("renders game ended overlay for last_pair winner", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.gameEnded = { reason: "last_pair", winnerGroupIndex: 2 };
    renderGamePage();

    expect(screen.getByText("遊戲結束")).toBeInTheDocument();
    expect(screen.getByText("第 2 組勝利！")).toBeInTheDocument();
  });

  it("renders game ended overlay for all_eliminated", () => {
    mockGameState.gameData = mockGameData;
    mockGameState.nightState = mockGameData.night;
    mockGameState.positions = mockGameData.positions;
    mockGameState.gameEnded = { reason: "all_eliminated" };
    renderGamePage();

    expect(screen.getByText("全員脫落")).toBeInTheDocument();
  });
});
