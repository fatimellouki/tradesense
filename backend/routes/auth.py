"""
Authentication Routes
"""

import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from models import User, db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()

    # Validation
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not email or not username or not password:
        return jsonify({'success': False, 'error': 'Email, username and password are required'}), 400

    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

    # Check existing user
    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'error': 'Email already registered'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'error': 'Username already taken'}), 400

    # Create user
    user = User(email=email, username=username)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Generate tokens (identity must be string for Flask-JWT-Extended)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'message': 'User registered successfully',
        'data': {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'error': 'Email and password are required'}), 400

    # Find user
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'success': False, 'error': 'Invalid email or password'}), 401

    # Generate tokens (identity must be string for Flask-JWT-Extended)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'success': True,
        'message': 'Login successful',
        'data': {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    return jsonify({
        'success': True,
        'data': {'user': user.to_dict()}
    })


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    """Refresh access token"""
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))

    return jsonify({
        'success': True,
        'data': {'access_token': access_token}
    })


@auth_bp.route('/update-preferences', methods=['PATCH'])
@jwt_required()
def update_preferences():
    """Update user preferences (language, dark mode)"""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    data = request.get_json()

    if 'language' in data and data['language'] in ['fr', 'ar', 'en']:
        user.language = data['language']

    if 'dark_mode' in data:
        user.dark_mode = bool(data['dark_mode'])

    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Preferences updated',
        'data': {'user': user.to_dict()}
    })


@auth_bp.route('/setup-superadmin', methods=['POST'])
def setup_superadmin():
    """
    One-time superadmin setup endpoint.
    Requires a secret key for security.
    Can either create a new superadmin or promote an existing user.
    """
    data = request.get_json()

    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400

    # Verify setup secret key
    setup_key = data.get('setup_key', '')
    expected_key = os.environ.get('SETUP_SECRET_KEY', 'TradeSense2026SuperAdmin!')

    if setup_key != expected_key:
        return jsonify({'success': False, 'error': 'Invalid setup key'}), 403

    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'success': False, 'error': 'Email is required'}), 400

    # Check if user exists
    user = User.query.filter_by(email=email).first()

    if user:
        # Promote existing user to superadmin
        user.role = 'superadmin'
        db.session.commit()

        return jsonify({
            'success': True,
            'message': f'User {user.username} promoted to superadmin',
            'data': {'user': user.to_dict()}
        })
    else:
        # Create new superadmin
        username = data.get('username', '').strip()
        password = data.get('password', '')

        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required for new user'}), 400

        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'error': 'Username already taken'}), 400

        user = User(email=email, username=username, role='superadmin')
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Generate tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify({
            'success': True,
            'message': 'Superadmin created successfully',
            'data': {
                'user': user.to_dict(),
                'access_token': access_token,
                'refresh_token': refresh_token
            }
        }), 201
