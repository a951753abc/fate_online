import { describe, it, expect } from "vitest";
import { rollDice, roll2D6 } from "../../server/dice/engine.js";

describe("rollDice", () => {
  it("returns correct number of dice", () => {
    const result = rollDice(3, 6);
    expect(result.dice).toHaveLength(3);
  });

  it("each die is within [1, sides]", () => {
    const result = rollDice(5, 6);
    for (const die of result.dice) {
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
    }
  });

  it("total equals sum of dice plus modifier", () => {
    const result = rollDice(2, 6, 3);
    const sum = result.dice.reduce((a, b) => a + b, 0);
    expect(result.total).toBe(sum + 3);
  });

  it("formula string is correct without modifier", () => {
    const result = rollDice(2, 6);
    expect(result.formula).toBe("2d6");
  });

  it("formula string includes positive modifier", () => {
    const result = rollDice(2, 6, 3);
    expect(result.formula).toBe("2d6+3");
  });

  it("formula string includes negative modifier", () => {
    const result = rollDice(1, 20, -2);
    expect(result.formula).toBe("1d20-2");
  });

  it("modifier defaults to 0", () => {
    const result = rollDice(2, 6);
    expect(result.modifier).toBe(0);
  });

  it("result is frozen (immutable)", () => {
    const result = rollDice(2, 6);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dice)).toBe(true);
  });

  it("handles single die", () => {
    const result = rollDice(1, 6);
    expect(result.dice).toHaveLength(1);
    expect(result.total).toBe(result.dice[0]);
  });

  it("handles large number of dice", () => {
    const result = rollDice(10, 6);
    expect(result.dice).toHaveLength(10);
    expect(result.total).toBeGreaterThanOrEqual(10);
    expect(result.total).toBeLessThanOrEqual(60);
  });

  it("handles d20", () => {
    const result = rollDice(1, 20);
    expect(result.dice[0]).toBeGreaterThanOrEqual(1);
    expect(result.dice[0]).toBeLessThanOrEqual(20);
  });
});

describe("roll2D6", () => {
  it("returns exactly 2 dice", () => {
    const result = roll2D6();
    expect(result.dice).toHaveLength(2);
  });

  it("total is between 2 and 12 without modifier", () => {
    const result = roll2D6();
    expect(result.total).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeLessThanOrEqual(12);
  });

  it("formula is 2d6", () => {
    const result = roll2D6();
    expect(result.formula).toBe("2d6");
  });

  it("applies modifier", () => {
    const result = roll2D6(5);
    expect(result.total).toBeGreaterThanOrEqual(7);
    expect(result.total).toBeLessThanOrEqual(17);
    expect(result.formula).toBe("2d6+5");
  });

  it("each die is between 1 and 6", () => {
    for (let i = 0; i < 100; i++) {
      const result = roll2D6();
      for (const die of result.dice) {
        expect(die).toBeGreaterThanOrEqual(1);
        expect(die).toBeLessThanOrEqual(6);
      }
    }
  });
});

describe("distribution fairness", () => {
  it("distribution of 2D6 is roughly bell-curved (10K rolls)", () => {
    const counts = new Map<number, number>();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const result = roll2D6();
      counts.set(result.total, (counts.get(result.total) ?? 0) + 1);
    }

    // 7 should be the most common result (~16.67% expected)
    const count7 = counts.get(7) ?? 0;
    expect(count7 / iterations).toBeGreaterThan(0.1);
    expect(count7 / iterations).toBeLessThan(0.25);

    // 2 and 12 should be the least common (~2.78% expected)
    const count2 = counts.get(2) ?? 0;
    const count12 = counts.get(12) ?? 0;
    expect(count2 / iterations).toBeLessThan(0.06);
    expect(count12 / iterations).toBeLessThan(0.06);

    // All values 2-12 should appear
    for (let v = 2; v <= 12; v++) {
      expect(counts.get(v)).toBeGreaterThan(0);
    }
  });
});
