import express from "express";
import { Request, Response, NextFunction } from "express";
import { protect } from "../middleware/authMiddleware";
import { securityLogger } from "../middleware/securityMiddleware";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../utils/appError";
import { APIResponse } from "../types";
import { HTTP_CODES } from "../types";
import investmentModel from "../models/investment";
import { 
  RiskAssessmentService, 
  PortfolioService, 
  RecommendationService, 
  InvestmentService 
} from "../services/investmentService";
import CacheService from "../services/cacheService";

const router = express.Router();

// All investment routes require authentication
router.use(protect);

// =================
// RISK ASSESSMENT ROUTES
// =================

// Submit risk assessment questionnaire
router.post("/risk-assessment",
  securityLogger("RISK_ASSESSMENT_SUBMISSION"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const answers = req.body;

    // Validate required fields
    const requiredFields = ['employment_status', 'risk_tolerance', 'investment_timeline', 'financial_experience', 'loss_tolerance'];
    for (const field of requiredFields) {
      if (!answers[field]) {
        return next(new AppError(`${field} is required`, HTTP_CODES.BAD_REQUEST));
      }
    }

    const assessment = await RiskAssessmentService.processRiskAssessment(user.id, answers);

    res.status(HTTP_CODES.CREATED).json(
      new APIResponse("success", "Risk assessment completed successfully", {
        assessment,
        riskProfile: {
          category: assessment.risk_category,
          score: assessment.calculated_risk_score,
          recommendation: "Portfolio recommendations have been generated based on your risk profile"
        }
      })
    );
  })
);

// Get user's risk assessment
router.get("/risk-assessment",
  securityLogger("RISK_ASSESSMENT_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    const assessment = await investmentModel.getUserRiskAssessment(user.id);
    
    if (!assessment) {
      return next(new AppError("Risk assessment not found. Please complete the questionnaire first", HTTP_CODES.NOT_FOUND));
    }

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Risk assessment retrieved successfully", {
        assessment,
        riskProfile: {
          category: assessment.risk_category,
          score: assessment.calculated_risk_score
        }
      })
    );
  })
);

// =================
// INVESTMENT FUNDS ROUTES
// =================

// Get all available investment funds
router.get("/funds",
  securityLogger("FUNDS_LIST_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { fund_type } = req.query;

    const cacheKey = fund_type ? `funds:${fund_type}` : "funds:all";
    const cached = await CacheService.get<any>(cacheKey);
    if (cached) {
      return res.status(HTTP_CODES.OK).json(
        new APIResponse("success", "Investment funds retrieved successfully (cached)", cached)
      );
    }

    const filters = fund_type ? { fund_type } : undefined;
    const funds = await investmentModel.getAllFunds(filters);

    // Group funds by type for easier consumption
    const fundsByType = {
      gold: funds.filter(f => f.fund_type === 'gold'),
      fixed_income: funds.filter(f => f.fund_type === 'fixed_income'),
      equity: funds.filter(f => f.fund_type === 'equity')
    };

    const responseData = {
      funds,
      fundsByType,
      totalFunds: funds.length
    };

    await CacheService.set(cacheKey, responseData, 300); // cache 5 minutes

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Investment funds retrieved successfully", responseData)
    );
  })
);

// Get specific fund details
router.get("/funds/:fundId",
  securityLogger("FUND_DETAILS_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { fundId } = req.params;
    
    const fund = await investmentModel.getFundById(fundId);
    
    if (!fund) {
      return next(new AppError("Fund not found", HTTP_CODES.NOT_FOUND));
    }

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Fund details retrieved successfully", { fund })
    );
  })
);

// =================
// MARKET MOVERS ROUTE
// =================

// Get top gainers or losers within a timeframe
router.get(
  "/top-movers",
  securityLogger("TOP_MOVERS_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { timeframe = 'day', type = 'gainers', limit = '3' } = req.query as any;

    const numericLimit = parseInt(limit as string, 10) || 3;

    const movers = await InvestmentService.getTopMovers(
      timeframe as string,
      (type as string) === 'losers' ? 'losers' : 'gainers',
      numericLimit
    );

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Top movers retrieved successfully", {
        timeframe,
        type,
        count: movers.length,
        movers
      })
    );
  })
);

// =================
// PORTFOLIO ROUTES
// =================

