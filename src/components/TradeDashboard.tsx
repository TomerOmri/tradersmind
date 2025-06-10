import { useTranslation } from "react-i18next";
import { useTradeStore, type Trade } from "../store/tradeStore";
import { useGeneralSettingsStore } from "./GeneralSettings";
import {
  CircleStackIcon,
  WalletIcon,
  ChartPieIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: MetricCardProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-3 sm:px-4">
      <div
        className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
          trend === "up"
            ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
            : trend === "down"
            ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            : "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }`}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
            {value}
          </p>
          {change && (
            <p
              className={`text-xs sm:text-sm font-medium truncate ${
                trend === "up"
                  ? "text-green-600 dark:text-green-400"
                  : trend === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateOpenPositionsMetrics(trades: Trade[]) {
  const { accountSize } = useGeneralSettingsStore();
  const activeTrades = trades.filter((t) => t.isActive);

  // Calculate total money in market
  const totalInMarket = activeTrades.reduce((acc, trade) => {
    const lastBuyAction = [...trade.actions]
      .reverse()
      .find((action) => action.type === "buy");
    if (!lastBuyAction) return acc;
    return acc + lastBuyAction.price * lastBuyAction.quantity;
  }, 0);

  // Calculate percentage of account in market
  const percentInMarket = accountSize ? (totalInMarket / accountSize) * 100 : 0;

  // Calculate total risk amount
  const totalRisk = activeTrades.reduce((acc, trade) => {
    const lastBuyAction = [...trade.actions]
      .reverse()
      .find((action) => action.type === "buy");
    if (!lastBuyAction || !lastBuyAction.stopLoss) return acc;
    const riskPerShare = lastBuyAction.price - lastBuyAction.stopLoss;
    return acc + riskPerShare * lastBuyAction.quantity;
  }, 0);

  // Calculate average risk percentage across active positions
  const avgRiskPercent =
    activeTrades.reduce((acc, trade) => {
      const lastBuyAction = [...trade.actions]
        .reverse()
        .find((action) => action.type === "buy");
      if (!lastBuyAction || !lastBuyAction.stopLoss) return acc;
      const riskPercent =
        ((lastBuyAction.price - lastBuyAction.stopLoss) / lastBuyAction.price) *
        100;
      return acc + riskPercent;
    }, 0) / (activeTrades.length || 1);

  return {
    activePositions: activeTrades.length,
    totalInMarket,
    percentInMarket,
    totalRisk,
    avgRiskPercent,
  };
}

export default function TradeDashboard() {
  const { t } = useTranslation();
  const trades = useTradeStore((state) => state.trades);
  const metrics = calculateOpenPositionsMetrics(trades);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y divide-x sm:divide-y-0 rtl:divide-x-reverse divide-gray-100 dark:divide-gray-700">
        <MetricCard
          title={t("dashboard.activePositions")}
          value={metrics.activePositions}
          icon={CircleStackIcon}
        />
        <MetricCard
          title={t("dashboard.totalInMarket")}
          value={`$${metrics.totalInMarket.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}`}
          icon={WalletIcon}
        />
        <MetricCard
          title={t("dashboard.percentInMarket")}
          value={`${metrics.percentInMarket.toFixed(1)}%`}
          icon={ChartPieIcon}
          trend={metrics.percentInMarket > 80 ? "down" : "neutral"}
        />
        <MetricCard
          title={t("dashboard.totalRisk")}
          value={`$${metrics.totalRisk.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}`}
          icon={ShieldExclamationIcon}
          trend={
            metrics.totalRisk > metrics.totalInMarket * 0.02 ? "down" : "up"
          }
        />
        <MetricCard
          title={t("dashboard.avgRisk")}
          value={`${metrics.avgRiskPercent.toFixed(1)}%`}
          icon={ExclamationTriangleIcon}
          trend={metrics.avgRiskPercent > 2 ? "down" : "up"}
        />
      </div>
    </div>
  );
}
