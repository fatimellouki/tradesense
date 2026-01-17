"""
Challenge Engine - The Killer Function
Evaluates challenge rules after each trade
"""

from datetime import datetime, date
from models import UserChallenge, Trade, Position, db
from sqlalchemy import func


class ChallengeEngine:
    """
    Core engine for prop firm challenge logic.
    Implements the "Killer Function" that evaluates rules after each trade.
    """

    def evaluate_rules(self, challenge_id):
        """
        The Killer Function - evaluates challenge rules after each trade.

        Rules:
        1. Daily Max Loss: If equity drops 5% in a day -> FAILED
        2. Total Max Loss: If equity drops 10% total -> FAILED
        3. Profit Target: If equity gains 10% -> PASSED

        Returns:
            tuple: (status, reason)
            - status: 'active', 'passed', or 'failed'
            - reason: Human-readable explanation
        """
        challenge = UserChallenge.query.get(challenge_id)

        if not challenge:
            return 'failed', 'Challenge not found'

        if challenge.status != 'active':
            return challenge.status, f'Challenge already {challenge.status}'

        # Get plan configuration
        config = UserChallenge.PLAN_CONFIG.get(challenge.plan_type, {
            'daily_max_loss': 0.05,
            'total_max_loss': 0.10,
            'profit_target': 0.10
        })

        initial = float(challenge.initial_balance)
        current_balance = float(challenge.current_balance)

        # Calculate equity (balance + position market values)
        # Equity = Cash Balance + Sum of (current_price * quantity for all positions)
        positions = Position.query.filter_by(challenge_id=challenge_id).all()

        # Calculate total position value (market value of all holdings)
        position_value = 0
        for p in positions:
            current_price = float(p.current_price or p.entry_price)
            qty = float(p.quantity)
            position_value += current_price * qty
            # Also update unrealized PnL for reporting
            p.unrealized_pnl = (current_price - float(p.entry_price)) * qty

        equity = current_balance + position_value

        # Update challenge equity
        challenge.equity = equity

        # ==================== RULE 1: Daily Max Loss ====================
        # Calculate today's P&L
        today = date.today()
        daily_trades = Trade.query.filter(
            Trade.challenge_id == challenge_id,
            func.date(Trade.executed_at) == today
        ).all()

        realized_daily_pnl = sum(float(t.profit or 0) for t in daily_trades)

        # Track daily high equity for drawdown
        if challenge.daily_high_equity is None:
            challenge.daily_high_equity = initial

        # Reset daily high at start of new day (simplified)
        daily_high = float(challenge.daily_high_equity)

        # Update daily high if current equity is higher
        if equity > daily_high:
            challenge.daily_high_equity = equity
            daily_high = equity

        # Daily drawdown from daily high
        daily_drawdown = (daily_high - equity) / initial
        daily_pnl_pct = realized_daily_pnl / initial

        # Check daily loss limit
        if daily_drawdown >= config['daily_max_loss']:
            challenge.status = 'failed'
            challenge.end_date = datetime.utcnow()
            db.session.commit()
            return 'failed', f'Daily loss limit exceeded: -{daily_drawdown * 100:.2f}% (max -{config["daily_max_loss"] * 100}%)'

        # ==================== RULE 2: Total Max Loss ====================
        total_drawdown = (initial - equity) / initial

        if total_drawdown >= config['total_max_loss']:
            challenge.status = 'failed'
            challenge.end_date = datetime.utcnow()
            db.session.commit()
            return 'failed', f'Total loss limit exceeded: -{total_drawdown * 100:.2f}% (max -{config["total_max_loss"] * 100}%)'

        # ==================== RULE 3: Profit Target ====================
        total_profit_pct = (equity - initial) / initial

        if total_profit_pct >= config['profit_target']:
            challenge.status = 'passed'
            challenge.end_date = datetime.utcnow()
            db.session.commit()
            return 'passed', f'Profit target reached: +{total_profit_pct * 100:.2f}% (target +{config["profit_target"] * 100}%)'

        # ==================== Still Active ====================
        # Update metrics
        challenge.daily_pnl = realized_daily_pnl
        challenge.total_pnl = equity - initial

        db.session.commit()

        return 'active', f'Challenge continues. P&L: {total_profit_pct * 100:+.2f}%'

    def reset_daily_metrics(self):
        """
        Reset daily metrics at the start of each trading day.
        Should be called by a scheduled task.
        """
        active_challenges = UserChallenge.query.filter_by(status='active').all()

        for challenge in active_challenges:
            challenge.daily_pnl = 0
            challenge.daily_high_equity = challenge.equity

        db.session.commit()
        return len(active_challenges)

    def get_challenge_metrics(self, challenge_id):
        """Get detailed metrics for a challenge"""
        challenge = UserChallenge.query.get(challenge_id)

        if not challenge:
            return None

        config = UserChallenge.PLAN_CONFIG.get(challenge.plan_type, {})
        initial = float(challenge.initial_balance)
        equity = float(challenge.equity)

        # Calculate all metrics
        total_pnl = equity - initial
        total_pnl_pct = (total_pnl / initial) * 100
        daily_pnl = float(challenge.daily_pnl or 0)
        daily_pnl_pct = (daily_pnl / initial) * 100

        # Trade statistics
        trades = Trade.query.filter_by(challenge_id=challenge_id).all()
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if (t.profit or 0) > 0)
        losing_trades = sum(1 for t in trades if (t.profit or 0) < 0)
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

        # Calculate largest win/loss
        profits = [float(t.profit or 0) for t in trades]
        largest_win = max(profits) if profits else 0
        largest_loss = min(profits) if profits else 0

        return {
            'challenge_id': challenge_id,
            'status': challenge.status,
            'plan_type': challenge.plan_type,
            'initial_balance': initial,
            'current_equity': equity,
            'total_pnl': round(total_pnl, 2),
            'total_pnl_percent': round(total_pnl_pct, 2),
            'daily_pnl': round(daily_pnl, 2),
            'daily_pnl_percent': round(daily_pnl_pct, 2),
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round(win_rate, 1),
            'largest_win': round(largest_win, 2),
            'largest_loss': round(largest_loss, 2),
            'rules': {
                'daily_loss_limit': config.get('daily_max_loss', 0.05) * 100,
                'total_loss_limit': config.get('total_max_loss', 0.10) * 100,
                'profit_target': config.get('profit_target', 0.10) * 100,
                'daily_loss_used': round(abs(min(daily_pnl_pct, 0)), 2),
                'total_loss_used': round(abs(min(total_pnl_pct, 0)), 2),
                'profit_achieved': round(max(total_pnl_pct, 0), 2)
            }
        }
