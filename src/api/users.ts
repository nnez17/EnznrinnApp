import { api } from './client';
import { UserName } from '@/types';

export interface ServerUser {
  id: number;
  name: UserName;
}

export const usersApi = {
  list: () => api.get<ServerUser[]>('/users'),
};
