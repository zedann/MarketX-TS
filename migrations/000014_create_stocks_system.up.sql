-- Stocks core tables

CREATE TABLE IF NOT EXISTS stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  sector VARCHAR(100),
  description TEXT,

  current_price DECIMAL(12,4) NOT NULL,
  previous_close DECIMAL(12,4),
  open_price DECIMAL(12,4),
  day_high DECIMAL(12,4),
  day_low DECIMAL(12,4),
  volume BIGINT,
  market_cap BIGINT,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_id UUID NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  price_date DATE NOT NULL,
  open_price DECIMAL(12,4) NOT NULL,
  close_price DECIMAL(12,4) NOT NULL,
  high_price DECIMAL(12,4) NOT NULL,
  low_price DECIMAL(12,4) NOT NULL,
  volume BIGINT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stock_id, price_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stocks_symbol ON stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_date ON stock_price_history(stock_id, price_date);

-- Sample data matching screenshots (prices illustrative)
INSERT INTO stocks (name, symbol, sector, description, current_price, previous_close, open_price, day_high, day_low, volume, market_cap)
VALUES
 ('أبو قير للأسمدة والصناعات الكيماوية', 'ABUK', 'الأسمدة والكيماويات', 'شركة مصرية للأسمدة', 48.60, 43.50, 44.20, 49.00, 42.90, 5562000, 15000000000),
 ('مصرف أبو ظبي الإسلامي - مصر', 'ADIB', 'البنوك', 'بنك إسلامي مصري', 21.74, 20.10, 20.20, 22.00, 19.80, 12560000, 10000000000),
 ('الإسكندرية للزيوت المعدنية', 'AMOC', 'الطاقة', 'شركة تكرير النفط', 17.59, 16.60, 16.80, 18.00, 16.30, 7600000, 8000000000); 