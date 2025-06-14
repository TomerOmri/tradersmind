import { create } from "zustand";
import { ItemStorage } from "./localForageInstances";

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
  addWatch: (symbol: string, statuses: WatchStatus[]) => Promise<void>;
  updateWatch: (id: string, updates: Partial<Watch>) => Promise<void>;
  addNote: (
    watchId: string,
    content: string,
    status: WatchStatus
  ) => Promise<void>;
  updateNote: (
    watchId: string,
    noteId: string,
    updates: Partial<WatchNote>
  ) => Promise<void>;
  removeWatch: (id: string) => Promise<void>;
  removeNote: (watchId: string, noteId: string) => Promise<void>;
  loadWatches: () => Promise<void>;
}

// Create storage instance for watches
const watchStorage = new ItemStorage<Watch>("watch-store", "watch");

export const useWatchStore = create<WatchStore>((set, get) => ({
  watches: [],

  addWatch: async (symbol, statuses) => {
    const newWatch: Watch = {
      id: crypto.randomUUID(),
      symbol,
      statuses,
      notes: [],
      lastUpdated: new Date().toISOString(),
    };

    await watchStorage.setItem(newWatch.id, newWatch);
    set((state) => ({
      watches: [...state.watches, newWatch],
    }));
  },

  updateWatch: async (id, updates) => {
    const state = get();
    const existingWatch = state.watches.find((watch) => watch.id === id);
    if (!existingWatch) return;

    const updatedWatch = {
      ...existingWatch,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    await watchStorage.setItem(id, updatedWatch);
    set((state) => ({
      watches: state.watches.map((watch) =>
        watch.id === id ? updatedWatch : watch
      ),
    }));
  },

  addNote: async (watchId, content, status) => {
    const state = get();
    const watch = state.watches.find((w) => w.id === watchId);
    if (!watch) return;

    const newNote: WatchNote = {
      id: crypto.randomUUID(),
      content,
      status,
      createdAt: new Date().toISOString(),
    };

    const updatedWatch = {
      ...watch,
      notes: [...watch.notes, newNote],
      lastUpdated: new Date().toISOString(),
    };

    await watchStorage.setItem(watchId, updatedWatch);
    set((state) => ({
      watches: state.watches.map((watch) =>
        watch.id === watchId ? updatedWatch : watch
      ),
    }));
  },

  updateNote: async (watchId, noteId, updates) => {
    const state = get();
    const watch = state.watches.find((w) => w.id === watchId);
    if (!watch) return;

    const updatedWatch = {
      ...watch,
      notes: watch.notes.map((note) =>
        note.id === noteId ? { ...note, ...updates } : note
      ),
      lastUpdated: new Date().toISOString(),
    };

    await watchStorage.setItem(watchId, updatedWatch);
    set((state) => ({
      watches: state.watches.map((watch) =>
        watch.id === watchId ? updatedWatch : watch
      ),
    }));
  },

  removeWatch: async (id) => {
    await watchStorage.removeItem(id);
    set((state) => ({
      watches: state.watches.filter((watch) => watch.id !== id),
    }));
  },

  removeNote: async (watchId, noteId) => {
    const state = get();
    const watch = state.watches.find((w) => w.id === watchId);
    if (!watch) return;

    const updatedWatch = {
      ...watch,
      notes: watch.notes.filter((note) => note.id !== noteId),
    };

    await watchStorage.setItem(watchId, updatedWatch);
    set((state) => ({
      watches: state.watches.map((watch) =>
        watch.id === watchId ? updatedWatch : watch
      ),
    }));
  },

  loadWatches: async () => {
    const watches = await watchStorage.getAllItems();
    // Sort by last updated, newest first
    const sortedWatches = watches.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
    set({ watches: sortedWatches });
  },
}));

// Load watches on store initialization
useWatchStore.getState().loadWatches();
