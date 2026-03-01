import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LobbyPage } from "./pages/LobbyPage.js";
import { RoomPage } from "./pages/RoomPage.js";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LobbyPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Routes>
    </BrowserRouter>
  );
}
