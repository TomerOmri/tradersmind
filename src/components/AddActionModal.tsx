import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@headlessui/react";
import {
  useTradeStore,
  type TradeType,
  type Trade,
  type TradeAction,
} from "../store/tradeStore";
import { useSettingsStore } from "../store/settingsStore";

interface Position {
  totalShares: number;
  costBasis: number;
  avgPrice: number;
}

interface PositionMetrics extends Position {
  accountSize: number;
  positionSize: number;
  positionSizePercent: number;
  riskAmount: number;
  riskPercent: number;
  potentialProfit: number;
  riskRewardRatio: number;
  remainingShares?: number;
  remainingPercent?: number;
}

interface AddActionModalProps {
  tradeId: string;
  onClose: () => void;
}

// Utility function for number formatting
const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

const formatCurrency = (num: number): string => {
  return `$${formatNumber(num)}`;
};

const formatShares = (num: number): string => {
  return formatNumber(num, 0);
};

export default function AddActionModal({
  tradeId,
  onClose,
}: AddActionModalProps) {
  const { t } = useTranslation();
  const addAction = useTradeStore(
    (state: {
      addAction: (tradeId: string, action: Omit<TradeAction, "date">) => void;
    }) => state.addAction
  );
  const accountSize = useSettingsStore(
    (state: { accountSize: number }) => state.accountSize
  );
  const trade = useTradeStore((state: { trades: Trade[] }) =>
    state.trades.find((t) => t.id === tradeId)
  );

  // Calculate current position details
  const calculateCurrentPosition = () => {
    if (!trade?.actions?.length)
      return { totalShares: 0, costBasis: 0, avgPrice: 0 } as Position;

    let runningAvgPrice = 0;
    const position = trade.actions.reduce(
      (
        acc: { totalShares: number; costBasis: number },
        action: TradeAction
      ) => {
        const actionCost = action.price * action.quantity;
        if (action.type === "buy") {
          const newTotalShares = acc.totalShares + action.quantity;
          const newCostBasis = acc.costBasis + actionCost;
          runningAvgPrice =
            newTotalShares > 0 ? newCostBasis / newTotalShares : 0;
          return {
            totalShares: newTotalShares,
            costBasis: newCostBasis,
          };
        } else {
          const newTotalShares = acc.totalShares - action.quantity;
          const newCostBasis =
            acc.costBasis - runningAvgPrice * action.quantity;
          runningAvgPrice =
            newTotalShares > 0 ? newCostBasis / newTotalShares : 0;
          return {
            totalShares: newTotalShares,
            costBasis: newCostBasis,
          };
        }
      },
      { totalShares: 0, costBasis: 0 }
    );

    return { ...position, avgPrice: runningAvgPrice } as Position;
  };

  // Calculate position metrics
  const calculatePositionMetrics = (): PositionMetrics => {
    const current = calculateCurrentPosition();
    const actionQuantity = parseFloat(formData.quantity) || 0;
    const actionPrice = parseFloat(formData.price) || 0;
    const stopLoss = parseFloat(formData.stopLoss) || 0;
    const targetPrice = parseFloat(formData.targetPrice) || 0;
    const actionCost = actionPrice * actionQuantity;

    let newPosition: Position;
    if (formData.type === "buy") {
      const newTotalShares = current.totalShares + actionQuantity;
      const newCostBasis = current.costBasis + actionCost;
      const newAvgPrice =
        newTotalShares > 0 ? newCostBasis / newTotalShares : 0;
      newPosition = {
        totalShares: newTotalShares,
        costBasis: newCostBasis,
        avgPrice: newAvgPrice,
      };
    } else {
      const newTotalShares = current.totalShares - actionQuantity;
      const newCostBasis =
        current.costBasis - current.avgPrice * actionQuantity;
      const newAvgPrice =
        newTotalShares > 0 ? newCostBasis / newTotalShares : 0;
      newPosition = {
        totalShares: newTotalShares,
        costBasis: newCostBasis,
        avgPrice: newAvgPrice,
      };
    }

    // Calculate risk and position metrics
    const positionSize =
      formData.type === "buy" ? actionCost : actionQuantity * actionPrice;
    const positionSizePercent = (positionSize / accountSize) * 100;

    let riskAmount = 0;
    let potentialProfit = 0;

    if (formData.type === "buy") {
      riskAmount = stopLoss ? (actionPrice - stopLoss) * actionQuantity : 0;
      potentialProfit = targetPrice
        ? (targetPrice - actionPrice) * actionQuantity
        : 0;
    } else {
      riskAmount = stopLoss ? (stopLoss - actionPrice) * actionQuantity : 0;
      potentialProfit = targetPrice
        ? (actionPrice - targetPrice) * actionQuantity
        : 0;
    }

    const riskPercent = (riskAmount / accountSize) * 100;
    const riskRewardRatio =
      riskAmount && potentialProfit ? potentialProfit / riskAmount : 0;

    // Calculate remaining position metrics for partial sells
    const remainingShares =
      formData.type === "sell" ? newPosition.totalShares : undefined;
    const remainingPercent = remainingShares
      ? (remainingShares / current.totalShares) * 100
      : undefined;

    return {
      ...newPosition,
      accountSize,
      positionSize,
      positionSizePercent,
      riskAmount,
      riskPercent,
      potentialProfit,
      riskRewardRatio,
      remainingShares,
      remainingPercent,
    };
  };

  const [formData, setFormData] = useState({
    type: "sell" as TradeType,
    price: "",
    quantity: calculateCurrentPosition().totalShares.toString(),
    date: new Date().toISOString().slice(0, 16),
    stopLoss: "",
    targetPrice: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAction(tradeId, {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        stopLoss:
          formData.type === "buy" && formData.stopLoss
            ? parseFloat(formData.stopLoss)
            : undefined,
        targetPrice: formData.targetPrice
          ? parseFloat(formData.targetPrice)
          : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to add action:", error);
      // You might want to show an error message to the user here
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!trade) return null;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white dark:bg-gray-800 p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            {t("actions.add")} - {trade.symbol}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("trade.type")}
              </label>
              <select
                name="type"
                id="type"
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-opacity-50 sm:text-sm
                  ${
                    formData.type === "buy"
                      ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400"
                      : "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 text-red-700 dark:text-red-400"
                  } 
                  dark:bg-gray-700`}
                value={formData.type}
                onChange={handleChange}
              >
                <option
                  value="buy"
                  className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30"
                >
                  {t("actions.buy")}
                </option>
                <option
                  value="sell"
                  className="text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                >
                  {t("actions.sell")}
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("trade.price")}
              </label>
              <input
                type="number"
                name="price"
                id="price"
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("trade.quantity")}
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                min="0"
                step="1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            {formData.type === "buy" && (
              <div>
                <label
                  htmlFor="stopLoss"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t("trade.stopLoss")}
                </label>
                <input
                  type="number"
                  name="stopLoss"
                  id="stopLoss"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  value={formData.stopLoss}
                  onChange={handleChange}
                />
              </div>
            )}

            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("trade.notes")}
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={1}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm min-h-[38px] resize-none overflow-hidden"
                value={formData.notes}
                onChange={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                  handleChange(e);
                }}
              />
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t("trade.summary")}
              </h3>

              <div className="space-y-4 text-sm">
                {/* Current Position */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("trade.currentPosition")}:
                    </span>
                    <span className="font-medium">
                      {formatShares(calculateCurrentPosition().totalShares)} @{" "}
                      {formatCurrency(calculateCurrentPosition().avgPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("trade.currentCostBasis")}:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(calculateCurrentPosition().costBasis)}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-600" />

                {/* New Position */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("trade.newPosition")}:
                    </span>
                    <span className="font-medium">
                      {formatShares(calculatePositionMetrics().totalShares)} @{" "}
                      {formatCurrency(calculatePositionMetrics().avgPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("trade.newCostBasis")}:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(calculatePositionMetrics().costBasis)}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-600" />

                {/* Position Size */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      {t("trade.positionSize")}:
                    </span>
                    <span className="font-medium">
                      {formatCurrency(calculatePositionMetrics().positionSize)}{" "}
                      (
                      {formatNumber(
                        calculatePositionMetrics().positionSizePercent
                      )}
                      %)
                    </span>
                  </div>

                  {/* Risk/Reward */}
                  {formData.stopLoss && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>{t("trade.riskAmount")}:</span>
                      <span className="font-medium">
                        {formatCurrency(calculatePositionMetrics().riskAmount)}{" "}
                        ({formatNumber(calculatePositionMetrics().riskPercent)}
                        %)
                      </span>
                    </div>
                  )}
                  {formData.stopLoss && formData.targetPrice && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>{t("trade.potentialProfit")}:</span>
                      <span className="font-medium">
                        {formatCurrency(
                          calculatePositionMetrics().potentialProfit
                        )}{" "}
                        (R/R:{" "}
                        {formatNumber(
                          calculatePositionMetrics().riskRewardRatio
                        )}
                        )
                      </span>
                    </div>
                  )}
                </div>

                {/* Remaining Position (for sells) */}
                {formData.type === "sell" &&
                  calculatePositionMetrics().remainingShares !== undefined && (
                    <>
                      <hr className="border-gray-200 dark:border-gray-600" />
                      <div className="space-y-2">
                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                          <span>{t("trade.remainingPosition")}:</span>
                          <span className="font-medium">
                            {formatShares(
                              calculatePositionMetrics().remainingShares ?? 0
                            )}{" "}
                            {t("trade.sharesLabel")} |{" "}
                            {formatNumber(
                              calculatePositionMetrics().remainingPercent ?? 0
                            )}
                            % {t("trade.percentFromTotal")}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 rtl:space-x-reverse">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-900"
              >
                {t("actions.cancel")}
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
              >
                {t("actions.save")}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
