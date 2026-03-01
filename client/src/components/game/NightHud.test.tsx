import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { NightHud } from "./NightHud.js";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("NightHud", () => {
  it("renders night number", () => {
    render(<NightHud nightNumber={3} phase="free_action" phaseEndsAt={Date.now() + 60000} />);
    expect(screen.getByText("Night 3")).toBeInTheDocument();
  });

  it("renders free_action phase label in 繁中", () => {
    render(<NightHud nightNumber={1} phase="free_action" phaseEndsAt={Date.now() + 60000} />);
    expect(screen.getByText("自由行動期")).toBeInTheDocument();
  });

  it("renders encounter phase label", () => {
    render(<NightHud nightNumber={1} phase="encounter" phaseEndsAt={Date.now() + 60000} />);
    expect(screen.getByText("遭遇結算期")).toBeInTheDocument();
  });

  it("renders settlement phase label", () => {
    render(<NightHud nightNumber={1} phase="settlement" phaseEndsAt={Date.now() + 60000} />);
    expect(screen.getByText("夜間結算")).toBeInTheDocument();
  });

  it("renders countdown timer", () => {
    render(<NightHud nightNumber={1} phase="free_action" phaseEndsAt={Date.now() + 125000} />);
    // 125s → 2 min 5 sec → "2:05"
    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("shows 0:00 when time has expired", () => {
    render(<NightHud nightNumber={1} phase="free_action" phaseEndsAt={Date.now() - 1000} />);
    expect(screen.getByText("0:00")).toBeInTheDocument();
  });

  it("updates countdown as time passes", () => {
    render(<NightHud nightNumber={1} phase="free_action" phaseEndsAt={Date.now() + 65000} />);
    // Initially: 65s → "1:05"
    expect(screen.getByText("1:05")).toBeInTheDocument();

    // Advance 1 second (wrap in act for state update)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    // 64s → "1:04"
    expect(screen.getByText("1:04")).toBeInTheDocument();
  });
});
