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

interface FormData {
  ticker: string;
  entryPrice: string;
  stopLoss: string;
  profitTarget: string;
  isBuy: boolean;
  shares: string;
  date: string;
  setupType: string;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function AddTradeModal({
  onClose,
  onSubmit,
}: AddTradeModalProps) {
  const { t, i18n } = useTranslation();
  const { accountSize, riskPerTrade } = useGeneralSettingsStore();
  const isRTL = i18n.dir() === "rtl";

  const [formData, setFormData] = useState<FormData>({
    ticker: "",
    entryPrice: "",
    stopLoss: "",
    profitTarget: "",
    isBuy: true,
    shares: "",
    date: new Date().toISOString().split("T")[0],
    setupType: "",
  });

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 my-auto transform transition-all ${
          isRTL ? "rtl" : "ltr"
        }`}
      >
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {formData.isBuy
                ? t("trade.newBuyTrade")
                : t("trade.newSellTrade")}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Symbol and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
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
                  placeholder={t("trade.symbolPlaceholder")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                    errors.ticker
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                  } dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base font-medium`}
                  dir="ltr"
                />
                {errors.ticker && (
                  <p className="mt-1 text-sm text-red-600">{errors.ticker}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 dark:text-gray-300 mb-1">
                  {t("trade.date")}
                </label>
                <div className="relative">
                  <div
                    className={`absolute inset-y-0 ${
                      isRTL ? "right-0 pr-3" : "left-0 pl-3"
                    } flex items-center pointer-events-none`}
                  >
                    <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className={`w-full ${
                      isRTL ? "pr-10 pl-3" : "pl-10 pr-3"
                    } py-2 dark:text-gray-300 border rounded-xl focus:outline-none focus:ring-2 ${
                      errors.date
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                    } dark:bg-gray-700/50 font-medium`}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Buy/Sell Switch */}
            <div className="flex justify-center">
              <Switch.Group>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isBuy: true }))
                    }
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      formData.isBuy
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                    {t("actions.buy")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, isBuy: false }))
                    }
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      !formData.isBuy
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                    {t("actions.sell")}
                  </button>
                </div>
              </Switch.Group>
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  key: "entryPrice" as const,
                  label: "trade.price",
                },
                {
                  key: "stopLoss" as const,
                  label: "trade.stopLoss",
                },
                {
                  key: "profitTarget" as const,
                  label: "trade.profitTarget",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t(field.label)} *
                  </label>
                  <div className="relative">
                    <div
                      className={`absolute inset-y-0 ${
                        isRTL ? "right-0 pr-3" : "left-0 pl-3"
                      } flex items-center pointer-events-none`}
                    >
                      <span className="text-gray-500 dark:text-gray-400">
                        {t("settings.currencySymbol")}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={formData[field.key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.key]: e.target.value,
                        })
                      }
                      placeholder={t(field.placeholder)}
                      className={`w-full ${
                        isRTL ? "pr-8 pl-3" : "pl-8 pr-3"
                      } py-2 border rounded-xl focus:outline-none focus:ring-2 ${
                        errors[field.key]
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                      } dark:bg-gray-700 dark:text-gray-300 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`}
                      dir="ltr"
                    />
                  </div>
                  {errors[field.key] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[field.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Setup and Shares */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("trade.setup")}
                </label>
                <select
                  value={formData.setupType}
                  onChange={(e) =>
                    setFormData({ ...formData, setupType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t("trade.selectSetup")}</option>
                  <option value="breakout">{t("setup.breakout")}</option>
                  <option value="pullback">{t("setup.pullback")}</option>
                  <option value="momentum">{t("setup.momentum")}</option>
                  <option value="reversal">{t("setup.reversal")}</option>
                  <option value="other">{t("setup.other")}</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("trade.shares")} *
                  </label>
                </div>
                <input
                  type="number"
                  value={formData.shares}
                  onChange={(e) =>
                    setFormData({ ...formData, shares: e.target.value })
                  }
                  placeholder={t("trade.sharesPlaceholder")}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2  bg-white dark:bg-gray-700/50 ${
                    errors.shares
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 dark:text-gray-300 focus:ring-primary-500"
                  } font-medium`}
                  dir="ltr"
                />
                {errors.shares && (
                  <p className="mt-1 text-sm text-red-600">{errors.shares}</p>
                )}
              </div>
            </div>

            {/* Trade Summary and Visual Bar Container */}
            <div className="p-3 pb-8 bg-gray-50 dark:bg-gray-700/30 rounded-xl min-h-[420px]">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Trade Summary Section */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("trade.tradeSummary")}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">
                        {t("trade.totalTrade")}
                      </span>
                      <span
                        className="text-sm font-medium text-gray-900 dark:text-white tabular-nums flex-1 text-right"
                        dir="ltr"
                      >
                        {t("settings.currencySymbol")}
                        {formatNumber(
                          parseFloat(formData.entryPrice || "0") *
                            parseFloat(formData.shares || "0")
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">
                        {t("trade.potentialProfit")}
                      </span>
                      <span
                        className="text-sm font-medium text-green-600 dark:text-green-400 tabular-nums flex-1 text-right"
                        dir="ltr"
                      >
                        {t("settings.currencySymbol")}
                        {formatNumber(
                          Math.abs(
                            parseFloat(formData.profitTarget || "0") -
                              parseFloat(formData.entryPrice || "0")
                          ) * parseFloat(formData.shares || "0")
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">
                        {t("trade.riskAmount")}
                      </span>
                      <span
                        className="text-sm font-medium text-red-600 dark:text-red-400 tabular-nums flex-1 text-right"
                        dir="ltr"
                      >
                        {t("settings.currencySymbol")}
                        {formatNumber(
                          Math.abs(
                            parseFloat(formData.entryPrice || "0") -
                              parseFloat(formData.stopLoss || "0")
                          ) * parseFloat(formData.shares || "0")
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 min-w-24">
                        {t("trade.riskReward")}
                      </span>
                      <span
                        className="text-sm font-medium text-gray-900 dark:text-white tabular-nums flex-1 text-right"
                        dir="ltr"
                      >
                        1:
                        {(
                          Math.abs(
                            parseFloat(formData.profitTarget || "0") -
                              parseFloat(formData.entryPrice || "0")
                          ) /
                          Math.abs(
                            parseFloat(formData.entryPrice || "0") -
                              parseFloat(formData.stopLoss || "0")
                          )
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Risk/Reward Visual Bar */}
                <div className="h-[368px] flex items-center justify-center px-8">
                  <div className="w-[128px] relative h-full flex flex-col gap-[2px]">
                    {/* Profit Section */}
                    <div className="h-[75%] bg-[#049981] relative flex items-center">
                      <div className="absolute inset-x-0 px-3 py-2 text-center">
                        <div className="text-sm font-medium text-white">
                          {t("settings.currencySymbol")}
                          {formatNumber(
                            Math.abs(
                              parseFloat(formData.profitTarget || "0") -
                                parseFloat(formData.entryPrice || "0")
                            ) * parseFloat(formData.shares || "0")
                          )}
                        </div>
                        <div className="text-sm text-white">
                          {t("trade.profitRewardExpected")}
                        </div>
                      </div>
                    </div>

                    {/* Loss Section */}
                    <div className="h-[25%] bg-[#f23645] relative flex items-center">
                      <div className="absolute inset-x-0 px-3 py-2 text-center">
                        <div className="text-sm font-medium text-white">
                          {t("settings.currencySymbol")}
                          {formatNumber(
                            Math.abs(
                              parseFloat(formData.entryPrice || "0") -
                                parseFloat(formData.stopLoss || "0")
                            ) * parseFloat(formData.shares || "0")
                          )}
                        </div>
                        <div className="text-sm text-white">
                          {t("trade.lossExpected")}
                        </div>
                      </div>
                    </div>

                    {/* Entry Price */}
                    <div className="absolute -right-16 top-[75%] -translate-y-4 flex items-center">
                      <div className="flex flex-col items-start ml-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t("settings.currencySymbol")}
                          {formatNumber(parseFloat(formData.entryPrice || "0"))}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("trade.entryPriceLabel")}
                        </span>
                      </div>
                    </div>

                    {/* Stop Loss Label */}
                    <div className="absolute -right-16 top-[100%] -translate-y-4 flex items-center">
                      <div className="flex flex-col items-start ml-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {t("settings.currencySymbol")}
                          {formatNumber(parseFloat(formData.stopLoss || "0"))}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("trade.stopLossLabel")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors duration-150"
            >
              {t("actions.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-medium text-white bg-[#feb062] hover:bg-[#fea042] dark:bg-[#e99c52] dark:hover:bg-[#d98c42] rounded-xl transition-colors duration-150"
            >
              {t("actions.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
