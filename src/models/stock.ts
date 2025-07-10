import pool from "../config/db";

export interface Stock {
  id?: string;
  name: string;
  symbol: string;
  sector?: string;
  description?: string;
  current_price: number;
  previous_close?: number;
  open_price?: number;
  day_high?: number;
  day_low?: number;
  volume?: number;
  market_cap?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface StockPrice {
  price_date: Date;
  open_price: number;
  close_price: number;
  high_price: number;
  low_price: number;
  volume?: number;
}

interface StockModel {
  getStocks: (filters?: any) => Promise<Stock[]>;
  getStockById: (id: string) => Promise<Stock | null>;
  getStockBySymbol: (symbol: string) => Promise<Stock | null>;
  getPriceHistory: (stockId: string, limit: number) => Promise<StockPrice[]>;
  getTopMovers: (timeframe: string, type: 'gainers' | 'losers', limit?: number) => Promise<any[]>;
}

const stockModel: StockModel = {
  getStocks: async (filters?: any) => {
    let query = "SELECT * FROM stocks WHERE is_active = true";
    const params: any[] = [];

    if (filters?.sector) {
      params.push(filters.sector);
      query += ` AND sector = $${params.length}`;
    }
    query += " ORDER BY name";
    const result = await pool.query(query, params);
    return result.rows;
  },

  getStockById: async (id: string) => {
    const result = await pool.query("SELECT * FROM stocks WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  getStockBySymbol: async (symbol: string) => {
    const result = await pool.query("SELECT * FROM stocks WHERE symbol = $1", [symbol]);
    return result.rows[0] || null;
  },

  getPriceHistory: async (stockId: string, limit: number = 30) => {
    const result = await pool.query(
      "SELECT * FROM stock_price_history WHERE stock_id = $1 ORDER BY price_date DESC LIMIT $2",
      [stockId, limit]
    );
    return result.rows.reverse();
  },

  getTopMovers: async (timeframe: string = 'day', type: 'gainers' | 'losers' = 'gainers', limit: number = 3) => {
    const intervalMap: any = {
      day: '1 day',
      week: '7 days',
      month: '30 days',
      year: '365 days'
    };
    const interval = intervalMap[timeframe] || '1 day';
    const order = type === 'losers' ? 'ASC' : 'DESC';

    const result = await pool.query(
      `WITH price_diff AS (
        SELECT s.id, s.name, s.symbol, s.sector,
               l.close_price AS latest_price,
               e.close_price AS earlier_price,
               ROUND(((l.close_price - e.close_price)/NULLIF(e.close_price,0))*100,2) AS return_percentage
        FROM stocks s
        JOIN LATERAL (
          SELECT close_price FROM stock_price_history
          WHERE stock_id = s.id
          ORDER BY price_date DESC LIMIT 1
        ) l ON TRUE
        JOIN LATERAL (
          SELECT close_price FROM stock_price_history
          WHERE stock_id = s.id AND price_date <= (CURRENT_DATE - INTERVAL '${interval}')
          ORDER BY price_date DESC LIMIT 1
        ) e ON TRUE
        WHERE s.is_active = true
      )
      SELECT * FROM price_diff ORDER BY return_percentage ${order} LIMIT $1`,
      [limit]
    );
    return result.rows;
  }
};

export default stockModel; 