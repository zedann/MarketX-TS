import stockModel from "../models/stock";
import YahooFinanceService from "./yahooFinanceService";
import CacheService from "./cacheService";
import AppError from "../utils/appError";

interface StockFilters {
  sector?: string;
  exchange?: string;
  limit?: number;
  offset?: number;
}

interface ChartDataPoint {
  date: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

class StockService {
  // List stocks with optional filters
  static async listStocks(filters: StockFilters = {}): Promise<any[]> {
    try {
      const cacheKey = `stocks:list:${JSON.stringify(filters)}`;
      const cached = await CacheService.get<any[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get stocks from database
      const dbStocks = await stockModel.getAllStocks(filters);
      
      // If we have stocks in DB, get real-time data from Yahoo Finance
      if (dbStocks.length > 0) {
        const symbols = dbStocks.map(stock => stock.symbol);
        const liveQuotes = await YahooFinanceService.getMultipleQuotes(symbols);
        
        // Merge database data with live quotes
        const enrichedStocks = dbStocks.map(dbStock => {
          const liveQuote = liveQuotes.find(quote => quote.symbol === dbStock.symbol);
          
          return {
            ...dbStock,
            current_price: liveQuote?.regularMarketPrice || dbStock.current_price,
            previous_close: liveQuote?.regularMarketPreviousClose || dbStock.previous_close,
            open_price: liveQuote?.regularMarketOpen || dbStock.open_price,
            day_high: liveQuote?.regularMarketDayHigh || dbStock.day_high,
            day_low: liveQuote?.regularMarketDayLow || dbStock.day_low,
            volume: liveQuote?.regularMarketVolume || dbStock.volume,
            market_cap: liveQuote?.marketCap || dbStock.market_cap,
            change: liveQuote?.regularMarketChange || 0,
            change_percent: liveQuote?.regularMarketChangePercent || 0,
            sector: liveQuote?.sector || dbStock.sector,
            industry: liveQuote?.industry || '',
            currency: liveQuote?.currency || 'USD',
            exchange: liveQuote?.exchange || dbStock.exchange || '',
            last_updated: new Date()
          };
        });

        await CacheService.set(cacheKey, enrichedStocks, 60); // Cache for 1 minute
        return enrichedStocks;
      }

      
      const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'AMD', 'BABA'];
      const liveQuotes = await YahooFinanceService.getMultipleQuotes(popularSymbols);
      
      const popularStocks = liveQuotes.map(quote => ({
        id: quote.symbol,
        symbol: quote.symbol,
        name: quote.longName || quote.shortName,
        current_price: quote.regularMarketPrice,
        previous_close: quote.regularMarketPreviousClose,
        open_price: quote.regularMarketOpen,
        day_high: quote.regularMarketDayHigh,
        day_low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        market_cap: quote.marketCap,
        change: quote.regularMarketChange,
        change_percent: quote.regularMarketChangePercent,
        sector: quote.sector,
        industry: quote.industry,
        currency: quote.currency,
        exchange: quote.exchange,
        is_active: true,
        last_updated: new Date()
      }));

      await CacheService.set(cacheKey, popularStocks, 60);
      return popularStocks;

    } catch (error) {
      console.error('Error listing stocks:', error);
      throw new AppError('Failed to retrieve stocks', 500);
    }
  }

