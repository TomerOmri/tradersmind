import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ItemStorage } from "./localForageInstances";

export type TradeType = "buy" | "sell";

export interface TradeAction {
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

interface TradeState {
  trades: Trade[];
  addTrade: (trade: TradeData) => Promise<void>;
  addAction: (tradeId: string, action: Omit<TradeAction, "date">) => void;
  updateAction: (
    tradeId: string,
    actionId: string,
    action: Omit<TradeAction, "id">
  ) => Promise<void>;
  removeTrade: (id: string) => Promise<void>;
  removeAction: (tradeId: string, actionId: string) => Promise<void>;
  addNote: (tradeId: string, text: string, image?: File) => Promise<void>;
  removeNote: (tradeId: string, noteId: string) => Promise<void>;
  loadTrades: () => Promise<void>;
}

const calculateTradeStatus = (actions: TradeAction[]): boolean => {
  const totalShares = actions.reduce(
    (acc, action) =>
      acc + (action.type === "buy" ? action.quantity : -action.quantity),
    0
  );
  return totalShares > 0;
};

// Create storage instances
const tradeStorage = new ItemStorage<Trade>("trade-store", "trade");

export const useTradeStore = create<TradeState>()(
  persist(
    (set, get) => ({
      trades: [],

      addTrade: async (tradeData) => {
        const action = { ...tradeData.action, id: crypto.randomUUID() };
        const trade: Trade = {
          id: crypto.randomUUID(),
          symbol: tradeData.symbol,
          actions: [action],
          notes: [],
          isActive: true,
          setupType: tradeData.setupType,
        };

        await tradeStorage.setItem(trade.id, trade);
        set((state) => ({ trades: [...state.trades, trade] }));
      },

      addAction: async (tradeId, action) => {
        const state = get();
        const trade = state.trades.find((t) => t.id === tradeId);
        if (!trade) return;

        const updatedTrade = {
          ...trade,
          actions: [
            ...trade.actions,
            { ...action, date: new Date().toISOString() },
          ],
          isActive: true, // Update active status
        };

        // Update storage first
        await tradeStorage.setItem(tradeId, updatedTrade);

        // Then update state
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === tradeId ? updatedTrade : t
          ),
        }));
      },

      updateAction: async (tradeId, actionId, actionData) => {
        const state = get();
        const trade = state.trades.find((t) => t.id === tradeId);
        if (!trade) return;

        const updatedActions = trade.actions.map((action) =>
          action.id === actionId ? { ...actionData, id: action.id } : action
        );
        const updatedTrade = {
          ...trade,
          actions: updatedActions,
          isActive: calculateTradeStatus(updatedActions),
        };

        await tradeStorage.setItem(tradeId, updatedTrade);
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === tradeId ? updatedTrade : t
          ),
        }));
      },

      removeTrade: async (id) => {
        await tradeStorage.removeItem(id);
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== id),
        }));
      },

      removeAction: async (tradeId, actionId) => {
        const state = get();
        const trade = state.trades.find((t) => t.id === tradeId);
        if (!trade) return;

        const updatedActions = trade.actions.filter(
          (action) => action.id !== actionId
        );
        const updatedTrade = {
          ...trade,
          actions: updatedActions,
          isActive: calculateTradeStatus(updatedActions),
        };

        await tradeStorage.setItem(tradeId, updatedTrade);
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === tradeId ? updatedTrade : t
          ),
        }));
      },

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

        const state = get();
        const trade = state.trades.find((t) => t.id === tradeId);
        if (!trade) return;

        const newNote: TradeNote = {
          id: crypto.randomUUID(),
          text,
          date: new Date().toISOString(),
          ...(compressedImage && { image: compressedImage }),
        };

        const updatedTrade = {
          ...trade,
          notes: [...trade.notes, newNote],
        };

        await tradeStorage.setItem(tradeId, updatedTrade);
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === tradeId ? updatedTrade : t
          ),
        }));
      },

      removeNote: async (tradeId, noteId) => {
        const state = get();
        const trade = state.trades.find((t) => t.id === tradeId);
        if (!trade) return;

        const updatedTrade = {
          ...trade,
          notes: trade.notes.filter((note) => note.id !== noteId),
        };

        await tradeStorage.setItem(tradeId, updatedTrade);
        set((state) => ({
          trades: state.trades.map((t) =>
            t.id === tradeId ? updatedTrade : t
          ),
        }));
      },

      loadTrades: async () => {
        const trades = await tradeStorage.getAllItems();
        // Sort by most recent action date
        const sortedTrades = trades.sort((a, b) => {
          const aLatest = Math.max(
            ...a.actions.map((action) => new Date(action.date).getTime())
          );
          const bLatest = Math.max(
            ...b.actions.map((action) => new Date(action.date).getTime())
          );
          return bLatest - aLatest;
        });
        set({ trades: sortedTrades });
      },
    }),
    {
      name: "trade-storage",
    }
  )
);

// Load trades on store initialization
useTradeStore.getState().loadTrades();
