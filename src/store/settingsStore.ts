import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  accountSize: number;
  setAccountSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accountSize: 100000, // Default account size
      setAccountSize: (size: number) => set({ accountSize: size }),
    }),
    {
      name: "settings-storage",
    }
  )
);
