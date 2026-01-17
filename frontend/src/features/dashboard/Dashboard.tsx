import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTradingStore } from '../../store/tradingStore';
import TradingChart from './TradingChart';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const SYMBOLS = {
  us: ['AAPL', 'TSLA', 'GOOGL', 'MSFT'],
  crypto: ['BTC-USD', 'ETH-USD'],
  morocco: ['IAM', 'ATW'],
};

export default function Dashboard() {
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

  useEffect(() => {
    fetchActiveChallenge();
    fetchPrices();
    fetchPositions();

    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      fetchPrice(selectedSymbol);
    }, 30000);

    return () => clearInterval(interval);
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
          text: `Challenge ECHOUE: ${result.data.status_reason}`
        });
      } else if (result.data.challenge_status === 'passed') {
        setTradeMessage({
          type: 'success',
          text: 'Felicitations! Challenge REUSSI!'
        });
      } else {
        setTradeMessage({
          type: 'success',
          text: `Trade execute: ${side.toUpperCase()} ${quantity} ${selectedSymbol}`
        });
      }
    } catch (error: any) {
      setTradeMessage({
        type: 'error',
        text: error.response?.data?.error || 'Erreur lors du trade'
      });
    }
  };

  const currentPrice = prices[selectedSymbol];

  if (!activeChallenge) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold mb-4">Pas de Challenge Actif</h2>
        <p className="text-gray-400 mb-8">
          Vous devez d'abord acheter un challenge pour commencer a trader.
        </p>
        <Link
          to="/pricing"
          className="inline-block px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
        >
          Choisir un Challenge
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
              <p className="text-gray-400 text-sm">Solde</p>
              <p className="text-2xl font-bold">${activeChallenge.current_balance.toLocaleString()}</p>
            </div>
            <DollarSign className="text-primary-500" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Equite</p>
              <p className="text-2xl font-bold">${activeChallenge.equity.toLocaleString()}</p>
            </div>
            <BarChart2 className="text-blue-500" size={24} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">P&L Total</p>
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
              <p className="text-gray-400 text-sm">Statut</p>
              <p className={`text-lg font-bold uppercase ${
                activeChallenge.status === 'active' ? 'text-blue-500' :
                activeChallenge.status === 'passed' ? 'text-green-500' : 'text-red-500'
              }`}>
                {activeChallenge.status === 'active' ? 'En Cours' :
                 activeChallenge.status === 'passed' ? 'Reussi' : 'Echoue'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Rules Progress */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4">Regles du Challenge</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Perte Max Journaliere</span>
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
              <span className="text-gray-400">Perte Max Totale</span>
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
              <span className="text-gray-400">Objectif Profit</span>
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
                  <span className="text-gray-500 text-sm uppercase">{market}:</span>
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
            <h3 className="text-lg font-semibold mb-4">Executer un Trade</h3>

            {tradeMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                tradeMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {tradeMessage.text}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Quantite</label>
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
                Valeur: ${(parseFloat(quantity) * currentPrice.price).toLocaleString()}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTrade('buy')}
                disabled={isLoading || activeChallenge.status !== 'active'}
                className="py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                ACHETER
              </button>
              <button
                onClick={() => handleTrade('sell')}
                disabled={isLoading || activeChallenge.status !== 'active'}
                className="py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
              >
                VENDRE
              </button>
            </div>
          </div>

          {/* AI Signals */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Signaux IA</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <span>BTC-USD</span>
                <span className="text-green-500 font-semibold">ACHETER</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg">
                <span>AAPL</span>
                <span className="text-yellow-500 font-semibold">HOLD</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                <span>IAM</span>
                <span className="text-red-500 font-semibold">VENDRE</span>
              </div>
            </div>
          </div>

          {/* Open Positions */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Positions Ouvertes</h3>
            {positions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune position</p>
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
