import { useTranslation } from "react-i18next";
import { useTradeStore, type Trade } from "../store/tradeStore";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ScaleIcon,
  BanknotesIcon,
  ClockIcon,
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
            {change && (
              <p
                className={`text-xs font-medium ${
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
    </div>
  );
}

function calculateMetrics(trades: Trade[], t: (key: string) => string) {
  const totalTrades = trades.length;
  const closedTrades = trades.filter((t) => !t.isActive);
  const winningTrades = closedTrades.filter(
    (t) =>
      t.actions.reduce(
        (acc, action) =>
          acc +
          (action.type === "sell"
            ? action.price * action.quantity
            : -action.price * action.quantity),
        0
      ) > 0
  );

  const winRate = totalTrades
    ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1)
    : "0.0";

  const totalPnL = trades.reduce((acc, trade) => {
    return (
      acc +
      trade.actions.reduce(
        (acc, action) =>
          acc +
          (action.type === "sell"
            ? action.price * action.quantity
            : -action.price * action.quantity),
        0
      )
    );
  }, 0);

  const avgHoldingTime = closedTrades.length
    ? Math.round(
        closedTrades.reduce((acc, trade) => {
          const firstAction = new Date(trade.actions[0].date);
          const lastAction = new Date(
            trade.actions[trade.actions.length - 1].date
          );
          return acc + (lastAction.getTime() - firstAction.getTime());
        }, 0) /
          closedTrades.length /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const avgRiskPerTrade =
    trades.reduce((acc, trade) => acc + (trade.riskPerTrade || 0), 0) /
    trades.filter((t) => t.riskPerTrade).length;

  return {
    totalTrades,
    winRate,
    totalPnL,
    avgHoldingTime,
    avgRiskPerTrade: avgRiskPerTrade || 0,
    activePositions: trades.filter((t) => t.isActive).length,
  };
}

export default function TradeDashboard() {
  const { t } = useTranslation();
  const trades = useTradeStore((state) => state.trades);
  const metrics = calculateMetrics(trades, t);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <MetricCard
        title={t("dashboard.winRate")}
        value={`${metrics.winRate}%`}
        icon={ChartBarIcon}
        trend={Number(metrics.winRate) > 50 ? "up" : "down"}
      />
      <MetricCard
        title={t("dashboard.totalPnL")}
        value={`$${metrics.totalPnL.toFixed(2)}`}
        icon={BanknotesIcon}
        trend={metrics.totalPnL > 0 ? "up" : "down"}
      />
      <MetricCard
        title={t("dashboard.activePositions")}
        value={metrics.activePositions}
        icon={ScaleIcon}
      />
      <MetricCard
        title={t("dashboard.totalTrades")}
        value={metrics.totalTrades}
        icon={ChartBarIcon}
      />
      <MetricCard
        title={t("dashboard.avgHoldingTime")}
        value={metrics.avgHoldingTime}
        change={t("dashboard.days")}
        icon={ClockIcon}
      />
      <MetricCard
        title={t("dashboard.avgRiskPerTrade")}
        value={`${metrics.avgRiskPerTrade.toFixed(1)}%`}
        icon={ArrowTrendingDownIcon}
        trend={metrics.avgRiskPerTrade <= 2 ? "up" : "down"}
      />
    </div>
  );
}
