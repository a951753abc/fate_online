export interface DiceResult {
  readonly dice: readonly number[];
  readonly total: number;
  readonly modifier: number;
  readonly formula: string;
}