// Create a new portfolio
router.post("/portfolios",
  securityLogger("PORTFOLIO_CREATION"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { customAllocation } = req.body;

    const portfolio = await PortfolioService.createUserPortfolio(user.id, customAllocation);

    res.status(HTTP_CODES.CREATED).json(
      new APIResponse("success", "Portfolio created successfully", { portfolio })
    );
  })
);

// Get user's portfolios
router.get("/portfolios",
  securityLogger("PORTFOLIOS_LIST_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    const portfolios = await investmentModel.getUserPortfolios(user.id);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Portfolios retrieved successfully", { 
        portfolios,
        totalPortfolios: portfolios.length
      })
    );
  })
);

// Get specific portfolio with details
router.get("/portfolios/:portfolioId",
  securityLogger("PORTFOLIO_DETAILS_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { portfolioId } = req.params;
    
    const portfolio = await investmentModel.getPortfolioById(portfolioId);
    
    if (!portfolio) {
      return next(new AppError("Portfolio not found", HTTP_CODES.NOT_FOUND));
    }

    if (portfolio.user_id !== user.id) {
      return next(new AppError("Access denied", HTTP_CODES.FORBIDDEN));
    }

    const holdings = await investmentModel.getUserHoldings(user.id, portfolioId);
    const currentAllocation = await PortfolioService.calculateCurrentAllocation(portfolioId);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Portfolio details retrieved successfully", {
        portfolio,
        holdings,
        currentAllocation,
        targetAllocation: portfolio.target_allocation
      })
    );
  })
);

// Update portfolio allocation
router.patch("/portfolios/:portfolioId/allocation",
  securityLogger("PORTFOLIO_ALLOCATION_UPDATE"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { portfolioId } = req.params;
    const { allocation } = req.body;

    const portfolio = await investmentModel.getPortfolioById(portfolioId);
    
    if (!portfolio) {
      return next(new AppError("Portfolio not found", HTTP_CODES.NOT_FOUND));
    }

    if (portfolio.user_id !== user.id) {
      return next(new AppError("Access denied", HTTP_CODES.FORBIDDEN));
    }

    const updatedPortfolio = await PortfolioService.updatePortfolioAllocation(portfolioId, allocation);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Portfolio allocation updated successfully", { 
        portfolio: updatedPortfolio 
      })
    );
  })
);

// =================
// INVESTMENT ROUTES
// =================

// Make an investment
router.post("/invest",
  securityLogger("INVESTMENT_TRANSACTION"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { portfolioId, fundId, amount } = req.body;

    // Validate required fields
    if (!portfolioId || !fundId || !amount) {
      return next(new AppError("Portfolio ID, Fund ID, and amount are required", HTTP_CODES.BAD_REQUEST));
    }

    if (amount <= 0) {
      return next(new AppError("Investment amount must be greater than 0", HTTP_CODES.BAD_REQUEST));
    }

    const result = await InvestmentService.processInvestment(
      user.id,
      portfolioId,
      fundId,
      parseFloat(amount),
      'buy'
    );

    res.status(HTTP_CODES.CREATED).json(
      new APIResponse("success", "Investment processed successfully", {
        transaction: result.transaction,
        fund: result.fund,
        units: result.units,
        fees: result.fees,
        message: `Successfully invested ${amount} AED in ${result.fund.name}`
      })
    );
  })
);

// Get user's investment transactions
router.get("/transactions",
  securityLogger("TRANSACTIONS_LIST_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { limit = 50 } = req.query;
    
    const transactions = await investmentModel.getUserTransactions(user.id, parseInt(limit as string));

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Transactions retrieved successfully", { 
        transactions,
        totalTransactions: transactions.length
      })
    );
  })
);

// Get user's fund holdings
router.get("/holdings",
  securityLogger("HOLDINGS_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { portfolioId } = req.query;
    
    const holdings = await investmentModel.getUserHoldings(user.id, portfolioId as string);

    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, holding) => sum + (holding.current_value || 0), 0);
    const totalInvested = holdings.reduce((sum, holding) => sum + (holding.total_invested || 0), 0);
    const totalReturn = totalValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Holdings retrieved successfully", {
        holdings,
        summary: {
          totalHoldings: holdings.length,
          totalValue,
          totalInvested,
          totalReturn,
          returnPercentage
        }
      })
    );
  })
);

// =================
// RECOMMENDATIONS ROUTES
// =================

