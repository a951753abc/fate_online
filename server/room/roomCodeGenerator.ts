import crypto from "node:crypto";

// Excludes ambiguous characters: I, O, 0, 1
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length]!)
    .join("");
}
