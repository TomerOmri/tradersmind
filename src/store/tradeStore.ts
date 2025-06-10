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
  image?: string; // base64 encoded image
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

// Image compression utilities
const MAX_IMAGE_SIZE_MB = 5;
const MAX_WIDTH = 1200;
const COMPRESSION_QUALITY = 0.7;

const compressImage = async (file: File): Promise<string | null> => {
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image size must be less than ${MAX_IMAGE_SIZE_MB}MB`);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (MAX_WIDTH * height) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL(
          "image/jpeg",
          COMPRESSION_QUALITY
        );
        resolve(compressedBase64);
      };
    };
  });
};

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
  addNote: (tradeId: string, text: string, image?: File) => Promise<void>;
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
      addNote: async (tradeId, text, image) => {
        let compressedImage: string | null = null;
        if (image) {
          try {
            compressedImage = await compressImage(image);
          } catch (error) {
            console.error("Failed to compress image:", error);
            throw error;
          }
        }

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
                      ...(compressedImage && { image: compressedImage }),
                    },
                  ],
                }
              : trade
          ),
        }));
      },
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
