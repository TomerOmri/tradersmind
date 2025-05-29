import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Switch } from "@headlessui/react";
import {
  XMarkIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { useGeneralSettingsStore } from "./GeneralSettings";

interface AddTradeModalProps {
  onClose: () => void;
  onSubmit: (trade: any) => void;
}

export default function AddTradeModal({
  onClose,
  onSubmit,
}: AddTradeModalProps) {
  const { t } = useTranslation();
  const { accountSize, riskPerTrade } = useGeneralSettingsStore();

  const [formData, setFormData] = useState({
    ticker: "",
    entryPrice: "",
    stopLoss: "",
    isBuy: true,
    shares: "",
    date: new Date().toISOString().split("T")[0],
    setupType: "",
  });

  const [isDateLocked, setIsDateLocked] = useState(true);
  const [isSharesLocked, setIsSharesLocked] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate risk percentage and shares
  const calculateRiskAndShares = () => {
    if (!formData.entryPrice || !formData.stopLoss)
      return { riskPercentage: 0, calculatedShares: 0 };

    const entry = parseFloat(formData.entryPrice);
    const stop = parseFloat(formData.stopLoss);

    if (isNaN(entry) || isNaN(stop))
      return { riskPercentage: 0, calculatedShares: 0 };

    const riskPerShare = Math.abs(entry - stop);
    const maxRiskAmount = (accountSize * riskPerTrade) / 100;
    const calculatedShares = Math.floor(maxRiskAmount / riskPerShare);

    const riskPercentage = ((riskPerShare / entry) * 100).toFixed(2);

    return { riskPercentage, calculatedShares };
  };

  const { riskPercentage, calculatedShares } = calculateRiskAndShares();

  useEffect(() => {
    if (isSharesLocked) {
      setFormData((prev) => ({
        ...prev,
        shares: calculatedShares.toString(),
      }));
    }
  }, [calculatedShares, isSharesLocked]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ticker.trim()) {
      newErrors.ticker = t("validation.required");
    }

    if (!formData.entryPrice || isNaN(parseFloat(formData.entryPrice))) {
      newErrors.entryPrice = t("validation.invalidNumber");
    }

    if (!formData.stopLoss || isNaN(parseFloat(formData.stopLoss))) {
      newErrors.stopLoss = t("validation.invalidNumber");
    }

    if (!formData.date || isNaN(Date.parse(formData.date))) {
      newErrors.date = t("validation.invalidDate");
    }

    if (
      !formData.shares ||
      isNaN(parseFloat(formData.shares)) ||
      parseFloat(formData.shares) <= 0
    ) {
      newErrors.shares = t("validation.invalidShares");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...formData,
        entryPrice: parseFloat(formData.entryPrice),
        stopLoss: parseFloat(formData.stopLoss),
        shares: parseInt(formData.shares),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("trade.newTrade")}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("trade.symbol")} • {formData.ticker || "---"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Buy/Sell Switch */}
            <div className="flex justify-center">
              <Switch.Group>
                <div className="flex items-center gap-8 bg-gray-100 dark:bg-gray-700/50 px-6 py-3 rounded-xl">
                  <div
                    className={`flex items-center gap-2 ${
                      !formData.isBuy
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    <ArrowTrendingDownIcon className="h-5 w-5" />
                    {t("actions.sell")}
                  </div>
                  <Switch
                    checked={formData.isBuy}
                    onChange={(checked) =>
                      setFormData({ ...formData, isBuy: checked })
                    }
                    className={`${
                      formData.isBuy ? "bg-green-500" : "bg-red-500"
                    } relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500`}
                  >
                    <span
                      className={`${
                        formData.isBuy ? "translate-x-8" : "translate-x-1"
                      } inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform`}
                    />
                  </Switch>
                  <div
                    className={`flex items-center gap-2 ${
                      formData.isBuy
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    <ArrowTrendingUpIcon className="h-5 w-5" />
                    {t("actions.buy")}
                  </div>
                </div>
              </Switch.Group>
            </div>

            {/* Ticker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("trade.symbol")} *
              </label>
              <input
                type="text"
                value={formData.ticker}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ticker: e.target.value.toUpperCase(),
                  })
                }
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                  errors.ticker
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                } dark:bg-gray-700/50 text-lg font-medium`}
                placeholder="AAPL"
              />
              {errors.ticker && (
                <p className="mt-1.5 text-sm text-red-600">{errors.ticker}</p>
              )}
            </div>

            {/* Entry Price and Stop Loss */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("trade.price")} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entryPrice}
                    onChange={(e) =>
                      setFormData({ ...formData, entryPrice: e.target.value })
                    }
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                      errors.entryPrice
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                    } dark:bg-gray-700/50`}
                    placeholder="0.00"
                  />
                </div>
                {errors.entryPrice && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.entryPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t("trade.stopLoss")} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stopLoss}
                    onChange={(e) =>
                      setFormData({ ...formData, stopLoss: e.target.value })
                    }
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                      errors.stopLoss
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                    } dark:bg-gray-700/50`}
                    placeholder="0.00"
                  />
                </div>
                {errors.stopLoss && (
                  <p className="mt-1.5 text-sm text-red-600">
                    {errors.stopLoss}
                  </p>
                )}
              </div>
            </div>

            {/* Risk % (Calculated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("trade.riskPerTrade")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={`${riskPercentage}%`}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium"
                />
              </div>
            </div>

            {/* Setup Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("trade.setup")}
              </label>
              <select
                value={formData.setupType}
                onChange={(e) =>
                  setFormData({ ...formData, setupType: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700/50"
              >
                <option value="">{t("trade.selectSetup")}</option>
                <option value="breakout">{t("setup.breakout")}</option>
                <option value="pullback">{t("setup.pullback")}</option>
                <option value="momentum">{t("setup.momentum")}</option>
                <option value="reversal">{t("setup.reversal")}</option>
                <option value="other">{t("setup.other")}</option>
              </select>
            </div>

            {/* Date Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("trade.date")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsDateLocked(!isDateLocked);
                    if (isDateLocked) {
                      setFormData({
                        ...formData,
                        date: new Date().toISOString().split("T")[0],
                      });
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title={t("trade.dateOverride")}
                >
                  {isDateLocked ? (
                    <LockClosedIcon className="h-4 w-4" />
                  ) : (
                    <LockOpenIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  disabled={isDateLocked}
                  className={`w-full pl-12 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                    isDateLocked
                      ? "bg-gray-50 dark:bg-gray-700/30"
                      : "bg-white dark:bg-gray-700/50"
                  } ${
                    errors.date
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                  } font-medium`}
                />
              </div>
              {errors.date && (
                <p className="mt-1.5 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* Shares */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("trade.shares")}
                </label>
                <button
                  type="button"
                  onClick={() => setIsSharesLocked(!isSharesLocked)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {isSharesLocked ? (
                    <LockClosedIcon className="h-4 w-4" />
                  ) : (
                    <LockOpenIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              <input
                type="number"
                value={formData.shares}
                onChange={(e) =>
                  setFormData({ ...formData, shares: e.target.value })
                }
                disabled={isSharesLocked}
                className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 ${
                  isSharesLocked
                    ? "bg-gray-50 dark:bg-gray-700/30"
                    : "bg-white dark:bg-gray-700/50"
                } ${
                  errors.shares
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                } font-medium`}
              />
              {errors.shares && (
                <p className="mt-1.5 text-sm text-red-600">{errors.shares}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-150"
              >
                {t("actions.cancel")}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-sm font-medium text-white bg-[#feb062] hover:bg-[#fea042] rounded-xl transition-colors duration-150"
              >
                {t("actions.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
