import { create } from "zustand";
import { ItemStorage } from "./localForageInstances";

export interface MemoryItem {
  id: string;
  imageData: string; // base64 encoded image
  text: string;
  tags: string[];
  createdAt: string;
}

// Image compression utilities
const MAX_WIDTH = 2400; // Increased for better quality on high-res displays
const COMPRESSION_QUALITY = 1; // Higher quality for important reference images

const compressImage = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Only resize if width is significantly larger than MAX_WIDTH
      if (width > MAX_WIDTH * 1.5) {
        height = (MAX_WIDTH * height) / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use better quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw image with white background to handle transparency
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG for better compression while maintaining quality
      const compressedBase64 = canvas.toDataURL(
        "image/jpeg",
        COMPRESSION_QUALITY
      );
      resolve(compressedBase64);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
  });
};

interface MemoryStore {
  memories: MemoryItem[];
  addMemory: (
    memory: Omit<MemoryItem, "id" | "createdAt" | "imageData"> & {
      imageUrl: string;
    }
  ) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  updateMemory: (id: string, memory: Partial<MemoryItem>) => Promise<void>;
  loadMemories: () => Promise<void>;
}

// Create storage instance for memories
const memoryStorage = new ItemStorage<MemoryItem>("memory-store", "memory");

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  memories: [],

  addMemory: async (memory) => {
    try {
      const compressedImage = await compressImage(memory.imageUrl);

      const newMemory: MemoryItem = {
        ...memory,
        id: crypto.randomUUID(),
        imageData: compressedImage,
        createdAt: new Date().toISOString(),
      };

      await memoryStorage.setItem(newMemory.id, newMemory);
      set((state) => ({
        memories: [...state.memories, newMemory],
      }));
    } catch (error) {
      console.error("Failed to compress image:", error);
      throw error;
    }
  },

  deleteMemory: async (id) => {
    await memoryStorage.removeItem(id);
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    }));
  },

  updateMemory: async (id, memory) => {
    const state = get();
    const existingMemory = state.memories.find((m) => m.id === id);
    if (!existingMemory) return;

    const updatedMemory = { ...existingMemory, ...memory };
    await memoryStorage.setItem(id, updatedMemory);
    set((state) => ({
      memories: state.memories.map((m) => (m.id === id ? updatedMemory : m)),
    }));
  },

  loadMemories: async () => {
    const memories = await memoryStorage.getAllItems();
    // Sort by creation date, newest first
    const sortedMemories = memories.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    set({ memories: sortedMemories });
  },
}));

// Load memories on store initialization
useMemoryStore.getState().loadMemories();
