"""
AI Signals Service
Generates trading signals based on technical analysis of market data
"""

from datetime import datetime, timedelta
from models import AISignal, MarketData, db


class AISignalService:
    """Service for generating AI trading signals based on price analysis"""

    # Signal thresholds
    STRONG_BUY_THRESHOLD = 3.0   # >3% gain = strong buy
    BUY_THRESHOLD = 1.0          # >1% gain = buy
    SELL_THRESHOLD = -1.0        # <-1% = sell
    STRONG_SELL_THRESHOLD = -3.0 # <-3% = strong sell

    # Signal expiry (in hours)
    SIGNAL_EXPIRY_HOURS = 4

    def __init__(self):
        self.all_symbols = [
            # US Stocks
            'AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA',
            # Crypto
            'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD',
            # Morocco
            'IAM', 'ATW', 'BCP', 'CIH', 'LHM', 'MNG'
        ]

    def generate_signal(self, symbol: str, price_data: dict) -> dict:
        """
        Generate a trading signal based on price data.
        Uses momentum-based analysis:
        - Daily change percentage
        - Price relative to high/low range
        - Volume indicators (when available)
        """
        if not price_data:
            return None

        signal_type = 'hold'
        confidence = 50.0
        reasoning = []

        change_pct = price_data.get('change_percent', 0)
        current_price = price_data.get('price', 0)
        high_price = price_data.get('high', current_price)
        low_price = price_data.get('low', current_price)
        open_price = price_data.get('open', current_price)

        # 1. Momentum Analysis (40% weight)
        if change_pct >= self.STRONG_BUY_THRESHOLD:
            signal_type = 'buy'
            confidence += 25
            reasoning.append(f"Strong momentum: +{change_pct:.2f}%")
        elif change_pct >= self.BUY_THRESHOLD:
            signal_type = 'buy'
            confidence += 15
            reasoning.append(f"Positive momentum: +{change_pct:.2f}%")
        elif change_pct <= self.STRONG_SELL_THRESHOLD:
            signal_type = 'sell'
            confidence += 25
            reasoning.append(f"Strong downward momentum: {change_pct:.2f}%")
        elif change_pct <= self.SELL_THRESHOLD:
            signal_type = 'sell'
            confidence += 15
            reasoning.append(f"Negative momentum: {change_pct:.2f}%")
        else:
            reasoning.append(f"Neutral momentum: {change_pct:.2f}%")

        # 2. Position in Range Analysis (30% weight)
        if high_price > low_price:
            price_range = high_price - low_price
            position_in_range = (current_price - low_price) / price_range

            if position_in_range > 0.8:
                # Near high - potential overbought
                if signal_type == 'buy':
                    confidence -= 10
                reasoning.append("Price near daily high (potential resistance)")
            elif position_in_range < 0.2:
                # Near low - potential oversold
                if signal_type == 'sell':
                    confidence -= 10
                elif signal_type == 'hold':
                    signal_type = 'buy'
                    confidence += 10
                reasoning.append("Price near daily low (potential support)")
            else:
                reasoning.append("Price in mid-range")

        # 3. Opening Gap Analysis (20% weight)
        if open_price > 0:
            gap_pct = ((current_price - open_price) / open_price) * 100

            if gap_pct > 2:
                if signal_type != 'sell':
                    confidence += 10
                reasoning.append(f"Strong opening gap up: +{gap_pct:.2f}%")
            elif gap_pct < -2:
                if signal_type != 'buy':
                    confidence += 10
                reasoning.append(f"Strong opening gap down: {gap_pct:.2f}%")

        # 4. Market-specific adjustments (10% weight)
        market = price_data.get('market', 'us')
        if market == 'crypto':
            # Crypto is more volatile, adjust confidence
            confidence *= 0.85
            reasoning.append("Crypto market (higher volatility)")
        elif market == 'morocco':
            reasoning.append("Morocco market (BVC)")

        # Ensure confidence is within bounds
        confidence = max(30, min(95, confidence))

        return {
            'symbol': symbol,
            'market': market,
            'signal_type': signal_type,
            'confidence': round(confidence, 1),
            'reasoning': ' | '.join(reasoning),
            'price_at_signal': current_price,
            'change_percent': change_pct
        }

    def generate_all_signals(self) -> list:
        """Generate signals for all tracked symbols"""
        signals_generated = []

        for symbol in self.all_symbols:
            # Get latest market data from cache
            market_data = MarketData.query.filter_by(symbol=symbol).first()

            if market_data:
                price_data = {
                    'price': float(market_data.price),
                    'open': float(market_data.open_price) if market_data.open_price else None,
                    'high': float(market_data.high_price) if market_data.high_price else None,
                    'low': float(market_data.low_price) if market_data.low_price else None,
                    'change_percent': float(market_data.change_percent) if market_data.change_percent else 0,
                    'market': market_data.market
                }

                signal_data = self.generate_signal(symbol, price_data)

                if signal_data:
                    # Save or update signal in database
                    self._save_signal(signal_data)
                    signals_generated.append(signal_data)

        return signals_generated

    def _save_signal(self, signal_data: dict) -> AISignal:
        """Save signal to database"""
        # Check if we have a recent signal for this symbol
        existing = AISignal.query.filter_by(symbol=signal_data['symbol']).filter(
            AISignal.expires_at > datetime.utcnow()
        ).first()

        expires_at = datetime.utcnow() + timedelta(hours=self.SIGNAL_EXPIRY_HOURS)

        if existing:
            # Update existing signal
            existing.signal_type = signal_data['signal_type']
            existing.confidence = signal_data['confidence']
            existing.reasoning = signal_data['reasoning']
            existing.generated_at = datetime.utcnow()
            existing.expires_at = expires_at
            signal = existing
        else:
            # Create new signal
            signal = AISignal(
                symbol=signal_data['symbol'],
                market=signal_data['market'],
                signal_type=signal_data['signal_type'],
                confidence=signal_data['confidence'],
                reasoning=signal_data['reasoning'],
                generated_at=datetime.utcnow(),
                expires_at=expires_at
            )
            db.session.add(signal)

        db.session.commit()
        return signal

    def get_active_signals(self, market: str = None, limit: int = 10) -> list:
        """Get active (non-expired) signals"""
        query = AISignal.query.filter(AISignal.expires_at > datetime.utcnow())

        if market:
            query = query.filter_by(market=market)

        signals = query.order_by(
            AISignal.confidence.desc(),
            AISignal.generated_at.desc()
        ).limit(limit).all()

        return [s.to_dict() for s in signals]

    def get_signal_for_symbol(self, symbol: str) -> dict:
        """Get the current signal for a specific symbol"""
        signal = AISignal.query.filter_by(symbol=symbol.upper()).filter(
            AISignal.expires_at > datetime.utcnow()
        ).first()

        return signal.to_dict() if signal else None
