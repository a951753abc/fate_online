import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import { LobbyPage } from "./LobbyPage.js";

let mockSocket: MockSocket;
const mockConnect = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../context/SocketContext.js", () => ({
  useSocketContext: () => ({
    socket: mockSocket,
    isConnected: mockSocket.connected,
    connect: mockConnect,
    disconnect: vi.fn(),
  }),
}));

describe("LobbyPage", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
    vi.clearAllMocks();
  });

  it("renders title and form elements", () => {
    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("聖杯戰爭 Online")).toBeInTheDocument();
    expect(screen.getByText("暱稱：")).toBeInTheDocument();
    expect(screen.getByText("建立房間")).toBeInTheDocument();
    expect(screen.getByText("加入")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("房間代碼")).toBeInTheDocument();
  });

  it("Create Room button is disabled without nickname", () => {
    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("建立房間")).toBeDisabled();
  });

  it("Join button is disabled without nickname or code", () => {
    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("加入")).toBeDisabled();
  });

  it("enables Create Room after entering nickname", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /暱稱/ }), "Alice");
    expect(screen.getByText("建立房間")).not.toBeDisabled();
  });

  it("calls connect on Create Room click", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: /暱稱/ }), "Alice");
    await user.click(screen.getByText("建立房間"));

    expect(mockConnect).toHaveBeenCalledWith("Alice");
  });

  it("uppercases room code input", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LobbyPage />
      </MemoryRouter>,
    );

    const codeInput = screen.getByPlaceholderText("房間代碼");
    await user.type(codeInput, "abc123");
    expect(codeInput).toHaveValue("ABC123");
  });
});
