"""
Challenge Routes - Core Prop Firm Logic
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import UserChallenge, User, db
from datetime import datetime

challenges_bp = Blueprint('challenges', __name__)


@challenges_bp.route('/plans', methods=['GET'])
def get_plans():
    """Get available challenge plans"""
    plans = [
        {
            'id': 'starter',
            'name': 'Starter',
            'balance': 5000,
            'price': 200,
            'currency': 'DH',
            'features': [
                'Solde initial de 5 000 $',
                'Perte max journalière: 5%',
                'Perte max totale: 10%',
                'Objectif de profit: 10%',
                'Support par email'
            ]
        },
        {
            'id': 'pro',
            'name': 'Pro',
            'balance': 10000,
            'price': 500,
            'currency': 'DH',
            'features': [
                'Solde initial de 10 000 $',
                'Perte max journalière: 5%',
                'Perte max totale: 10%',
                'Objectif de profit: 10%',
                'Support prioritaire',
                'Signaux IA premium'
            ],
            'popular': True
        },
        {
            'id': 'elite',
            'name': 'Elite',
            'balance': 25000,
            'price': 1000,
            'currency': 'DH',
            'features': [
                'Solde initial de 25 000 $',
                'Perte max journalière: 5%',
                'Perte max totale: 10%',
                'Objectif de profit: 10%',
                'Support VIP 24/7',
                'Signaux IA premium',
                'Accès MasterClass complet'
            ]
        }
    ]

    return jsonify({
        'success': True,
        'data': {'plans': plans}
    })


@challenges_bp.route('/my-challenges', methods=['GET'])
@jwt_required()
def get_my_challenges():
    """Get user's challenges"""
    user_id = int(get_jwt_identity())

    challenges = UserChallenge.query.filter_by(user_id=user_id).order_by(
        UserChallenge.created_at.desc()
    ).all()

    return jsonify({
        'success': True,
        'data': {
            'challenges': [c.to_dict() for c in challenges]
        }
    })


@challenges_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_challenge():
    """Get user's active challenge"""
    user_id = int(get_jwt_identity())

    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if not challenge:
        return jsonify({
            'success': False,
            'error': 'No active challenge found'
        }), 404

    return jsonify({
        'success': True,
        'data': {'challenge': challenge.to_dict()}
    })


@challenges_bp.route('/<int:challenge_id>', methods=['GET'])
@jwt_required()
def get_challenge(challenge_id):
    """Get specific challenge details"""
    user_id = int(get_jwt_identity())

    challenge = UserChallenge.query.filter_by(
        id=challenge_id,
        user_id=user_id
    ).first()

    if not challenge:
        return jsonify({
            'success': False,
            'error': 'Challenge not found'
        }), 404

    return jsonify({
        'success': True,
        'data': {'challenge': challenge.to_dict()}
    })


@challenges_bp.route('/create', methods=['POST'])
@jwt_required()
def create_challenge():
    """Create a new challenge (after payment)"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    plan_type = data.get('plan_type')
    payment_method = data.get('payment_method')
    payment_reference = data.get('payment_reference')

    if plan_type not in UserChallenge.PLAN_CONFIG:
        return jsonify({
            'success': False,
            'error': 'Invalid plan type'
        }), 400

    # Check for existing active challenge
    existing = UserChallenge.query.filter_by(
        user_id=user_id,
        status='active'
    ).first()

    if existing:
        return jsonify({
            'success': False,
            'error': 'You already have an active challenge'
        }), 400

    # Create challenge
    config = UserChallenge.PLAN_CONFIG[plan_type]
    initial_balance = config['initial_balance']

    challenge = UserChallenge(
        user_id=user_id,
        plan_type=plan_type,
        initial_balance=initial_balance,
        current_balance=initial_balance,
        equity=initial_balance,
        daily_high_equity=initial_balance,
        payment_method=payment_method,
        payment_reference=payment_reference,
        status='active'
    )

    db.session.add(challenge)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Challenge created successfully',
        'data': {'challenge': challenge.to_dict()}
    }), 201


@challenges_bp.route('/<int:challenge_id>/status', methods=['GET'])
@jwt_required()
def get_challenge_status(challenge_id):
    """Get detailed challenge status with rules evaluation"""
    user_id = int(get_jwt_identity())

    challenge = UserChallenge.query.filter_by(
        id=challenge_id,
        user_id=user_id
    ).first()

    if not challenge:
        return jsonify({
            'success': False,
            'error': 'Challenge not found'
        }), 404

    config = UserChallenge.PLAN_CONFIG[challenge.plan_type]
    initial = float(challenge.initial_balance)
    equity = float(challenge.equity)
    daily_pnl = float(challenge.daily_pnl or 0)

    # Calculate metrics
    total_pnl_pct = (equity - initial) / initial * 100
    daily_pnl_pct = daily_pnl / initial * 100

    status_data = {
        'challenge': challenge.to_dict(),
        'rules': {
            'daily_loss': {
                'current': round(daily_pnl_pct, 2),
                'limit': -config['daily_max_loss'] * 100,
                'breached': daily_pnl_pct <= -config['daily_max_loss'] * 100
            },
            'total_loss': {
                'current': round(total_pnl_pct, 2),
                'limit': -config['total_max_loss'] * 100,
                'breached': total_pnl_pct <= -config['total_max_loss'] * 100
            },
            'profit_target': {
                'current': round(total_pnl_pct, 2),
                'target': config['profit_target'] * 100,
                'achieved': total_pnl_pct >= config['profit_target'] * 100
            }
        }
    }

    return jsonify({
        'success': True,
        'data': status_data
    })
