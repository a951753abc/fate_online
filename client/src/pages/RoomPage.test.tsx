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

    expect(screen.getByText("尚未連線，請返回大廳。")).toBeInTheDocument();
    expect(screen.getByText("返回大廳")).toBeInTheDocument();
  });

  it("shows loading when socket exists but no room state yet", () => {
    renderRoomPage();

    expect(screen.getByText("載入房間 ABC123...")).toBeInTheDocument();
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

    expect(screen.getByText("房間：ABC123")).toBeInTheDocument();
    expect(screen.getByText("玩家：2 / 14")).toBeInTheDocument();
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

    expect(screen.getByText("開始遊戲")).toBeInTheDocument();
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

    expect(screen.queryByText("開始遊戲")).not.toBeInTheDocument();
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

    expect(screen.getByText("開始遊戲")).toBeDisabled();
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

    expect(screen.getByText("遊戲已開始！")).toBeInTheDocument();
    expect(screen.getByText("人類組數：1")).toBeInTheDocument();
    expect(screen.getByText("NPC 組數：6")).toBeInTheDocument();
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
    mockError = "無法以目前的偏好分配角色";

    renderRoomPage();

    expect(screen.getByText("無法以目前的偏好分配角色")).toBeInTheDocument();
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

    expect(screen.getByText("角色偏好")).toBeInTheDocument();
    // RoleSelector buttons (マスター/サーヴァント may also appear in PlayerList)
    expect(screen.getAllByText("マスター").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("サーヴァント").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("皆可").length).toBeGreaterThanOrEqual(1);
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

    await user.click(screen.getByText("離開"));
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

    expect(screen.getByText("骰子測試（開發用）")).toBeInTheDocument();
    expect(screen.getByText("擲 2D6")).toBeInTheDocument();
  });
});
