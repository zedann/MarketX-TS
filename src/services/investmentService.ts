import investmentModel, { 
  RiskAssessment, 
  InvestmentFund, 
  UserPortfolio, 
  InvestmentRecommendation 
} from "../models/investment";
import AppError from "../utils/appError";

// Risk Assessment Service
export class RiskAssessmentService {
  // Calculate risk score based on questionnaire responses
  static calculateRiskScore(answers: any): { score: number; category: string } {
    let score = 0;

    // Employment status scoring (0-20 points)
    const employmentScores = {
      'unemployed': 5,
      'student': 10,
      'employed': 15,
      'self_employed': 20
    };
    score += employmentScores[answers.employment_status as keyof typeof employmentScores] || 10;

    // Risk tolerance scoring (0-25 points)
    const riskToleranceScores = {
      'very_conservative': 5,
      'conservative': 10,
      'moderate': 15,
      'aggressive': 20,
      'very_aggressive': 25
    };
    score += riskToleranceScores[answers.risk_tolerance as keyof typeof riskToleranceScores] || 10;

    // Investment timeline scoring (0-20 points)
    const timelineScores = {
      'short_term': 5,      // < 2 years
      'medium_term': 15,    // 2-5 years
      'long_term': 20       // > 5 years
    };
    score += timelineScores[answers.investment_timeline as keyof typeof timelineScores] || 10;

    // Financial experience scoring (0-15 points)
    const experienceScores = {
      'beginner': 5,
      'intermediate': 10,
      'expert': 15
    };
    score += experienceScores[answers.financial_experience as keyof typeof experienceScores] || 5;

    // Loss tolerance scoring (0-20 points)
    const lossToleranceScores = {
      'cannot_accept': 5,
      'small_losses': 10,
      'moderate_losses': 15,
      'significant_losses': 20
    };
    score += lossToleranceScores[answers.loss_tolerance as keyof typeof lossToleranceScores] || 10;

    // Determine risk category based on total score
    let category = 'conservative';
    if (score >= 70) {
      category = 'aggressive';
    } else if (score >= 50) {
      category = 'moderate';
    }

    return { score: Math.min(100, score), category };
  }

  // Process risk assessment questionnaire
  static async processRiskAssessment(userId: string, answers: any): Promise<RiskAssessment> {
    try {
      const { score, category } = this.calculateRiskScore(answers);

      const assessment: RiskAssessment = {
        user_id: userId,
        employment_status: answers.employment_status,
        money_usage_preference: answers.money_usage_preference,
        risk_tolerance: answers.risk_tolerance,
        investment_goal: answers.investment_goal,
        financial_experience: answers.financial_experience,
        investment_timeline: answers.investment_timeline,
        loss_tolerance: answers.loss_tolerance,
        income_source: answers.income_source,
        calculated_risk_score: score,
        risk_category: category
      };

      // Check if user already has an assessment
      const existingAssessment = await investmentModel.getUserRiskAssessment(userId);
      
      if (existingAssessment) {
        return await investmentModel.updateRiskAssessment(userId, assessment);
      } else {
        return await investmentModel.createRiskAssessment(assessment);
      }
    } catch (error) {
      console.error("Error processing risk assessment:", error);
      throw new AppError("Failed to process risk assessment", 500);
    }
  }

  // Get recommended allocation based on risk profile
  static getRecommendedAllocation(riskCategory: string): any {
    const allocations = {
      'conservative': {
        gold: 50,
        fixed_income: 40,
        equity: 10
      },
      'moderate': {
        gold: 40,
        fixed_income: 30,
        equity: 30
      },
      'aggressive': {
        gold: 30,
        fixed_income: 20,
        equity: 50
      }
    };

    return allocations[riskCategory as keyof typeof allocations] || allocations.conservative;
  }
}

