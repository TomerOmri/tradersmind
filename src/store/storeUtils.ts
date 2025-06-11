import { useTradeStore } from "./tradeStore";
import { useWatchStore } from "./watchStore";
import { useJournalStore } from "./journalStore";

// Add any new store here
const STORES = {
  trade: useTradeStore,
  watch: useWatchStore,
  journal: useJournalStore,
} as const;

export const exportState = (): string => {
  const state = Object.entries(STORES).reduce((acc, [key, store]) => {
    const storeState = store.getState();
    // Filter out functions from the state
    const serializedState = Object.fromEntries(
      Object.entries(storeState).filter(
        ([_, value]) => typeof value !== "function"
      )
    );
    return { ...acc, [key]: serializedState };
  }, {});

  return JSON.stringify(state, null, 2);
};

export const importState = (jsonString: string): void => {
  try {
    const state = JSON.parse(jsonString);

    Object.entries(state).forEach(([key, value]) => {
      const store = STORES[key as keyof typeof STORES];
      if (store) {
        // Get current state to merge with functions
        const currentState = store.getState();
        store.setState({
          ...currentState,
          ...value,
        });
      }
    });
  } catch (error) {
    throw new Error("Failed to import state: Invalid JSON format");
  }
};
