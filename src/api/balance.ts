import { api } from './client';

// Backend returns the authoritative balance — SQL aggregate, no row loading (PRD §22).
export interface ServerBalance {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  todayIncome: number;
  todayExpense: number;
}

export const balanceApi = {
  get: () => api.get<ServerBalance>('/balance'),
};
