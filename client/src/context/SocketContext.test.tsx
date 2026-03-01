import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import { SocketProvider, useSocketContext } from "./SocketContext.js";

let mockSocket: MockSocket;

vi.mock("../socket.js", () => ({
  connectSocket: vi.fn(() => mockSocket),
  disconnectSocket: vi.fn(() => {
    mockSocket.disconnect();
  }),
  getSocket: vi.fn(() => null),
}));

// Test component that exposes context values
function TestConsumer({
  onRender,
}: {
  onRender: (ctx: ReturnType<typeof useSocketContext>) => void;
}) {
  const ctx = useSocketContext();
  onRender(ctx);
  return (
    <div>
      <span data-testid="connected">{String(ctx.isConnected)}</span>
      <span data-testid="has-socket">{String(ctx.socket !== null)}</span>
      <button data-testid="connect" onClick={() => ctx.connect("TestPlayer")} />
      <button data-testid="disconnect" onClick={() => ctx.disconnect()} />
    </div>
  );
}

describe("SocketContext", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    vi.clearAllMocks();
  });

  it("starts with no socket and not connected", () => {
    let captured: ReturnType<typeof useSocketContext> | null = null;
    render(
      <SocketProvider>
        <TestConsumer
          onRender={(ctx) => {
            captured = ctx;
          }}
        />
      </SocketProvider>,
    );

    expect(captured!.socket).toBeNull();
    expect(captured!.isConnected).toBe(false);
  });

  it("connect() creates socket and updates isConnected on connect event", () => {
    render(
      <SocketProvider>
        <TestConsumer onRender={() => {}} />
      </SocketProvider>,
    );

    act(() => {
      screen.getByTestId("connect").click();
    });

    act(() => {
      mockSocket.__simulateConnect();
    });

    expect(screen.getByTestId("connected").textContent).toBe("true");
  });

  it("disconnect() clears socket and sets isConnected to false", () => {
    render(
      <SocketProvider>
        <TestConsumer onRender={() => {}} />
      </SocketProvider>,
    );

    // Connect first
    act(() => {
      screen.getByTestId("connect").click();
    });
    act(() => {
      mockSocket.__simulateConnect();
    });
    expect(screen.getByTestId("connected").textContent).toBe("true");

    // Then disconnect
    act(() => {
      screen.getByTestId("disconnect").click();
    });
    expect(screen.getByTestId("connected").textContent).toBe("false");
  });

  it("socket survives child component unmount (THE BUG FIX)", () => {
    // This test verifies the exact bug: socket must persist when
    // a child component (LobbyPage) unmounts during navigation.
    function ChildA() {
      const { connect } = useSocketContext();
      return <button data-testid="child-connect" onClick={() => connect("Player")} />;
    }

    function ChildB() {
      const { socket } = useSocketContext();
      return <span data-testid="child-b-socket">{String(socket !== null)}</span>;
    }

    const { rerender } = render(
      <SocketProvider>
        <ChildA />
      </SocketProvider>,
    );

    // ChildA connects
    act(() => {
      screen.getByTestId("child-connect").click();
    });
    act(() => {
      mockSocket.__simulateConnect();
    });

    // Now "navigate": unmount ChildA, mount ChildB
    // Socket should still be available from context
    rerender(
      <SocketProvider>
        <ChildB />
      </SocketProvider>,
    );

    // The socket should NOT have been disconnected
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });

  it("handles already-connected socket in connect()", () => {
    mockSocket.connected = true;

    render(
      <SocketProvider>
        <TestConsumer onRender={() => {}} />
      </SocketProvider>,
    );

    act(() => {
      screen.getByTestId("connect").click();
    });

    // Should immediately show connected since socket.connected is true
    expect(screen.getByTestId("connected").textContent).toBe("true");
  });
});
