import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Socket } from "socket.io-client";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import { useGameState } from "./useGameState.js";
import type {
  GameInitializedPayload,
  GamePhaseChangePayload,
  PositionsPayload,
  OccupationsPayload,
  MoveResultPayload,
  EncounterPayload,
  NightReportPayload,
  LocationDestroyedPayload,
  GameEndedPayload,
} from "../types/protocol.js";

let mockSocket: MockSocket;
const asSocket = (mock: MockSocket) => mock as unknown as Socket;

const mockInitPayload: GameInitializedPayload = {
  yourCharacterId: "m0",
  yourGroupIndex: 0,
  yourRole: "master",
  yourLocation: "bridge",
  groups: [{ groupIndex: 0, masterNickname: "Alice", servantNickname: "Bob" }],
  positions: [
    { characterId: "m0", location: "bridge", type: "master", groupIndex: 0 },
    { characterId: "s0", location: "bridge", type: "servant", groupIndex: 0 },
  ],
  night: { nightNumber: 1, phase: "free_action", phaseEndsAt: Date.now() + 300000 },
};

beforeEach(() => {
  mockSocket = createMockSocket();
});

describe("useGameState", () => {
  it("returns initial empty state", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    expect(result.current.gameData).toBeNull();
    expect(result.current.nightState).toBeNull();
    expect(result.current.positions).toEqual([]);
    expect(result.current.occupations).toEqual([]);
    expect(result.current.encounters).toEqual([]);
    expect(result.current.nightReport).toBeNull();
    expect(result.current.destroyedLocations).toEqual([]);
    expect(result.current.gameEnded).toBeNull();
    expect(result.current.moveSubmitted).toBe(false);
    expect(result.current.moveError).toBeNull();
  });

  it("returns empty state when socket is null", () => {
    const { result } = renderHook(() => useGameState(null));
    expect(result.current.gameData).toBeNull();
    expect(result.current.nightState).toBeNull();
  });

  it("registers 9 event listeners on mount", () => {
    renderHook(() => useGameState(asSocket(mockSocket)));
    expect(mockSocket.on).toHaveBeenCalledTimes(9);
  });

  it("cleans up 9 listeners on unmount", () => {
    const { unmount } = renderHook(() => useGameState(asSocket(mockSocket)));
    unmount();
    expect(mockSocket.off).toHaveBeenCalledTimes(9);
  });

  it("handles game:initialized event", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    act(() => {
      mockSocket.__simulateEvent("game:initialized", mockInitPayload);
    });

    expect(result.current.gameData).toEqual(mockInitPayload);
    expect(result.current.nightState).toEqual(mockInitPayload.night);
    expect(result.current.positions).toEqual(mockInitPayload.positions);
  });

  it("handles game:phaseChange event and resets move state", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    // First set some move state
    act(() => {
      mockSocket.__simulateEvent("game:moveResult", { success: true } satisfies MoveResultPayload);
    });
    expect(result.current.moveSubmitted).toBe(true);

    // Phase change should reset
    const phaseChange: GamePhaseChangePayload = {
      nightNumber: 2,
      phase: "encounter",
      phaseEndsAt: Date.now() + 180000,
    };
    act(() => {
      mockSocket.__simulateEvent("game:phaseChange", phaseChange);
    });

    expect(result.current.nightState).toEqual({
      nightNumber: 2,
      phase: "encounter",
      phaseEndsAt: phaseChange.phaseEndsAt,
    });
    expect(result.current.moveSubmitted).toBe(false);
    expect(result.current.moveError).toBeNull();
    expect(result.current.encounters).toEqual([]);
  });

  it("handles game:positions event", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    const posPayload: PositionsPayload = {
      positions: [{ characterId: "m0", location: "port", type: "master", groupIndex: 0 }],
    };
    act(() => {
      mockSocket.__simulateEvent("game:positions", posPayload);
    });

    expect(result.current.positions).toEqual(posPayload.positions);
  });

  it("handles game:occupations event", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    const occPayload: OccupationsPayload = {
      occupations: [{ locationId: "bridge", groupIndex: 0, occupiedBy: "both" }],
    };
    act(() => {
      mockSocket.__simulateEvent("game:occupations", occPayload);
    });

    expect(result.current.occupations).toEqual(occPayload.occupations);
  });

  it("handles game:moveResult success", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    act(() => {
      mockSocket.__simulateEvent("game:moveResult", {
        success: true,
        newLocation: "port",
      } satisfies MoveResultPayload);
    });

    expect(result.current.moveSubmitted).toBe(true);
    expect(result.current.moveError).toBeNull();
  });

  it("handles game:moveResult failure", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    act(() => {
      mockSocket.__simulateEvent("game:moveResult", {
        success: false,
        error: "Not adjacent",
      } satisfies MoveResultPayload);
    });

    expect(result.current.moveSubmitted).toBe(false);
    expect(result.current.moveError).toBe("Not adjacent");
  });

  it("handles game:moveResult failure with no error message", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    act(() => {
      mockSocket.__simulateEvent("game:moveResult", { success: false } satisfies MoveResultPayload);
    });

    expect(result.current.moveError).toBe("Move failed");
  });

  it("accumulates game:encounter events", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    const enc1: EncounterPayload = { locationId: "bridge", groupIndices: [0, 1] };
    const enc2: EncounterPayload = { locationId: "port", groupIndices: [2, 3] };

    act(() => {
      mockSocket.__simulateEvent("game:encounter", enc1);
    });
    act(() => {
      mockSocket.__simulateEvent("game:encounter", enc2);
    });

    expect(result.current.encounters).toHaveLength(2);
    expect(result.current.encounters[0]).toEqual(enc1);
    expect(result.current.encounters[1]).toEqual(enc2);
  });

  it("handles game:nightReport event", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    const report: NightReportPayload = { nightNumber: 1, events: ["A quiet night."] };
    act(() => {
      mockSocket.__simulateEvent("game:nightReport", report);
    });

    expect(result.current.nightReport).toEqual(report);
  });

  it("accumulates game:locationDestroyed events", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    act(() => {
      mockSocket.__simulateEvent("game:locationDestroyed", {
        locationIds: ["bridge"],
      } satisfies LocationDestroyedPayload);
    });
    act(() => {
      mockSocket.__simulateEvent("game:locationDestroyed", {
        locationIds: ["port", "warehouse"],
      } satisfies LocationDestroyedPayload);
    });

    expect(result.current.destroyedLocations).toEqual(["bridge", "port", "warehouse"]);
  });

  it("handles game:ended event", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    const ended: GameEndedPayload = { reason: "grail_rampage" };
    act(() => {
      mockSocket.__simulateEvent("game:ended", ended);
    });

    expect(result.current.gameEnded).toEqual(ended);
  });

  it("submitMove emits game:move event", () => {
    const { result } = renderHook(() => useGameState(asSocket(mockSocket)));

    act(() => {
      result.current.submitMove("port");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("game:move", { targetLocation: "port" });
  });

  it("submitMove does nothing when socket is null", () => {
    const { result } = renderHook(() => useGameState(null));

    act(() => {
      result.current.submitMove("port");
    });

    // No error, just no-op
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
