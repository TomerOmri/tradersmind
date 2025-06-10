import { create } from "zustand";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import { useTradeStore, type Trade, type TradeAction } from "./tradeStore";

interface DailyStats {
  totalTrades: number;
  wins: number;
  losses: number;
  pnl: number;
  percentageChange?: number;
}

interface ReportStore {
  getDayStats: (date: Date) => DailyStats;
  getMonthStats: (date: Date) => DailyStats;
}

const calculateTradeStats = (
  actions: TradeAction[]
): { pnl: number; shares: number } => {
  return actions.reduce(
    (acc, action) => {
      if (action.type === "buy") {
        acc.shares += action.shares;
        acc.pnl -= action.shares * action.price;
      } else if (action.type === "sell") {
        acc.shares -= action.shares;
        acc.pnl += action.shares * action.price;
      }
      return acc;
    },
    { pnl: 0, shares: 0 }
  );
};

const isTradeClosedOnDate = (trade: Trade, date: Date) => {
  if (!trade.actions.length || trade.isActive) return false;

  const lastAction = trade.actions[trade.actions.length - 1];
  const closeDate = new Date(lastAction.date);
  return isSameDay(closeDate, date);
};

const calculateDayStats = (trades: Trade[], targetDate: Date): DailyStats => {
  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  // Filter only closed trades that were closed on this specific day
  const dayTrades = trades.filter(
    (trade) => !trade.isActive && isTradeClosedOnDate(trade, targetDate)
  );

  const stats: DailyStats = {
    totalTrades: dayTrades.length,
    wins: dayTrades.filter((trade) => trade.status === "win").length,
    losses: dayTrades.filter((trade) => trade.status === "loss").length,
    pnl: 0,
  };

  // Calculate P&L for completed trades
  stats.pnl = dayTrades.reduce((total, trade) => {
    const { pnl } = calculateTradeStats(trade.actions);
    return total + pnl;
  }, 0);

  // Calculate percentage change if there were trades
  if (stats.totalTrades > 0) {
    const { accountSize } = useTradeStore.getState();
    if (accountSize && accountSize > 0) {
      stats.percentageChange = (stats.pnl / accountSize) * 100;
    }
  }

  return stats;
};

const calculateMonthStats = (trades: Trade[], date: Date): DailyStats => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  // Filter only closed trades that were closed within this month
  const monthTrades = trades.filter((trade) => {
    if (trade.isActive || !trade.actions.length) return false;

    const lastAction = trade.actions[trade.actions.length - 1];
    const closeDate = new Date(lastAction.date);
    return closeDate >= monthStart && closeDate <= monthEnd;
  });

  const stats: DailyStats = {
    totalTrades: monthTrades.length,
    wins: monthTrades.filter((trade) => trade.status === "win").length,
    losses: monthTrades.filter((trade) => trade.status === "loss").length,
    pnl: monthTrades.reduce((total, trade) => {
      const { pnl } = calculateTradeStats(trade.actions);
      return total + pnl;
    }, 0),
  };

  if (stats.totalTrades > 0) {
    const { accountSize } = useTradeStore.getState();
    if (accountSize && accountSize > 0) {
      stats.percentageChange = (stats.pnl / accountSize) * 100;
    }
  }

  return stats;
};

export const useReportStore = create<ReportStore>()((set, get) => ({
  getDayStats: (date: Date) => {
    const trades = useTradeStore.getState().trades;
    return calculateDayStats(trades, date);
  },
  getMonthStats: (date: Date) => {
    const trades = useTradeStore.getState().trades;
    return calculateMonthStats(trades, date);
  },
}));
