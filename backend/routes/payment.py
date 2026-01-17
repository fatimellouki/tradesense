"""
Payment Routes - Mock Gateway & PayPal Integration
"""

import os
import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import UserChallenge, AdminSetting, db
import requests

payment_bp = Blueprint('payment', __name__)


@payment_bp.route('/create-order', methods=['POST'])
@jwt_required()
def create_order():
    """Create a payment order"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    plan_type = data.get('plan_type')
    payment_method = data.get('payment_method', 'mock')

    if plan_type not in UserChallenge.PLAN_CONFIG:
        return jsonify({
            'success': False,
            'error': 'Invalid plan type'
        }), 400

    config = UserChallenge.PLAN_CONFIG[plan_type]
    amount = config['price_dh']

    if payment_method == 'paypal':
        # Create PayPal order
        order = create_paypal_order(amount, plan_type)
        if order:
            return jsonify({
                'success': True,
                'data': {
                    'order_id': order['id'],
                    'payment_method': 'paypal',
                    'approval_url': next(
                        (link['href'] for link in order['links'] if link['rel'] == 'approve'),
                        None
                    )
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create PayPal order'
            }), 500

    else:
        # Mock payment (CMI, Crypto simulation)
        order_id = f"MOCK-{user_id}-{int(time.time())}"

        return jsonify({
            'success': True,
            'data': {
                'order_id': order_id,
                'payment_method': payment_method,
                'amount': amount,
                'currency': 'DH',
                'status': 'pending'
            }
        })


@payment_bp.route('/capture-order', methods=['POST'])
@jwt_required()
def capture_order():
    """Capture/complete a payment order"""
    user_id = int(get_jwt_identity())
    data = request.get_json()

    order_id = data.get('order_id')
    payment_method = data.get('payment_method', 'mock')
    plan_type = data.get('plan_type')

    if not order_id or not plan_type:
        return jsonify({
            'success': False,
            'error': 'Order ID and plan type required'
        }), 400

    if payment_method == 'paypal':
        # Capture PayPal payment
        capture = capture_paypal_order(order_id)
        if not capture or capture.get('status') != 'COMPLETED':
            return jsonify({
                'success': False,
                'error': 'PayPal payment capture failed'
            }), 400
        payment_reference = capture.get('id')
    else:
        # Mock payment - simulate success after delay
        time.sleep(2)  # Simulate processing
        payment_reference = order_id

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
        'message': 'Payment successful! Challenge activated.',
        'data': {
            'challenge': challenge.to_dict(),
            'payment_reference': payment_reference
        }
    })


@payment_bp.route('/verify/<reference>', methods=['GET'])
@jwt_required()
def verify_payment(reference):
    """Verify a payment"""
    user_id = int(get_jwt_identity())

    challenge = UserChallenge.query.filter_by(
        user_id=user_id,
        payment_reference=reference
    ).first()

    if challenge:
        return jsonify({
            'success': True,
            'data': {
                'verified': True,
                'challenge': challenge.to_dict()
            }
        })

    return jsonify({
        'success': False,
        'data': {'verified': False}
    })


# PayPal Helper Functions

def get_paypal_credentials():
    """Get PayPal credentials from admin settings or env"""
    client_id = os.environ.get('PAYPAL_CLIENT_ID')
    client_secret = os.environ.get('PAYPAL_CLIENT_SECRET')

    # Try to get from admin settings (SuperAdmin configured)
    setting_id = AdminSetting.query.filter_by(key='paypal_client_id').first()
    setting_secret = AdminSetting.query.filter_by(key='paypal_client_secret').first()

    if setting_id and setting_id.value:
        client_id = setting_id.value
    if setting_secret and setting_secret.value:
        client_secret = setting_secret.value

    return client_id, client_secret


def get_paypal_access_token():
    """Get PayPal OAuth access token"""
    client_id, client_secret = get_paypal_credentials()

    if not client_id or not client_secret:
        return None

    base_url = os.environ.get('PAYPAL_API_URL', 'https://api-m.sandbox.paypal.com')

    response = requests.post(
        f"{base_url}/v1/oauth2/token",
        auth=(client_id, client_secret),
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        data={'grant_type': 'client_credentials'}
    )

    if response.status_code == 200:
        return response.json().get('access_token')

    return None


def create_paypal_order(amount, plan_type):
    """Create PayPal order"""
    access_token = get_paypal_access_token()
    if not access_token:
        return None

    base_url = os.environ.get('PAYPAL_API_URL', 'https://api-m.sandbox.paypal.com')
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    # Convert DH to USD (approximate)
    usd_amount = round(amount / 10, 2)

    response = requests.post(
        f"{base_url}/v2/checkout/orders",
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        },
        json={
            'intent': 'CAPTURE',
            'purchase_units': [{
                'amount': {
                    'currency_code': 'USD',
                    'value': str(usd_amount)
                },
                'description': f'TradeSense {plan_type.capitalize()} Challenge'
            }],
            'application_context': {
                'return_url': f'{frontend_url}/payment/callback',
                'cancel_url': f'{frontend_url}/pricing',
                'brand_name': 'TradeSense AI',
                'landing_page': 'LOGIN',
                'user_action': 'PAY_NOW'
            }
        }
    )

    if response.status_code == 201:
        return response.json()

    return None


def capture_paypal_order(order_id):
    """Capture PayPal order"""
    access_token = get_paypal_access_token()
    if not access_token:
        return None

    base_url = os.environ.get('PAYPAL_API_URL', 'https://api-m.sandbox.paypal.com')

    response = requests.post(
        f"{base_url}/v2/checkout/orders/{order_id}/capture",
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
    )

    if response.status_code == 201:
        return response.json()

    return None