// Portfolio Management Service
export class PortfolioService {
  // Create a new portfolio for user based on risk assessment
  static async createUserPortfolio(userId: string, customAllocation?: any): Promise<UserPortfolio> {
    try {
      // Get user's risk assessment
      const riskAssessment = await investmentModel.getUserRiskAssessment(userId);
      
      let targetAllocation;
      if (customAllocation) {
        targetAllocation = customAllocation;
      } else if (riskAssessment) {
        targetAllocation = RiskAssessmentService.getRecommendedAllocation(riskAssessment.risk_category!);
      } else {
        // Default conservative allocation
        targetAllocation = { gold: 70, fixed_income: 20, equity: 10 };
      }

      const portfolio: UserPortfolio = {
        user_id: userId,
        portfolio_name: 'My Investment Portfolio',
        target_allocation: targetAllocation,
        current_allocation: { gold: 0, fixed_income: 0, equity: 0 },
        total_invested: 0,
        current_value: 0,
        total_return: 0,
        return_percentage: 0,
        auto_rebalance: false,
        rebalance_threshold: 5.0
      };

      return await investmentModel.createPortfolio(portfolio);
    } catch (error) {
      console.error("Error creating user portfolio:", error);
      throw new AppError("Failed to create portfolio", 500);
    }
  }

  // Update portfolio allocation
  static async updatePortfolioAllocation(portfolioId: string, newAllocation: any): Promise<UserPortfolio> {
    try {
      // Validate allocation percentages sum to 100
      const totalPercentage = Object.values(newAllocation).reduce((sum: any, val: any) => sum + val, 0);
      if (Math.abs(totalPercentage - 100) > 0.1) {
        throw new AppError("Portfolio allocation must sum to 100%", 400);
      }

      return await investmentModel.updatePortfolio(portfolioId, {
        target_allocation: newAllocation
      });
    } catch (error) {
      console.error("Error updating portfolio allocation:", error);
      throw error;
    }
  }

  // Calculate current portfolio allocation based on holdings
  static async calculateCurrentAllocation(portfolioId: string): Promise<any> {
    try {
      const portfolio = await investmentModel.getPortfolioById(portfolioId);
      if (!portfolio) {
        throw new AppError("Portfolio not found", 404);
      }

      const holdings = await investmentModel.getUserHoldings(portfolio.user_id, portfolioId);
      
      let totalValue = 0;
      const allocationValues = { gold: 0, fixed_income: 0, equity: 0 };

      // Calculate total value and allocations by fund type
      for (const holding of holdings) {
        const currentValue = holding.current_value || 0;
        totalValue += currentValue;
        
        // @ts-ignore - holding has fund_type from the JOIN query
        const fundType = holding.fund_type;
        if (allocationValues.hasOwnProperty(fundType)) {
          allocationValues[fundType as keyof typeof allocationValues] += currentValue;
        }
      }

      // Convert to percentages
      const currentAllocation = { gold: 0, fixed_income: 0, equity: 0 };
      if (totalValue > 0) {
        currentAllocation.gold = (allocationValues.gold / totalValue) * 100;
        currentAllocation.fixed_income = (allocationValues.fixed_income / totalValue) * 100;
        currentAllocation.equity = (allocationValues.equity / totalValue) * 100;
      }

      // Update portfolio with current allocation
      await investmentModel.updatePortfolio(portfolioId, {
        current_allocation: currentAllocation,
        current_value: totalValue
      });

      return currentAllocation;
    } catch (error) {
      console.error("Error calculating current allocation:", error);
      throw error;
    }
  }
}

