import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext.js";
import { LobbyPage } from "./pages/LobbyPage.js";
import { RoomPage } from "./pages/RoomPage.js";
import { GamePage } from "./pages/GamePage.js";

export function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/room/:code" element={<RoomPage />} />
          <Route path="/game/:code" element={<GamePage />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}
