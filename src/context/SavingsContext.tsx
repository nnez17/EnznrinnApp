import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Balance, Target, WishlistItem, DiaryEntry, AppState, UserName, ThemeMode, Priority, MoodType } from '@/types';
import { transactionsApi } from '@/api/transactions';
import { balanceApi } from '@/api/balance';
import { targetsApi } from '@/api/targets';
import { wishlistApi } from '@/api/wishlist';
import { diaryApi } from '@/api/diary';
import { ApiError } from '@/api/client';
import { generateId, toISOString } from '@/utils/dateUtils';

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_BALANCE'; payload: Balance }
  | { type: 'SET_TARGET'; payload: Target | null }
  | { type: 'SET_LAST_SYNCED'; payload: number }
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'SWITCH_USER'; payload: UserName }
  | { type: 'SET_THEME_MODE'; payload: ThemeMode }
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'ADD_WISHLIST_ITEM'; payload: WishlistItem }
  | { type: 'UPDATE_WISHLIST_ITEM'; payload: { id: string; updates: Partial<WishlistItem> } }
  | { type: 'REMOVE_WISHLIST_ITEM'; payload: string }
  | { type: 'SET_DIARY'; payload: DiaryEntry[] }
  | { type: 'ADD_DIARY_ENTRY'; payload: DiaryEntry }
  | { type: 'UPDATE_DIARY_ENTRY'; payload: { id: string; updates: Partial<DiaryEntry> } }
  | { type: 'REMOVE_DIARY_ENTRY'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  transactions: [],
  balance: { current: 0, totalIncome: 0, totalExpense: 0, todayIncome: 0, todayExpense: 0 },
  target: null,
  wishlist: [],
  diary: [],
  currentUser: 'Noval',
  isLoading: false,
  isAuthenticated: true,
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
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_TARGET':
      return { ...state, target: action.payload };
    case 'SET_LAST_SYNCED':
      return { ...state, lastSynced: action.payload };
    case 'SET_ONLINE':
      return { ...state, isOnline: action.payload };
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.payload };
    case 'ADD_WISHLIST_ITEM':
      return { ...state, wishlist: [action.payload, ...state.wishlist] };
    case 'UPDATE_WISHLIST_ITEM':
      return {
        ...state,
        wishlist: state.wishlist.map(w =>
          w.id === action.payload.id ? { ...w, ...action.payload.updates } : w
        ),
      };
    case 'REMOVE_WISHLIST_ITEM':
      return { ...state, wishlist: state.wishlist.filter(w => w.id !== action.payload) };
    case 'SET_DIARY':
      return { ...state, diary: action.payload };
    case 'ADD_DIARY_ENTRY':
      return { ...state, diary: [action.payload, ...state.diary] };
    case 'UPDATE_DIARY_ENTRY':
      return {
        ...state,
        diary: state.diary.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload.updates } : d
        ),
      };
    case 'REMOVE_DIARY_ENTRY':
      return { ...state, diary: state.diary.filter(d => d.id !== action.payload) };
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
  loadWishlist: () => Promise<void>;
  addWishlistItem: (name: string, price: number | undefined, priority: Priority, notes?: string, user?: UserName) => Promise<void>;
  toggleWishlistItem: (id: string) => Promise<void>;
  deleteWishlistItem: (id: string) => Promise<void>;
  loadDiary: () => Promise<void>;
  saveDiaryEntry: (date: string, content: string, mood?: MoodType) => Promise<void>;
  updateDiaryEntry: (id: string, updates: { content?: string; mood?: MoodType }) => Promise<void>;
  deleteDiaryEntry: (id: string) => Promise<void>;
} | null>(null);

const THEME_KEY = '@enznrinn_theme';

const toBalance = (b: { balance: number; totalIncome: number; totalExpense: number; todayIncome: number; todayExpense: number }): Balance => ({
  current: b.balance,
  totalIncome: b.totalIncome,
  totalExpense: b.totalExpense,
  todayIncome: b.todayIncome,
  todayExpense: b.todayExpense,
});

