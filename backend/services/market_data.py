"""
Market Data Service
Integrates yfinance (US/Crypto) and BVCscrap (Morocco)
"""

import yfinance as yf
from datetime import datetime, timedelta
from models import MarketData, db

# Morocco stocks mapping
MOROCCO_SYMBOLS = {
    'IAM': 'Maroc Telecom',
    'ATW': 'Attijariwafa Bank',
    'BCP': 'Banque Centrale Populaire',
    'CIH': 'CIH Bank',
    'LHM': 'LafargeHolcim Maroc',
    'MNG': 'Managem'
}

# US stocks for the platform
US_SYMBOLS = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA']

# Crypto symbols
CRYPTO_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD']


class MarketDataService:
    """Service for fetching market data from multiple sources"""

    def __init__(self):
        self.cache = {}
        self.cache_duration = 30  # seconds

    def get_price(self, symbol):
        """Get price for any symbol"""
        symbol = symbol.upper()

        # Determine market type
        if symbol in MOROCCO_SYMBOLS:
            return self.get_morocco_price(symbol)
        elif symbol.endswith('-USD') or symbol in ['BTC', 'ETH', 'SOL', 'BNB']:
            # Normalize crypto symbols
            if not symbol.endswith('-USD'):
                symbol = f"{symbol}-USD"
            return self.get_yfinance_price(symbol, 'crypto')
        else:
            return self.get_yfinance_price(symbol, 'us')

    def get_yfinance_price(self, symbol, market='us'):
        """Get price from Yahoo Finance (US stocks & Crypto)"""
        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period='1d', interval='1m')

            if data.empty:
                # Try with longer period
                data = ticker.history(period='5d', interval='1d')

            if not data.empty:
                current_price = float(data['Close'].iloc[-1])
                open_price = float(data['Open'].iloc[0])
                high_price = float(data['High'].max())
                low_price = float(data['Low'].min())
                volume = float(data['Volume'].sum())
                change_pct = ((current_price - open_price) / open_price) * 100

                return {
                    'symbol': symbol,
                    'market': market,
                    'price': round(current_price, 2 if market == 'us' else 8),
                    'open': round(open_price, 2),
                    'high': round(high_price, 2),
                    'low': round(low_price, 2),
                    'change_percent': round(change_pct, 2),
                    'volume': volume,
                    'timestamp': datetime.utcnow().isoformat()
                }
        except Exception as e:
            print(f"yfinance error for {symbol}: {e}")

        # Return fallback data if yfinance fails
        return self._get_fallback_price(symbol, market)

    def get_morocco_price(self, symbol):
        """Get price for Moroccan stocks from BVCscrap"""
        try:
            # Try importing BVCscrap
            from BVCscrap import LoadData

            end = datetime.now()
            start = end - timedelta(days=10)

            data = LoadData(
                symbol,
                start.strftime('%Y-%m-%d'),
                end.strftime('%Y-%m-%d')
            )

            if data is not None and not data.empty:
                current_price = float(data['close'].iloc[-1])
                open_price = float(data['open'].iloc[-1])
                high_price = float(data['high'].iloc[-1])
                low_price = float(data['low'].iloc[-1])
                volume = float(data['volume'].iloc[-1]) if 'volume' in data.columns else 0
                change_pct = ((current_price - open_price) / open_price) * 100

                return {
                    'symbol': symbol,
                    'market': 'morocco',
                    'price': round(current_price, 2),
                    'open': round(open_price, 2),
                    'high': round(high_price, 2),
                    'low': round(low_price, 2),
                    'change_percent': round(change_pct, 2),
                    'volume': volume,
                    'timestamp': datetime.utcnow().isoformat()
                }
        except ImportError:
            print("BVCscrap not installed, using fallback data")
            return self._get_morocco_fallback(symbol)
        except Exception as e:
            print(f"BVCscrap error for {symbol}: {e}")
            return self._get_morocco_fallback(symbol)

        return None

    def _get_fallback_price(self, symbol, market):
        """Fallback data for US/Crypto when yfinance fails"""
        import random

        # Real prices as of January 17, 2026
        fallback_prices = {
            # US Stocks
            'AAPL': 255.53,
            'TSLA': 437.50,
            'GOOGL': 197.00,
            'MSFT': 459.91,
            'AMZN': 239.09,
            'META': 622.19,
            'NVDA': 186.23,
            # Crypto
            'BTC-USD': 95456.24,
            'ETH-USD': 3317.09,
            'SOL-USD': 144.59,
            'BNB-USD': 695.00,
        }

        base_price = fallback_prices.get(symbol, 100.00)
        variation = random.uniform(-0.02, 0.02)
        price = base_price * (1 + variation)

        return {
            'symbol': symbol,
            'market': market,
            'price': round(price, 2 if market == 'us' else 2),
            'open': round(base_price * 0.995, 2),
            'high': round(base_price * 1.015, 2),
            'low': round(base_price * 0.985, 2),
            'change_percent': round(variation * 100, 2),
            'volume': random.randint(1000000, 50000000),
            'timestamp': datetime.utcnow().isoformat(),
            'is_fallback': True
        }

    def _get_morocco_fallback(self, symbol):
        """Fallback data for Morocco stocks when BVCscrap fails"""
        # These are approximate values for demo purposes
        fallback_prices = {
            'IAM': 125.50,
            'ATW': 485.00,
            'BCP': 275.00,
            'CIH': 320.00,
            'LHM': 1850.00,
            'MNG': 1520.00
        }

        price = fallback_prices.get(symbol, 100.00)
        # Add small random variation for demo
        import random
        variation = random.uniform(-0.02, 0.02)
        price = price * (1 + variation)

        return {
            'symbol': symbol,
            'market': 'morocco',
            'price': round(price, 2),
            'open': round(price * 0.99, 2),
            'high': round(price * 1.01, 2),
            'low': round(price * 0.98, 2),
            'change_percent': round(variation * 100, 2),
            'volume': 0,
            'timestamp': datetime.utcnow().isoformat(),
            'is_fallback': True
        }

    def refresh_all_prices(self):
        """Refresh prices for all tracked symbols"""
        updated = 0

        all_symbols = US_SYMBOLS + CRYPTO_SYMBOLS + list(MOROCCO_SYMBOLS.keys())

        for symbol in all_symbols:
            price_data = self.get_price(symbol)

            if price_data:
                # Update database cache
                cached = MarketData.query.filter_by(symbol=symbol).first()

                if cached:
                    cached.price = price_data['price']
                    cached.open_price = price_data.get('open')
                    cached.high_price = price_data.get('high')
                    cached.low_price = price_data.get('low')
                    cached.change_percent = price_data.get('change_percent')
                    cached.volume = price_data.get('volume')
                    cached.last_updated = datetime.utcnow()
                else:
                    cached = MarketData(
                        symbol=symbol,
                        market=price_data['market'],
                        price=price_data['price'],
                        open_price=price_data.get('open'),
                        high_price=price_data.get('high'),
                        low_price=price_data.get('low'),
                        change_percent=price_data.get('change_percent'),
                        volume=price_data.get('volume'),
                        last_updated=datetime.utcnow()
                    )
                    db.session.add(cached)

                updated += 1

        db.session.commit()
        return updated

    def get_historical_data(self, symbol, period='1mo', interval='1d'):
        """Get historical data for charts"""
        try:
            if symbol in MOROCCO_SYMBOLS:
                # Use BVCscrap for Morocco
                from BVCscrap import LoadData
                end = datetime.now()
                start = end - timedelta(days=30 if period == '1mo' else 365)

                data = LoadData(
                    symbol,
                    start.strftime('%Y-%m-%d'),
                    end.strftime('%Y-%m-%d')
                )

                if data is not None and not data.empty:
                    return data.reset_index().to_dict('records')
            else:
                # Use yfinance
                ticker = yf.Ticker(symbol)
                data = ticker.history(period=period, interval=interval)

                if not data.empty:
                    data = data.reset_index()
                    data['Date'] = data['Date'].astype(str)
                    return data.to_dict('records')
        except Exception as e:
            print(f"Historical data error for {symbol}: {e}")

        return []

    def get_all_available_symbols(self):
        """Get all available trading symbols"""
        return {
            'us': [{'symbol': s, 'name': s} for s in US_SYMBOLS],
            'crypto': [{'symbol': s, 'name': s.replace('-USD', '')} for s in CRYPTO_SYMBOLS],
            'morocco': [{'symbol': k, 'name': v} for k, v in MOROCCO_SYMBOLS.items()]
        }
