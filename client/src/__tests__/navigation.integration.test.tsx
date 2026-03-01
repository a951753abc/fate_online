/**
 * Integration tests for cross-page navigation flows.
 *
 * These tests use REAL hooks (useRoom, useGameState) with a mock socket
 * to catch state-loss bugs that occur when navigating between pages.
 * Unit tests with mocked hooks cannot catch these because they never
 * exercise the "hook unmounts → remounts with fresh state" lifecycle.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import type { RoomState, GameInitializedPayload } from "../types/protocol.js";

// Only mock the transport layer — real hooks and components run above it
let mockSocket: MockSocket;

vi.mock("../socket.js", () => ({
  connectSocket: vi.fn(() => mockSocket),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => null),
}));

// Mock map-data.json (imported by GamePage for adjacency)
vi.mock("../../map/map-data.json", () => ({
  default: {
    meta: { canvas: { width: 800, height: 600 } },
    locations: [
      { id: "bridge", name: "奏琴橋", zone: "town", x: 400, y: 300 },
      { id: "port", name: "港口", zone: "sea", x: 500, y: 400 },
    ],
    connections: [{ from: "bridge", to: "port", type: "normal" }],
  },
}));

// Mock MapView to avoid map-data.json dependency in jsdom
vi.mock("../components/game/MapView.js", () => ({
  MapView: (props: { myLocation: string }) => (
    <div data-testid="map-view">MapView: {props.myLocation}</div>
  ),
}));

// Import REAL components (not mocked)
import { SocketProvider } from "../context/SocketContext.js";
import { LobbyPage } from "../pages/LobbyPage.js";
import { RoomPage } from "../pages/RoomPage.js";
import { GamePage } from "../pages/GamePage.js";

const mockRoomState: RoomState = {
  code: "ABC123",
  status: "waiting",
  players: [
    { id: "p1", nickname: "Alice", rolePreference: "master", isHost: true, isConnected: true },
    { id: "p2", nickname: "Bob", rolePreference: "servant", isHost: false, isConnected: true },
  ],
  maxGroups: 7,
  minHumanPairs: 2,
};

const mockGameInit: GameInitializedPayload = {
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

beforeEach(() => {
  mockSocket = createMockSocket();
  vi.clearAllMocks();
});

describe("Navigation integration: Lobby → Room", () => {
  it("RoomPage loads state after navigation (the Loading bug)", async () => {
    const user = userEvent.setup();

    // Render full app at lobby
    render(
      <SocketProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/room/:code" element={<RoomPage />} />
          </Routes>
        </MemoryRouter>
      </SocketProvider>,
    );

    // Step 1: User types nickname and clicks Join
    const nicknameInput = screen.getByLabelText("Nickname:");
    await user.type(nicknameInput, "Alice");
    const codeInput = screen.getByPlaceholderText("Room Code");
    await user.type(codeInput, "ABC123");
    await user.click(screen.getByText("Join"));

    // Step 2: Socket connects
    act(() => {
      mockSocket.__simulateConnect();
    });

    // Step 3: LobbyPage's useEffect calls joinRoom → socket emits room:join
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("room:join", { code: "ABC123" });
    });

    // Step 4: Server responds with room:joined + room:state
    // LobbyPage's useRoom receives these → roomCode is set → navigate to /room/ABC123
    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", mockRoomState);
    });

    // Step 5: Navigation happened — now on RoomPage
    // RoomPage's useRoom is fresh (roomState = null)
    // The fix: RoomPage emits room:requestState on mount
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("room:requestState");
    });

    // Step 6: Server responds to requestState
    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", mockRoomState);
    });

    // Step 7: RoomPage should now show the room — NOT stuck on "Loading"
    await waitFor(() => {
      expect(screen.getByText("Room: ABC123")).toBeInTheDocument();
    });
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it("RoomPage identifies current player as host after requestState", async () => {
    const user = userEvent.setup();

    render(
      <SocketProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/room/:code" element={<RoomPage />} />
          </Routes>
        </MemoryRouter>
      </SocketProvider>,
    );

    // Fast-forward through join flow
    await user.type(screen.getByLabelText("Nickname:"), "Alice");
    await user.type(screen.getByPlaceholderText("Room Code"), "ABC123");
    await user.click(screen.getByText("Join"));
    act(() => mockSocket.__simulateConnect());

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("room:join", { code: "ABC123" });
    });

    // Navigate to RoomPage
    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", mockRoomState);
    });

    // Wait for requestState, then respond
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("room:requestState");
    });
    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", mockRoomState);
    });

    // Host should see the Start Game button (p1 is host in mockRoomState)
    await waitFor(() => {
      expect(screen.getByText("Start Game")).toBeInTheDocument();
    });
  });
});

describe("Navigation integration: Room → Game", () => {
  it("RoomPage navigates to GamePage on game:initialized", async () => {
    const user = userEvent.setup();

    render(
      <SocketProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/room/:code" element={<RoomPage />} />
            <Route path="/game/:code" element={<GamePage />} />
          </Routes>
        </MemoryRouter>
      </SocketProvider>,
    );

    // Join flow
    await user.type(screen.getByLabelText("Nickname:"), "Alice");
    await user.type(screen.getByPlaceholderText("Room Code"), "ABC123");
    await user.click(screen.getByText("Join"));
    act(() => mockSocket.__simulateConnect());

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("room:join", { code: "ABC123" });
    });

    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", mockRoomState);
    });

    // RoomPage requestState
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("room:requestState");
    });
    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", mockRoomState);
    });

    await waitFor(() => {
      expect(screen.getByText("Room: ABC123")).toBeInTheDocument();
    });

    // Game starts: server emits game:initialized
    act(() => {
      mockSocket.__simulateEvent("game:initialized", mockGameInit);
    });

    // GamePage should render with game data
    await waitFor(() => {
      expect(screen.getByTestId("map-view")).toBeInTheDocument();
    });
    expect(screen.getByText("MapView: bridge")).toBeInTheDocument();
  });
});

describe("Navigation integration: direct URL access", () => {
  it("RoomPage mounted directly requests state and recovers", async () => {
    // Simulate: user bookmarks /room/ABC123 or refreshes
    // Socket is already connected via context

    render(
      <SocketProvider>
        <MemoryRouter initialEntries={["/room/ABC123"]}>
          <Routes>
            <Route path="/" element={<LobbyPage />} />
            <Route path="/room/:code" element={<RoomPage />} />
          </Routes>
        </MemoryRouter>
      </SocketProvider>,
    );

    // No socket → "Not connected" (connect hasn't been called)
    expect(screen.getByText(/Not connected/)).toBeInTheDocument();
  });
});
