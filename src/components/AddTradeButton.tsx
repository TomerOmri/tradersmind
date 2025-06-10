import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon } from "@heroicons/react/24/outline";
import AddTradeModal from "./AddTradeModal";
import { useTradeStore } from "../store/tradeStore";

export default function AddTradeButton() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const addTrade = useTradeStore((state) => state.addTrade);

  const handleSubmit = (tradeData: any) => {
    addTrade({
      symbol: tradeData.ticker,
      setupType: tradeData.setupType,
      action: {
        type: tradeData.isBuy ? "buy" : "sell",
        price: tradeData.entryPrice,
        quantity: tradeData.shares,
        date: new Date().toISOString(),
        stopLoss: tradeData.stopLoss,
      },
    });
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg
          bg-gradient-to-r from-blue-900 to-blue-800 text-blue-50
          hover:from-blue-950 hover:to-blue-900 
          active:scale-[0.98] transition-all"
        >
          <PlusIcon className="h-5 w-5 me-2 transition-transform group-hover:scale-110" />
          {t("actions.add")}
        </button>
      </div>

      {isOpen && (
        <AddTradeModal
          onClose={() => setIsOpen(false)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
