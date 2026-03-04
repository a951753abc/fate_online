import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext.js";
import { LobbyPage } from "./pages/LobbyPage.js";
import { RoomPage } from "./pages/RoomPage.js";
import { GamePage } from "./pages/GamePage.js";
import { CreatorPage } from "./pages/CreatorPage.js";

export function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/room/:code" element={<RoomPage />} />
          <Route path="/game/:code" element={<GamePage />} />
          <Route path="/creator" element={<CreatorPage />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}
