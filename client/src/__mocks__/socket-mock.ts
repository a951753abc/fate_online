import { vi } from "vitest";

type Listener = (...args: unknown[]) => void;

export function createMockSocket() {
  const listeners = new Map<string, Set<Listener>>();

  const mockSocket = {
    connected: false,

    on: vi.fn((event: string, listener: Listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
      return mockSocket;
    }),

    off: vi.fn((event: string, listener?: Listener) => {
      if (listener) {
        listeners.get(event)?.delete(listener);
      } else {
        listeners.delete(event);
      }
      return mockSocket;
    }),

    emit: vi.fn(),

    disconnect: vi.fn(() => {
      mockSocket.connected = false;
    }),

    // Test helper: simulate server emitting an event
    __simulateEvent(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((fn) => fn(...args));
    },

    // Test helper: simulate connection
    __simulateConnect() {
      mockSocket.connected = true;
      this.__simulateEvent("connect");
    },

    // Test helper: simulate disconnection
    __simulateDisconnect() {
      mockSocket.connected = false;
      this.__simulateEvent("disconnect");
    },
  };

  return mockSocket;
}

export type MockSocket = ReturnType<typeof createMockSocket>;
