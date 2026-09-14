import { api } from './client';
import { Transaction, TransactionType, UserName } from '@/types';

interface ServerTx {
  id: string;
  user: string | null;
  type: TransactionType;
  amount: number;
  note: string;
  date: string;
  balance: number;
}

const toTx = (s: ServerTx): Transaction => ({
  id: s.id,
  user: (s.user as UserName | null) ?? null,
  type: s.type,
  amount: s.amount,
  note: s.note,
  date: s.date,
  balance: s.balance,
});

export const transactionsApi = {
  list: async (): Promise<Transaction[]> => (await api.get<ServerTx[]>('/transactions')).map(toTx),
  get: async (id: string): Promise<Transaction> => toTx(await api.get<ServerTx>(`/transactions/${id}`)),
  create: async (input: { user: UserName; type: TransactionType; amount: number; note: string; transactionDate: string }): Promise<Transaction> =>
    toTx(await api.post<ServerTx>('/transactions', input)),
  update: async (id: string, input: { user?: UserName; type?: TransactionType; amount?: number; note?: string; transactionDate?: string }): Promise<Transaction> =>
    toTx(await api.put<ServerTx>(`/transactions/${id}`, input)),
  remove: (id: string) => api.del<{ deleted: string }>(`/transactions/${id}`),
};
