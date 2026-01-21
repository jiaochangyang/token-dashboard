import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TokensPage } from "./pages/TokensPage";
import { TokenDetailPage } from "./pages/TokenDetailPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TokensPage />} />
        <Route path="/token/:address" element={<TokenDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
