import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Socket } from "socket.io-client";
import { createMockSocket, type MockSocket } from "../../__mocks__/socket-mock.js";
import { usePreparation } from "../usePreparation.js";
import type { PrepResultPayload, PrepStatePayload } from "../../types/protocol.js";

let mockSocket: MockSocket;
const asSocket = (mock: MockSocket) => mock as unknown as Socket;

beforeEach(() => {
  mockSocket = createMockSocket();
});

describe("usePreparation", () => {
  it("returns initial empty state", () => {
    const { result } = renderHook(() => usePreparation(asSocket(mockSocket)));

    expect(result.current.prepState).toBeNull();
    expect(result.current.buildResult).toBeNull();
  });

  it("registers 2 event listeners on mount", () => {
    renderHook(() => usePreparation(asSocket(mockSocket)));

    expect(mockSocket.on).toHaveBeenCalledTimes(2);
    expect(mockSocket.on).toHaveBeenCalledWith("prep:result", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("prep:state", expect.any(Function));
  });

  it("cleans up 2 listeners on unmount", () => {
    const { unmount } = renderHook(() => usePreparation(asSocket(mockSocket)));
    unmount();

    expect(mockSocket.off).toHaveBeenCalledTimes(2);
    expect(mockSocket.off).toHaveBeenCalledWith("prep:result", expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith("prep:state", expect.any(Function));
  });

  it("does not register listeners when socket is null", () => {
    renderHook(() => usePreparation(null));

    expect(mockSocket.on).not.toHaveBeenCalled();
  });

  it("handles prep:result event with success", () => {
    const { result } = renderHook(() => usePreparation(asSocket(mockSocket)));

    const prepResult: PrepResultPayload = {
      success: true,
      stats: {
        baseAbilities: { body: 5, perception: 5, reason: 8, will: 6 },
        bonuses: { body: 1, perception: 1, reason: 2, will: 2 },
        baseCombat: { melee: 2, ranged: 2, spirit: 4, action: 2, hp: 3, focus: 4, defense: 0 },
        levelModifiers: { melee: 0, ranged: 0, spirit: 2, action: 0, hp: 0, focus: 2, defense: 0 },
        finalCombat: { melee: 2, ranged: 2, spirit: 6, action: 2, hp: 3, focus: 6, defense: 0 },
      },
    };

    act(() => {
      mockSocket.__simulateEvent("prep:result", prepResult);
    });

    expect(result.current.buildResult).toEqual(prepResult);
  });

  it("handles prep:result event with error", () => {
    const { result } = renderHook(() => usePreparation(asSocket(mockSocket)));

    const prepResult: PrepResultPayload = {
      success: false,
      error: "等級總和必須為 4",
    };

    act(() => {
      mockSocket.__simulateEvent("prep:result", prepResult);
    });

    expect(result.current.buildResult).toEqual(prepResult);
    expect(result.current.buildResult?.success).toBe(false);
    expect(result.current.buildResult?.error).toBe("等級總和必須為 4");
  });

  it("handles prep:state event", () => {
    const { result } = renderHook(() => usePreparation(asSocket(mockSocket)));

    const prepState: PrepStatePayload = {
      players: [
        { characterId: "m0", role: "master", status: "submitted" },
        { characterId: "m1", role: "master", status: "pending" },
        { characterId: "s0", role: "servant", status: "ready" },
      ],
    };

    act(() => {
      mockSocket.__simulateEvent("prep:state", prepState);
    });

    expect(result.current.prepState).toEqual(prepState);
  });

  it("submitBuild emits prep:submit event", () => {
    const { result } = renderHook(() => usePreparation(asSocket(mockSocket)));

    act(() => {
      result.current.submitBuild({
        allocation: [{ levelId: "magician", level: 4 }],
        freePoint: "reason",
      });
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("prep:submit", {
      allocation: [{ levelId: "magician", level: 4 }],
      freePoint: "reason",
    });
  });

  it("submitBuild does nothing when socket is null", () => {
    const { result } = renderHook(() => usePreparation(null));

    act(() => {
      result.current.submitBuild({
        allocation: [{ levelId: "magician", level: 4 }],
        freePoint: "reason",
      });
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("confirmReady emits prep:ready event", () => {
    const { result } = renderHook(() => usePreparation(asSocket(mockSocket)));

    act(() => {
      result.current.confirmReady();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("prep:ready");
  });

  it("confirmReady does nothing when socket is null", () => {
    const { result } = renderHook(() => usePreparation(null));

    act(() => {
      result.current.confirmReady();
    });

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
