import { describe, it, expect } from "vitest";
import { assignStartingPositions } from "../startingPositions.js";
import { LOCATION_IDS } from "../map/mapData.js";

describe("assignStartingPositions", () => {
  it("assigns one location per group", () => {
    const result = assignStartingPositions(7);
    expect(result.size).toBe(7);
  });

  it("assigns no duplicate locations", () => {
    const result = assignStartingPositions(7);
    const locations = [...result.values()];
    const unique = new Set(locations);
    expect(unique.size).toBe(7);
  });

  it("all assigned locations are valid", () => {
    const result = assignStartingPositions(7);
    for (const loc of result.values()) {
      expect(LOCATION_IDS).toContain(loc);
    }
  });

  it("works with 2 groups", () => {
    const result = assignStartingPositions(2);
    expect(result.size).toBe(2);
    const [loc1, loc2] = [...result.values()];
    expect(loc1).not.toBe(loc2);
  });

  it("works with max groups (7) on 12 locations", () => {
    const result = assignStartingPositions(7);
    expect(result.size).toBe(7);
  });

  it("group indices are 0-based sequential", () => {
    const result = assignStartingPositions(5);
    for (let i = 0; i < 5; i++) {
      expect(result.has(i)).toBe(true);
    }
  });

  it("throws if more groups than locations", () => {
    expect(() => assignStartingPositions(13)).toThrow();
  });

  it("accepts custom available locations", () => {
    const result = assignStartingPositions(2, ["bridge", "port", "church"]);
    expect(result.size).toBe(2);
    for (const loc of result.values()) {
      expect(["bridge", "port", "church"]).toContain(loc);
    }
  });
});
