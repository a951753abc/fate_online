import { useState, useEffect, useCallback } from "react";
import type { Socket } from "socket.io-client";
import type { PrepResultPayload, PrepStatePayload, PrepSubmitPayload } from "../types/protocol.js";

export interface PrepHook {
  readonly prepState: PrepStatePayload | null;
  readonly buildResult: PrepResultPayload | null;
  readonly submitBuild: (payload: PrepSubmitPayload) => void;
  readonly confirmReady: () => void;
}

export function usePreparation(socket: Socket | null): PrepHook {
  const [prepState, setPrepState] = useState<PrepStatePayload | null>(null);
  const [buildResult, setBuildResult] = useState<PrepResultPayload | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onPrepResult = (data: PrepResultPayload) => {
      setBuildResult(data);
    };

    const onPrepState = (data: PrepStatePayload) => {
      setPrepState(data);
    };

    socket.on("prep:result", onPrepResult);
    socket.on("prep:state", onPrepState);

    return () => {
      socket.off("prep:result", onPrepResult);
      socket.off("prep:state", onPrepState);
    };
  }, [socket]);

  const submitBuild = useCallback(
    (payload: PrepSubmitPayload) => {
      socket?.emit("prep:submit", payload);
    },
    [socket],
  );

  const confirmReady = useCallback(() => {
    socket?.emit("prep:ready");
  }, [socket]);

  return { prepState, buildResult, submitBuild, confirmReady };
}
