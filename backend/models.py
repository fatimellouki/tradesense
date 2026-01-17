"""
TradeSense Database Models
"""

from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    """User model for authentication and profile"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # user, admin, superadmin
    language = db.Column(db.String(5), default='fr')  # fr, ar, en
    dark_mode = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    challenges = db.relationship('UserChallenge', backref='user', lazy='dynamic')
    trades = db.relationship('Trade', backref='user', lazy='dynamic')
    positions = db.relationship('Position', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'role': self.role,
            'language': self.language,
            'dark_mode': self.dark_mode,
            'created_at': self.created_at.isoformat()
        }


class UserChallenge(db.Model):
    """Trading challenge model - core of prop firm logic"""
    __tablename__ = 'user_challenges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    plan_type = db.Column(db.String(20), nullable=False)  # starter, pro, elite
    initial_balance = db.Column(db.Numeric(12, 2), nullable=False)
    current_balance = db.Column(db.Numeric(12, 2), nullable=False)
    equity = db.Column(db.Numeric(12, 2), nullable=False)
    daily_pnl = db.Column(db.Numeric(12, 2), default=0)
    total_pnl = db.Column(db.Numeric(12, 2), default=0)
    daily_high_equity = db.Column(db.Numeric(12, 2))  # For daily drawdown calculation
    status = db.Column(db.String(20), default='active', index=True)  # active, passed, failed
    payment_method = db.Column(db.String(50))
    payment_reference = db.Column(db.String(255))
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    trades = db.relationship('Trade', backref='challenge', lazy='dynamic')
    positions = db.relationship('Position', backref='challenge', lazy='dynamic')

    # Challenge rules (stored as constants, configurable per plan)
    PLAN_CONFIG = {
        'starter': {
            'initial_balance': 5000,
            'daily_max_loss': 0.05,
            'total_max_loss': 0.10,
            'profit_target': 0.10,
            'price_dh': 200
        },
        'pro': {
            'initial_balance': 10000,
            'daily_max_loss': 0.05,
            'total_max_loss': 0.10,
            'profit_target': 0.10,
            'price_dh': 500
        },
        'elite': {
            'initial_balance': 25000,
            'daily_max_loss': 0.05,
            'total_max_loss': 0.10,
            'profit_target': 0.10,
            'price_dh': 1000
        }
    }

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'plan_type': self.plan_type,
            'initial_balance': float(self.initial_balance),
            'current_balance': float(self.current_balance),
            'equity': float(self.equity),
            'daily_pnl': float(self.daily_pnl or 0),
            'total_pnl': float(self.total_pnl or 0),
            'status': self.status,
            'profit_percent': round((float(self.equity) - float(self.initial_balance)) / float(self.initial_balance) * 100, 2),
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None
        }


class Trade(db.Model):
    """Individual trade records"""
    __tablename__ = 'trades'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False)
    market = db.Column(db.String(20), nullable=False)  # us, morocco, crypto
    side = db.Column(db.String(10), nullable=False)  # buy, sell
    quantity = db.Column(db.Numeric(18, 8), nullable=False)
    entry_price = db.Column(db.Numeric(18, 8), nullable=False)
    exit_price = db.Column(db.Numeric(18, 8))
    profit = db.Column(db.Numeric(12, 2))
    status = db.Column(db.String(20), default='open')  # open, closed
    executed_at = db.Column(db.DateTime, default=datetime.utcnow)
    closed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'market': self.market,
            'side': self.side,
            'quantity': float(self.quantity),
            'entry_price': float(self.entry_price),
            'exit_price': float(self.exit_price) if self.exit_price else None,
            'profit': float(self.profit) if self.profit else None,
            'status': self.status,
            'executed_at': self.executed_at.isoformat()
        }


class Position(db.Model):
    """Open positions"""
    __tablename__ = 'positions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey('user_challenges.id'), nullable=False, index=True)
    symbol = db.Column(db.String(20), nullable=False)
    market = db.Column(db.String(20), nullable=False)
    side = db.Column(db.String(10), nullable=False)  # long, short
    quantity = db.Column(db.Numeric(18, 8), nullable=False)
    entry_price = db.Column(db.Numeric(18, 8), nullable=False)
    current_price = db.Column(db.Numeric(18, 8))
    unrealized_pnl = db.Column(db.Numeric(12, 2))
    opened_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'market': self.market,
            'side': self.side,
            'quantity': float(self.quantity),
            'entry_price': float(self.entry_price),
            'current_price': float(self.current_price) if self.current_price else None,
            'unrealized_pnl': float(self.unrealized_pnl) if self.unrealized_pnl else None,
            'opened_at': self.opened_at.isoformat()
        }


class MarketData(db.Model):
    """Cached market data"""
    __tablename__ = 'market_data'

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), unique=True, nullable=False, index=True)
    market = db.Column(db.String(20), nullable=False)
    price = db.Column(db.Numeric(18, 8), nullable=False)
    open_price = db.Column(db.Numeric(18, 8))
    high_price = db.Column(db.Numeric(18, 8))
    low_price = db.Column(db.Numeric(18, 8))
    change_percent = db.Column(db.Numeric(8, 4))
    volume = db.Column(db.Numeric(20, 2))
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'symbol': self.symbol,
            'market': self.market,
            'price': float(self.price),
            'open': float(self.open_price) if self.open_price else None,
            'high': float(self.high_price) if self.high_price else None,
            'low': float(self.low_price) if self.low_price else None,
            'change_percent': float(self.change_percent) if self.change_percent else None,
            'volume': float(self.volume) if self.volume else None,
            'last_updated': self.last_updated.isoformat()
        }


class AISignal(db.Model):
    """AI-generated trading signals"""
    __tablename__ = 'ai_signals'

    id = db.Column(db.Integer, primary_key=True)
    symbol = db.Column(db.String(20), nullable=False, index=True)
    market = db.Column(db.String(20), nullable=False)
    signal_type = db.Column(db.String(10), nullable=False)  # buy, sell, hold
    confidence = db.Column(db.Numeric(5, 2))
    reasoning = db.Column(db.Text)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'symbol': self.symbol,
            'market': self.market,
            'signal': self.signal_type,
            'confidence': float(self.confidence) if self.confidence else None,
            'reasoning': self.reasoning,
            'generated_at': self.generated_at.isoformat()
        }


class AdminSetting(db.Model):
    """Admin configuration settings (PayPal, etc.)"""
    __tablename__ = 'admin_settings'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    category = db.Column(db.String(50))
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