// Get investment recommendations
router.get("/recommendations",
  securityLogger("RECOMMENDATIONS_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    const recommendations = await investmentModel.getUserRecommendations(user.id);
    
    if (recommendations.length === 0) {
      // Generate new recommendations if none exist
      try {
        const newRecommendation = await RecommendationService.generateRecommendations(user.id);
        recommendations.push(newRecommendation);
      } catch (error) {
        return next(new AppError("Please complete risk assessment to get recommendations", HTTP_CODES.BAD_REQUEST));
      }
    }

    const fundRecommendations = await RecommendationService.getFundRecommendations(user.id);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Investment recommendations retrieved successfully", {
        recommendations,
        fundRecommendations,
        message: "Recommendations are updated based on your risk profile and market conditions"
      })
    );
  })
);

// Generate new recommendations
router.post("/recommendations/generate",
  securityLogger("RECOMMENDATIONS_GENERATION"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    const recommendation = await RecommendationService.generateRecommendations(user.id);

    res.status(HTTP_CODES.CREATED).json(
      new APIResponse("success", "New recommendations generated successfully", { 
        recommendation 
      })
    );
  })
);

// =================
// ANALYTICS ROUTES
// =================

// Get portfolio performance data for charts
router.get("/portfolios/:portfolioId/performance",
  securityLogger("PORTFOLIO_PERFORMANCE_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { portfolioId } = req.params;
    const { timeframe = '1Y' } = req.query;

    const portfolio = await investmentModel.getPortfolioById(portfolioId);
    
    if (!portfolio) {
      return next(new AppError("Portfolio not found", HTTP_CODES.NOT_FOUND));
    }

    if (portfolio.user_id !== user.id) {
      return next(new AppError("Access denied", HTTP_CODES.FORBIDDEN));
    }

    const performanceData = await InvestmentService.getPortfolioPerformanceData(
      user.id, 
      portfolioId, 
      timeframe as string
    );

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Portfolio performance data retrieved successfully", {
        performance: performanceData,
        timeframe,
        portfolio: {
          name: portfolio.portfolio_name,
          created: portfolio.created_at
        }
      })
    );
  })
);

// Get user investment summary
router.get("/summary",
  securityLogger("INVESTMENT_SUMMARY_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    const summary = await investmentModel.getUserInvestmentSummary(user.id);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Investment summary retrieved successfully", {
        summary,
        lastUpdated: new Date().toISOString()
      })
    );
  })
);

// =================
// FUND INFORMATION ROUTES (Matching mobile app screens)
// =================

// Get fund allocation breakdown (for the percentage screens shown in mobile)
router.get("/allocation-breakdown",
  securityLogger("ALLOCATION_BREAKDOWN_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    
    // Get user's risk assessment for recommended allocation
    const riskAssessment = await investmentModel.getUserRiskAssessment(user.id);
    const portfolios = await investmentModel.getUserPortfolios(user.id);

    // Default allocation from the mobile screens: Gold 70%, Fixed Income 20%, Equity 10%
    const defaultAllocation = { gold: 70, fixed_income: 20, equity: 10 };
    const recommendedAllocation = riskAssessment 
      ? RiskAssessmentService.getRecommendedAllocation(riskAssessment.risk_category!)
      : defaultAllocation;

    // Get current allocation if user has portfolios
    let currentAllocation = { gold: 0, fixed_income: 0, equity: 0 };
    if (portfolios.length > 0) {
      currentAllocation = await PortfolioService.calculateCurrentAllocation(portfolios[0].id!);
    }

    // Get fund performance data for each category
    const funds = await investmentModel.getAllFunds();
    const fundsByType = {
      gold: funds.filter(f => f.fund_type === 'gold'),
      fixed_income: funds.filter(f => f.fund_type === 'fixed_income'),
      equity: funds.filter(f => f.fund_type === 'equity')
    };

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Fund allocation breakdown retrieved successfully", {
        recommendedAllocation,
        currentAllocation,
        allocationComparison: {
          gold: {
            recommended: recommendedAllocation.gold,
            current: currentAllocation.gold,
            funds: fundsByType.gold,
            description: "صناديق الذهب"
          },
          fixed_income: {
            recommended: recommendedAllocation.fixed_income,
            current: currentAllocation.fixed_income,
            funds: fundsByType.fixed_income,
            description: "صناديق الدخل الثابت"
          },
          equity: {
            recommended: recommendedAllocation.equity,
            current: currentAllocation.equity,
            funds: fundsByType.equity,
            description: "صناديق الأسهم"
          }
        },
        riskProfile: riskAssessment?.risk_category || 'conservative',
        totalFunds: funds.length
      })
    );
  })
);

export default router; 