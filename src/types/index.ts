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
}

export interface Target {
  id: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppState {
  transactions: Transaction[];
  balance: Balance;
  target: Target | null;
  currentUser: UserName;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastSynced: number | null;
  error: string | null;
  themeMode: ThemeMode;
}
