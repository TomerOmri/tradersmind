import { create } from "zustand";
import { ItemStorage } from "./localForageInstances";

interface StickyNote {
  id: string;
  text: string;
  tag: string;
  createdAt: string;
  color: string;
}

type StickyStore = {
  notes: StickyNote[];
  addNote: (tag: string, text: string) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  updateNote: (id: string, text: string) => Promise<void>;
  loadNotes: () => Promise<void>;
};

const STICKY_COLORS = [
  "bg-yellow-100 dark:bg-yellow-900",
  "bg-green-100 dark:bg-green-900",
  "bg-blue-100 dark:bg-blue-900",
  "bg-pink-100 dark:bg-pink-900",
  "bg-purple-100 dark:bg-purple-900",
];

// Create storage instance for sticky notes
const stickyStorage = new ItemStorage<StickyNote>("sticky-store", "note");

export const useStickyStore = create<StickyStore>((set, get) => ({
  notes: [],

  addNote: async (tag, text) => {
    const newNote: StickyNote = {
      id: crypto.randomUUID(),
      text,
      tag,
      createdAt: new Date().toISOString(),
      color: STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
    };

    await stickyStorage.setItem(newNote.id, newNote);
    set((state) => ({
      notes: [...state.notes, newNote],
    }));
  },

  removeNote: async (id) => {
    await stickyStorage.removeItem(id);
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    }));
  },

  updateNote: async (id, text) => {
    const state = get();
    const existingNote = state.notes.find((note) => note.id === id);
    if (!existingNote) return;

    const updatedNote = { ...existingNote, text };
    await stickyStorage.setItem(id, updatedNote);
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
    }));
  },

  loadNotes: async () => {
    const notes = await stickyStorage.getAllItems();
    // Sort by creation date, newest first
    const sortedNotes = notes.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    set({ notes: sortedNotes });
  },
}));

// Load notes on store initialization
useStickyStore.getState().loadNotes();

// Export types
export type { StickyNote };
