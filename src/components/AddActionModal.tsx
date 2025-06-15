import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@headlessui/react";
import { useTradeStore, type TradeType } from "../store/tradeStore";

interface AddActionModalProps {
  tradeId: string;
  onClose: () => void;
}

export default function AddActionModal({
  tradeId,
  onClose,
}: AddActionModalProps) {
  const { t } = useTranslation();
  const addAction = useTradeStore((state) => state.addAction);
  const trade = useTradeStore((state) =>
    state.trades.find((t) => t.id === tradeId)
  );

  // Calculate total shares held
  const calculateTotalShares = () => {
    if (!trade?.actions?.length) return 0;
    return trade.actions.reduce((acc, action) => {
      return acc + (action.type === "buy" ? action.quantity : -action.quantity);
    }, 0);
  };

  const [formData, setFormData] = useState({
    type: "sell" as TradeType,
    price: "",
    quantity: calculateTotalShares().toString(),
    date: new Date().toISOString().slice(0, 16),
    stopLoss: "",
    targetPrice: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAction(tradeId, {
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
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                value={formData.notes}
                onChange={handleChange}
              />
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
