import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockSocket, type MockSocket } from "../__mocks__/socket-mock.js";
import { DiceTest } from "./DiceTest.js";

let mockSocket: MockSocket;

describe("DiceTest", () => {
  beforeEach(() => {
    mockSocket = createMockSocket();
  });

  it("renders roll button", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<DiceTest socket={mockSocket as any} />);
    expect(screen.getByText("Roll 2D6")).toBeInTheDocument();
  });

  it("emits dice:roll on button click", async () => {
    const user = userEvent.setup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<DiceTest socket={mockSocket as any} />);

    await user.click(screen.getByText("Roll 2D6"));

    expect(mockSocket.emit).toHaveBeenCalledWith("dice:roll", {
      count: 2,
      sides: 6,
      modifier: 0,
    });
  });

  it("displays dice result when received", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<DiceTest socket={mockSocket as any} />);

    act(() => {
      mockSocket.__simulateEvent("dice:result", {
        formula: "2d6",
        dice: [3, 5],
        total: 8,
        modifier: 0,
      });
    });

    expect(screen.getByText("2d6: [3, 5] = 8")).toBeInTheDocument();
  });

  it("does not show result before rolling", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<DiceTest socket={mockSocket as any} />);
    expect(screen.queryByText(/2d6:/)).not.toBeInTheDocument();
  });

  it("renders without socket (null)", () => {
    render(<DiceTest socket={null} />);
    expect(screen.getByText("Roll 2D6")).toBeInTheDocument();
  });
});
