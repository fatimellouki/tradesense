"""
Trading Routes - Market Data & Trade Execution
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Trade, Position, UserChallenge, MarketData, AISignal, db
from services.market_data import MarketDataService
from services.challenge_engine import ChallengeEngine
from services.ai_signals import AISignalService
from datetime import datetime

trading_bp = Blueprint('trading', __name__)
market_service = MarketDataService()
challenge_engine = ChallengeEngine()
ai_signal_service = AISignalService()


@trading_bp.route('/market-data', methods=['GET'])
def get_all_market_data():
    """Get all available market data"""
    market = request.args.get('market')  # us, morocco, crypto

    query = MarketData.query
    if market:
        query = query.filter_by(market=market)

    data = query.all()

    return jsonify({
        'success': True,
        'data': {
            'prices': [d.to_dict() for d in data]
        }
    })


@trading_bp.route('/market-data/<symbol>', methods=['GET'])
def get_symbol_data(symbol):
    """Get market data for specific symbol"""
    # Try to get from cache first
    cached = MarketData.query.filter_by(symbol=symbol.upper()).first()

    # If cache is old (>30s), refresh
    if cached and (datetime.utcnow() - cached.last_updated).seconds < 30:
        return jsonify({
            'success': True,
            'data': {'price': cached.to_dict()}
        })

    # Fetch fresh data
    price_data = market_service.get_price(symbol.upper())

    if price_data:
        # Update cache
        if cached:
            cached.price = price_data['price']
            cached.change_percent = price_data.get('change_percent')
            cached.last_updated = datetime.utcnow()
        else:
            cached = MarketData(
                symbol=symbol.upper(),
                market=price_data.get('market', 'us'),
                price=price_data['price'],
                change_percent=price_data.get('change_percent'),
                last_updated=datetime.utcnow()
            )
            db.session.add(cached)

        db.session.commit()

        return jsonify({
            'success': True,
            'data': {'price': cached.to_dict()}
        })

    return jsonify({
        'success': False,
        'error': 'Could not fetch price data'
    }), 404


@trading_bp.route('/refresh-prices', methods=['POST'])
def refresh_prices():
    """Refresh all market prices and regenerate AI signals (called by scheduler)"""
    updated = market_service.refresh_all_prices()

    # Generate new AI signals based on updated prices
    signals = ai_signal_service.generate_all_signals()

    return jsonify({
        'success': True,
        'message': f'Updated {updated} prices and generated {len(signals)} signals'
    })


@trading_bp.route('/execute', methods=['POST'])
@jwt_required()
def execute_trade():
    """Execute a trade"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    # Validate input
    symbol = data.get('symbol', '').upper()
    side = data.get('side', '').lower()
    quantity = data.get('quantity')
    market = data.get('market', 'us')

    if not symbol or side not in ['buy', 'sell'] or not quantity:
        return jsonify({
            'success': False,
            'error': 'Invalid trade parameters'
        }), 400

    quantity = float(quantity)
    if quantity <= 0:
        return jsonify({
            'success': False,
            'error': 'Quantity must be positive'
        }), 400

    # Get active challenge
    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({
            'success': False,
            'error': 'No active challenge. Please purchase a challenge first.'
        }), 400

    # Get current price
    price_data = market_service.get_price(symbol)
    if not price_data:
        return jsonify({
            'success': False,
            'error': f'Could not get price for {symbol}'
        }), 400

    current_price = price_data['price']
    trade_value = quantity * current_price

    # Check if user has enough balance for buy
    if side == 'buy' and trade_value > float(challenge.current_balance):
        return jsonify({
            'success': False,
            'error': 'Insufficient balance'
        }), 400

    # Create trade
    trade = Trade(
        user_id=user_id,
        challenge_id=challenge.id,
        symbol=symbol,
        market=market,
        side=side,
        quantity=quantity,
        entry_price=current_price,
        status='open'
    )

    # Create or update position
    position = Position.query.filter_by(
        challenge_id=challenge.id,
        symbol=symbol
    ).first()

    if side == 'buy':
        if position:
            # Add to existing position
            new_quantity = float(position.quantity) + quantity
            avg_price = (float(position.quantity) * float(position.entry_price) + quantity * current_price) / new_quantity
            position.quantity = new_quantity
            position.entry_price = avg_price
        else:
            # Create new position
            position = Position(
                user_id=user_id,
                challenge_id=challenge.id,
                symbol=symbol,
                market=market,
                side='long',
                quantity=quantity,
                entry_price=current_price,
                current_price=current_price
            )
            db.session.add(position)

        # Deduct from balance
        challenge.current_balance = float(challenge.current_balance) - trade_value

    else:  # sell
        if not position or float(position.quantity) < quantity:
            return jsonify({
                'success': False,
                'error': 'Insufficient position to sell'
            }), 400

        # Calculate profit
        profit = (current_price - float(position.entry_price)) * quantity
        trade.profit = profit
        trade.exit_price = current_price
        trade.status = 'closed'
        trade.closed_at = datetime.utcnow()

        # Update position
        remaining = float(position.quantity) - quantity
        if remaining <= 0:
            db.session.delete(position)
        else:
            position.quantity = remaining

        # Update balance
        challenge.current_balance = float(challenge.current_balance) + trade_value
        challenge.total_pnl = float(challenge.total_pnl or 0) + profit
        challenge.daily_pnl = float(challenge.daily_pnl or 0) + profit

    db.session.add(trade)
    db.session.commit()

    # Evaluate challenge rules (The Killer Function)
    status, reason = challenge_engine.evaluate_rules(challenge.id)

    return jsonify({
        'success': True,
        'message': f'Trade executed successfully',
        'data': {
            'trade': trade.to_dict(),
            'challenge_status': status,
            'status_reason': reason if status != 'active' else None,
            'new_balance': float(challenge.current_balance)
        }
    })


