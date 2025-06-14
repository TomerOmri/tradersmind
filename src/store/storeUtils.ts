import { useTradeStore } from "./tradeStore";
import { useWatchStore } from "./watchStore";
import { useJournalStore } from "./journalStore";
import { useMemoryStore } from "./memoryStore";
import { useStickyStore } from "./stickyStore";
import { useTagStore } from "./tagStore";
import { useGeneralSettingsStore } from "../components/GeneralSettings";

// Add any new store here
const STORES = {
  trade: useTradeStore,
  watch: useWatchStore,
  journal: useJournalStore,
  memory: useMemoryStore,
  sticky: useStickyStore,
  tag: useTagStore,
  generalSettings: useGeneralSettingsStore,
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

export const importState = async (jsonString: string): Promise<void> => {
  try {
    const state = JSON.parse(jsonString);

    // Clear all existing data first
    await clearAllStores();

    // Import data for each store
    for (const [key, value] of Object.entries(state)) {
      if (key in STORES && typeof value === "object" && value !== null) {
        const storeValue = value as Record<string, any>;

        // Handle different store types
        switch (key) {
          case "trade":
            if (storeValue.trades && Array.isArray(storeValue.trades)) {
              const tradeStore = useTradeStore.getState();
              for (const trade of storeValue.trades) {
                // Add the first action to create the trade
                if (trade.actions && trade.actions.length > 0) {
                  await tradeStore.addTrade({
                    symbol: trade.symbol,
                    action: {
                      type: trade.actions[0].type,
                      price: trade.actions[0].price,
                      quantity: trade.actions[0].quantity,
                      date: trade.actions[0].date,
                      stopLoss: trade.actions[0].stopLoss,
                      targetPrice: trade.actions[0].targetPrice,
                      notes: trade.actions[0].notes,
                    },
                    setupType: trade.setupType,
                  });

                  // Get the newly created trade ID
                  const currentTrades = tradeStore.trades;
                  const newTrade = currentTrades[currentTrades.length - 1];

                  // Add remaining actions
                  for (let i = 1; i < trade.actions.length; i++) {
                    const action = trade.actions[i];
                    await tradeStore.addAction(newTrade.id, {
                      type: action.type,
                      price: action.price,
                      quantity: action.quantity,
                      date: action.date,
                      stopLoss: action.stopLoss,
                      targetPrice: action.targetPrice,
                      notes: action.notes,
                    });
                  }

                  // Add notes
                  if (trade.notes && Array.isArray(trade.notes)) {
                    for (const note of trade.notes) {
                      await tradeStore.addNote(newTrade.id, note.text);
                    }
                  }
                }
              }
            }
            break;

          case "journal":
            if (storeValue.entries && Array.isArray(storeValue.entries)) {
              const journalStore = useJournalStore.getState();
              for (const entry of storeValue.entries) {
                await journalStore.addEntry({
                  id: entry.id || crypto.randomUUID(),
                  date: entry.date,
                  content: entry.content,
                });
              }
            }
            break;

          case "memory":
            if (storeValue.memories && Array.isArray(storeValue.memories)) {
              const memoryStore = useMemoryStore.getState();
              for (const memory of storeValue.memories) {
                await memoryStore.addMemory({
                  text: memory.text,
                  tags: memory.tags || [],
                  imageUrl: memory.imageData, // Use existing image data as URL
                });
              }
            }
            break;

          case "sticky":
            if (storeValue.notes && Array.isArray(storeValue.notes)) {
              const stickyStore = useStickyStore.getState();
              for (const note of storeValue.notes) {
                await stickyStore.addNote(note.tag, note.text);
              }
            }
            break;

          case "tag":
            if (storeValue.tags && Array.isArray(storeValue.tags)) {
              const tagStore = useTagStore.getState();
              const tagIdMap = new Map<string, string>(); // old ID -> new ID mapping

              // First, add all tags
              for (const tag of storeValue.tags) {
                const newTag = await tagStore.addTag(tag.name, tag.color);
                tagIdMap.set(tag.id, newTag.id);
              }

              // Then add trade tags with mapped IDs
              if (storeValue.tradeTags && Array.isArray(storeValue.tradeTags)) {
                for (const tradeTag of storeValue.tradeTags) {
                  const newTagId = tagIdMap.get(tradeTag.tagId);
                  if (newTagId) {
                    await tagStore.addTradeTag(tradeTag.tradeId, newTagId);
                  }
                }
              }
            }
            break;

          case "watch":
            if (storeValue.watches && Array.isArray(storeValue.watches)) {
              const watchStore = useWatchStore.getState();
              for (const watch of storeValue.watches) {
                await watchStore.addWatch(watch.symbol, watch.statuses || []);

                // Get the newly created watch
                const currentWatches = watchStore.watches;
                const newWatch = currentWatches.find(
                  (w) => w.symbol === watch.symbol
                );

                // Add notes if any
                if (newWatch && watch.notes && Array.isArray(watch.notes)) {
                  for (const note of watch.notes) {
                    await watchStore.addNote(
                      newWatch.id,
                      note.content,
                      note.status
                    );
                  }
                }
              }
            }
            break;

          case "generalSettings":
            if (
              storeValue.accountSize !== undefined ||
              storeValue.riskPerTrade !== undefined
            ) {
              const settingsStore = useGeneralSettingsStore.getState();
              if (storeValue.accountSize !== undefined) {
                await settingsStore.setAccountSize(storeValue.accountSize);
              }
              if (storeValue.riskPerTrade !== undefined) {
                await settingsStore.setRiskPerTrade(storeValue.riskPerTrade);
              }
            }
            break;
        }
      }
    }
  } catch (error) {
    console.error("Import error:", error);
    throw new Error(
      "Failed to import state: Invalid JSON format or import error"
    );
  }
};

// Utility to clear all stores
export const clearAllStores = async (): Promise<void> => {
  // Clear IndexedDB data by clearing each store's storage
  const { ItemStorage } = await import("./localForageInstances");

  const storageInstances = [
    new ItemStorage("trade-store", "trade"),
    new ItemStorage("journal-store", "entry"),
    new ItemStorage("memory-store", "memory"),
    new ItemStorage("sticky-store", "note"),
    new ItemStorage("tag-store", "tag"),
    new ItemStorage("tag-store", "trade-tag"),
    new ItemStorage("watch-store", "watch"),
    new ItemStorage("general-settings", "config"),
  ];

  await Promise.all(storageInstances.map((storage) => storage.clear()));

  // Reset in-memory state
  useTradeStore.setState({ trades: [] });
  useJournalStore.setState({ entries: [] });
  useMemoryStore.setState({ memories: [] });
  useStickyStore.setState({ notes: [] });
  useTagStore.setState({ tags: [], tradeTags: [] });
  useWatchStore.setState({ watches: [] });
  useGeneralSettingsStore.setState({ accountSize: 0, riskPerTrade: 1 });
};

// Utility to reload all stores from IndexedDB
export const reloadAllStores = async (): Promise<void> => {
  await Promise.all([
    useTradeStore.getState().loadTrades(),
    useWatchStore.getState().loadWatches(),
    useJournalStore.getState().loadEntries(),
    useMemoryStore.getState().loadMemories(),
    useStickyStore.getState().loadNotes(),
    useTagStore.getState().loadTags(),
    useTagStore.getState().loadTradeTags(),
    useGeneralSettingsStore.getState().loadSettings(),
  ]);
};

// Utility to get storage statistics
export const getStorageStats = async (): Promise<Record<string, number>> => {
  const stats: Record<string, number> = {};

  stats.trades = useTradeStore.getState().trades.length;
  stats.journalEntries = useJournalStore.getState().entries.length;
  stats.memories = useMemoryStore.getState().memories.length;
  stats.stickyNotes = useStickyStore.getState().notes.length;
  stats.tags = useTagStore.getState().tags.length;
  stats.tradeTags = useTagStore.getState().tradeTags.length;
  stats.watches = useWatchStore.getState().watches.length;

  return stats;
};
