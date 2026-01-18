import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTradingStore } from '../../store/tradingStore';
import TradingChart from './TradingChart';
import api from '../../services/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  RefreshCw
} from 'lucide-react';

const SYMBOLS = {
  us: ['AAPL', 'TSLA', 'GOOGL', 'MSFT'],
  crypto: ['BTC-USD', 'ETH-USD'],
  morocco: ['IAM', 'ATW'],
};

interface AISignal {
  symbol: string;
  market: string;
  signal: string;
  confidence: number;
  reasoning: string;
  generated_at: string;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const {
    prices,
    positions,
    activeChallenge,
    selectedSymbol,
    selectedMarket,
    fetchPrices,
    fetchPrice,
    fetchPositions,
    fetchActiveChallenge,
    executeTrade,
    setSelectedSymbol,
    setSelectedMarket,
    isLoading,
  } = useTradingStore();

  const [quantity, setQuantity] = useState('1');
  const [tradeMessage, setTradeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [aiSignals, setAiSignals] = useState<AISignal[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(false);

  // Fetch AI signals
  const fetchAISignals = async () => {
    setSignalsLoading(true);
    try {
      const response = await api.get('/trading/signals?limit=6');
      if (response.data.success) {
        setAiSignals(response.data.data.signals);
      }
    } catch (error) {
      console.error('Failed to fetch AI signals:', error);
    } finally {
      setSignalsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveChallenge();
    fetchPrices();
    fetchPositions();
    fetchAISignals();

    // Refresh prices every 30 seconds
    const priceInterval = setInterval(() => {
      fetchPrice(selectedSymbol);
    }, 30000);

    // Refresh signals every 2 minutes
    const signalInterval = setInterval(() => {
      fetchAISignals();
    }, 120000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(signalInterval);
    };
  }, []);

  useEffect(() => {
    fetchPrice(selectedSymbol);
  }, [selectedSymbol]);

  const handleTrade = async (side: 'buy' | 'sell') => {
    setTradeMessage(null);
    try {
      const result = await executeTrade(selectedSymbol, side, parseFloat(quantity), selectedMarket);

      if (result.data.challenge_status === 'failed') {
        setTradeMessage({
          type: 'error',
          text: `${t('dashboard.trading.challenge_failed')}: ${result.data.status_reason}`
        });
      } else if (result.data.challenge_status === 'passed') {
        setTradeMessage({
          type: 'success',
          text: t('dashboard.trading.challenge_passed')
        });
      } else {
        setTradeMessage({
          type: 'success',
          text: `${t('dashboard.trading.success')}: ${side.toUpperCase()} ${quantity} ${selectedSymbol}`
        });
      }
      // Refresh signals after trade
      fetchAISignals();
    } catch (error: any) {
      setTradeMessage({
        type: 'error',
        text: error.response?.data?.error || t('dashboard.trading.error')
      });
    }
  };

  const currentPrice = prices[selectedSymbol];

  const getSignalColor = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'buy':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'sell':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    }
  };

