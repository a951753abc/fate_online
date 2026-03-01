import { describe, it, expect } from "vitest";
import { generateRoomCode } from "../../server/room/roomCodeGenerator.js";

describe("generateRoomCode", () => {
  it("generates 6-character codes", () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it("uses only allowed characters (no I, O, 0, 1)", () => {
    const allowed = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(allowed).toContain(char);
      }
    }
  });

  it("generates unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // With 32^6 = ~1 billion possibilities, 100 codes should all be unique
    expect(codes.size).toBe(100);
  });

  it("does not contain ambiguous characters", () => {
    const ambiguous = ["I", "O", "0", "1"];
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      for (const char of ambiguous) {
        expect(code).not.toContain(char);
      }
    }
  });
});
