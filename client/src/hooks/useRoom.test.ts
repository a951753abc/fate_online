import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import { useRoom } from "./useRoom.js";

let mockSocket: MockSocket;

describe("useRoom", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
  });

  it("starts with null state", () => {
    const { result } = renderHook(() => useRoom(null));

    expect(result.current.roomState).toBeNull();
    expect(result.current.playerId).toBeNull();
    expect(result.current.roomCode).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.pairing).toBeNull();
  });

  it("updates roomCode and playerId on room:created", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      mockSocket.__simulateEvent("room:created", { code: "ABC123", playerId: "p1" });
    });

    expect(result.current.roomCode).toBe("ABC123");
    expect(result.current.playerId).toBe("p1");
    expect(result.current.error).toBeNull();
  });

  it("updates roomCode and playerId on room:joined", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      mockSocket.__simulateEvent("room:joined", { code: "XYZ789", playerId: "p2" });
    });

    expect(result.current.roomCode).toBe("XYZ789");
    expect(result.current.playerId).toBe("p2");
  });

  it("updates roomState on room:state", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    const state = {
      code: "ABC123",
      status: "waiting" as const,
      players: [
        {
          id: "p1",
          nickname: "Alice",
          rolePreference: "any" as const,
          isHost: true,
          isConnected: true,
        },
      ],
      maxGroups: 7,
      minHumanPairs: 2,
    };

    act(() => {
      mockSocket.__simulateEvent("room:state", state);
    });

    expect(result.current.roomState).toEqual(state);
  });

  it("sets error on room:error", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      mockSocket.__simulateEvent("room:error", { message: "Room is full" });
    });

    expect(result.current.error).toBe("Room is full");
  });

  it("clears error on successful room:created after error", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      mockSocket.__simulateEvent("room:error", { message: "Something failed" });
    });
    expect(result.current.error).toBe("Something failed");

    act(() => {
      mockSocket.__simulateEvent("room:created", { code: "NEW123", playerId: "p1" });
    });
    expect(result.current.error).toBeNull();
  });

  it("sets pairing on room:started", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    const pairing = {
      humanPairs: [{ masterId: "m1", servantId: "s1" }],
      npcGroupCount: 6,
    };

    act(() => {
      mockSocket.__simulateEvent("room:started", pairing);
    });

    expect(result.current.pairing).toEqual(pairing);
  });

  it("createRoom emits room:create", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      result.current.createRoom();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:create", {});
  });

  it("joinRoom emits room:join with code", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      result.current.joinRoom("ABC123");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:join", { code: "ABC123" });
  });

  it("leaveRoom emits room:leave and resets state", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    // Set some state first
    act(() => {
      mockSocket.__simulateEvent("room:created", { code: "ABC123", playerId: "p1" });
      mockSocket.__simulateEvent("room:state", {
        code: "ABC123",
        status: "waiting",
        players: [],
        maxGroups: 7,
        minHumanPairs: 2,
      });
    });

    act(() => {
      result.current.leaveRoom();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:leave");
    expect(result.current.roomState).toBeNull();
    expect(result.current.roomCode).toBeNull();
    expect(result.current.pairing).toBeNull();
  });

  it("setRole emits room:setRole", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      result.current.setRole("master");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:setRole", { rolePreference: "master" });
  });

  it("startGame emits room:start", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      result.current.startGame();
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:start");
  });

  it("kickPlayer emits room:kick", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useRoom(mockSocket as any));

    act(() => {
      result.current.kickPlayer("target-id");
    });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:kick", { targetPlayerId: "target-id" });
  });

  it("does not emit when socket is null", () => {
    const { result } = renderHook(() => useRoom(null));

    act(() => {
      result.current.createRoom();
      result.current.joinRoom("ABC");
      result.current.setRole("servant");
      result.current.startGame();
      result.current.kickPlayer("x");
    });

    // No errors thrown, nothing emitted
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("cleans up listeners on unmount", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { unmount } = renderHook(() => useRoom(mockSocket as any));

    expect(mockSocket.on).toHaveBeenCalledTimes(5);
    unmount();
    expect(mockSocket.off).toHaveBeenCalledTimes(5);
  });
});
