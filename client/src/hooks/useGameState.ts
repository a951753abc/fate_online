import { useState, useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type {
  LocationId,
  GameInitializedPayload,
  GamePhaseChangePayload,
  PositionsPayload,
  OccupationsPayload,
  MoveResultPayload,
  EncounterPayload,
  NightReportPayload,
  LocationDestroyedPayload,
  GameEndedPayload,
  CharacterPositionView,
  NightStateView,
} from "../types/protocol.js";

export interface GameStateHook {
  readonly gameData: GameInitializedPayload | null;
  readonly nightState: NightStateView | null;
  readonly positions: readonly CharacterPositionView[];
  readonly occupations: OccupationsPayload["occupations"];
  readonly encounters: readonly EncounterPayload[];
  readonly nightReport: NightReportPayload | null;
  readonly destroyedLocations: readonly LocationId[];
  readonly gameEnded: GameEndedPayload | null;
  readonly moveSubmitted: boolean;
  readonly moveError: string | null;
  readonly submitMove: (location: LocationId) => void;
}

export function useGameState(
  socket: Socket | null,
  initialData?: GameInitializedPayload,
): GameStateHook {
  const [gameData, setGameData] = useState<GameInitializedPayload | null>(initialData ?? null);
  const [nightState, setNightState] = useState<NightStateView | null>(initialData?.night ?? null);
  const [positions, setPositions] = useState<readonly CharacterPositionView[]>(
    initialData?.positions ?? [],
  );
  const [occupations, setOccupations] = useState<OccupationsPayload["occupations"]>([]);
  const [encounters, setEncounters] = useState<readonly EncounterPayload[]>([]);
  const [nightReport, setNightReport] = useState<NightReportPayload | null>(null);
  const [destroyedLocations, setDestroyedLocations] = useState<readonly LocationId[]>([]);
  const [gameEnded, setGameEnded] = useState<GameEndedPayload | null>(null);
  const [moveSubmitted, setMoveSubmitted] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onInitialized = (data: GameInitializedPayload) => {
      setGameData(data);
      setNightState(data.night);
      setPositions(data.positions);
    };

    const onPhaseChange = (data: GamePhaseChangePayload) => {
      setNightState({
        nightNumber: data.nightNumber,
        phase: data.phase,
        phaseEndsAt: data.phaseEndsAt,
      });
      setMoveSubmitted(false);
      setMoveError(null);
      setEncounters([]);
    };

    const onPositions = (data: PositionsPayload) => {
      setPositions(data.positions);
    };

    const onOccupations = (data: OccupationsPayload) => {
      setOccupations(data.occupations);
    };

    const onMoveResult = (data: MoveResultPayload) => {
      if (data.success) {
        setMoveSubmitted(true);
        setMoveError(null);
      } else {
        setMoveError(data.error ?? "Move failed");
      }
    };

    const onEncounter = (data: EncounterPayload) => {
      setEncounters((prev) => [...prev, data]);
    };

    const onNightReport = (data: NightReportPayload) => {
      setNightReport(data);
    };

    const onLocationDestroyed = (data: LocationDestroyedPayload) => {
      setDestroyedLocations((prev) => [...prev, ...data.locationIds]);
    };

    const onGameEnded = (data: GameEndedPayload) => {
      setGameEnded(data);
    };

    socket.on("game:initialized", onInitialized);
    socket.on("game:phaseChange", onPhaseChange);
    socket.on("game:positions", onPositions);
    socket.on("game:occupations", onOccupations);
    socket.on("game:moveResult", onMoveResult);
    socket.on("game:encounter", onEncounter);
    socket.on("game:nightReport", onNightReport);
    socket.on("game:locationDestroyed", onLocationDestroyed);
    socket.on("game:ended", onGameEnded);

    return () => {
      socket.off("game:initialized", onInitialized);
      socket.off("game:phaseChange", onPhaseChange);
      socket.off("game:positions", onPositions);
      socket.off("game:occupations", onOccupations);
      socket.off("game:moveResult", onMoveResult);
      socket.off("game:encounter", onEncounter);
      socket.off("game:nightReport", onNightReport);
      socket.off("game:locationDestroyed", onLocationDestroyed);
      socket.off("game:ended", onGameEnded);
    };
  }, [socket]);

  const submitMove = useCallback(
    (location: LocationId) => {
      if (!socket) return;
      socket.emit("game:move", { targetLocation: location });
    },
    [socket],
  );

  return {
    gameData,
    nightState,
    positions,
    occupations,
    encounters,
    nightReport,
    destroyedLocations,
    gameEnded,
    moveSubmitted,
    moveError,
    submitMove,
  };
}
