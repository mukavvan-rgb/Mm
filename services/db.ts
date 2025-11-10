
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Trade, TradeStatus } from '../types';

const DB_NAME = 'TradingTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'trades';

// Define the database schema using the DBSchema interface
interface TradingTrackerDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Omit<Trade, 'livePrice' | 'pnl' | 'pnlPercent' | 'pairInfo'>;
    indexes: { 'coinSlugOrAddress': string };
  };
}

let dbPromise: Promise<IDBPDatabase<TradingTrackerDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TradingTrackerDB>> {
    if (!dbPromise) {
        dbPromise = openDB<TradingTrackerDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, {
                    keyPath: 'id',
                    autoIncrement: true,
                });
                store.createIndex('coinSlugOrAddress', 'coinSlugOrAddress');
            },
        });
    }
    return dbPromise;
}

export const dbService = {
  async getAllTrades(): Promise<Trade[]> {
    const db = await getDb();
    return db.getAll(STORE_NAME);
  },

  async addTrade(trade: Omit<Trade, 'id' | 'livePrice' | 'pnl' | 'pnlPercent' | 'pairInfo'>): Promise<number> {
    const db = await getDb();
    return db.add(STORE_NAME, trade);
  },

  async updateTrade(trade: Trade): Promise<number> {
    const db = await getDb();
    const { livePrice, pnl, pnlPercent, pairInfo, ...tradeToStore } = trade;
    return db.put(STORE_NAME, tradeToStore);
  },

  async deleteTrade(id: number): Promise<void> {
    const db = await getDb();
    return db.delete(STORE_NAME, id);
  },

  async bulkAddTrades(trades: Omit<Trade, 'id' | 'livePrice' | 'pnl' | 'pnlPercent' | 'pairInfo'>[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all([...trades.map(t => tx.store.add(t)), tx.done]);
  },

  async bulkUpdateTrades(trades: Trade[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const tradesToStore = trades.map(trade => {
        const { livePrice, pnl, pnlPercent, pairInfo, ...tradeToStore } = trade;
        return tradeToStore;
    });
    await Promise.all([...tradesToStore.map(t => tx.store.put(t)), tx.done]);
  },
  
  async bulkDeleteTrades(ids: number[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all([...ids.map(id => tx.store.delete(id)), tx.done]);
  },
};
