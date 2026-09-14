import { api } from './client';
import { DiaryEntry, MoodType, UserName } from '@/types';

interface ServerDiary {
  id: string;
  user: string;
  date: string;
  content: string;
  mood?: string;
  createdAt: string;
  updatedAt: string;
}

const toEntry = (s: ServerDiary): DiaryEntry => ({
  id: s.id, date: s.date, content: s.content,
  ...(s.mood ? { mood: s.mood as MoodType } : {}),
  createdAt: s.createdAt, updatedAt: s.updatedAt, user: s.user as UserName,
});

export const diaryApi = {
  list: async (): Promise<DiaryEntry[]> => (await api.get<ServerDiary[]>('/diary')).map(toEntry),
  // Backend enforces one-entry-per-day: same date updates instead of inserting.
  save: async (input: { date: string; content: string; mood?: string; user: UserName }): Promise<DiaryEntry> =>
    toEntry(await api.post<ServerDiary>('/diary', input)),
  update: (id: string, updates: { content?: string; mood?: string }) =>
    api.put<{ updated: string }>(`/diary/${id}`, updates),
  remove: (id: string) => api.del<{ deleted: string }>(`/diary/${id}`),
};
