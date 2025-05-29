import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TradeType = "buy" | "sell";

export interface TradeAction {
  id: string;
  type: TradeType;
  price: number;
  quantity: number;
  date: string;
  stopLoss?: number;
  targetPrice?: number;
  notes?: string;
}

export interface TradeNote {
  id: string;
  text: string;
  date: string;
}

export interface Trade {
  id: string;
  symbol: string;
  actions: TradeAction[];
  notes: TradeNote[];
  isActive: boolean;
  setupType?: string;
}

interface TradeData {
  symbol: string;
  action: Omit<TradeAction, "id">;
  setupType?: string;
}

interface TradeStore {
  trades: Trade[];
  addTrade: (trade: TradeData) => void;
  addAction: (tradeId: string, action: Omit<TradeAction, "id">) => void;
  updateAction: (
    tradeId: string,
    actionId: string,
    action: Omit<TradeAction, "id">
  ) => void;
  removeTrade: (id: string) => void;
  removeAction: (tradeId: string, actionId: string) => void;
  addNote: (tradeId: string, text: string) => void;
  removeNote: (tradeId: string, noteId: string) => void;
}

const calculateTradeStatus = (actions: TradeAction[]): boolean => {
  const totalShares = actions.reduce(
    (acc, action) =>
      acc + (action.type === "buy" ? action.quantity : -action.quantity),
    0
  );
  return totalShares > 0;
};

export const useTradeStore = create<TradeStore>()(
  persist(
    (set) => ({
      trades: [],
      addTrade: (tradeData) =>
        set((state) => {
          const action = { ...tradeData.action, id: crypto.randomUUID() };
          const trade: Trade = {
            id: crypto.randomUUID(),
            symbol: tradeData.symbol,
            actions: [action],
            notes: [],
            isActive: true,
            setupType: tradeData.setupType,
          };
          return { trades: [...state.trades, trade] };
        }),
      addAction: (tradeId, actionData) =>
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === tradeId
              ? {
                  ...trade,
                  actions: [
                    ...trade.actions,
                    { ...actionData, id: crypto.randomUUID() },
                  ],
                  isActive: calculateTradeStatus([
                    ...trade.actions,
                    { ...actionData, id: crypto.randomUUID() },
                  ]),
                }
              : trade
          ),
        })),
      updateAction: (tradeId, actionId, actionData) =>
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === tradeId
              ? {
                  ...trade,
                  actions: trade.actions.map((action) =>
                    action.id === actionId
                      ? { ...actionData, id: action.id }
                      : action
                  ),
                  isActive: calculateTradeStatus(
                    trade.actions.map((action) =>
                      action.id === actionId
                        ? { ...actionData, id: action.id }
                        : action
                    )
                  ),
                }
              : trade
          ),
        })),
      removeTrade: (id) =>
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== id),
        })),
      removeAction: (tradeId, actionId) =>
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === tradeId
              ? {
                  ...trade,
                  actions: trade.actions.filter(
                    (action) => action.id !== actionId
                  ),
                  isActive: calculateTradeStatus(
                    trade.actions.filter((action) => action.id !== actionId)
                  ),
                }
              : trade
          ),
        })),
      addNote: (tradeId, text) =>
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === tradeId
              ? {
                  ...trade,
                  notes: [
                    ...trade.notes,
                    {
                      id: crypto.randomUUID(),
                      text,
                      date: new Date().toISOString(),
                    },
                  ],
                }
              : trade
          ),
        })),
      removeNote: (tradeId, noteId) =>
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === tradeId
              ? {
                  ...trade,
                  notes: trade.notes.filter((note) => note.id !== noteId),
                }
              : trade
          ),
        })),
    }),
    {
      name: "trade-store",
    }
  )
);
