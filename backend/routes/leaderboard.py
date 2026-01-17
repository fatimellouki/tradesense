"""
Leaderboard Routes - Gamification
"""

from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, UserChallenge, Trade, db
from sqlalchemy import func

leaderboard_bp = Blueprint('leaderboard', __name__)


@leaderboard_bp.route('/top-10', methods=['GET'])
def get_top_10():
    """Get top 10 traders by profit percentage"""

    # SQL query to get top performers
    results = db.session.query(
        User.id,
        User.username,
        UserChallenge.plan_type,
        UserChallenge.initial_balance,
        UserChallenge.equity,
        func.count(Trade.id).label('total_trades'),
        func.sum(
            db.case(
                (Trade.profit > 0, 1),
                else_=0
            )
        ).label('winning_trades')
    ).join(
        UserChallenge, User.id == UserChallenge.user_id
    ).outerjoin(
        Trade, UserChallenge.id == Trade.challenge_id
    ).filter(
        UserChallenge.status.in_(['active', 'passed'])
    ).group_by(
        User.id, User.username,
        UserChallenge.id, UserChallenge.plan_type,
        UserChallenge.initial_balance, UserChallenge.equity
    ).all()

    # Calculate rankings
    leaderboard = []
    for r in results:
        initial = float(r.initial_balance)
        equity = float(r.equity)
        profit_pct = ((equity - initial) / initial) * 100
        total_trades = r.total_trades or 0
        winning_trades = r.winning_trades or 0
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0

        leaderboard.append({
            'user_id': r.id,
            'username': r.username,
            'plan_type': r.plan_type,
            'profit_percent': round(profit_pct, 2),
            'total_trades': total_trades,
            'win_rate': round(win_rate, 1),
            'equity': equity
        })

    # Sort by profit percentage and take top 10
    leaderboard.sort(key=lambda x: x['profit_percent'], reverse=True)
    top_10 = leaderboard[:10]

    # Add rank
    for i, trader in enumerate(top_10, 1):
        trader['rank'] = i

    return jsonify({
        'success': True,
        'data': {
            'leaderboard': top_10,
            'updated_at': datetime.utcnow().isoformat()
        }
    })


@leaderboard_bp.route('/my-rank', methods=['GET'])
@jwt_required()
def get_my_rank():
    """Get current user's ranking"""
    user_id = int(get_jwt_identity())

    # Get user's active/passed challenge
    challenge = UserChallenge.query.filter(
        UserChallenge.user_id == user_id,
        UserChallenge.status.in_(['active', 'passed'])
    ).first()

    if not challenge:
        return jsonify({
            'success': True,
            'data': {
                'rank': None,
                'message': 'No active challenge found'
            }
        })

    # Calculate user's profit percentage
    initial = float(challenge.initial_balance)
    equity = float(challenge.equity)
    user_profit_pct = ((equity - initial) / initial) * 100

    # Count how many traders have higher profit
    higher_count = db.session.query(
        func.count(UserChallenge.id)
    ).filter(
        UserChallenge.status.in_(['active', 'passed']),
        ((UserChallenge.equity - UserChallenge.initial_balance) / UserChallenge.initial_balance) > (user_profit_pct / 100)
    ).scalar()

    rank = (higher_count or 0) + 1

    # Get total participants
    total = UserChallenge.query.filter(
        UserChallenge.status.in_(['active', 'passed'])
    ).count()

    return jsonify({
        'success': True,
        'data': {
            'rank': rank,
            'total_participants': total,
            'profit_percent': round(user_profit_pct, 2),
            'percentile': round((1 - rank / total) * 100, 1) if total > 0 else 0
        }
    })
