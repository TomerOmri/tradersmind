import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import TradeList from "./components/TradeList";
import Process from "./components/Process";
import Reports from "./components/Reports";
import Journal from "./components/Journal";
import ProceduralMemory from "./components/ProceduralMemory";
import MemoryTagPage from "./pages/MemoryTagPage";
import "./i18n/config";

function TradeView() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 w-full px-4 py-8">
        <div className="w-full max-w-[2000px] mx-auto flex flex-col gap-6">
          <TradeList />
        </div>
      </main>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.t("app.direction");
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        <Routes>
          <Route path="/" element={<TradeView />} />
          <Route path="/trades" element={<TradeView />} />
          <Route path="/process" element={<Process />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/memory" element={<ProceduralMemory />} />
          <Route path="/memory/:tag" element={<MemoryTagPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
