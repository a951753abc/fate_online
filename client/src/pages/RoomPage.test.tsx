import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import { RoomPage } from "./RoomPage.js";
import type { RoomState, PairingResult } from "../types/protocol.js";

let mockSocket: MockSocket | null;
let mockRoomState: RoomState | null = null;
let mockPlayerId: string | null = null;
let mockError: string | null = null;
let mockPairing: PairingResult | null = null;

const mockSetRole = vi.fn();
const mockStartGame = vi.fn();
const mockLeaveRoom = vi.fn();
const mockKickPlayer = vi.fn();

vi.mock("../context/SocketContext.js", () => ({
  useSocketContext: () => ({
    socket: mockSocket,
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("../hooks/useRoom.js", () => ({
  useRoom: () => ({
    roomState: mockRoomState,
    playerId: mockPlayerId,
    roomCode: mockRoomState?.code ?? null,
    error: mockError,
    pairing: mockPairing,
    setRole: mockSetRole,
    startGame: mockStartGame,
    leaveRoom: mockLeaveRoom,
    kickPlayer: mockKickPlayer,
    createRoom: vi.fn(),
    joinRoom: vi.fn(),
  }),
}));

function renderRoomPage(code = "ABC123") {
  return render(
    <MemoryRouter initialEntries={[`/room/${code}`]}>
      <Routes>
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="/" element={<div>Lobby</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoomPage", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    mockRoomState = null;
    mockPlayerId = null;
    mockError = null;
    mockPairing = null;
    vi.clearAllMocks();
  });

  it("shows 'not connected' when socket is null", () => {
    mockSocket = null;
    renderRoomPage();

    expect(screen.getByText("Not connected. Please go back to lobby.")).toBeInTheDocument();
    expect(screen.getByText("Back to Lobby")).toBeInTheDocument();
  });

  it("shows loading when socket exists but no room state yet", () => {
    renderRoomPage();

    expect(screen.getByText("Loading room ABC123...")).toBeInTheDocument();
  });

  it("renders room with players when state is available", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
        { id: "p2", nickname: "Bob", rolePreference: "servant", isHost: false, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    expect(screen.getByText("Room: ABC123")).toBeInTheDocument();
    expect(screen.getByText("Players: 2 / 14")).toBeInTheDocument();
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("shows Start Game button for host", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    expect(screen.getByText("Start Game")).toBeInTheDocument();
  });

  it("hides Start Game button for non-host", () => {
    mockPlayerId = "p2";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
        { id: "p2", nickname: "Bob", rolePreference: "servant", isHost: false, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    expect(screen.queryByText("Start Game")).not.toBeInTheDocument();
  });

  it("disables Start Game when below minimum players", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    expect(screen.getByText("Start Game")).toBeDisabled();
  });

  it("shows pairing result when game started", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "starting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "master", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };
    mockPairing = {
      humanPairs: [{ masterId: "p1", servantId: "p2" }],
      npcGroupCount: 6,
    };

    renderRoomPage();

    expect(screen.getByText("Game Started!")).toBeInTheDocument();
    expect(screen.getByText("Human pairs: 1")).toBeInTheDocument();
    expect(screen.getByText("NPC groups: 6")).toBeInTheDocument();
  });

  it("shows error message", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };
    mockError = "Cannot balance roles";

    renderRoomPage();

    expect(screen.getByText("Cannot balance roles")).toBeInTheDocument();
  });

  it("renders role selector", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    expect(screen.getByText("Your Role Preference")).toBeInTheDocument();
    expect(screen.getByText("Master")).toBeInTheDocument();
    expect(screen.getByText("Servant")).toBeInTheDocument();
    expect(screen.getByText("Any")).toBeInTheDocument();
  });

  it("calls leaveRoom and navigates to lobby on Leave click", async () => {
    const userEvt = (await import("@testing-library/user-event")).default;
    const user = userEvt.setup();
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    await user.click(screen.getByText("Leave"));
    expect(mockLeaveRoom).toHaveBeenCalled();
  });

  it("renders dice test panel", () => {
    mockPlayerId = "p1";
    mockRoomState = {
      code: "ABC123",
      status: "waiting",
      players: [
        { id: "p1", nickname: "Alice", rolePreference: "any", isHost: true, isConnected: true },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    renderRoomPage();

    expect(screen.getByText("Dice Test (Dev)")).toBeInTheDocument();
    expect(screen.getByText("Roll 2D6")).toBeInTheDocument();
  });
});
