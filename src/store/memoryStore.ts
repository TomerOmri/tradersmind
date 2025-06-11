import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MemoryItem {
  id: string;
  imageData: string; // base64 encoded image
  text: string;
  tags: string[];
  createdAt: string;
}

// Image compression utilities
const MAX_WIDTH = 1600; // Slightly larger than trade store for better quality
const COMPRESSION_QUALITY = 0.85; // Higher quality than trade store since these are important reference images

const compressImage = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > MAX_WIDTH) {
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

      // Convert to JPEG for better compression
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
  deleteMemory: (id: string) => void;
  updateMemory: (id: string, memory: Partial<MemoryItem>) => void;
}

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set) => ({
      memories: [],
      addMemory: async (memory) => {
        try {
          const compressedImage = await compressImage(memory.imageUrl);

          set((state) => ({
            memories: [
              ...state.memories,
              {
                ...memory,
                id: crypto.randomUUID(),
                imageData: compressedImage,
                createdAt: new Date().toISOString(),
              },
            ],
          }));
        } catch (error) {
          console.error("Failed to compress image:", error);
          throw error;
        }
      },
      deleteMemory: (id) =>
        set((state) => ({
          memories: state.memories.filter((m) => m.id !== id),
        })),
      updateMemory: (id, memory) =>
        set((state) => ({
          memories: state.memories.map((m) =>
            m.id === id ? { ...m, ...memory } : m
          ),
        })),
    }),
    {
      name: "memory-store",
      // Add data validation/migration for future schema changes
      version: 1,
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            // Perform any necessary data migrations here
            console.log("Memory store rehydrated");
          }
        };
      },
    }
  )
);
