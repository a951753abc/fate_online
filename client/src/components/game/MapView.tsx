import type { LocationId, CharacterPositionView } from "../../types/protocol.js";
import mapData from "../../../../map/map-data.json";

interface MapViewProps {
  readonly positions: readonly CharacterPositionView[];
  readonly occupations: readonly { locationId: LocationId; groupIndex: number }[];
  readonly myCharacterId: string;
  readonly myLocation: LocationId;
  readonly validMoves: readonly LocationId[];
  readonly canMove: boolean;
  readonly destroyedLocations: readonly LocationId[];
  readonly onLocationClick: (id: LocationId) => void;
}

const ZONE_COLORS: Record<string, string> = {
  mountain: "#3a5a2c",
  town: "#8a7d6b",
  sea: "#1a4b7a",
  global: "#6b3a6b",
};

const GROUP_COLORS = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22"];

export function MapView({
  positions,
  occupations,
  myCharacterId,
  myLocation,
  validMoves,
  canMove,
  destroyedLocations,
  onLocationClick,
}: MapViewProps) {
  const locations = mapData.locations;
  const connections = mapData.connections;
  const canvas = mapData.meta.canvas;

  // Group positions by location
  const locationChars = new Map<string, CharacterPositionView[]>();
  for (const pos of positions) {
    const list = locationChars.get(pos.location) ?? [];
    locationChars.set(pos.location, [...list, pos]);
  }

  // Occupation lookup
  const occupationMap = new Map<string, number>();
  for (const occ of occupations) {
    occupationMap.set(occ.locationId, occ.groupIndex);
  }

  const destroyedSet = new Set(destroyedLocations);

  return (
    <svg
      viewBox={`0 0 ${canvas.width} ${canvas.height}`}
      style={{ width: "100%", maxHeight: "500px", background: "#0d1117", borderRadius: "8px" }}
    >
      {/* Connections */}
      {connections.map((conn, i) => {
        const from = locations.find((l) => l.id === conn.from);
        const to = locations.find((l) => l.id === conn.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={conn.type === "hidden" ? "#444" : "#666"}
            strokeWidth={conn.type === "hidden" ? 1 : 2}
            strokeDasharray={conn.type === "hidden" ? "6,4" : undefined}
          />
        );
      })}

      {/* Locations */}
      {locations.map((loc) => {
        const id = loc.id as LocationId;
        const isDestroyed = destroyedSet.has(id);
        const isMyLocation = id === myLocation;
        const isValidMove = canMove && validMoves.includes(id);
        const occupiedBy = occupationMap.get(id);
        const charsHere = locationChars.get(id) ?? [];
        const zoneColor = ZONE_COLORS[loc.zone] ?? "#555";

        return (
          <g key={id}>
            {/* Occupation ring */}
            {occupiedBy !== undefined && !isDestroyed && (
              <circle
                cx={loc.x}
                cy={loc.y}
                r={30}
                fill="none"
                stroke={GROUP_COLORS[occupiedBy % GROUP_COLORS.length]}
                strokeWidth={3}
                opacity={0.6}
              />
            )}

            {/* Location circle */}
            <circle
              cx={loc.x}
              cy={loc.y}
              r={24}
              fill={isDestroyed ? "#333" : zoneColor}
              stroke={isMyLocation ? "#ffd700" : isValidMove ? "#00ff88" : "#888"}
              strokeWidth={isMyLocation ? 3 : isValidMove ? 2 : 1}
              opacity={isDestroyed ? 0.3 : 1}
              style={{ cursor: isValidMove && !isDestroyed ? "pointer" : "default" }}
              onClick={() => {
                if (isValidMove && !isDestroyed) onLocationClick(id);
              }}
            />

            {/* Destroyed X */}
            {isDestroyed && (
              <>
                <line
                  x1={loc.x - 12}
                  y1={loc.y - 12}
                  x2={loc.x + 12}
                  y2={loc.y + 12}
                  stroke="#ff0000"
                  strokeWidth={3}
                />
                <line
                  x1={loc.x + 12}
                  y1={loc.y - 12}
                  x2={loc.x - 12}
                  y2={loc.y + 12}
                  stroke="#ff0000"
                  strokeWidth={3}
                />
              </>
            )}

            {/* Character dots */}
            {!isDestroyed &&
              charsHere.map((char, ci) => {
                const isMe = char.characterId === myCharacterId;
                const angle = (ci / Math.max(charsHere.length, 1)) * Math.PI * 2 - Math.PI / 2;
                const radius = charsHere.length === 1 ? 0 : 14;
                const cx = loc.x + Math.cos(angle) * radius;
                const cy = loc.y + Math.sin(angle) * radius;

                return (
                  <circle
                    key={char.characterId}
                    cx={cx}
                    cy={cy}
                    r={isMe ? 6 : 4}
                    fill={isMe ? "#ffd700" : GROUP_COLORS[char.groupIndex % GROUP_COLORS.length]}
                    stroke={isMe ? "#fff" : "none"}
                    strokeWidth={isMe ? 1.5 : 0}
                  />
                );
              })}

            {/* Location name */}
            <text
              x={loc.x}
              y={loc.y + 38}
              textAnchor="middle"
              fill={isDestroyed ? "#666" : "#ccc"}
              fontSize={11}
              fontFamily="sans-serif"
            >
              {loc.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
