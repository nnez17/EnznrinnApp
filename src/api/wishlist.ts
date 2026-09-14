import { api } from './client';
import { WishlistItem, Priority, UserName } from '@/types';

interface ServerWishlist {
  id: string;
  user: string;
  name: string;
  price?: number;
  priority: Priority;
  notes?: string;
  isAchieved: boolean;
  createdAt: string;
}

export const wishlistApi = {
  list: async (): Promise<WishlistItem[]> => {
    const rows = await api.get<ServerWishlist[]>('/wishlist');
    return rows.map(r => ({
      id: r.id, name: r.name, priority: r.priority, isAchieved: r.isAchieved,
      createdAt: r.createdAt, user: r.user as UserName,
      ...(r.price !== undefined && r.price !== null ? { price: r.price } : {}),
      ...(r.notes ? { notes: r.notes } : {}),
    }));
  },
  create: (input: { id?: string; name: string; price?: number; priority: Priority; notes?: string; isAchieved: boolean; user: UserName }) =>
    api.post<ServerWishlist>('/wishlist', input),
  update: (id: string, updates: Partial<Pick<WishlistItem, 'name' | 'price' | 'priority' | 'notes' | 'isAchieved'>>) =>
    api.put<{ updated: string }>(`/wishlist/${id}`, updates),
  remove: (id: string) => api.del<{ deleted: string }>(`/wishlist/${id}`),
};
