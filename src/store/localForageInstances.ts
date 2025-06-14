import localForage from "localforage";

// Configure localForage
localForage.config({
  name: "tradermind",
  storeName: "tradermind_stores",
  description: "Tradermind application storage",
});

export const createStoreInstance = (storeName: string) => {
  return localForage.createInstance({
    name: "tradermind",
    storeName,
  });
};

// Individual item storage utilities
export class ItemStorage<T> {
  private instance: LocalForage;
  private keyPrefix: string;

  constructor(storeName: string, keyPrefix: string) {
    this.instance = createStoreInstance(storeName);
    this.keyPrefix = keyPrefix;
  }

  private getKey(id: string): string {
    return `${this.keyPrefix}:${id}`;
  }

  async getItem(id: string): Promise<T | null> {
    try {
      const value = await this.instance.getItem<T>(this.getKey(id));
      return value;
    } catch (error) {
      console.error(`Error getting item ${id}:`, error);
      return null;
    }
  }

  async setItem(id: string, value: T): Promise<void> {
    try {
      await this.instance.setItem(this.getKey(id), value);
    } catch (error) {
      console.error(`Error setting item ${id}:`, error);
    }
  }

  async removeItem(id: string): Promise<void> {
    try {
      await this.instance.removeItem(this.getKey(id));
    } catch (error) {
      console.error(`Error removing item ${id}:`, error);
    }
  }

  async getAllItems(): Promise<T[]> {
    try {
      const keys = await this.instance.keys();
      const prefixedKeys = keys.filter((key) =>
        key.startsWith(this.keyPrefix + ":")
      );
      const items = await Promise.all(
        prefixedKeys.map((key) => this.instance.getItem<T>(key))
      );
      return items.filter((item) => item !== null) as T[];
    } catch (error) {
      console.error(`Error getting all items:`, error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.instance.keys();
      const prefixedKeys = keys.filter((key) =>
        key.startsWith(this.keyPrefix + ":")
      );
      await Promise.all(
        prefixedKeys.map((key) => this.instance.removeItem(key))
      );
    } catch (error) {
      console.error(`Error clearing items:`, error);
    }
  }
}

// Legacy storage adapter for stores that still need it
export const createLocalForageStorage = <T>(storeName: string) => {
  const instance = createStoreInstance(storeName);

  return {
    getItem: async (name: string) => {
      try {
        const value = await instance.getItem(name);
        if (value === null) return null;
        return JSON.parse(value as string);
      } catch (error) {
        console.error(`Error getting item ${name} from ${storeName}:`, error);
        return null;
      }
    },
    setItem: async (name: string, value: any) => {
      try {
        await instance.setItem(name, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting item ${name} in ${storeName}:`, error);
      }
    },
    removeItem: async (name: string) => {
      try {
        await instance.removeItem(name);
      } catch (error) {
        console.error(`Error removing item ${name} from ${storeName}:`, error);
      }
    },
  };
};
