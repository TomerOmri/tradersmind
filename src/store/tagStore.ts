import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  addTag: (name: string, color: string) => Tag;
  removeTag: (id: string) => void;
  addTradeTag: (tradeId: string, tagId: string) => void;
  removeTradeTag: (tradeId: string, tagId: string) => void;
  getTagsForTrade: (tradeId: string) => Tag[];
  getTagUsageCount: (
    startDate: string,
    endDate: string
  ) => Record<string, number>;
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      tags: [],
      tradeTags: [],

      addTag: (name, color) => {
        const newTag = { id: crypto.randomUUID(), name, color };
        set((state) => ({
          tags: [...state.tags, newTag],
        }));
        return newTag;
      },

      removeTag: (id) =>
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== id),
          tradeTags: state.tradeTags.filter((tt) => tt.tagId !== id),
        })),

      addTradeTag: (tradeId, tagId) =>
        set((state) => ({
          tradeTags: [
            ...state.tradeTags,
            {
              id: crypto.randomUUID(),
              tagId,
              tradeId,
              date: new Date().toISOString(),
            },
          ],
        })),

      removeTradeTag: (tradeId, tagId) =>
        set((state) => ({
          tradeTags: state.tradeTags.filter(
            (tt) => !(tt.tradeId === tradeId && tt.tagId === tagId)
          ),
        })),

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
    }),
    {
      name: "tag-store",
    }
  )
);
