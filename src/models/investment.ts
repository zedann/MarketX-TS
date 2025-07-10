import { Pool } from "pg";
import pool from "../config/db";

// Investment-related interfaces
export interface RiskAssessment {
  id?: string;
  user_id: string;
  employment_status?: string;
  money_usage_preference?: string;
  risk_tolerance?: string;
  investment_goal?: string;
  financial_experience?: string;
  investment_timeline?: string;
  loss_tolerance?: string;
  income_source?: string;
  calculated_risk_score?: number;
  risk_category?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface InvestmentFund {
  id?: string;
  name: string;
  fund_type: 'gold' | 'fixed_income' | 'equity';
  symbol: string;
  description?: string;
  manager_name?: string;
  inception_date?: Date;
  minimum_investment?: number;
  current_nav: number;
  currency?: string;
  ytd_return?: number;
  one_year_return?: number;
  three_year_return?: number;
  five_year_return?: number;
  risk_rating?: string;
  volatility?: number;
  sharpe_ratio?: number;
  is_active?: boolean;
  is_shariah_compliant?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserPortfolio {
  id?: string;
  user_id: string;
  portfolio_name?: string;
  target_allocation: any; // JSONB
  current_allocation?: any; // JSONB
  total_invested?: number;
  current_value?: number;
  total_return?: number;
  return_percentage?: number;
  auto_rebalance?: boolean;
  rebalance_threshold?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserFundHolding {
  id?: string;
  user_id: string;
  portfolio_id: string;
  fund_id: string;
  units_held?: number;
  average_buy_price?: number;
  total_invested?: number;
  current_value?: number;
  unrealized_gain_loss?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface InvestmentTransaction {
  id?: string;
  user_id: string;
  portfolio_id: string;
  fund_id: string;
  transaction_type: 'buy' | 'sell' | 'dividend';
  amount: number;
  units: number;
  price_per_unit: number;
  transaction_date?: Date;
  settlement_date?: Date;
  transaction_fees?: number;
  status?: string;
  reference_number?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface InvestmentRecommendation {
  id?: string;
  user_id: string;
  recommended_allocation: any; // JSONB
  reasoning?: string;
  expected_return?: number;
  risk_score?: number;
  recommendation_type?: string;
  is_active?: boolean;
  expires_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Investment Model Interface
interface InvestmentModel {
  // Risk Assessment
  createRiskAssessment: (assessment: RiskAssessment) => Promise<RiskAssessment>;
  getUserRiskAssessment: (userId: string) => Promise<RiskAssessment | null>;
  updateRiskAssessment: (userId: string, assessment: Partial<RiskAssessment>) => Promise<RiskAssessment>;

  // Investment Funds
  getAllFunds: (filters?: any) => Promise<InvestmentFund[]>;
  getFundById: (fundId: string) => Promise<InvestmentFund | null>;
  getFundsByType: (fundType: string) => Promise<InvestmentFund[]>;
  updateFundPrices: (fundId: string, newNav: number) => Promise<InvestmentFund>;

  // User Portfolios
  createPortfolio: (portfolio: UserPortfolio) => Promise<UserPortfolio>;
  getUserPortfolios: (userId: string) => Promise<UserPortfolio[]>;
  getPortfolioById: (portfolioId: string) => Promise<UserPortfolio | null>;
  updatePortfolio: (portfolioId: string, updates: Partial<UserPortfolio>) => Promise<UserPortfolio>;
  deletePortfolio: (portfolioId: string) => Promise<void>;

  // Fund Holdings
  getUserHoldings: (userId: string, portfolioId?: string) => Promise<UserFundHolding[]>;
  getHoldingByFund: (userId: string, portfolioId: string, fundId: string) => Promise<UserFundHolding | null>;
  updateHolding: (holdingId: string, updates: Partial<UserFundHolding>) => Promise<UserFundHolding>;
  createOrUpdateHolding: (holding: UserFundHolding) => Promise<UserFundHolding>;

  // Transactions
  createTransaction: (transaction: InvestmentTransaction) => Promise<InvestmentTransaction>;
  getUserTransactions: (userId: string, limit?: number) => Promise<InvestmentTransaction[]>;
  getTransactionById: (transactionId: string) => Promise<InvestmentTransaction | null>;
  updateTransactionStatus: (transactionId: string, status: string) => Promise<InvestmentTransaction>;

  // Recommendations
  createRecommendation: (recommendation: InvestmentRecommendation) => Promise<InvestmentRecommendation>;
  getUserRecommendations: (userId: string) => Promise<InvestmentRecommendation[]>;
  updateRecommendation: (recommendationId: string, updates: Partial<InvestmentRecommendation>) => Promise<InvestmentRecommendation>;

  // Analytics
  getPortfolioPerformance: (userId: string, portfolioId: string, timeframe?: string) => Promise<any>;
  getUserInvestmentSummary: (userId: string) => Promise<any>;
  // Market Movers
  getTopMovers: (timeframe: string, type: 'gainers' | 'losers', limit?: number) => Promise<any[]>;
}

const investmentModel: InvestmentModel = {
  // Risk Assessment Methods
  createRiskAssessment: async (assessment: RiskAssessment) => {
    try {
      const result = await pool.query(
        `INSERT INTO risk_assessments (
          user_id, employment_status, money_usage_preference, risk_tolerance,
          investment_goal, financial_experience, investment_timeline, loss_tolerance,
          income_source, calculated_risk_score, risk_category
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          assessment.user_id,
          assessment.employment_status,
          assessment.money_usage_preference,
          assessment.risk_tolerance,
          assessment.investment_goal,
          assessment.financial_experience,
          assessment.investment_timeline,
          assessment.loss_tolerance,
          assessment.income_source,
          assessment.calculated_risk_score,
          assessment.risk_category
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating risk assessment:", error);
      throw error;
    }
  },

  getUserRiskAssessment: async (userId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM risk_assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting user risk assessment:", error);
      throw error;
    }
  },

  updateRiskAssessment: async (userId: string, assessment: Partial<RiskAssessment>) => {
    try {
      const updateFields = Object.keys(assessment)
        .filter(key => assessment[key as keyof RiskAssessment] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = Object.values(assessment).filter(value => value !== undefined);

      const result = await pool.query(
        `UPDATE risk_assessments SET ${updateFields}, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1 RETURNING *`,
        [userId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating risk assessment:", error);
      throw error;
    }
  },

  // Investment Funds Methods
  getAllFunds: async (filters?: any) => {
    try {
      let query = "SELECT * FROM investment_funds WHERE is_active = true";
      const params: any[] = [];

      if (filters?.fund_type) {
        query += " AND fund_type = $1";
        params.push(filters.fund_type);
      }

      query += " ORDER BY fund_type, name";

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error getting all funds:", error);
      throw error;
    }
  },

  getFundById: async (fundId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM investment_funds WHERE id = $1",
        [fundId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting fund by ID:", error);
      throw error;
    }
  },

  getFundsByType: async (fundType: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM investment_funds WHERE fund_type = $1 AND is_active = true ORDER BY name",
        [fundType]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting funds by type:", error);
      throw error;
    }
  },

  updateFundPrices: async (fundId: string, newNav: number) => {
    try {
      const result = await pool.query(
        `UPDATE investment_funds SET current_nav = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 RETURNING *`,
        [newNav, fundId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating fund prices:", error);
      throw error;
    }
  },

  // Portfolio Methods
  createPortfolio: async (portfolio: UserPortfolio) => {
    try {
      const result = await pool.query(
        `INSERT INTO user_portfolios (
          user_id, portfolio_name, target_allocation, current_allocation,
          total_invested, current_value, auto_rebalance, rebalance_threshold
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          portfolio.user_id,
          portfolio.portfolio_name || 'My Portfolio',
          JSON.stringify(portfolio.target_allocation),
          JSON.stringify(portfolio.current_allocation || {}),
          portfolio.total_invested || 0,
          portfolio.current_value || 0,
          portfolio.auto_rebalance || false,
          portfolio.rebalance_threshold || 5.0
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating portfolio:", error);
      throw error;
    }
  },

  getUserPortfolios: async (userId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM user_portfolios WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC",
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user portfolios:", error);
      throw error;
    }
  },

  getPortfolioById: async (portfolioId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM user_portfolios WHERE id = $1",
        [portfolioId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting portfolio by ID:", error);
      throw error;
    }
  },

  updatePortfolio: async (portfolioId: string, updates: Partial<UserPortfolio>) => {
    try {
      const updateFields = Object.keys(updates)
        .filter(key => updates[key as keyof UserPortfolio] !== undefined)
        .map((key, index) => {
          if (key === 'target_allocation' || key === 'current_allocation') {
            return `${key} = $${index + 2}`;
          }
          return `${key} = $${index + 2}`;
        })
        .join(', ');

      const values = Object.entries(updates)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (key === 'target_allocation' || key === 'current_allocation') {
            return JSON.stringify(value);
          }
          return value;
        });

      const result = await pool.query(
        `UPDATE user_portfolios SET ${updateFields}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        [portfolioId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating portfolio:", error);
      throw error;
    }
  },

  deletePortfolio: async (portfolioId: string) => {
    try {
      await pool.query(
        "UPDATE user_portfolios SET is_active = false WHERE id = $1",
        [portfolioId]
      );
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      throw error;
    }
  },

  // Holdings Methods
  getUserHoldings: async (userId: string, portfolioId?: string) => {
    try {
      let query = `
        SELECT h.*, f.name as fund_name, f.symbol, f.fund_type, f.current_nav
        FROM user_fund_holdings h
        JOIN investment_funds f ON h.fund_id = f.id
        WHERE h.user_id = $1
      `;
      const params = [userId];

      if (portfolioId) {
        query += " AND h.portfolio_id = $2";
        params.push(portfolioId);
      }

      query += " ORDER BY h.created_at DESC";

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error("Error getting user holdings:", error);
      throw error;
    }
  },

  getHoldingByFund: async (userId: string, portfolioId: string, fundId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM user_fund_holdings WHERE user_id = $1 AND portfolio_id = $2 AND fund_id = $3",
        [userId, portfolioId, fundId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting holding by fund:", error);
      throw error;
    }
  },

  updateHolding: async (holdingId: string, updates: Partial<UserFundHolding>) => {
    try {
      const updateFields = Object.keys(updates)
        .filter(key => updates[key as keyof UserFundHolding] !== undefined)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = Object.values(updates).filter(value => value !== undefined);

      const result = await pool.query(
        `UPDATE user_fund_holdings SET ${updateFields}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        [holdingId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating holding:", error);
      throw error;
    }
  },

  createOrUpdateHolding: async (holding: UserFundHolding) => {
    try {
      const existingHolding = await investmentModel.getHoldingByFund(
        holding.user_id,
        holding.portfolio_id,
        holding.fund_id
      );

      if (existingHolding) {
        return await investmentModel.updateHolding(existingHolding.id!, holding);
      } else {
        const result = await pool.query(
          `INSERT INTO user_fund_holdings (
            user_id, portfolio_id, fund_id, units_held, average_buy_price,
            total_invested, current_value, unrealized_gain_loss
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [
            holding.user_id,
            holding.portfolio_id,
            holding.fund_id,
            holding.units_held || 0,
            holding.average_buy_price || 0,
            holding.total_invested || 0,
            holding.current_value || 0,
            holding.unrealized_gain_loss || 0
          ]
        );
        return result.rows[0];
      }
    } catch (error) {
      console.error("Error creating/updating holding:", error);
      throw error;
    }
  },

  // Transaction Methods
  createTransaction: async (transaction: InvestmentTransaction) => {
    try {
      const refNumber = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      const result = await pool.query(
        `INSERT INTO investment_transactions (
          user_id, portfolio_id, fund_id, transaction_type, amount, units,
          price_per_unit, transaction_fees, reference_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          transaction.user_id,
          transaction.portfolio_id,
          transaction.fund_id,
          transaction.transaction_type,
          transaction.amount,
          transaction.units,
          transaction.price_per_unit,
          transaction.transaction_fees || 0,
          refNumber
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  },

  getUserTransactions: async (userId: string, limit: number = 50) => {
    try {
      const result = await pool.query(
        `SELECT t.*, f.name as fund_name, f.symbol, f.fund_type
         FROM investment_transactions t
         JOIN investment_funds f ON t.fund_id = f.id
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user transactions:", error);
      throw error;
    }
  },

  getTransactionById: async (transactionId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM investment_transactions WHERE id = $1",
        [transactionId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error getting transaction by ID:", error);
      throw error;
    }
  },

  updateTransactionStatus: async (transactionId: string, status: string) => {
    try {
      const result = await pool.query(
        `UPDATE investment_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 RETURNING *`,
        [status, transactionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  },

  // Recommendation Methods
  createRecommendation: async (recommendation: InvestmentRecommendation) => {
    try {
      const result = await pool.query(
        `INSERT INTO investment_recommendations (
          user_id, recommended_allocation, reasoning, expected_return,
          risk_score, recommendation_type, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          recommendation.user_id,
          JSON.stringify(recommendation.recommended_allocation),
          recommendation.reasoning,
          recommendation.expected_return,
          recommendation.risk_score,
          recommendation.recommendation_type || 'portfolio_allocation',
          recommendation.expires_at
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating recommendation:", error);
      throw error;
    }
  },

  getUserRecommendations: async (userId: string) => {
    try {
      const result = await pool.query(
        "SELECT * FROM investment_recommendations WHERE user_id = $1 AND is_active = true ORDER BY created_at DESC",
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error("Error getting user recommendations:", error);
      throw error;
    }
  },

  updateRecommendation: async (recommendationId: string, updates: Partial<InvestmentRecommendation>) => {
    try {
      const updateFields = Object.keys(updates)
        .filter(key => updates[key as keyof InvestmentRecommendation] !== undefined)
        .map((key, index) => {
          if (key === 'recommended_allocation') {
            return `${key} = $${index + 2}`;
          }
          return `${key} = $${index + 2}`;
        })
        .join(', ');

      const values = Object.entries(updates)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          if (key === 'recommended_allocation') {
            return JSON.stringify(value);
          }
          return value;
        });

      const result = await pool.query(
        `UPDATE investment_recommendations SET ${updateFields}, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 RETURNING *`,
        [recommendationId, ...values]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error updating recommendation:", error);
      throw error;
    }
  },

  // Analytics Methods
  getPortfolioPerformance: async (userId: string, portfolioId: string, timeframe: string = '1Y') => {
    try {
      // This would implement complex portfolio performance calculations
      // For now, returning basic structure
      const portfolio = await investmentModel.getPortfolioById(portfolioId);
      const holdings = await investmentModel.getUserHoldings(userId, portfolioId);
      
      return {
        portfolio,
        holdings,
        performance: {
          totalReturn: portfolio?.total_return || 0,
          returnPercentage: portfolio?.return_percentage || 0,
          totalInvested: portfolio?.total_invested || 0,
          currentValue: portfolio?.current_value || 0
        }
      };
    } catch (error) {
      console.error("Error getting portfolio performance:", error);
      throw error;
    }
  },

  getUserInvestmentSummary: async (userId: string) => {
    try {
      const portfolios = await investmentModel.getUserPortfolios(userId);
      const allHoldings = await investmentModel.getUserHoldings(userId);
      const recentTransactions = await investmentModel.getUserTransactions(userId, 10);

      const totalInvested = portfolios.reduce((sum, p) => sum + (p.total_invested || 0), 0);
      const totalValue = portfolios.reduce((sum, p) => sum + (p.current_value || 0), 0);
      const totalReturn = totalValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

      return {
        portfolios,
        holdings: allHoldings,
        recentTransactions,
        summary: {
          totalInvested,
          totalValue,
          totalReturn,
          returnPercentage,
          portfolioCount: portfolios.length
        }
      };
    } catch (error) {
      console.error("Error getting user investment summary:", error);
      throw error;
    }
  },

  // Market Movers
  getTopMovers: async (
    timeframe: string = 'day',
    type: 'gainers' | 'losers' = 'gainers',
    limit: number = 3
  ) => {
    try {
      const intervalMap: any = {
        day: '1 day',
        week: '7 days',
        month: '30 days',
        '6m': '182 days',
        year: '365 days',
        '5y': '1825 days'
      };

      const interval = intervalMap[timeframe] || '1 day';
      const order = type === 'losers' ? 'ASC' : 'DESC';

      const result = await pool.query(
        `
        WITH price_diff AS (
          SELECT 
            f.id,
            f.name,
            f.symbol,
            f.fund_type,
            l.nav_price AS latest_nav,
            e.nav_price AS earlier_nav,
            ROUND(((l.nav_price - e.nav_price) / NULLIF(e.nav_price,0)) * 100, 2) AS return_percentage
          FROM investment_funds f
          JOIN LATERAL (
            SELECT nav_price FROM fund_price_history
            WHERE fund_id = f.id
            ORDER BY price_date DESC
            LIMIT 1
          ) l ON TRUE
          JOIN LATERAL (
            SELECT nav_price FROM fund_price_history
            WHERE fund_id = f.id
              AND price_date <= (CURRENT_DATE - INTERVAL '${interval}')
            ORDER BY price_date DESC
            LIMIT 1
          ) e ON TRUE
          WHERE f.is_active = true
        )
        SELECT * FROM price_diff
        ORDER BY return_percentage ${order}
        LIMIT $1
        `,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting top movers:', error);
      throw error;
    }
  }
};

export default investmentModel; 