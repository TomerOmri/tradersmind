import { create } from "zustand";
import { persist } from "zustand/middleware";

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
}

export const useJournalStore = create<JournalState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [entry, ...state.entries],
        })),
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        })),
      updateEntry: (id, content) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, content } : entry
          ),
        })),
    }),
    {
      name: "journal-storage",
    }
  )
);
