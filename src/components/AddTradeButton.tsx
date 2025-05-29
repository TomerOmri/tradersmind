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
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
        >
          <PlusIcon className="h-5 w-5 me-2" />
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
