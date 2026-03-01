import crypto from "node:crypto";
import type { DiceResult } from "./types.js";

/**
 * Cryptographically secure random integer in [1, sides].
 * Uses rejection sampling to eliminate modulo bias.
 */
function secureDie(sides: number): number {
  const maxValid = 256 - (256 % sides);
  let value: number;
  do {
    value = crypto.randomBytes(1)[0]!;
  } while (value >= maxValid);
  return (value % sides) + 1;
}

export function rollDice(count: number, sides: number, modifier: number = 0): DiceResult {
  const dice = Array.from({ length: count }, () => secureDie(sides));
  const sum = dice.reduce((a, b) => a + b, 0);
  const total = sum + modifier;

  const modStr = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : "";
  const formula = `${count}d${sides}${modStr}`;

  return Object.freeze({
    dice: Object.freeze(dice),
    total,
    modifier,
    formula,
  });
}

export function roll2D6(modifier: number = 0): DiceResult {
  return rollDice(2, 6, modifier);
}
