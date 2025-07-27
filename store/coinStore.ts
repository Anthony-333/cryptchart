import { create } from 'zustand';
import { fetchCoinsList } from '../services/coinApi';
import { CoinData, TransformedCoin } from '../types/coin';

interface CoinStore {
  coins: TransformedCoin[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  fetchCoins: () => Promise<void>;
  fetchMoreCoins: () => Promise<void>;
}

const cleanCoinName = (name: string): string => {
  return name.replace(/^_+|_+$/g, '').replace(/_/g, ' ');
};

const transformCoinData = (coin: CoinData): TransformedCoin => ({
  id: coin.code || 'unknown',
  name: coin.name || 'Unknown',
  ticker: cleanCoinName(coin.code || 'N/A'),
  price: coin.rate || 0,
  marketCap: coin.cap || 0, // Keep as number instead of formatting here
  change: coin.delta?.day ? ((coin.delta.day - 1) * 100) : 0,
  icon: coin.symbol || (coin.code ? coin.code.charAt(0) : '?'),
  imageUrl: coin.png32,
  color: coin.color || '#666666',
  chartData: [20, 45, 28, 80, 99, 43, 50], // Mock chart data
});

export const useCoinStore = create<CoinStore>((set, get) => ({
  coins: [],
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: true,
  offset: 0,
  
  fetchCoins: async () => {
    set({ loading: true, error: null, offset: 0 });
    try {
      const data = await fetchCoinsList(0, 50);
      const transformedCoins = data.map(transformCoinData);
      set({ 
        coins: transformedCoins, 
        loading: false, 
        offset: 50,
        hasMore: data.length === 50 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch coins',
        loading: false 
      });
    }
  },

  fetchMoreCoins: async () => {
    const { loadingMore, hasMore, offset } = get();
    if (loadingMore || !hasMore) return;

    set({ loadingMore: true, error: null });
    try {
      const data = await fetchCoinsList(offset, 50);
      const transformedCoins = data.map(transformCoinData);
      set(state => ({ 
        coins: [...state.coins, ...transformedCoins],
        loadingMore: false,
        offset: offset + 50,
        hasMore: data.length === 50
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch more coins',
        loadingMore: false 
      });
    }
  },
}));




