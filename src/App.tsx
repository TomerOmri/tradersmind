import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import TradeList from "./components/TradeList";
import AddTradeButton from "./components/AddTradeButton";
import Process from "./components/Process";
import "./i18n/config";

function TradeView() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 w-full px-4 py-8">
        <div className="w-full max-w-[2000px] mx-auto flex flex-col gap-6">
          <AddTradeButton />
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