// Investment Recommendation Service
export class RecommendationService {
  // Generate investment recommendations based on user profile
  static async generateRecommendations(userId: string): Promise<InvestmentRecommendation> {
    try {
      const riskAssessment = await investmentModel.getUserRiskAssessment(userId);
      
      if (!riskAssessment) {
        throw new AppError("Please complete risk assessment first", 400);
      }

      const recommendedAllocation = RiskAssessmentService.getRecommendedAllocation(riskAssessment.risk_category!);
      
      // Calculate expected return based on risk profile
      const expectedReturnRanges = {
        'conservative': 5.5,  // 4-7% expected return
        'moderate': 8.0,      // 6-10% expected return
        'aggressive': 12.0    // 9-15% expected return
      };

      const expectedReturn = expectedReturnRanges[riskAssessment.risk_category! as keyof typeof expectedReturnRanges];

      // Generate reasoning based on risk profile
      const reasoning = this.generateRecommendationReasoning(riskAssessment);

      const recommendation: InvestmentRecommendation = {
        user_id: userId,
        recommended_allocation: recommendedAllocation,
        reasoning,
        expected_return: expectedReturn,
        risk_score: riskAssessment.calculated_risk_score,
        recommendation_type: 'portfolio_allocation',
        is_active: true,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      };

      // Deactivate old recommendations
      const oldRecommendations = await investmentModel.getUserRecommendations(userId);
      for (const oldRec of oldRecommendations) {
        await investmentModel.updateRecommendation(oldRec.id!, { is_active: false });
      }

      return await investmentModel.createRecommendation(recommendation);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  }

  // Generate personalized recommendation reasoning
  private static generateRecommendationReasoning(assessment: RiskAssessment): string {
    const reasons = [];
    
    // Based on risk category
    if (assessment.risk_category === 'conservative') {
      reasons.push("Based on your conservative risk profile, we recommend a defensive allocation focused on capital preservation.");
    } else if (assessment.risk_category === 'moderate') {
      reasons.push("Your moderate risk tolerance allows for a balanced approach between growth and stability.");
    } else {
      reasons.push("Your aggressive risk profile supports a growth-oriented strategy with higher return potential.");
    }

    // Based on investment timeline
    if (assessment.investment_timeline === 'long_term') {
      reasons.push("Your long-term investment horizon allows for riding out market volatility.");
    } else if (assessment.investment_timeline === 'short_term') {
      reasons.push("Given your short-term timeline, we prioritize liquidity and capital preservation.");
    }

    // Based on experience
    if (assessment.financial_experience === 'beginner') {
      reasons.push("As a beginner investor, this allocation provides diversification while minimizing complexity.");
    } else if (assessment.financial_experience === 'expert') {
      reasons.push("Your investment experience allows for a more sophisticated allocation strategy.");
    }

    return reasons.join(' ');
  }

  // Get specific fund recommendations within each category
  static async getFundRecommendations(userId: string): Promise<any> {
    try {
      const riskAssessment = await investmentModel.getUserRiskAssessment(userId);
      const allFunds = await investmentModel.getAllFunds();

      const recommendations = {
        gold: [] as InvestmentFund[],
        fixed_income: [] as InvestmentFund[],
        equity: [] as InvestmentFund[]
      };

      // Filter and rank funds based on risk profile
      const goldFunds = allFunds.filter(f => f.fund_type === 'gold').slice(0, 3);
      const fixedIncomeFunds = allFunds.filter(f => f.fund_type === 'fixed_income').slice(0, 3);
      const equityFunds = allFunds.filter(f => f.fund_type === 'equity').slice(0, 3);

      recommendations.gold = goldFunds;
      recommendations.fixed_income = fixedIncomeFunds;
      recommendations.equity = equityFunds;

      return {
        riskProfile: riskAssessment?.risk_category || 'conservative',
        recommendedFunds: recommendations,
        allocation: RiskAssessmentService.getRecommendedAllocation(riskAssessment?.risk_category || 'conservative')
      };
    } catch (error) {
      console.error("Error getting fund recommendations:", error);
      throw error;
    }
  }
}

// Investment Transaction Service
export class InvestmentService {
  // Process investment transaction
  static async processInvestment(
    userId: string,
    portfolioId: string,
    fundId: string,
    amount: number,
    transactionType: 'buy' | 'sell' = 'buy'
  ) {
    try {
      // Get fund information
      const fund = await investmentModel.getFundById(fundId);
      if (!fund) {
        throw new AppError("Fund not found", 404);
      }

      // Validate minimum investment
      if (transactionType === 'buy' && amount < (fund.minimum_investment || 500)) {
        throw new AppError(`Minimum investment amount is ${fund.minimum_investment || 500} AED`, 400);
      }

      // Calculate units based on current NAV
      const units = amount / fund.current_nav;
      const fees = this.calculateTransactionFees(amount);

      // Create transaction record
      const transaction = await investmentModel.createTransaction({
        user_id: userId,
        portfolio_id: portfolioId,
        fund_id: fundId,
        transaction_type: transactionType,
        amount: amount,
        units: units,
        price_per_unit: fund.current_nav,
        transaction_fees: fees,
        status: 'pending'
      });

      // Update or create holding
      const existingHolding = await investmentModel.getHoldingByFund(userId, portfolioId, fundId);
      
      if (existingHolding) {
        const newUnits = transactionType === 'buy' 
          ? (existingHolding.units_held || 0) + units
          : (existingHolding.units_held || 0) - units;
        
        const newTotalInvested = transactionType === 'buy'
          ? (existingHolding.total_invested || 0) + amount
          : (existingHolding.total_invested || 0) - amount;

        const newAvgPrice = newUnits > 0 ? newTotalInvested / newUnits : 0;

        await investmentModel.updateHolding(existingHolding.id!, {
          units_held: newUnits,
          average_buy_price: newAvgPrice,
          total_invested: newTotalInvested,
          current_value: newUnits * fund.current_nav,
          unrealized_gain_loss: (newUnits * fund.current_nav) - newTotalInvested
        });
      } else if (transactionType === 'buy') {
        await investmentModel.createOrUpdateHolding({
          user_id: userId,
          portfolio_id: portfolioId,
          fund_id: fundId,
          units_held: units,
          average_buy_price: fund.current_nav,
          total_invested: amount,
          current_value: amount,
          unrealized_gain_loss: 0
        });
      }

      // Update portfolio totals
      await this.updatePortfolioTotals(portfolioId);

      // Mark transaction as completed
      await investmentModel.updateTransactionStatus(transaction.id!, 'completed');

      return {
        transaction,
        fund,
        units,
        fees
      };
    } catch (error) {
      console.error("Error processing investment:", error);
      throw error;
    }
  }

