import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Balance, Target } from '@/types';

const STORAGE_KEYS = {
  TRANSACTIONS: '@savingsapp_transactions',
  BALANCE: '@savingsapp_balance',
  TARGET: '@savingsapp_target',
  LAST_SYNCED: '@savingsapp_last_synced',
} as const;

export const storage = {
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  async getBalance(): Promise<Balance | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BALANCE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setBalance(balance: Balance): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(balance));
  },

  async getTarget(): Promise<Target | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TARGET);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setTarget(target: Target): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TARGET, JSON.stringify(target));
  },

  async clearTarget(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.TARGET);
  },

  async getLastSynced(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNCED);
      return data ? parseInt(data, 10) : null;
    } catch {
      return null;
    }
  },

  async setLastSynced(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNCED, timestamp.toString());
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.BALANCE,
      STORAGE_KEYS.TARGET,
      STORAGE_KEYS.LAST_SYNCED,
    ]);
  },
};
