import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@headlessui/react";
import { useTradeStore, type TradeAction } from "../store/tradeStore";

interface EditActionModalProps {
  tradeId: string;
  action: TradeAction;
  onClose: () => void;
}

export default function EditActionModal({
  tradeId,
  action,
  onClose,
}: EditActionModalProps) {
  const { t } = useTranslation();
  const updateAction = useTradeStore((state) => state.updateAction);
  const [formData, setFormData] = useState({
    type: action.type,
    price: action.price.toString(),
    quantity: action.quantity.toString(),
    date: action.date.slice(0, 16),
    stopLoss: action.stopLoss?.toString() || "",
    targetPrice: action.targetPrice?.toString() || "",
    notes: action.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAction(tradeId, action.id, {
      ...formData,
      price: parseFloat(formData.price),
      quantity: parseFloat(formData.quantity),
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : undefined,
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

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded-lg bg-white dark:bg-gray-800 p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
            Edit Action
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="buy">{t("actions.buy")}</option>
                <option value="sell">{t("actions.sell")}</option>
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
              />
            </div>

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

            <div>
              <label
                htmlFor="targetPrice"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t("trade.targetPrice")}
              </label>
              <input
                type="number"
                name="targetPrice"
                id="targetPrice"
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                value={formData.targetPrice}
                onChange={handleChange}
              />
            </div>

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

            <div className="flex justify-end space-x-3">
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
