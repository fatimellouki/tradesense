import { create } from 'zustand';
import api from '../services/api';

interface PriceData {
  symbol: string;
  market: string;
  price: number;
  change_percent: number;
  last_updated: string;
}

interface Position {
  id: number;
  symbol: string;
  market: string;
  side: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
}

interface Challenge {
  id: number;
  plan_type: string;
  initial_balance: number;
  current_balance: number;
  equity: number;
  daily_pnl: number;
  total_pnl: number;
  status: string;
  profit_percent: number;
}

interface TradingState {
  prices: Record<string, PriceData>;
  positions: Position[];
  activeChallenge: Challenge | null;
  selectedSymbol: string;
  selectedMarket: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPrices: () => Promise<void>;
  fetchPrice: (symbol: string) => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchActiveChallenge: () => Promise<void>;
  executeTrade: (symbol: string, side: 'buy' | 'sell', quantity: number, market: string) => Promise<any>;
  setSelectedSymbol: (symbol: string) => void;
  setSelectedMarket: (market: string) => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  prices: {},
  positions: [],
  activeChallenge: null,
  selectedSymbol: 'BTC-USD',
  selectedMarket: 'crypto',
  isLoading: false,
  error: null,

  fetchPrices: async () => {
    try {
      const response = await api.get('/trading/market-data');
      const pricesMap: Record<string, PriceData> = {};
      response.data.data.prices.forEach((p: PriceData) => {
        pricesMap[p.symbol] = p;
      });
      set({ prices: pricesMap });
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  },

  fetchPrice: async (symbol: string) => {
    try {
      const response = await api.get(`/trading/market-data/${symbol}`);
      const priceData = response.data.data.price;
      set((state) => ({
        prices: {
          ...state.prices,
          [symbol]: priceData,
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}:`, error);
    }
  },

  fetchPositions: async () => {
    try {
      const response = await api.get('/trading/positions');
      set({ positions: response.data.data.positions });
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  },

  fetchActiveChallenge: async () => {
    try {
      const response = await api.get('/challenges/active');
      set({ activeChallenge: response.data.data.challenge });
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch challenge:', error);
      }
      set({ activeChallenge: null });
    }
  },

  executeTrade: async (symbol: string, side: 'buy' | 'sell', quantity: number, market: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/trading/execute', {
        symbol,
        side,
        quantity,
        market,
      });

      // Refresh data after trade
      await get().fetchActiveChallenge();
      await get().fetchPositions();

      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || 'Trade execution failed',
      });
      throw error;
    }
  },

  setSelectedSymbol: (symbol: string) => set({ selectedSymbol: symbol }),
  setSelectedMarket: (market: string) => set({ selectedMarket: market }),
}));
