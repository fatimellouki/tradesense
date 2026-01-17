import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, Time } from 'lightweight-charts';

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

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    // Generate and set demo data
    const data = generateDemoData(symbol);
    candlestickSeries.setData(data);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  return (
    <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden" />
  );
}

// Generate demo candlestick data
function generateDemoData(symbol?: string): CandleData[] {
  const data: CandleData[] = [];
  const basePrice = getBasePrice(symbol);
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = 100; i >= 0; i--) {
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
    'AAPL': 180,
    'TSLA': 250,
    'GOOGL': 140,
    'MSFT': 400,
    'IAM': 125,
    'ATW': 485,
  };
  return prices[symbol || 'BTC-USD'] || 100;
}
