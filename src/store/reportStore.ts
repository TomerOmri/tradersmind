import { create } from "zustand";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { useTradeStore } from "./tradeStore";
import type { Trade } from "./tradeStore";

interface DayStats {
  wins: number;
  losses: number;
  pnl: number;
  tradesCount: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  accountGrowth: number;
}

interface MonthStats extends DayStats {
  days: DayStats[];
}

interface ReportStore {
  getDayStats: (targetDate: Date) => DayStats;
  getMonthStats: (targetDate: Date) => MonthStats;
}

const calculateTradeStats = (
  trades: Trade[]
): { wins: number; losses: number; pnl: number } => {
  return trades.reduce(
    (acc, trade) => {
      const totalPnl = trade.actions.reduce((sum, action) => {
        if (action.type === "buy") {
          return sum - action.quantity * action.price;
        } else {
          return sum + action.quantity * action.price;
        }
      }, 0);

      if (totalPnl > 0) {
        acc.wins++;
      } else if (totalPnl < 0) {
        acc.losses++;
      }
      acc.pnl += totalPnl;

      return acc;
    },
    { wins: 0, losses: 0, pnl: 0 }
  );
};

const getDayStats = (targetDate: Date): DayStats => {
  const start = startOfDay(targetDate);
  const end = endOfDay(targetDate);
  const trades = useTradeStore.getState().trades.filter((trade) => {
    const latestAction = trade.actions[trade.actions.length - 1];
    return (
      latestAction &&
      new Date(latestAction.date) >= start &&
      new Date(latestAction.date) <= end
    );
  });

  const { wins, losses, pnl } = calculateTradeStats(trades);
  const tradesCount = trades.length;
  const winRate = tradesCount > 0 ? (wins / tradesCount) * 100 : 0;

  const winningTrades = trades.filter((trade) => {
    const tradePnl = trade.actions.reduce((sum, action) => {
      return action.type === "buy"
        ? sum - action.quantity * action.price
        : sum + action.quantity * action.price;
    }, 0);
    return tradePnl > 0;
  });

  const losingTrades = trades.filter((trade) => {
    const tradePnl = trade.actions.reduce((sum, action) => {
      return action.type === "buy"
        ? sum - action.quantity * action.price
        : sum + action.quantity * action.price;
    }, 0);
    return tradePnl < 0;
  });

  const averageWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => {
          const tradePnl = trade.actions.reduce((pnlSum, action) => {
            return action.type === "buy"
              ? pnlSum - action.quantity * action.price
              : pnlSum + action.quantity * action.price;
          }, 0);
          return sum + tradePnl;
        }, 0) / winningTrades.length
      : 0;

  const averageLoss =
    losingTrades.length > 0
      ? Math.abs(
          losingTrades.reduce((sum, trade) => {
            const tradePnl = trade.actions.reduce((pnlSum, action) => {
              return action.type === "buy"
                ? pnlSum - action.quantity * action.price
                : pnlSum + action.quantity * action.price;
            }, 0);
            return sum + tradePnl;
          }, 0) / losingTrades.length
        )
      : 0;

  const largestWin = winningTrades.reduce((max, trade) => {
    const tradePnl = trade.actions.reduce((sum, action) => {
      return action.type === "buy"
        ? sum - action.quantity * action.price
        : sum + action.quantity * action.price;
    }, 0);
    return Math.max(max, tradePnl);
  }, 0);

  const largestLoss = Math.abs(
    losingTrades.reduce((min, trade) => {
      const tradePnl = trade.actions.reduce((sum, action) => {
        return action.type === "buy"
          ? sum - action.quantity * action.price
          : sum + action.quantity * action.price;
      }, 0);
      return Math.min(min, tradePnl);
    }, 0)
  );

  const profitFactor = averageLoss !== 0 ? averageWin / averageLoss : 0;
  const initialBalance = 10000; // TODO: Get from settings
  const accountGrowth = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;

  return {
    wins,
    losses,
    pnl,
    tradesCount,
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    accountGrowth,
  };
};

const getMonthStats = (targetDate: Date): MonthStats => {
  const start = startOfMonth(targetDate);
  const end = endOfMonth(targetDate);
  const trades = useTradeStore.getState().trades.filter((trade) => {
    const latestAction = trade.actions[trade.actions.length - 1];
    return (
      latestAction &&
      new Date(latestAction.date) >= start &&
      new Date(latestAction.date) <= end
    );
  });

  const { wins, losses, pnl } = calculateTradeStats(trades);
  const tradesCount = trades.length;
  const winRate = tradesCount > 0 ? (wins / tradesCount) * 100 : 0;

  // Calculate daily stats for the month
  const days: DayStats[] = [];
  let currentDate = start;
  while (currentDate <= end) {
    days.push(getDayStats(currentDate));
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
  }

  const winningTrades = trades.filter((trade) => {
    const tradePnl = trade.actions.reduce((sum, action) => {
      return action.type === "buy"
        ? sum - action.quantity * action.price
        : sum + action.quantity * action.price;
    }, 0);
    return tradePnl > 0;
  });

  const losingTrades = trades.filter((trade) => {
    const tradePnl = trade.actions.reduce((sum, action) => {
      return action.type === "buy"
        ? sum - action.quantity * action.price
        : sum + action.quantity * action.price;
    }, 0);
    return tradePnl < 0;
  });

  const averageWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum, trade) => {
          const tradePnl = trade.actions.reduce((pnlSum, action) => {
            return action.type === "buy"
              ? pnlSum - action.quantity * action.price
              : pnlSum + action.quantity * action.price;
          }, 0);
          return sum + tradePnl;
        }, 0) / winningTrades.length
      : 0;

  const averageLoss =
    losingTrades.length > 0
      ? Math.abs(
          losingTrades.reduce((sum, trade) => {
            const tradePnl = trade.actions.reduce((pnlSum, action) => {
              return action.type === "buy"
                ? pnlSum - action.quantity * action.price
                : pnlSum + action.quantity * action.price;
            }, 0);
            return sum + tradePnl;
          }, 0) / losingTrades.length
        )
      : 0;

  const largestWin = winningTrades.reduce((max, trade) => {
    const tradePnl = trade.actions.reduce((sum, action) => {
      return action.type === "buy"
        ? sum - action.quantity * action.price
        : sum + action.quantity * action.price;
    }, 0);
    return Math.max(max, tradePnl);
  }, 0);

  const largestLoss = Math.abs(
    losingTrades.reduce((min, trade) => {
      const tradePnl = trade.actions.reduce((sum, action) => {
        return action.type === "buy"
          ? sum - action.quantity * action.price
          : sum + action.quantity * action.price;
      }, 0);
      return Math.min(min, tradePnl);
    }, 0)
  );

  const profitFactor = averageLoss !== 0 ? averageWin / averageLoss : 0;
  const initialBalance = 10000; // TODO: Get from settings
  const accountGrowth = initialBalance > 0 ? (pnl / initialBalance) * 100 : 0;

  return {
    wins,
    losses,
    pnl,
    tradesCount,
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    largestWin,
    largestLoss,
    accountGrowth,
    days,
  };
};

export const useReportStore = create<ReportStore>()(() => ({
  getDayStats,
  getMonthStats,
}));
