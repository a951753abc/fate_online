import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlayerList } from "./PlayerList.js";
import type { PlayerInfo } from "../types/protocol.js";

const players: readonly PlayerInfo[] = [
  { id: "p1", nickname: "Alice", rolePreference: "master", isHost: true, isConnected: true },
  { id: "p2", nickname: "Bob", rolePreference: "servant", isHost: false, isConnected: true },
  { id: "p3", nickname: "Charlie", rolePreference: "any", isHost: false, isConnected: false },
];

describe("PlayerList", () => {
  it("renders all players", () => {
    render(<PlayerList players={players} currentPlayerId="p1" isHost={true} />);

    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });

  it("shows [Host] badge for host player", () => {
    render(<PlayerList players={players} currentPlayerId="p1" isHost={true} />);

    expect(screen.getByText(/（房主）/)).toBeInTheDocument();
  });

  it("shows (disconnected) for offline players", () => {
    render(<PlayerList players={players} currentPlayerId="p1" isHost={true} />);

    expect(screen.getByText(/（離線）/)).toBeInTheDocument();
  });

  it("shows role preference in uppercase", () => {
    render(<PlayerList players={players} currentPlayerId="p1" isHost={false} />);

    expect(screen.getByText("マスター")).toBeInTheDocument();
    expect(screen.getByText("サーヴァント")).toBeInTheDocument();
    expect(screen.getByText("皆可")).toBeInTheDocument();
  });

  it("shows kick button for host viewing other players", () => {
    const onKick = vi.fn();
    render(<PlayerList players={players} currentPlayerId="p1" isHost={true} onKick={onKick} />);

    const kickButtons = screen.getAllByText("踢出");
    // Should have kick buttons for p2 and p3, but NOT for p1 (self)
    expect(kickButtons).toHaveLength(2);
  });

  it("calls onKick with correct player id", async () => {
    const user = userEvent.setup();
    const onKick = vi.fn();
    render(<PlayerList players={players} currentPlayerId="p1" isHost={true} onKick={onKick} />);

    const kickButtons = screen.getAllByText("踢出");
    await user.click(kickButtons[0]);

    expect(onKick).toHaveBeenCalledWith("p2");
  });

  it("hides kick buttons for non-host", () => {
    const onKick = vi.fn();
    render(<PlayerList players={players} currentPlayerId="p2" isHost={false} onKick={onKick} />);

    expect(screen.queryAllByText("踢出")).toHaveLength(0);
  });

  it("renders empty list without error", () => {
    render(<PlayerList players={[]} currentPlayerId={null} isHost={false} />);
    // No crash, renders empty ul
    expect(document.querySelector("ul")).toBeInTheDocument();
  });
});
