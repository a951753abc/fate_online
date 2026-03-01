import { describe, it, expect } from "vitest";
import {
  LOCATIONS,
  ADJACENCY,
  LOCATION_IDS,
  LEY_LINE_LOCATIONS,
  getLocationDef,
} from "../mapData.js";

describe("mapData", () => {
  it("has exactly 12 locations", () => {
    expect(LOCATIONS).toHaveLength(12);
    expect(LOCATION_IDS).toHaveLength(12);
  });

  it("has unique location IDs", () => {
    const ids = new Set(LOCATION_IDS);
    expect(ids.size).toBe(12);
  });

  it("has adjacency entries for all 12 locations", () => {
    expect(ADJACENCY.size).toBe(12);
    for (const id of LOCATION_IDS) {
      expect(ADJACENCY.has(id)).toBe(true);
    }
  });

  it("adjacency is bidirectional", () => {
    for (const [locId, neighbors] of ADJACENCY) {
      for (const neighbor of neighbors) {
        const reverseNeighbors = ADJACENCY.get(neighbor);
        expect(reverseNeighbors, `${neighbor} should have adjacency entry`).toBeDefined();
        expect(
          reverseNeighbors!.includes(locId),
          `${neighbor} → ${locId} should be bidirectional`,
        ).toBe(true);
      }
    }
  });

  it("bridge has 5 neighbors (highest connectivity)", () => {
    const bridgeNeighbors = ADJACENCY.get("bridge")!;
    expect(bridgeNeighbors).toHaveLength(5);
    expect(bridgeNeighbors).toContain("church");
    expect(bridgeNeighbors).toContain("mountain-path");
    expect(bridgeNeighbors).toContain("shopping");
    expect(bridgeNeighbors).toContain("station");
    expect(bridgeNeighbors).toContain("warehouse");
  });

  it("church has 1 neighbor (most isolated)", () => {
    const churchNeighbors = ADJACENCY.get("church")!;
    expect(churchNeighbors).toHaveLength(1);
    expect(churchNeighbors).toContain("bridge");
  });

  it("aqueduct connects upstream and river-mouth (bypass)", () => {
    const aqueductNeighbors = ADJACENCY.get("aqueduct")!;
    expect(aqueductNeighbors).toHaveLength(2);
    expect(aqueductNeighbors).toContain("upstream");
    expect(aqueductNeighbors).toContain("river-mouth");
  });

  it("ley line locations are upstream and river-mouth", () => {
    expect(LEY_LINE_LOCATIONS).toContain("upstream");
    expect(LEY_LINE_LOCATIONS).toContain("river-mouth");
    expect(LEY_LINE_LOCATIONS).toHaveLength(2);
  });

  it("each location has all required fields", () => {
    for (const loc of LOCATIONS) {
      expect(loc.id).toBeTruthy();
      expect(loc.name).toBeTruthy();
      expect(["mountain", "town", "sea", "global"]).toContain(loc.zone);
      expect(loc.description).toBeTruthy();
      expect(loc.stars).toBeGreaterThanOrEqual(1);
      expect(loc.stars).toBeLessThanOrEqual(5);
    }
  });

  it("getLocationDef returns correct location", () => {
    const bridge = getLocationDef("bridge");
    expect(bridge.name).toBe("奏琴橋");
    expect(bridge.zone).toBe("town");
  });

  it("getLocationDef throws for unknown location", () => {
    expect(() => getLocationDef("nonexistent" as never)).toThrow("Unknown location");
  });

  it("zones are correctly assigned", () => {
    const mountainLocs = LOCATIONS.filter((l) => l.zone === "mountain");
    const townLocs = LOCATIONS.filter((l) => l.zone === "town");
    const seaLocs = LOCATIONS.filter((l) => l.zone === "sea");
    const globalLocs = LOCATIONS.filter((l) => l.zone === "global");

    expect(mountainLocs).toHaveLength(4);
    expect(townLocs).toHaveLength(4);
    expect(seaLocs).toHaveLength(3);
    expect(globalLocs).toHaveLength(1);
  });
});