export const SavingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(val => {
      if (val === 'dark' || val === 'light' || val === 'kharin') dispatch({ type: 'SET_THEME_MODE', payload: val });
    }).catch(() => {});
  }, []);

  // Reload the derived views that change after a transaction mutation:
  // per-row running balance and the aggregate balance (server-computed).
  const reloadAfterTxChange = useCallback(async () => {
    const [transactions, balance] = await Promise.all([
      transactionsApi.list(),
      balanceApi.get(),
    ]);
    dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
    dispatch({ type: 'SET_BALANCE', payload: toBalance(balance) });
  }, []);

  const syncFromSheet = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [transactions, balance, targets] = await Promise.all([
        transactionsApi.list(),
        balanceApi.get(),
        targetsApi.list(),
      ]);

      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_BALANCE', payload: toBalance(balance) });
      dispatch({ type: 'SET_TARGET', payload: targets[0] ?? null });
      dispatch({ type: 'SET_LAST_SYNCED', payload: Date.now() });
      dispatch({ type: 'SET_ONLINE', payload: true });

      wishlistApi.list().then(items => dispatch({ type: 'SET_WISHLIST', payload: items })).catch(() => dispatch({ type: 'SET_ERROR', payload: 'Gagal muat wishlist' }));
      diaryApi.list().then(entries => dispatch({ type: 'SET_DIARY', payload: entries })).catch(() => dispatch({ type: 'SET_ERROR', payload: 'Gagal muat diary' }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sync gagal';
      dispatch({ type: 'SET_ERROR', payload: msg });
      dispatch({ type: 'SET_ONLINE', payload: false });
    }
  }, []);

  const addTransaction = useCallback(async (type: 'income' | 'expense', amount: number, note: string, user: UserName) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await transactionsApi.create({
        user,
        type, amount, note,
        transactionDate: toISOString(),
      });
      await reloadAfterTxChange();
      dispatch({ type: 'SET_ONLINE', payload: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal menyimpan transaksi';
      dispatch({ type: 'SET_ERROR', payload: msg });
      if (e instanceof ApiError && e.code === 'INSUFFICIENT_BALANCE') {
        // keep the existing UI error path; reload so client balance is accurate
        dispatch({ type: 'SET_ONLINE', payload: true });
      } else {
        dispatch({ type: 'SET_ONLINE', payload: false });
      }
    }
  }, [reloadAfterTxChange]);

  const updateTransaction = useCallback(async (id: string, updates: { amount?: number; note?: string; user?: UserName }) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await transactionsApi.update(id, {
        amount: updates.amount,
        note: updates.note,
        ...(updates.user !== undefined ? { user: updates.user } : {}),
      });
      await reloadAfterTxChange(); // running balances shift (PRD §20: UPDATE one row, not a rewrite)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal update transaksi';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [reloadAfterTxChange]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      await transactionsApi.remove(transactionId);
      await reloadAfterTxChange();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal hapus transaksi';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [reloadAfterTxChange]);

  const setTarget = useCallback(async (targetAmount: number, deadline: string) => {
    try {
      const target = await targetsApi.create({ id: generateId(), targetAmount, deadline });
      dispatch({ type: 'SET_TARGET', payload: target });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal simpan target';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, []);

  const updateTarget = useCallback(async (updates: { targetAmount?: number; deadline?: string }) => {
    if (!state.target) return;
    try {
      const target = await targetsApi.update(state.target.id, updates);
      dispatch({ type: 'SET_TARGET', payload: target });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal update target';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [state.target]);

  const deleteTargetFromSheet = useCallback(async () => {
    if (!state.target) return;
    try {
      await targetsApi.remove(state.target.id);
      dispatch({ type: 'SET_TARGET', payload: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal hapus target';
      dispatch({ type: 'SET_ERROR', payload: msg });
    }
  }, [state.target]);

  const checkConnection = useCallback(async () => {
    try {
      await balanceApi.get();
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
    AsyncStorage.setItem(THEME_KEY, mode).catch(() => {});
  }, []);

  const clearAllData = useCallback(async () => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // ── Wishlist ──
  const loadWishlist = useCallback(async () => {
    try {
      const items = await wishlistApi.list();
      dispatch({ type: 'SET_WISHLIST', payload: items });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal muat wishlist' });
    }
  }, []);

  const addWishlistItem = useCallback(async (name: string, price: number | undefined, priority: Priority, notes?: string, user?: UserName) => {
    const item: WishlistItem = {
      id: generateId(), name, priority,
      isAchieved: false, createdAt: toISOString(), user: user || state.currentUser,
    };
    if (price !== undefined) item.price = price;
    if (notes !== undefined) item.notes = notes;
    try {
      await wishlistApi.create({ id: item.id, name, price, priority, notes, isAchieved: false, user: item.user });
      dispatch({ type: 'ADD_WISHLIST_ITEM', payload: item });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal simpan wishlist' });
    }
  }, [state.currentUser]);

  const toggleWishlistItem = useCallback(async (id: string) => {
    const item = state.wishlist.find(w => w.id === id);
    if (!item) return;
    const updates: Partial<WishlistItem> = { isAchieved: !item.isAchieved };
    try {
      await wishlistApi.update(id, { isAchieved: updates.isAchieved });
      dispatch({ type: 'UPDATE_WISHLIST_ITEM', payload: { id, updates } });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal update wishlist' });
    }
  }, [state.wishlist]);

  const deleteWishlistItem = useCallback(async (id: string) => {
    try {
      await wishlistApi.remove(id);
      dispatch({ type: 'REMOVE_WISHLIST_ITEM', payload: id });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal hapus wishlist' });
    }
  }, []);

  // ── Diary ──
  const loadDiary = useCallback(async () => {
    try {
      const entries = await diaryApi.list();
      dispatch({ type: 'SET_DIARY', payload: entries });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal muat diary' });
    }
  }, []);

  const saveDiaryEntry = useCallback(async (date: string, content: string, mood?: MoodType) => {
    try {
      // Backend enforces one-entry-per-day (updates same-date entry).
      const saved = await diaryApi.save({ date, content, ...(mood ? { mood } : {}), user: state.currentUser });
      const existing = state.diary.find(d => d.date.split('T')[0] === saved.date.split('T')[0]);
      if (existing) {
        dispatch({ type: 'UPDATE_DIARY_ENTRY', payload: { id: existing.id, updates: { ...saved, id: existing.id } } });
      } else {
        dispatch({ type: 'ADD_DIARY_ENTRY', payload: saved });
      }
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal simpan jurnal' });
    }
  }, [state.diary, state.currentUser]);

  const updateDiaryEntry = useCallback(async (id: string, updates: { content?: string; mood?: MoodType }) => {
    try {
      await diaryApi.update(id, updates);
      dispatch({ type: 'UPDATE_DIARY_ENTRY', payload: { id, updates: { ...updates, updatedAt: toISOString() } } });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal update jurnal' });
    }
  }, []);

  const deleteDiaryEntry = useCallback(async (id: string) => {
    try {
      await diaryApi.remove(id);
      dispatch({ type: 'REMOVE_DIARY_ENTRY', payload: id });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e instanceof Error ? e.message : 'Gagal hapus jurnal' });
    }
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
        loadWishlist,
        addWishlistItem,
        toggleWishlistItem,
        deleteWishlistItem,
        loadDiary,
        saveDiaryEntry,
        updateDiaryEntry,
        deleteDiaryEntry,
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
