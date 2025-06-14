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
    <div className="relative flex flex-col p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-800/80">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
          {title}
        </span>
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            trend === "up"
              ? "bg-green-50/50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : trend === "down"
              ? "bg-red-50/50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              : "bg-gray-50/50 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400"
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-base font-bold text-gray-900 dark:text-white truncate">
          {value}
        </p>
        {change && (
          <span
            className={`text-xs font-semibold truncate ${
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {change}
          </span>
        )}
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
    <div className="bg-gray-50/30 dark:bg-gray-900/30 backdrop-blur-sm rounded-xl p-3 sm:p-4">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
