-- Rollback Investment System Migration

-- Drop indexes
DROP INDEX IF EXISTS idx_fund_price_history_fund_date;
DROP INDEX IF EXISTS idx_investment_recommendations_active;
DROP INDEX IF EXISTS idx_investment_recommendations_user_id;
DROP INDEX IF EXISTS idx_investment_transactions_status;
DROP INDEX IF EXISTS idx_investment_transactions_date;
DROP INDEX IF EXISTS idx_investment_transactions_user_id;
DROP INDEX IF EXISTS idx_user_fund_holdings_portfolio_id;
DROP INDEX IF EXISTS idx_user_fund_holdings_user_id;
DROP INDEX IF EXISTS idx_user_portfolios_active;
DROP INDEX IF EXISTS idx_user_portfolios_user_id;
DROP INDEX IF EXISTS idx_investment_funds_active;
DROP INDEX IF EXISTS idx_investment_funds_type;
DROP INDEX IF EXISTS idx_risk_assessments_user_id;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS fund_price_history;
DROP TABLE IF EXISTS investment_recommendations;
DROP TABLE IF EXISTS investment_transactions;
DROP TABLE IF EXISTS user_fund_holdings;
DROP TABLE IF EXISTS user_portfolios;
DROP TABLE IF EXISTS investment_funds;
DROP TABLE IF EXISTS risk_assessments; 