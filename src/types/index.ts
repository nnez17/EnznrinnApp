export type TransactionType = 'income' | 'expense';
export type UserName = 'Noval' | 'Kharin';

export interface Transaction {
  id: string;
  user: UserName | null;
  type: TransactionType;
  amount: number;
  note: string;
  date: string;
  balance: number;
}

export interface Balance {
  current: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
}

export interface Target {
  id: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export type Priority = 'low' | 'medium' | 'high';
export type MoodType = 'happy' | 'sad' | 'neutral' | 'love' | 'excited' | 'stressed';
export type ThemeMode = 'light' | 'dark' | 'kharin';

export type CyclePhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

export interface CycleData {
  lastPeriodStart: string;
  cycleLength: number;
  periodDuration: number;
}

export interface CycleDay {
  date: string;
  phase: CyclePhase | null;
  dayInCycle: number;
  isFuture: boolean;
  isToday: boolean;
  hasJournal: boolean;
}

export interface WishlistItem {
  id: string;
  name: string;
  price?: number;
  priority: Priority;
  notes?: string;
  isAchieved: boolean;
  createdAt: string;
  user: UserName;
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: MoodType;
  createdAt: string;
  updatedAt: string;
  user: UserName;
}

export interface AppState {
  transactions: Transaction[];
  balance: Balance;
  target: Target | null;
  wishlist: WishlistItem[];
  diary: DiaryEntry[];
  currentUser: UserName;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  lastSynced: number | null;
  error: string | null;
  themeMode: ThemeMode;
}