@trading_bp.route('/positions', methods=['GET'])
@jwt_required()
def get_positions():
    """Get open positions"""
    user_id = int(get_jwt_identity())

    # Get active challenge
    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({
            'success': True,
            'data': {'positions': []}
        })

    positions = Position.query.filter_by(challenge_id=challenge.id).all()

    # Update current prices
    for pos in positions:
        price_data = market_service.get_price(pos.symbol)
        if price_data:
            pos.current_price = price_data['price']
            pos.unrealized_pnl = (price_data['price'] - float(pos.entry_price)) * float(pos.quantity)

    db.session.commit()

    return jsonify({
        'success': True,
        'data': {
            'positions': [p.to_dict() for p in positions]
        }
    })


@trading_bp.route('/close-position/<int:position_id>', methods=['POST'])
@jwt_required()
def close_position(position_id):
    """Close an entire position"""
    user_id = int(get_jwt_identity())

    position = Position.query.filter_by(
        id=position_id,
        user_id=user_id
    ).first()

    if not position:
        return jsonify({
            'success': False,
            'error': 'Position not found'
        }), 404

    # Execute sell trade for the full position
    return execute_trade()


@trading_bp.route('/signals', methods=['GET'])
@jwt_required()
def get_ai_signals():
    """Get AI trading signals"""
    market = request.args.get('market')  # Optional: filter by market
    limit = request.args.get('limit', 10, type=int)

    # Get active signals from the service
    signals = ai_signal_service.get_active_signals(market=market, limit=limit)

    # If no signals exist, generate them
    if not signals:
        ai_signal_service.generate_all_signals()
        signals = ai_signal_service.get_active_signals(market=market, limit=limit)

    return jsonify({
        'success': True,
        'data': {
            'signals': signals
        }
    })


@trading_bp.route('/signals/<symbol>', methods=['GET'])
@jwt_required()
def get_symbol_signal(symbol):
    """Get AI signal for a specific symbol"""
    signal = ai_signal_service.get_signal_for_symbol(symbol)

    if not signal:
        # Try to generate signal for this symbol
        market_data = MarketData.query.filter_by(symbol=symbol.upper()).first()
        if market_data:
            price_data = {
                'price': float(market_data.price),
                'open': float(market_data.open_price) if market_data.open_price else None,
                'high': float(market_data.high_price) if market_data.high_price else None,
                'low': float(market_data.low_price) if market_data.low_price else None,
                'change_percent': float(market_data.change_percent) if market_data.change_percent else 0,
                'market': market_data.market
            }
            signal_data = ai_signal_service.generate_signal(symbol.upper(), price_data)
            if signal_data:
                ai_signal_service._save_signal(signal_data)
                signal = signal_data

    return jsonify({
        'success': True,
        'data': {
            'signal': signal
        }
    })


@trading_bp.route('/historical/<symbol>', methods=['GET'])
def get_historical_data(symbol):
    """Get historical OHLC data for charts - public endpoint"""
    period = request.args.get('period', '1mo')
    interval = request.args.get('interval', '1d')

    data = market_service.get_historical_data(symbol.upper(), period, interval)

    if not data:
        return jsonify({
            'success': False,
            'error': f'No historical data available for {symbol}'
        }), 404

    # Transform to lightweight-charts format
    chart_data = []
    for row in data:
        try:
            # Handle different date field names from various sources
            date_val = row.get('Date') or row.get('seance') or row.get('date')
            if not date_val:
                continue

            # Convert to unix timestamp
            if isinstance(date_val, str):
                dt = datetime.fromisoformat(date_val.split('T')[0].split(' ')[0])
            else:
                dt = date_val

            timestamp = int(dt.timestamp())

            chart_data.append({
                'time': timestamp,
                'open': float(row.get('Open') or row.get('open', 0)),
                'high': float(row.get('High') or row.get('high', 0)),
                'low': float(row.get('Low') or row.get('low', 0)),
                'close': float(row.get('Close') or row.get('close', 0)),
            })
        except (ValueError, TypeError, AttributeError):
            continue

    # Sort by time (oldest first - required by lightweight-charts)
    chart_data.sort(key=lambda x: x['time'])

    return jsonify({
        'success': True,
        'data': {
            'symbol': symbol.upper(),
            'period': period,
            'interval': interval,
            'candles': chart_data
        }
    })


@trading_bp.route('/history', methods=['GET'])
@jwt_required()
def get_trade_history():
    """Get trade history"""
    user_id = int(get_jwt_identity())
    challenge_id = request.args.get('challenge_id')

    query = Trade.query.filter_by(user_id=user_id)
    if challenge_id:
        query = query.filter_by(challenge_id=challenge_id)

    trades = query.order_by(Trade.executed_at.desc()).limit(50).all()

    return jsonify({
        'success': True,
        'data': {
            'trades': [t.to_dict() for t in trades]
        }
    })
