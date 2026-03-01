import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapView } from "./MapView.js";
import type { CharacterPositionView, LocationId } from "../../types/protocol.js";

// Mock map data JSON
vi.mock("../../../../map/map-data.json", () => ({
  default: {
    meta: { canvas: { width: 800, height: 600 } },
    locations: [
      { id: "bridge", name: "奏琴橋", zone: "town", x: 400, y: 300 },
      { id: "port", name: "港口", zone: "sea", x: 500, y: 400 },
      { id: "warehouse", name: "倉庫區", zone: "sea", x: 600, y: 400 },
    ],
    connections: [
      { from: "bridge", to: "port", type: "normal" },
      { from: "port", to: "warehouse", type: "hidden" },
    ],
  },
}));

const defaultProps = {
  positions: [] as CharacterPositionView[],
  occupations: [] as { locationId: LocationId; groupIndex: number }[],
  myCharacterId: "m0",
  myLocation: "bridge" as LocationId,
  validMoves: [] as LocationId[],
  canMove: false,
  destroyedLocations: [] as LocationId[],
  onLocationClick: vi.fn(),
};

describe("MapView", () => {
  it("renders an SVG element", () => {
    const { container } = render(<MapView {...defaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 800 600");
  });

  it("renders all location names", () => {
    render(<MapView {...defaultProps} />);
    expect(screen.getByText("奏琴橋")).toBeInTheDocument();
    expect(screen.getByText("港口")).toBeInTheDocument();
    expect(screen.getByText("倉庫區")).toBeInTheDocument();
  });

  it("renders connection lines", () => {
    const { container } = render(<MapView {...defaultProps} />);
    const lines = container.querySelectorAll("line");
    // 2 connections = 2 lines (no destroyed X lines since no destroyed locs)
    expect(lines.length).toBe(2);
  });

  it("renders dashed line for hidden connections", () => {
    const { container } = render(<MapView {...defaultProps} />);
    const lines = container.querySelectorAll("line");
    // Second connection is hidden type
    const hiddenLine = lines[1];
    expect(hiddenLine.getAttribute("stroke-dasharray")).toBe("6,4");
  });

  it("renders character dots at their location", () => {
    const positions: CharacterPositionView[] = [
      { characterId: "m0", location: "bridge", type: "master", groupIndex: 0 },
      { characterId: "s0", location: "bridge", type: "servant", groupIndex: 0 },
    ];
    const { container } = render(<MapView {...defaultProps} positions={positions} />);
    // Location circles (3) + character dots (2) + occupation rings (0) = 5 circles total
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(5);
  });

  it("highlights own character with gold color", () => {
    const positions: CharacterPositionView[] = [
      { characterId: "m0", location: "bridge", type: "master", groupIndex: 0 },
    ];
    const { container } = render(<MapView {...defaultProps} positions={positions} />);
    const circles = container.querySelectorAll("circle");
    // Find the gold character dot (r=6, fill=#ffd700)
    const goldCircle = Array.from(circles).find(
      (c) => c.getAttribute("fill") === "#ffd700" && c.getAttribute("r") === "6",
    );
    expect(goldCircle).toBeTruthy();
  });

  it("calls onLocationClick when clicking a valid move", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MapView {...defaultProps} canMove={true} validMoves={["port"]} onLocationClick={onClick} />,
    );
    // Find the port location circle (x=500, y=400)
    const circles = container.querySelectorAll("circle[r='24']");
    const portCircle = Array.from(circles).find(
      (c) => c.getAttribute("cx") === "500" && c.getAttribute("cy") === "400",
    );
    expect(portCircle).toBeTruthy();
    fireEvent.click(portCircle!);
    expect(onClick).toHaveBeenCalledWith("port");
  });

  it("does not call onLocationClick when clicking non-valid move", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MapView {...defaultProps} canMove={true} validMoves={["port"]} onLocationClick={onClick} />,
    );
    // Click bridge (not in validMoves)
    const circles = container.querySelectorAll("circle[r='24']");
    const bridgeCircle = Array.from(circles).find(
      (c) => c.getAttribute("cx") === "400" && c.getAttribute("cy") === "300",
    );
    fireEvent.click(bridgeCircle!);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not call onLocationClick for destroyed locations", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MapView
        {...defaultProps}
        canMove={true}
        validMoves={["port"]}
        destroyedLocations={["port"]}
        onLocationClick={onClick}
      />,
    );
    const circles = container.querySelectorAll("circle[r='24']");
    const portCircle = Array.from(circles).find(
      (c) => c.getAttribute("cx") === "500" && c.getAttribute("cy") === "400",
    );
    fireEvent.click(portCircle!);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders destroyed locations with X marks", () => {
    const { container } = render(<MapView {...defaultProps} destroyedLocations={["port"]} />);
    // Destroyed X = 2 extra lines (the X shape)
    const lines = container.querySelectorAll("line");
    // 2 connection lines + 2 X lines = 4
    expect(lines.length).toBe(4);
  });

  it("renders occupation rings", () => {
    const { container } = render(
      <MapView {...defaultProps} occupations={[{ locationId: "bridge", groupIndex: 0 }]} />,
    );
    // 3 location circles + 1 occupation ring = 4 circles
    const circles = container.querySelectorAll("circle");
    const occRing = Array.from(circles).find((c) => c.getAttribute("r") === "30");
    expect(occRing).toBeTruthy();
    expect(occRing!.getAttribute("fill")).toBe("none");
  });

  it("does not render character dots on destroyed locations", () => {
    const positions: CharacterPositionView[] = [
      { characterId: "m0", location: "port", type: "master", groupIndex: 0 },
    ];
    const { container } = render(
      <MapView {...defaultProps} positions={positions} destroyedLocations={["port"]} />,
    );
    // 3 location circles, 0 character dots (port is destroyed)
    const circles = container.querySelectorAll("circle");
    expect(circles.length).toBe(3);
  });
});
