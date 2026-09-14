import { api } from './client';
import { CycleData } from '@/types';

export const cycleApi = {
  // null when not configured yet — same as the old Firestore doc-missing case.
  get: () => api.get<CycleData | null>('/cycle'),
  save: (data: CycleData) => api.put<CycleData>('/cycle', data),
};
