import { create } from "zustand";
import { ItemStorage } from "./localForageInstances";

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

interface JournalState {
  entries: JournalEntry[];
  addEntry: (entry: JournalEntry) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, content: string) => void;
  loadEntries: () => Promise<void>;
}

// Create storage instance for journal entries
const journalStorage = new ItemStorage<JournalEntry>("journal-store", "entry");

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],

  addEntry: async (entry) => {
    await journalStorage.setItem(entry.id, entry);
    set((state) => ({
      entries: [entry, ...state.entries],
    }));
  },

  deleteEntry: async (id) => {
    await journalStorage.removeItem(id);
    set((state) => ({
      entries: state.entries.filter((entry) => entry.id !== id),
    }));
  },

  updateEntry: async (id, content) => {
    const state = get();
    const entry = state.entries.find((e) => e.id === id);
    if (entry) {
      const updatedEntry = { ...entry, content };
      await journalStorage.setItem(id, updatedEntry);
      set((state) => ({
        entries: state.entries.map((entry) =>
          entry.id === id ? updatedEntry : entry
        ),
      }));
    }
  },

  loadEntries: async () => {
    const entries = await journalStorage.getAllItems();
    // Sort by date, newest first
    const sortedEntries = entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    set({ entries: sortedEntries });
  },
}));

// Load entries on store initialization
useJournalStore.getState().loadEntries();
