import { describe, expect, it } from "vitest";
import { EMOTIONS, getEmotionDef } from "../masterEmotions.js";

describe("masterEmotions", () => {
  describe("EMOTIONS data integrity", () => {
    it("should have all emotion IDs unique", () => {
      const ids = EMOTIONS.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should have at least 20 emotions defined", () => {
      expect(EMOTIONS.length).toBeGreaterThanOrEqual(20);
    });

    it("should have both normal and black variants", () => {
      const variants = new Set(EMOTIONS.map((e) => e.variant));
      expect(variants).toContain("normal");
      expect(variants).toContain("black");
    });

    it("should have nameJa and nameCht for every emotion", () => {
      for (const emotion of EMOTIONS) {
        expect(emotion.nameJa.length).toBeGreaterThan(0);
        expect(emotion.nameCht.length).toBeGreaterThan(0);
      }
    });

    it("should have non-negative defaultBond for every emotion", () => {
      for (const emotion of EMOTIONS) {
        expect(emotion.defaultBond).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("getEmotionDef", () => {
    it("should return the correct emotion by ID", () => {
      const atonement = getEmotionDef("atonement");
      expect(atonement.nameCht).toBe("贖罪");
      expect(atonement.variant).toBe("normal");
    });

    it("should return a black emotion by ID", () => {
      const rivalry = getEmotionDef("rivalry-black");
      expect(rivalry.variant).toBe("black");
      expect(rivalry.nameCht).toBe("敵手（黑）");
    });

    it("should throw for unknown emotion ID", () => {
      expect(() => getEmotionDef("nonexistent")).toThrow("Unknown emotion ID");
    });
  });
});
