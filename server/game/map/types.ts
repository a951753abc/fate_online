export type LocationId =
  | "water-tower"
  | "old-residential"
  | "mountain-path"
  | "upstream"
  | "church"
  | "bridge"
  | "shopping"
  | "station"
  | "port"
  | "warehouse"
  | "river-mouth"
  | "aqueduct";

export type Zone = "mountain" | "town" | "sea" | "global";

export interface LocationDef {
  readonly id: LocationId;
  readonly name: string;
  readonly zone: Zone;
  readonly description: string;
  readonly stars: number;
}
