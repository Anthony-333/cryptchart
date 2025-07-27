import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface FavoriteItem {
  id: string;
  name: string;
  ticker: string;
  imageUrl: string;
}

interface FavoritesStore {
  favorites: FavoriteItem[];
  loading: boolean;
  loadFavorites: () => Promise<void>;
  addToFavorites: (item: FavoriteItem) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
}

const FAVORITES_KEY = '@crypto_favorites';

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favorites: [],
  loading: false,

  loadFavorites: async () => {
    try {
      set({ loading: true });
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      const favorites = stored ? JSON.parse(stored) : [];
      set({ favorites, loading: false });
    } catch (error) {
      console.error('Error loading favorites:', error);
      set({ loading: false });
    }
  },

  addToFavorites: async (item: FavoriteItem) => {
    try {
      const { favorites } = get();
      const newFavorites = [...favorites, item];
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      set({ favorites: newFavorites });
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  },

  removeFromFavorites: async (id: string) => {
    try {
      const { favorites } = get();
      const newFavorites = favorites.filter(item => item.id !== id);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      set({ favorites: newFavorites });
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  },

  isFavorite: (id: string) => {
    const { favorites } = get();
    return favorites.some(item => item.id === id);
  },
}));