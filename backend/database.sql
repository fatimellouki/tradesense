-- TradeSense MVP Database Schema
-- PostgreSQL Schema for Production

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    language VARCHAR(5) DEFAULT 'fr' CHECK (language IN ('fr', 'ar', 'en')),
    dark_mode BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Challenges Table
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('starter', 'pro', 'elite')),
    initial_balance DECIMAL(12, 2) NOT NULL,
    current_balance DECIMAL(12, 2) NOT NULL,
    equity DECIMAL(12, 2) NOT NULL,
    daily_pnl DECIMAL(12, 2) DEFAULT 0,
    total_pnl DECIMAL(12, 2) DEFAULT 0,
    daily_high_equity DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades Table
CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES user_challenges(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(20) NOT NULL CHECK (market IN ('us', 'morocco', 'crypto')),
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(18, 8) NOT NULL,
    entry_price DECIMAL(18, 8) NOT NULL,
    exit_price DECIMAL(18, 8),
    profit DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- Positions Table
CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES user_challenges(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('long', 'short')),
    quantity DECIMAL(18, 8) NOT NULL,
    entry_price DECIMAL(18, 8) NOT NULL,
    current_price DECIMAL(18, 8),
    unrealized_pnl DECIMAL(12, 2),
    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Market Data Cache Table
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    market VARCHAR(20) NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    open_price DECIMAL(18, 8),
    high_price DECIMAL(18, 8),
    low_price DECIMAL(18, 8),
    change_percent DECIMAL(8, 4),
    volume DECIMAL(20, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Signals Table
CREATE TABLE IF NOT EXISTS ai_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    market VARCHAR(20) NOT NULL,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
    confidence DECIMAL(5, 2),
    reasoning TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    category VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_challenge_id ON trades(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenges_user_id ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON user_challenges(status);
CREATE INDEX IF NOT EXISTS idx_market_data_symbol ON market_data(symbol);
CREATE INDEX IF NOT EXISTS idx_positions_challenge ON positions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ai_signals_symbol ON ai_signals(symbol);

-- Leaderboard View
CREATE OR REPLACE VIEW leaderboard AS
SELECT
    u.id,
    u.username,
    uc.plan_type,
    uc.initial_balance,
    uc.equity as current_equity,
    ((uc.equity - uc.initial_balance) / uc.initial_balance * 100) as profit_percent,
    COUNT(t.id) as total_trades,
    COALESCE(SUM(CASE WHEN t.profit > 0 THEN 1 ELSE 0 END)::float / NULLIF(COUNT(t.id), 0) * 100, 0) as win_rate
FROM users u
JOIN user_challenges uc ON u.id = uc.user_id
LEFT JOIN trades t ON uc.id = t.challenge_id
WHERE uc.status IN ('active', 'passed')
GROUP BY u.id, u.username, uc.id, uc.plan_type, uc.initial_balance, uc.equity
ORDER BY profit_percent DESC;

-- Insert default superadmin (password: admin123)
-- Hash generated with werkzeug.security.generate_password_hash
INSERT INTO users (email, username, password_hash, role)
VALUES (
    'admin@tradesense.ma',
    'superadmin',
    'scrypt:32768:8:1$salt$hash', -- Replace with actual hash in production
    'superadmin'
) ON CONFLICT (email) DO NOTHING;
