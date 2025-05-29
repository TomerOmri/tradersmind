import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchStatus = "SETUP_SUCCESS" | "TIP" | "WATCHING" | "FAILED";

export interface WatchNote {
  id: string;
  content: string;
  createdAt: string;
  status: WatchStatus;
}

export interface Watch {
  id: string;
  symbol: string;
  statuses: WatchStatus[];
  notes: WatchNote[];
  lastUpdated: string;
}

interface WatchStore {
  watches: Watch[];
  addWatch: (symbol: string, statuses: WatchStatus[]) => void;
  updateWatch: (id: string, updates: Partial<Watch>) => void;
  addNote: (watchId: string, content: string, status: WatchStatus) => void;
  updateNote: (
    watchId: string,
    noteId: string,
    updates: Partial<WatchNote>
  ) => void;
  removeWatch: (id: string) => void;
  removeNote: (watchId: string, noteId: string) => void;
}

export const useWatchStore = create<WatchStore>()(
  persist(
    (set) => ({
      watches: [],
      addWatch: (symbol, statuses) => {
        const newWatch: Watch = {
          id: crypto.randomUUID(),
          symbol,
          statuses,
          notes: [],
          lastUpdated: new Date().toISOString(),
        };
        set((state) => ({
          watches: [...state.watches, newWatch],
        }));
      },
      updateWatch: (id, updates) => {
        set((state) => ({
          watches: state.watches.map((watch) =>
            watch.id === id
              ? {
                  ...watch,
                  ...updates,
                  lastUpdated: new Date().toISOString(),
                }
              : watch
          ),
        }));
      },
      addNote: (watchId, content, status) => {
        set((state) => ({
          watches: state.watches.map((watch) =>
            watch.id === watchId
              ? {
                  ...watch,
                  notes: [
                    ...watch.notes,
                    {
                      id: crypto.randomUUID(),
                      content,
                      status,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                  lastUpdated: new Date().toISOString(),
                }
              : watch
          ),
        }));
      },
      updateNote: (watchId, noteId, updates) => {
        set((state) => ({
          watches: state.watches.map((watch) =>
            watch.id === watchId
              ? {
                  ...watch,
                  notes: watch.notes.map((note) =>
                    note.id === noteId ? { ...note, ...updates } : note
                  ),
                  lastUpdated: new Date().toISOString(),
                }
              : watch
          ),
        }));
      },
      removeWatch: (id) => {
        set((state) => ({
          watches: state.watches.filter((watch) => watch.id !== id),
        }));
      },
      removeNote: (watchId, noteId) => {
        set((state) => ({
          watches: state.watches.map((watch) =>
            watch.id === watchId
              ? {
                  ...watch,
                  notes: watch.notes.filter((note) => note.id !== noteId),
                }
              : watch
          ),
        }));
      },
    }),
    {
      name: "watch-storage",
    }
  )
);