  // Get stock detail by symbol or ID
  static async getStockDetail(idOrSymbol: string): Promise<any> {
    try {
      const cacheKey = `stock:detail:${idOrSymbol}`;
      const cached = await CacheService.get<any>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // First try to get from database
      let stock = await stockModel.getStockBySymbol(idOrSymbol) || 
                  await stockModel.getStockById(idOrSymbol);

      // If not found in DB, get from Yahoo Finance
      if (!stock) {
        const yahooQuote = await YahooFinanceService.getStockQuote(idOrSymbol.toUpperCase());
        
        if (!yahooQuote) {
          throw new AppError(`Stock not found: ${idOrSymbol}`, 404);
        }

        stock = {
          id: yahooQuote.symbol,
          symbol: yahooQuote.symbol,
          name: yahooQuote.longName || yahooQuote.shortName,
          sector: yahooQuote.sector,
          industry: yahooQuote.industry,
          description: `${yahooQuote.longName} (${yahooQuote.symbol}) - ${yahooQuote.sector}`,
          current_price: yahooQuote.regularMarketPrice,
          previous_close: yahooQuote.regularMarketPreviousClose,
          open_price: yahooQuote.regularMarketOpen,
          day_high: yahooQuote.regularMarketDayHigh,
          day_low: yahooQuote.regularMarketDayLow,
          volume: yahooQuote.regularMarketVolume,
          market_cap: yahooQuote.marketCap,
          currency: yahooQuote.currency,
          exchange: yahooQuote.exchange,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
      } else {
        // Update with real-time data from Yahoo Finance
        const yahooQuote = await YahooFinanceService.getStockQuote(stock.symbol);
        if (yahooQuote) {
          stock = {
            ...stock,
            current_price: yahooQuote.regularMarketPrice,
            previous_close: yahooQuote.regularMarketPreviousClose,
            open_price: yahooQuote.regularMarketOpen,
            day_high: yahooQuote.regularMarketDayHigh,
            day_low: yahooQuote.regularMarketDayLow,
            volume: yahooQuote.regularMarketVolume,
            market_cap: yahooQuote.marketCap,
            change: yahooQuote.regularMarketChange,
            change_percent: yahooQuote.regularMarketChangePercent,
            last_updated: new Date()
          };
        }
      }

      await CacheService.set(cacheKey, stock, 60); // Cache for 1 minute
      return stock;

    } catch (error) {
      console.error(`Error getting stock detail for ${idOrSymbol}:`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve stock details', 500);
    }
  }

  // Get top movers (gainers/losers)
  static async getTopMovers(
    timeframe: string = 'day',
    type: 'gainers' | 'losers' = 'gainers',
    limit: number = 10
  ): Promise<any[]> {
    try {
      const cacheKey = `stocks:movers:${type}:${timeframe}:${limit}`;
      const cached = await CacheService.get<any[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get market movers from Yahoo Finance
      const movers = await YahooFinanceService.getMarketMovers(type, limit);
      
      const formattedMovers = movers.map(stock => ({
        symbol: stock.symbol,
        name: stock.longName || stock.shortName,
        current_price: stock.regularMarketPrice,
        change: stock.regularMarketChange,
        change_percent: stock.regularMarketChangePercent,
        volume: stock.regularMarketVolume,
        market_cap: stock.marketCap,
        sector: stock.sector,
        currency: stock.currency,
        timeframe
      }));

      await CacheService.set(cacheKey, formattedMovers, 120); // Cache for 2 minutes
      return formattedMovers;

    } catch (error) {
      console.error(`Error getting top ${type}:`, error);
      throw new AppError(`Failed to retrieve top ${type}`, 500);
    }
  }

  // Get price chart data
  static async getPriceChart(stockId: string, timeframe: string = '1Y'): Promise<any> {
    try {
      const cacheKey = `stock:chart:${stockId}:${timeframe}`;
      const cached = await CacheService.get<any>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get stock symbol
      const stock = await this.getStockDetail(stockId);
      if (!stock) {
        throw new AppError(`Stock not found: ${stockId}`, 404);
      }

      // Calculate date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case '1D':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '1W':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '6M':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '5Y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
        default:
          startDate.setFullYear(endDate.getFullYear() - 1);
      }

      // Get historical data from Yahoo Finance
      const interval = timeframe === '1D' ? '1d' : timeframe === '1W' ? '1d' : '1d';
      const historicalData = await YahooFinanceService.getHistoricalData(
        stock.symbol,
        startDate,
        endDate,
        interval
      );

      // Format data for charts
      const lineData: ChartDataPoint[] = historicalData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        price: item.close
      }));

      const candles: ChartDataPoint[] = historicalData.map(item => ({
        date: item.date.toISOString().split('T')[0],
        open: item.open,
        close: item.close,
        high: item.high,
        low: item.low,
        volume: item.volume
      }));

      const chartData = {
        symbol: stock.symbol,
        timeframe,
        lineData,
        candles,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      };

      await CacheService.set(cacheKey, chartData, 300); // Cache for 5 minutes
      return chartData;

    } catch (error) {
      console.error(`Error getting chart data for ${stockId}:`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve chart data', 500);
    }
  }

  // Get stock statistics
  static async getStatistics(stockId: string): Promise<any> {
    try {
      const cacheKey = `stock:stats:${stockId}`;
      const cached = await CacheService.get<any>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get stock detail first
      const stock = await this.getStockDetail(stockId);
      if (!stock) {
        throw new AppError(`Stock not found: ${stockId}`, 404);
      }

      // Get comprehensive data from Yahoo Finance
      const summary = await YahooFinanceService.getStockSummary(stock.symbol);
      
      const statistics = {
        symbol: stock.symbol,
        name: stock.name,
        price: {
          current: stock.current_price,
          open: stock.open_price,
          previousClose: stock.previous_close,
          dayHigh: stock.day_high,
          dayLow: stock.day_low,
          change: stock.change || 0,
          changePercent: stock.change_percent || 0
        },
        volume: {
          current: stock.volume,
          average: summary?.summaryDetail?.averageVolume || 0,
          averageDailyVolume10Day: summary?.summaryDetail?.averageDailyVolume10Day || 0
        },
        marketData: {
          marketCap: stock.market_cap,
          peRatio: summary?.summaryDetail?.trailingPE || 0,
          eps: summary?.defaultKeyStatistics?.trailingEps || 0,
          beta: summary?.summaryDetail?.beta || 0,
          dividendYield: summary?.summaryDetail?.dividendYield || 0
        },
        priceRange: {
          fiftyTwoWeekHigh: summary?.summaryDetail?.fiftyTwoWeekHigh || 0,
          fiftyTwoWeekLow: summary?.summaryDetail?.fiftyTwoWeekLow || 0
        },
        company: {
          sector: stock.sector,
          industry: stock.industry || '',
          exchange: stock.exchange,
          currency: stock.currency
        }
      };

      await CacheService.set(cacheKey, statistics, 300); // Cache for 5 minutes
      return statistics;

    } catch (error) {
      console.error(`Error getting statistics for ${stockId}:`, error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to retrieve stock statistics', 500);
    }
  }

  // Search stocks
  static async searchStocks(query: string, limit: number = 10): Promise<any[]> {
    try {
      const cacheKey = `stocks:search:${query}:${limit}`;
      const cached = await CacheService.get<any[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const searchResults = await YahooFinanceService.searchStocks(query, limit);
      
      const formattedResults = searchResults.map(result => ({
        symbol: result.symbol,
        name: result.longname || result.shortname,
        sector: result.sector,
        industry: result.industry,
        exchange: result.exchange,
        type: result.quoteType
      }));

      await CacheService.set(cacheKey, formattedResults, 1800); // Cache for 30 minutes
      return formattedResults;

    } catch (error) {
      console.error(`Error searching stocks for query: ${query}:`, error);
      throw new AppError('Failed to search stocks', 500);
    }
  }
}

export default StockService; 