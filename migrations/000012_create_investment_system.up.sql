-- Investment System Migration
-- Create investment-related tables for MarketX platform

-- Risk Assessment Questionnaire Results
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Employment and Financial Situation Questions
    employment_status VARCHAR(50), -- From job status screen
    money_usage_preference VARCHAR(100), -- Question about money usage
    risk_tolerance VARCHAR(50), -- Conservative, Moderate, Aggressive
    investment_goal VARCHAR(100), -- Long-term growth, income, etc.
    financial_experience VARCHAR(50), -- Beginner, Intermediate, Expert
    
    -- Investment Preferences (from questionnaire screens)
    investment_timeline VARCHAR(50), -- Short-term, Medium-term, Long-term
    loss_tolerance VARCHAR(50), -- Low, Medium, High
    income_source VARCHAR(100), -- Primary income sources
    
    -- Calculated Risk Profile
    calculated_risk_score INTEGER DEFAULT 0, -- 0-100 scale
    risk_category VARCHAR(20) DEFAULT 'conservative', -- conservative, moderate, aggressive
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investment Funds (Gold, Fixed Income, Equity)
CREATE TABLE IF NOT EXISTS investment_funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    fund_type VARCHAR(50) NOT NULL, -- 'gold', 'fixed_income', 'equity'
    symbol VARCHAR(10) UNIQUE NOT NULL,
    
    -- Fund Details
    description TEXT,
    manager_name VARCHAR(255),
    inception_date DATE,
    minimum_investment DECIMAL(15,2) DEFAULT 500.00,
    
    -- Current Pricing
    current_nav DECIMAL(15,4) NOT NULL, -- Net Asset Value
    currency VARCHAR(3) DEFAULT 'AED',
    
    -- Performance Metrics
    ytd_return DECIMAL(8,4) DEFAULT 0.0000, -- Year-to-date return %
    one_year_return DECIMAL(8,4) DEFAULT 0.0000,
    three_year_return DECIMAL(8,4) DEFAULT 0.0000,
    five_year_return DECIMAL(8,4) DEFAULT 0.0000,
    
    -- Risk Metrics
    risk_rating VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    volatility DECIMAL(8,4) DEFAULT 0.0000,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0.0000,
    
    -- Fund Status
    is_active BOOLEAN DEFAULT true,
    is_shariah_compliant BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Investment Portfolios
CREATE TABLE IF NOT EXISTS user_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Portfolio Configuration
    portfolio_name VARCHAR(255) DEFAULT 'My Portfolio',
    target_allocation JSONB NOT NULL, -- {"gold": 70, "fixed_income": 20, "equity": 10}
    current_allocation JSONB, -- Actual current allocation
    
    -- Portfolio Metrics
    total_invested DECIMAL(15,2) DEFAULT 0.00,
    current_value DECIMAL(15,2) DEFAULT 0.00,
    total_return DECIMAL(15,2) DEFAULT 0.00,
    return_percentage DECIMAL(8,4) DEFAULT 0.0000,
    
    -- Portfolio Settings
    auto_rebalance BOOLEAN DEFAULT false,
    rebalance_threshold DECIMAL(5,2) DEFAULT 5.00, -- % deviation to trigger rebalance
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Fund Holdings
CREATE TABLE IF NOT EXISTS user_fund_holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES investment_funds(id) ON DELETE CASCADE,
    
    -- Holding Details
    units_held DECIMAL(15,6) DEFAULT 0.000000,
    average_buy_price DECIMAL(15,4) DEFAULT 0.0000,
    total_invested DECIMAL(15,2) DEFAULT 0.00,
    current_value DECIMAL(15,2) DEFAULT 0.00,
    unrealized_gain_loss DECIMAL(15,2) DEFAULT 0.00,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, portfolio_id, fund_id)
);

-- Investment Transactions
CREATE TABLE IF NOT EXISTS investment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    fund_id UUID NOT NULL REFERENCES investment_funds(id) ON DELETE CASCADE,
    
    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL, -- 'buy', 'sell', 'dividend'
    amount DECIMAL(15,2) NOT NULL,
    units DECIMAL(15,6) NOT NULL,
    price_per_unit DECIMAL(15,4) NOT NULL,
    
    -- Transaction Metadata
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settlement_date TIMESTAMP WITH TIME ZONE,
    transaction_fees DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    reference_number VARCHAR(50) UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Investment Recommendations
CREATE TABLE IF NOT EXISTS investment_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Recommendation Details
    recommended_allocation JSONB NOT NULL, -- Based on risk assessment
    reasoning TEXT,
    expected_return DECIMAL(8,4),
    risk_score INTEGER,
    
    -- Recommendation Metadata
    recommendation_type VARCHAR(50) DEFAULT 'portfolio_allocation',
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fund Price History (for performance charts)
CREATE TABLE IF NOT EXISTS fund_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fund_id UUID NOT NULL REFERENCES investment_funds(id) ON DELETE CASCADE,
    
    -- Price Data
    price_date DATE NOT NULL,
    nav_price DECIMAL(15,4) NOT NULL,
    volume BIGINT DEFAULT 0,
    
    -- Performance Metrics
    daily_return DECIMAL(8,4) DEFAULT 0.0000,
    cumulative_return DECIMAL(8,4) DEFAULT 0.0000,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(fund_id, price_date)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_risk_assessments_user_id ON risk_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_funds_type ON investment_funds(fund_type);
CREATE INDEX IF NOT EXISTS idx_investment_funds_active ON investment_funds(is_active);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portfolios_active ON user_portfolios(is_active);
CREATE INDEX IF NOT EXISTS idx_user_fund_holdings_user_id ON user_fund_holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fund_holdings_portfolio_id ON user_fund_holdings(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_user_id ON investment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_status ON investment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_investment_recommendations_user_id ON investment_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_recommendations_active ON investment_recommendations(is_active);
CREATE INDEX IF NOT EXISTS idx_fund_price_history_fund_date ON fund_price_history(fund_id, price_date);

-- Insert Sample Investment Funds (matching the mobile app screens)
INSERT INTO investment_funds (name, fund_type, symbol, description, current_nav, ytd_return, one_year_return, risk_rating, is_active) VALUES
-- Gold Funds (70% allocation as shown in screen)
('Emirates Gold Fund', 'gold', 'EGF', 'Shariah-compliant gold investment fund', 125.50, 8.75, 12.30, 'medium', true),
('ADCB Gold Fund', 'gold', 'ADCBGF', 'Diversified gold and precious metals fund', 98.20, 6.80, 10.50, 'medium', true),

-- Fixed Income Funds (20% allocation as shown in screen)
('UAE Bond Fund', 'fixed_income', 'UAEBF', 'Government and corporate bonds fund', 102.75, 4.20, 5.80, 'low', true),
('Emirates Islamic Sukuk Fund', 'fixed_income', 'EISF', 'Shariah-compliant sukuk and bonds', 105.30, 5.10, 6.40, 'low', true),

-- Equity Funds (10% allocation as shown in screen)
('MSCI UAE Equity Fund', 'equity', 'MUEF', 'UAE stock market index fund', 87.65, -2.30, 15.70, 'high', true),
('GCC Equity Growth Fund', 'equity', 'GEGF', 'Regional equity growth opportunities', 110.40, 3.50, 18.20, 'high', true); 