  const getSignalLabel = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'buy':
        return t('dashboard.signals.buy');
      case 'sell':
        return t('dashboard.signals.sell');
      default:
        return t('dashboard.signals.hold');
    }
  };

  if (!activeChallenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-4">{t('dashboard.no_challenge.title')}</h2>
        <p className="text-gray-400 mb-8">
          {t('dashboard.no_challenge.description')}
        </p>
        <Link
          to="/pricing"
          className="inline-block px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
        >
          {t('dashboard.no_challenge.cta')}
        </Link>
      </div>
    );
  }

  const profitPercent = activeChallenge.profit_percent;
  const isProfitable = profitPercent >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Account Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.stats.balance')}</p>
              <p className="text-2xl font-bold">${activeChallenge.current_balance.toLocaleString()}</p>
            </div>
            <DollarSign className="text-primary-500" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.stats.equity')}</p>
              <p className="text-2xl font-bold">${activeChallenge.equity.toLocaleString()}</p>
            </div>
            <BarChart2 className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.stats.pnl_total')}</p>
              <p className={`text-2xl font-bold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                {isProfitable ? '+' : ''}{profitPercent.toFixed(2)}%
              </p>
            </div>
            {isProfitable ? (
              <TrendingUp className="text-green-500" size={24} />
            ) : (
              <TrendingDown className="text-red-500" size={24} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.stats.status')}</p>
              <p className={`text-lg font-bold uppercase ${
                activeChallenge.status === 'active' ? 'text-blue-500' :
                activeChallenge.status === 'passed' ? 'text-green-500' : 'text-red-500'
              }`}>
                {activeChallenge.status === 'active' ? t('dashboard.stats.status_active') :
                 activeChallenge.status === 'passed' ? t('dashboard.stats.status_passed') : t('dashboard.stats.status_failed')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Rules Progress */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">{t('dashboard.rules.title')}</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{t('dashboard.rules.daily_loss')}</span>
              <span className={activeChallenge.daily_pnl < 0 ? 'text-red-500' : 'text-gray-300'}>
                {((activeChallenge.daily_pnl / activeChallenge.initial_balance) * 100).toFixed(2)}% / -5%
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width: `${Math.min(Math.abs(activeChallenge.daily_pnl / activeChallenge.initial_balance) * 100 / 5 * 100, 100)}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{t('dashboard.rules.total_loss')}</span>
              <span className={profitPercent < 0 ? 'text-red-500' : 'text-gray-300'}>
                {Math.min(profitPercent, 0).toFixed(2)}% / -10%
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width: `${Math.min(Math.abs(Math.min(profitPercent, 0)) / 10 * 100, 100)}%`
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">{t('dashboard.rules.profit_target')}</span>
              <span className={profitPercent > 0 ? 'text-green-500' : 'text-gray-300'}>
                {Math.max(profitPercent, 0).toFixed(2)}% / 10%
              </span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{
                  width: `${Math.min(Math.max(profitPercent, 0) / 10 * 100, 100)}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-3">
          {/* Symbol Selector */}
          <div className="card mb-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(SYMBOLS).map(([market, symbols]) => (
                <div key={market} className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm uppercase">{t(`dashboard.markets.${market}`)}:</span>
                  {symbols.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => {
                        setSelectedSymbol(symbol);
                        setSelectedMarket(market);
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        selectedSymbol === symbol
                          ? 'bg-primary-600 text-white'
                          : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                      }`}
                    >
                      {symbol.replace('-USD', '')}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Price & Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedSymbol}</h2>
                {currentPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">
                      ${currentPrice.price.toLocaleString()}
                    </span>
                    <span className={`flex items-center ${
                      currentPrice.change_percent >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {currentPrice.change_percent >= 0 ? (
                        <ArrowUpRight size={20} />
                      ) : (
                        <ArrowDownRight size={20} />
                      )}
                      {Math.abs(currentPrice.change_percent).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            <TradingChart symbol={selectedSymbol} />
          </div>
        </div>

        {/* Trading Panel */}
        <div className="space-y-4">
          {/* Trade Form */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.trading.title')}</h3>

            {tradeMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                tradeMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {tradeMessage.text}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">{t('dashboard.trading.quantity')}</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                min="0.001"
                step="0.001"
              />
            </div>

            {currentPrice && (
              <p className="text-sm text-gray-400 mb-4">
                {t('dashboard.trading.value')}: ${(parseFloat(quantity) * currentPrice.price).toLocaleString()}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTrade('buy')}
                disabled={isLoading || activeChallenge.status !== 'active'}
                className="py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                {t('dashboard.trading.buy')}
              </button>
              <button
                onClick={() => handleTrade('sell')}
                disabled={isLoading || activeChallenge.status !== 'active'}
                className="py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                {t('dashboard.trading.sell')}
              </button>
            </div>
          </div>

          {/* AI Signals */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="text-primary-500" size={20} />
                {t('dashboard.signals.title')}
              </h3>
              <button
                onClick={fetchAISignals}
                disabled={signalsLoading}
                className="p-1 text-gray-400 hover:text-white transition"
                title="Refresh signals"
              >
                <RefreshCw size={16} className={signalsLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {signalsLoading && aiSignals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('dashboard.signals.loading')}</p>
            ) : aiSignals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('dashboard.signals.no_signals')}</p>
            ) : (
              <div className="space-y-2">
                {aiSignals.slice(0, 5).map((signal, index) => (
                  <div
                    key={`${signal.symbol}-${index}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${getSignalColor(signal.signal)}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{signal.symbol.replace('-USD', '')}</span>
                      <span className="text-xs opacity-70">{signal.confidence}% {t('dashboard.signals.confidence')}</span>
                    </div>
                    <span className="font-semibold">{getSignalLabel(signal.signal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Positions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('dashboard.positions.title')}</h3>
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('dashboard.positions.no_positions')}</p>
            ) : (
              <div className="space-y-2">
                {positions.map((pos) => (
                  <div key={pos.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <div>
                      <span className="font-medium">{pos.symbol}</span>
                      <span className="text-sm text-gray-400 ml-2">{pos.quantity}</span>
                    </div>
                    <span className={pos.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                      ${pos.unrealized_pnl?.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
