"""
Admin & SuperAdmin Routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, UserChallenge, Trade, AdminSetting, db
from functools import wraps

admin_bp = Blueprint('admin', __name__)


def admin_required(f):
    """Decorator to require admin or superadmin role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user or user.role not in ['admin', 'superadmin']:
            return jsonify({
                'success': False,
                'error': 'Admin access required'
            }), 403

        return f(*args, **kwargs)

    return decorated_function


def superadmin_required(f):
    """Decorator to require superadmin role"""
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)

        if not user or user.role != 'superadmin':
            return jsonify({
                'success': False,
                'error': 'SuperAdmin access required'
            }), 403

        return f(*args, **kwargs)

    return decorated_function


# ==================== Admin Routes ====================

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users (admin)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    users = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': {
            'users': [u.to_dict() for u in users.items],
            'total': users.total,
            'pages': users.pages,
            'current_page': page
        }
    })


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required
def get_user_details(user_id):
    """Get specific user details"""
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            'success': False,
            'error': 'User not found'
        }), 404

    challenges = UserChallenge.query.filter_by(user_id=user_id).all()
    trades = Trade.query.filter_by(user_id=user_id).count()

    return jsonify({
        'success': True,
        'data': {
            'user': user.to_dict(),
            'challenges': [c.to_dict() for c in challenges],
            'total_trades': trades
        }
    })


@admin_bp.route('/challenges', methods=['GET'])
@admin_required
def get_all_challenges():
    """Get all challenges (admin)"""
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = UserChallenge.query
    if status:
        query = query.filter_by(status=status)

    challenges = query.order_by(UserChallenge.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'success': True,
        'data': {
            'challenges': [c.to_dict() for c in challenges.items],
            'total': challenges.total,
            'pages': challenges.pages,
            'current_page': page
        }
    })


@admin_bp.route('/challenges/<int:challenge_id>/status', methods=['PATCH'])
@admin_required
def update_challenge_status(challenge_id):
    """Manually update challenge status (admin)"""
    data = request.get_json()
    new_status = data.get('status')

    if new_status not in ['active', 'passed', 'failed']:
        return jsonify({
            'success': False,
            'error': 'Invalid status'
        }), 400

    challenge = UserChallenge.query.get(challenge_id)
    if not challenge:
        return jsonify({
            'success': False,
            'error': 'Challenge not found'
        }), 404

    challenge.status = new_status
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'Challenge status updated to {new_status}',
        'data': {'challenge': challenge.to_dict()}
    })


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    """Get admin dashboard statistics"""
    total_users = User.query.count()
    active_challenges = UserChallenge.query.filter_by(status='active').count()
    passed_challenges = UserChallenge.query.filter_by(status='passed').count()
    failed_challenges = UserChallenge.query.filter_by(status='failed').count()
    total_trades = Trade.query.count()

    return jsonify({
        'success': True,
        'data': {
            'total_users': total_users,
            'active_challenges': active_challenges,
            'passed_challenges': passed_challenges,
            'failed_challenges': failed_challenges,
            'total_trades': total_trades,
            'pass_rate': round(passed_challenges / (passed_challenges + failed_challenges) * 100, 1) if (passed_challenges + failed_challenges) > 0 else 0
        }
    })


# ==================== SuperAdmin Routes ====================

@admin_bp.route('/superadmin/settings', methods=['GET'])
@superadmin_required
def get_settings():
    """Get all admin settings (superadmin)"""
    settings = AdminSetting.query.all()

    # Mask sensitive values
    settings_dict = {}
    for s in settings:
        value = s.value
        if 'secret' in s.key.lower() or 'password' in s.key.lower():
            value = '********' if value else None
        settings_dict[s.key] = {
            'value': value,
            'category': s.category,
            'updated_at': s.updated_at.isoformat() if s.updated_at else None
        }

    return jsonify({
        'success': True,
        'data': {'settings': settings_dict}
    })


@admin_bp.route('/superadmin/settings/paypal', methods=['PUT'])
@superadmin_required
def update_paypal_settings():
    """Update PayPal credentials (superadmin)"""
    data = request.get_json()

    client_id = data.get('client_id')
    client_secret = data.get('client_secret')

    if not client_id or not client_secret:
        return jsonify({
            'success': False,
            'error': 'Client ID and Secret are required'
        }), 400

    # Update or create settings
    for key, value in [('paypal_client_id', client_id), ('paypal_client_secret', client_secret)]:
        setting = AdminSetting.query.filter_by(key=key).first()
        if setting:
            setting.value = value
        else:
            setting = AdminSetting(key=key, value=value, category='payment')
            db.session.add(setting)

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'PayPal credentials updated successfully'
    })


@admin_bp.route('/superadmin/users/<int:user_id>/role', methods=['PATCH'])
@superadmin_required
def update_user_role(user_id):
    """Update user role (superadmin)"""
    user_id_current = get_jwt_identity()
    data = request.get_json()
    new_role = data.get('role')

    if new_role not in ['user', 'admin', 'superadmin']:
        return jsonify({
            'success': False,
            'error': 'Invalid role'
        }), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({
            'success': False,
            'error': 'User not found'
        }), 404

    # Prevent self-demotion
    if user_id == user_id_current and new_role != 'superadmin':
        return jsonify({
            'success': False,
            'error': 'Cannot demote yourself'
        }), 400

    user.role = new_role
    db.session.commit()

    return jsonify({
        'success': True,
        'message': f'User role updated to {new_role}',
        'data': {'user': user.to_dict()}
    })
