import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StickyNote {
  id: string;
  text: string;
  tag: string;
  createdAt: string;
  color: string;
}

type StickyStore = {
  notes: StickyNote[];
  addNote: (tag: string, text: string) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, text: string) => void;
};

const STICKY_COLORS = [
  "bg-yellow-100 dark:bg-yellow-900",
  "bg-green-100 dark:bg-green-900",
  "bg-blue-100 dark:bg-blue-900",
  "bg-pink-100 dark:bg-pink-900",
  "bg-purple-100 dark:bg-purple-900",
];

export const useStickyStore = create<StickyStore>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (tag, text) =>
        set((state) => ({
          notes: [
            ...state.notes,
            {
              id: crypto.randomUUID(),
              text,
              tag,
              createdAt: new Date().toISOString(),
              color:
                STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)],
            },
          ],
        })),
      removeNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        })),
      updateNote: (id, text) =>
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, text } : note
          ),
        })),
    }),
    {
      name: "sticky-store",
    }
  )
);

// Export types
export type { StickyNote };
