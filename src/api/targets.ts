import { api } from './client';
import { Target } from '@/types';

interface ServerTarget {
  id: string;
  name?: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

const toTarget = (s: ServerTarget): Target => ({
  id: s.id,
  targetAmount: s.targetAmount,
  currentAmount: s.currentAmount, // derived by backend (PRD §23)
  deadline: s.deadline,
  createdAt: s.createdAt,
});

export const targetsApi = {
  list: async (): Promise<Target[]> => (await api.get<ServerTarget[]>('/targets')).map(toTarget),
  create: async (input: { id?: string; name?: string; targetAmount: number; deadline: string }): Promise<Target> =>
    toTarget(await api.post<ServerTarget>('/targets', input)),
  update: async (id: string, input: { targetAmount?: number; deadline?: string }): Promise<Target> =>
    toTarget(await api.put<ServerTarget>(`/targets/${id}`, input)),
  remove: (id: string) => api.del<{ deleted: string }>(`/targets/${id}`),
};
