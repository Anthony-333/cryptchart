import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface Holding {
  id: string;
  name: string;
  ticker: string;
  imageUrl: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
}

interface Transaction {
  id: string;
  coinId: string;
  coinName: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}

interface PortfolioStore {
  holdings: Holding[];
  transactions: Transaction[];
  balance: number;
  totalInvested: number;
  loading: boolean;
  loadPortfolio: () => Promise<void>;
  buyCoin: (coinId: string, coinName: string, ticker: string, imageUrl: string, quantity: number, price: number) => Promise<boolean>;
  sellCoin: (coinId: string, quantity: number, price: number) => Promise<boolean>;
  updateHoldingPrices: (coins: any[]) => Promise<void>;
  getTotalValue: () => number;
  getTotalProfitLoss: () => { amount: number; percentage: number };
}

const PORTFOLIO_KEY = '@crypto_portfolio';
const TRANSACTIONS_KEY = '@crypto_transactions';
const BALANCE_KEY = '@crypto_balance';

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  holdings: [],
  transactions: [],
  balance: 10000, // Starting balance
  totalInvested: 0,
  loading: false,

  loadPortfolio: async () => {
    try {
      set({ loading: true });
      const [holdingsData, transactionsData, balanceData] = await Promise.all([
        AsyncStorage.getItem(PORTFOLIO_KEY),
        AsyncStorage.getItem(TRANSACTIONS_KEY),
        AsyncStorage.getItem(BALANCE_KEY),
      ]);

      const holdings = holdingsData ? JSON.parse(holdingsData) : [];
      const transactions = transactionsData ? JSON.parse(transactionsData) : [];
      const balance = balanceData ? parseFloat(balanceData) : 10000;

      const totalInvested = transactions
        .filter((t: Transaction) => t.type === 'buy')
        .reduce((sum: number, t: Transaction) => sum + (t.quantity * t.price), 0);

      set({ holdings, transactions, balance, totalInvested, loading: false });
    } catch (error) {
      console.error('Error loading portfolio:', error);
      set({ loading: false });
    }
  },

  buyCoin: async (coinId: string, coinName: string, ticker: string, imageUrl: string, quantity: number, price: number) => {
    try {
      const { holdings, transactions, balance } = get();
      const totalCost = quantity * price;

      if (balance < totalCost) {
        return false; // Insufficient funds
      }

      const existingHolding = holdings.find(h => h.id === coinId);
      let newHoldings;

      if (existingHolding) {
        const totalQuantity = existingHolding.quantity + quantity;
        const newAveragePrice = ((existingHolding.quantity * existingHolding.averagePrice) + totalCost) / totalQuantity;
        
        newHoldings = holdings.map(h => 
          h.id === coinId 
            ? { ...h, quantity: totalQuantity, averagePrice: newAveragePrice, currentPrice: price }
            : h
        );
      } else {
        newHoldings = [...holdings, {
          id: coinId,
          name: coinName,
          ticker,
          imageUrl,
          quantity,
          averagePrice: price,
          currentPrice: price,
        }];
      }

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        coinId,
        coinName,
        type: 'buy',
        quantity,
        price,
        timestamp: Date.now(),
      };

      const newTransactions = [...transactions, newTransaction];
      const newBalance = balance - totalCost;

      await Promise.all([
        AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(newHoldings)),
        AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions)),
        AsyncStorage.setItem(BALANCE_KEY, newBalance.toString()),
      ]);

      set({ holdings: newHoldings, transactions: newTransactions, balance: newBalance });
      return true;
    } catch (error) {
      console.error('Error buying coin:', error);
      return false;
    }
  },

  sellCoin: async (coinId: string, quantity: number, price: number) => {
    try {
      const { holdings, transactions } = get();
      const holding = holdings.find(h => h.id === coinId);

      if (!holding || holding.quantity < quantity) {
        return false; // Insufficient holdings
      }

      const totalValue = quantity * price;
      const newQuantity = holding.quantity - quantity;
      
      let newHoldings;
      if (newQuantity === 0) {
        newHoldings = holdings.filter(h => h.id !== coinId);
      } else {
        newHoldings = holdings.map(h => 
          h.id === coinId 
            ? { ...h, quantity: newQuantity, currentPrice: price }
            : h
        );
      }

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        coinId,
        coinName: holding.name,
        type: 'sell',
        quantity,
        price,
        timestamp: Date.now(),
      };

      const newTransactions = [...transactions, newTransaction];
      const newBalance = get().balance + totalValue;

      await Promise.all([
        AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(newHoldings)),
        AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions)),
        AsyncStorage.setItem(BALANCE_KEY, newBalance.toString()),
      ]);

      set({ holdings: newHoldings, transactions: newTransactions, balance: newBalance });
      return true;
    } catch (error) {
      console.error('Error selling coin:', error);
      return false;
    }
  },

  updateHoldingPrices: async (coins: any[]) => {
    try {
      const { holdings } = get();
      const updatedHoldings = holdings.map(holding => {
        const coin = coins.find(c => c.id === holding.id);
        return coin ? { ...holding, currentPrice: coin.price } : holding;
      });

      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updatedHoldings));
      set({ holdings: updatedHoldings });
    } catch (error) {
      console.error('Error updating holding prices:', error);
    }
  },

  getTotalValue: () => {
    const { holdings, balance } = get();
    const holdingsValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    return holdingsValue + balance;
  },

  getTotalProfitLoss: () => {
    const { holdings, balance, totalInvested } = get();
    const currentValue = holdings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const totalValue = currentValue + balance;
    const profitLoss = totalValue - 10000; // Starting balance was 10000
    const percentage = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
    
    return { amount: profitLoss, percentage };
  },
}));