  // Calculate transaction fees (example: 0.5% for buy, 0.3% for sell)
  private static calculateTransactionFees(amount: number): number {
    return amount * 0.005; // 0.5% fee
  }

  // Update portfolio total values
  private static async updatePortfolioTotals(portfolioId: string) {
    try {
      const portfolio = await investmentModel.getPortfolioById(portfolioId);
      if (!portfolio) return;

      const holdings = await investmentModel.getUserHoldings(portfolio.user_id, portfolioId);
      
      let totalInvested = 0;
      let currentValue = 0;

      for (const holding of holdings) {
        totalInvested += holding.total_invested || 0;
        currentValue += holding.current_value || 0;
      }

      const totalReturn = currentValue - totalInvested;
      const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

      await investmentModel.updatePortfolio(portfolioId, {
        total_invested: totalInvested,
        current_value: currentValue,
        total_return: totalReturn,
        return_percentage: returnPercentage
      });

      // Recalculate current allocation
      await PortfolioService.calculateCurrentAllocation(portfolioId);
    } catch (error) {
      console.error("Error updating portfolio totals:", error);
      throw error;
    }
  }

  // Get portfolio performance for charts
  static async getPortfolioPerformanceData(userId: string, portfolioId: string, timeframe: string = '1Y') {
    try {
      const performance = await investmentModel.getPortfolioPerformance(userId, portfolioId, timeframe);
      
      // Generate sample performance data for charts
      // In a real implementation, this would come from historical data
      const chartData = this.generatePerformanceChartData(performance.portfolio, timeframe);

      return {
        ...performance,
        chartData,
        metrics: {
          totalReturn: performance.portfolio?.total_return || 0,
          returnPercentage: performance.portfolio?.return_percentage || 0,
          totalInvested: performance.portfolio?.total_invested || 0,
          currentValue: performance.portfolio?.current_value || 0,
          portfolioGrowth: chartData.portfolioValue,
          investmentGrowth: chartData.investmentValue
        }
      };
    } catch (error) {
      console.error("Error getting portfolio performance data:", error);
      throw error;
    }
  }

  // Generate sample chart data (in production, this would use real historical data)
  private static generatePerformanceChartData(portfolio: any, timeframe: string) {
    const dataPoints = timeframe === '1Y' ? 12 : timeframe === '5Y' ? 60 : 24;
    const portfolioValue = [];
    const investmentValue = [];
    
    const startValue = portfolio?.total_invested || 5000;
    const endValue = portfolio?.current_value || startValue;
    const growth = (endValue - startValue) / dataPoints;

    for (let i = 0; i <= dataPoints; i++) {
      const value = startValue + (growth * i);
      portfolioValue.push(Math.max(0, value + (Math.random() - 0.5) * value * 0.1));
      investmentValue.push(startValue);
    }

    return {
      portfolioValue,
      investmentValue,
      labels: Array.from({ length: dataPoints + 1 }, (_, i) => `Month ${i + 1}`)
    };
  }

  // Get market movers (top gainers/losers)
  static async getTopMovers(
    timeframe: string = 'day',
    type: 'gainers' | 'losers' = 'gainers',
    limit: number = 3
  ) {
    try {
      return await investmentModel.getTopMovers(timeframe, type, limit);
    } catch (error) {
      console.error('Error getting top movers:', error);
      throw error;
    }
  }
} 