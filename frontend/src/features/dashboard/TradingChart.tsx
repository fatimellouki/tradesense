import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import api from '../../services/api';

interface TradingChartProps {
  symbol: string;
}

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export default function TradingChart({ symbol }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real chart data from backend
  const fetchChartData = async (sym: string): Promise<CandleData[]> => {
    try {
      const response = await api.get(`/trading/historical/${sym}?period=1mo&interval=1d`);
      if (response.data.success && response.data.data.candles.length > 0) {
        return response.data.data.candles as CandleData[];
      }
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
    // Fallback to generated data if API fails
    return generateFallbackData(sym);
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#334155',
      },
      timeScale: {
        borderColor: '#334155',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candlestick series using v5 API
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // Fetch and set real data
    setIsLoading(true);
    fetchChartData(symbol).then((data) => {
      candlestickSeries.setData(data);
      setIsLoading(false);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Re-fetch when symbol changes
  useEffect(() => {
    if (seriesRef.current) {
      setIsLoading(true);
      fetchChartData(symbol).then((data) => {
        seriesRef.current?.setData(data);
        setIsLoading(false);
      });
    }
  }, [symbol]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-800/50 z-10 rounded-lg">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />
    </div>
  );
}

// Fallback data generator (only used when API fails)
function generateFallbackData(symbol?: string): CandleData[] {
  const data: CandleData[] = [];
  const basePrice = getBasePrice(symbol);
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    const open = currentPrice;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;

    data.push({
      time: Math.floor(date.getTime() / 1000) as Time,
      open,
      high,
      low,
      close,
    });

    currentPrice = close;
  }

  return data;
}

function getBasePrice(symbol?: string): number {
  const prices: Record<string, number> = {
    'BTC-USD': 95000,
    'ETH-USD': 3200,
    'AAPL': 255,
    'TSLA': 437,
    'GOOGL': 197,
    'MSFT': 460,
    'IAM': 125,
    'ATW': 485,
  };
  return prices[symbol || 'BTC-USD'] || 100;
}
