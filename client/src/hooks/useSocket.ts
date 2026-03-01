import { useEffect, useState, useRef } from "react";
import { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "../socket.js";

export function useSocket(nickname: string | null): {
  socket: Socket | null;
  isConnected: boolean;
} {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!nickname) return;

    const socket = connectSocket(nickname);
    socketRef.current = socket;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) setIsConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      disconnectSocket();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [nickname]);

  return { socket: socketRef.current, isConnected };
}
