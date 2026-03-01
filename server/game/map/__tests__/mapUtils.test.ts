import { describe, it, expect } from "vitest";
import {
  isAdjacent,
  getAdjacentLocations,
  shortestPathDistance,
  getStationReachable,
  getValidMoves,
  getManaDistanceMultiplier,
} from "../mapUtils.js";

describe("isAdjacent", () => {
  it("returns true for adjacent locations", () => {
    expect(isAdjacent("water-tower", "old-residential")).toBe(true);
    expect(isAdjacent("bridge", "warehouse")).toBe(true);
    expect(isAdjacent("aqueduct", "upstream")).toBe(true);
  });

  it("returns false for non-adjacent locations", () => {
    expect(isAdjacent("water-tower", "bridge")).toBe(false);
    expect(isAdjacent("church", "port")).toBe(false);
    expect(isAdjacent("upstream", "river-mouth")).toBe(false);
  });

  it("returns false for same location", () => {
    expect(isAdjacent("bridge", "bridge")).toBe(false);
  });
});

describe("getAdjacentLocations", () => {
  it("returns correct neighbors for bridge", () => {
    const neighbors = getAdjacentLocations("bridge");
    expect(neighbors).toHaveLength(5);
  });

  it("returns correct neighbors for church", () => {
    const neighbors = getAdjacentLocations("church");
    expect(neighbors).toEqual(["bridge"]);
  });
});

describe("shortestPathDistance", () => {
  it("returns 0 for same location", () => {
    expect(shortestPathDistance("bridge", "bridge")).toBe(0);
  });

  it("returns 1 for adjacent locations", () => {
    expect(shortestPathDistance("bridge", "warehouse")).toBe(1);
    expect(shortestPathDistance("church", "bridge")).toBe(1);
  });

  it("returns 2 for 2-step paths", () => {
    expect(shortestPathDistance("church", "mountain-path")).toBe(2);
    expect(shortestPathDistance("station", "warehouse")).toBe(2);
  });

  it("returns correct distance for water-tower to river-mouth", () => {
    // water-tower → mountain-path → bridge → warehouse → river-mouth = 4
    // OR water-tower → mountain-path → upstream → aqueduct → river-mouth = 4
    expect(shortestPathDistance("water-tower", "river-mouth")).toBe(4);
  });

  it("returns correct distance for church to port", () => {
    // church → bridge → station → port = 3
    expect(shortestPathDistance("church", "port")).toBe(3);
  });

  it("aqueduct shortens upstream ↔ river-mouth to 2", () => {
    // upstream → aqueduct → river-mouth = 2
    expect(shortestPathDistance("upstream", "river-mouth")).toBe(2);
  });

  it("is symmetric", () => {
    expect(shortestPathDistance("water-tower", "port")).toBe(
      shortestPathDistance("port", "water-tower"),
    );
  });
});

describe("getStationReachable", () => {
  it("includes all locations within 2 steps from station", () => {
    const reachable = getStationReachable();
    // station neighbors (1 step): bridge, shopping, port
    expect(reachable).toContain("bridge");
    expect(reachable).toContain("shopping");
    expect(reachable).toContain("port");
    // 2 steps from station: church, mountain-path, warehouse, old-residential, river-mouth
    expect(reachable).toContain("church");
    expect(reachable).toContain("mountain-path");
    expect(reachable).toContain("warehouse");
    expect(reachable).toContain("old-residential");
    expect(reachable).toContain("river-mouth");
  });

  it("does not include station itself", () => {
    const reachable = getStationReachable();
    expect(reachable).not.toContain("station");
  });

  it("does not include locations 3+ steps away", () => {
    const reachable = getStationReachable();
    // upstream is 3 steps: station → bridge → mountain-path → upstream
    expect(reachable).not.toContain("upstream");
    // aqueduct is 4+ steps from station
    expect(reachable).not.toContain("aqueduct");
    // water-tower is 3 steps: station → bridge → mountain-path → water-tower
    expect(reachable).not.toContain("water-tower");
  });
});

describe("getValidMoves", () => {
  it("returns adjacent + stay for normal location", () => {
    const moves = getValidMoves("bridge", false);
    expect(moves).toContain("bridge"); // stay
    expect(moves).toContain("church");
    expect(moves).toContain("mountain-path");
    expect(moves).toContain("shopping");
    expect(moves).toContain("station");
    expect(moves).toContain("warehouse");
    expect(moves).toHaveLength(6); // 5 neighbors + stay
  });

  it("returns 2-step reachable + stay for station", () => {
    const moves = getValidMoves("station", true);
    expect(moves).toContain("station"); // stay
    expect(moves).toContain("bridge");
    expect(moves).toContain("shopping");
    expect(moves).toContain("port");
    expect(moves).toContain("church");
    expect(moves).toContain("mountain-path");
    expect(moves).toContain("warehouse");
    expect(moves).toContain("old-residential");
    expect(moves).toContain("river-mouth");
  });

  it("uses normal movement if isAtStation is false even at station", () => {
    const moves = getValidMoves("station", false);
    expect(moves).toHaveLength(4); // 3 neighbors + stay
  });

  it("church has only 2 valid moves (stay + bridge)", () => {
    const moves = getValidMoves("church", false);
    expect(moves).toHaveLength(2);
    expect(moves).toContain("church");
    expect(moves).toContain("bridge");
  });
});

describe("getManaDistanceMultiplier", () => {
  it("returns ×1 for distance 0", () => {
    expect(getManaDistanceMultiplier(0)).toBe(1);
  });

  it("returns ×1 for distance 1", () => {
    expect(getManaDistanceMultiplier(1)).toBe(1);
  });

  it("returns ×1.5 for distance 2", () => {
    expect(getManaDistanceMultiplier(2)).toBe(1.5);
  });

  it("returns ×2 for distance 3", () => {
    expect(getManaDistanceMultiplier(3)).toBe(2);
  });

  it("returns ×3 for distance 4+", () => {
    expect(getManaDistanceMultiplier(4)).toBe(3);
    expect(getManaDistanceMultiplier(5)).toBe(3);
    expect(getManaDistanceMultiplier(10)).toBe(3);
  });
});
