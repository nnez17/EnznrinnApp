import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Transaction, Balance, Target, AppState, UserName, ThemeMode } from '@/types';
import { firestoreService } from '@/services/firestore';
import { hasFirebaseConfig } from '@/config/env';
import { generateId, toISOString } from '@/utils/dateUtils';
import { startOfDay } from 'date-fns';

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: string }
  | { type: 'SET_BALANCE'; payload: Balance }
  | { type: 'SET_TARGET'; payload: Target | null }
  | { type: 'SET_LAST_SYNCED'; payload: number }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SWITCH_USER'; payload: UserName }
  | { type: 'SET_THEME_MODE'; payload: ThemeMode }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  transactions: [],
  balance: { current: 0, totalIncome: 0, totalExpense: 0, todayIncome: 0, todayExpense: 0 },
  target: null,
  currentUser: 'Noval',
  isLoading: false,
  isAuthenticated: hasFirebaseConfig,
  isOnline: false,
  lastSynced: null,
  error: null,
  themeMode: 'light',
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, isLoading: false };
    case 'ADD_TRANSACTION': {
      const newTransactions = [action.payload, ...state.transactions];
      return { ...state, transactions: newTransactions };
    }
    case 'REMOVE_TRANSACTION': {
      const filtered = state.transactions.filter(t => t.id !== action.payload);
      return { ...state, transactions: filtered };
    }
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_TARGET':
      return { ...state, target: action.payload };
    case 'SET_LAST_SYNCED':
      return { ...state, lastSynced: action.payload };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SWITCH_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_THEME_MODE':
      return { ...state, themeMode: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

const SavingsContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addTransaction: (type: 'income' | 'expense', amount: number, note: string, user: UserName) => Promise<void>;
  updateTransaction: (id: string, updates: { amount?: number; note?: string; user?: UserName }) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  setTarget: (targetAmount: number, deadline: string) => Promise<void>;
  updateTarget: (updates: { targetAmount?: number; deadline?: string }) => Promise<void>;
  deleteTargetFromSheet: () => Promise<void>;
  syncFromSheet: () => Promise<void>;
  checkConnection: () => Promise<void>;
  clearAllData: () => Promise<void>;
  switchUser: (user: UserName) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
} | null>(null);

export const SavingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const calculateBalance = useCallback((transactions: Transaction[]): Balance => {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const todayStart = startOfDay(new Date()).getTime();
    const todayIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.date).getTime() >= todayStart)
      .reduce((sum, t) => sum + t.amount, 0);
    const todayExpense = transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getTime() >= todayStart)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      current: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      todayIncome,
      todayExpense,
    };
  }, []);

  const syncFromSheet = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [transactions, target] = await Promise.all([
        firestoreService.loadTransactions(),
        firestoreService.loadTarget(),
      ]);

      const balance = calculateBalance(transactions);

      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_BALANCE', payload: balance });
      dispatch({ type: 'SET_TARGET', payload: target });
      dispatch({ type: 'SET_LAST_SYNCED', payload: Date.now() });
      dispatch({ type: 'SET_ONLINE', payload: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync gagal';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_ONLINE', payload: false });
    }
  }, [calculateBalance]);

  const addTransaction = useCallback(async (type: 'income' | 'expense', amount: number, note: string, user: UserName) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    const runningBalance = state.balance.current + (type === 'income' ? amount : -amount);

    const newTransaction: Transaction = {
      id: generateId(),
      user,
      type,
      amount,
      note,
      date: toISOString(),
      balance: runningBalance,
    };

    try {
      await firestoreService.appendTransaction(newTransaction);
      dispatch({ type: 'SET_ONLINE', payload: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan ke Firestore';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_ONLINE', payload: false });
      return;
    }

    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
    const newBalanceState = calculateBalance([newTransaction, ...state.transactions]);
    dispatch({ type: 'SET_BALANCE', payload: newBalanceState });
  }, [state.transactions, state.balance, calculateBalance]);

  const updateTransaction = useCallback(async (id: string, updates: { amount?: number; note?: string; user?: UserName }) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const finalTransactions = await firestoreService.updateTransaction(id, updates);
      const finalBalance = calculateBalance(finalTransactions);

      dispatch({ type: 'SET_TRANSACTIONS', payload: finalTransactions });
      dispatch({ type: 'SET_BALANCE', payload: finalBalance });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal update transaksi';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [calculateBalance]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const finalTransactions = await firestoreService.deleteTransaction(transactionId);
      const finalBalance = calculateBalance(finalTransactions);

      dispatch({ type: 'SET_TRANSACTIONS', payload: finalTransactions });
      dispatch({ type: 'SET_BALANCE', payload: finalBalance });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal hapus transaksi';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [calculateBalance]);

  const setTarget = useCallback(async (targetAmount: number, deadline: string) => {
    const target: Target = {
      id: generateId(),
      targetAmount,
      currentAmount: state.balance.current,
      deadline,
      createdAt: toISOString(),
    };

    try {
      await firestoreService.saveTarget(target);
      dispatch({ type: 'SET_TARGET', payload: target });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal simpan target';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [state.balance]);

  const updateTarget = useCallback(async (updates: { targetAmount?: number; deadline?: string }) => {
    const payload: Record<string, any> = {};
    if (updates.targetAmount !== undefined) payload.targetAmount = updates.targetAmount;
    if (updates.deadline !== undefined) payload.deadline = updates.deadline;

    try {
      await firestoreService.updateTarget(payload);
      const target = await firestoreService.loadTarget();
      dispatch({ type: 'SET_TARGET', payload: target });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal update target';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  const deleteTargetFromSheet = useCallback(async () => {
    try {
      await firestoreService.deleteTarget();
      dispatch({ type: 'SET_TARGET', payload: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal hapus target';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (!hasFirebaseConfig) {
      dispatch({ type: 'SET_ONLINE', payload: false });
      return;
    }
    try {
      await firestoreService.loadTransactions();
      dispatch({ type: 'SET_ONLINE', payload: true });
    } catch {
      dispatch({ type: 'SET_ONLINE', payload: false });
    }
  }, []);

  const switchUser = useCallback(async (user: UserName) => {
    dispatch({ type: 'SWITCH_USER', payload: user });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    dispatch({ type: 'SET_THEME_MODE', payload: mode });
  }, []);

  const clearAllData = useCallback(async () => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  return (
    <SavingsContext.Provider
      value={{
        state,
        dispatch,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setTarget,
        updateTarget,
        deleteTargetFromSheet,
        syncFromSheet,
        checkConnection,
        clearAllData,
        switchUser,
        setThemeMode,
      }}
    >
      {children}
    </SavingsContext.Provider>
  );
};

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (!context) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
};
