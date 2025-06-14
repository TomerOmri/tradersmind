import { create } from "zustand";
import { ItemStorage } from "./localForageInstances";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TradeTag {
  id: string;
  tagId: string;
  tradeId: string;
  date: string;
}

interface TagStore {
  tags: Tag[];
  tradeTags: TradeTag[];
  addTag: (name: string, color: string) => Promise<Tag>;
  removeTag: (id: string) => Promise<void>;
  addTradeTag: (tradeId: string, tagId: string) => Promise<void>;
  removeTradeTag: (tradeId: string, tagId: string) => Promise<void>;
  getTagsForTrade: (tradeId: string) => Tag[];
  getTagUsageCount: (
    startDate: string,
    endDate: string
  ) => Record<string, number>;
  loadTags: () => Promise<void>;
  loadTradeTags: () => Promise<void>;
}

// Create storage instances
const tagStorage = new ItemStorage<Tag>("tag-store", "tag");
const tradeTagStorage = new ItemStorage<TradeTag>("tag-store", "trade-tag");

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],
  tradeTags: [],

  addTag: async (name, color) => {
    const newTag = { id: crypto.randomUUID(), name, color };
    await tagStorage.setItem(newTag.id, newTag);
    set((state) => ({
      tags: [...state.tags, newTag],
    }));
    return newTag;
  },

  removeTag: async (id) => {
    await tagStorage.removeItem(id);

    // Remove all trade tags associated with this tag
    const state = get();
    const tradeTagsToRemove = state.tradeTags.filter((tt) => tt.tagId === id);
    await Promise.all(
      tradeTagsToRemove.map((tt) => tradeTagStorage.removeItem(tt.id))
    );

    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      tradeTags: state.tradeTags.filter((tt) => tt.tagId !== id),
    }));
  },

  addTradeTag: async (tradeId, tagId) => {
    const newTradeTag: TradeTag = {
      id: crypto.randomUUID(),
      tagId,
      tradeId,
      date: new Date().toISOString(),
    };

    await tradeTagStorage.setItem(newTradeTag.id, newTradeTag);
    set((state) => ({
      tradeTags: [...state.tradeTags, newTradeTag],
    }));
  },

  removeTradeTag: async (tradeId, tagId) => {
    const state = get();
    const tradeTagToRemove = state.tradeTags.find(
      (tt) => tt.tradeId === tradeId && tt.tagId === tagId
    );

    if (tradeTagToRemove) {
      await tradeTagStorage.removeItem(tradeTagToRemove.id);
      set((state) => ({
        tradeTags: state.tradeTags.filter(
          (tt) => !(tt.tradeId === tradeId && tt.tagId === tagId)
        ),
      }));
    }
  },

  getTagsForTrade: (tradeId) => {
    const state = get();
    const tradeTagIds = state.tradeTags
      .filter((tt) => tt.tradeId === tradeId)
      .map((tt) => tt.tagId);
    return state.tags.filter((tag) => tradeTagIds.includes(tag.id));
  },

  getTagUsageCount: (startDate, endDate) => {
    const state = get();
    return state.tradeTags
      .filter((tt) => {
        const date = new Date(tt.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      })
      .reduce((acc, tt) => {
        const tag = state.tags.find((t) => t.id === tt.tagId);
        if (tag) {
          acc[tag.name] = (acc[tag.name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
  },

  loadTags: async () => {
    const tags = await tagStorage.getAllItems();
    // Sort by name
    const sortedTags = tags.sort((a, b) => a.name.localeCompare(b.name));
    set((state) => ({ ...state, tags: sortedTags }));
  },

  loadTradeTags: async () => {
    const tradeTags = await tradeTagStorage.getAllItems();
    // Sort by date, newest first
    const sortedTradeTags = tradeTags.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    set((state) => ({ ...state, tradeTags: sortedTradeTags }));
  },
}));

// Load data on store initialization
const loadInitialData = async () => {
  await Promise.all([
    useTagStore.getState().loadTags(),
    useTagStore.getState().loadTradeTags(),
  ]);
};
loadInitialData();
