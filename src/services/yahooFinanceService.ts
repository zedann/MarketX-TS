import yahooFinance from 'yahoo-finance2';
import CacheService from './cacheService';
import AppError from '../utils/appError';

interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  marketCap: number;
  shortName: string;
  longName: string;
  currency: string;
  exchange: string;
  sector: string;
  industry: string;
}

interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

class YahooFinanceService {
  private static readonly CACHE_TTL = {
    QUOTE: 60, // 1 minute for real-time quotes
    HISTORICAL: 3600, // 1 hour for historical data
    SEARCH: 1800, // 30 minutes for search results
  };

  // Get real-time stock quote
  static async getStockQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const cacheKey = `yahoo:quote:${symbol}`;
      const cached = await CacheService.get<StockQuote>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const quote = await yahooFinance.quote(symbol);
      
      if (!quote) {
        throw new AppError(`Stock quote not found for symbol: ${symbol}`, 404);
      }

      const stockData: StockQuote = {
        symbol: quote.symbol || symbol,
        regularMarketPrice: quote.regularMarketPrice || 0,
        regularMarketChange: quote.regularMarketChange || 0,
        regularMarketChangePercent: (quote.regularMarketChangePercent || 0) * 100,
        regularMarketPreviousClose: quote.regularMarketPreviousClose || 0,
        regularMarketOpen: quote.regularMarketOpen || 0,
        regularMarketDayHigh: quote.regularMarketDayHigh || 0,
        regularMarketDayLow: quote.regularMarketDayLow || 0,
        regularMarketVolume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        shortName: quote.shortName || '',
        longName: quote.longName || '',
        currency: quote.currency || 'USD',
        exchange: quote.exchange || '',
        sector: quote.sector || '',
        industry: quote.industry || ''
      };

      await CacheService.set(cacheKey, stockData, this.CACHE_TTL.QUOTE);
      return stockData;

    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  // Get multiple stock quotes at once
  static async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    try {
      const cacheKey = `yahoo:quotes:${symbols.sort().join(',')}`;
      const cached = await CacheService.get<StockQuote[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const quotes = await yahooFinance.quote(symbols);
      const stockData: StockQuote[] = [];

      for (const symbol of symbols) {
        const quote = Array.isArray(quotes) ? quotes.find(q => q.symbol === symbol) : quotes;
        
        if (quote) {
          stockData.push({
            symbol: quote.symbol || symbol,
            regularMarketPrice: quote.regularMarketPrice || 0,
            regularMarketChange: quote.regularMarketChange || 0,
            regularMarketChangePercent: (quote.regularMarketChangePercent || 0) * 100,
            regularMarketPreviousClose: quote.regularMarketPreviousClose || 0,
            regularMarketOpen: quote.regularMarketOpen || 0,
            regularMarketDayHigh: quote.regularMarketDayHigh || 0,
            regularMarketDayLow: quote.regularMarketDayLow || 0,
            regularMarketVolume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap || 0,
            shortName: quote.shortName || '',
            longName: quote.longName || '',
            currency: quote.currency || 'USD',
            exchange: quote.exchange || '',
            sector: quote.sector || '',
            industry: quote.industry || ''
          });
        }
      }

      await CacheService.set(cacheKey, stockData, this.CACHE_TTL.QUOTE);
      return stockData;

    } catch (error) {
      console.error('Error fetching multiple quotes:', error);
      return [];
    }
  }

  // Get historical stock data
  static async getHistoricalData(
    symbol: string, 
    period1: Date, 
    period2: Date = new Date(),
    interval: '1d' | '1wk' | '1mo' = '1d'
  ): Promise<HistoricalData[]> {
    try {
      const cacheKey = `yahoo:historical:${symbol}:${period1.toISOString().split('T')[0]}:${period2.toISOString().split('T')[0]}:${interval}`;
      const cached = await CacheService.get<HistoricalData[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const result = await yahooFinance.historical(symbol, {
        period1: period1.toISOString().split('T')[0],
        period2: period2.toISOString().split('T')[0],
        interval: interval,
      });

      const historicalData: HistoricalData[] = result.map(item => ({
        date: item.date,
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        adjClose: item.adjClose || 0,
        volume: item.volume || 0
      }));

      await CacheService.set(cacheKey, historicalData, this.CACHE_TTL.HISTORICAL);
      return historicalData;

    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  // Search for stocks
  static async searchStocks(query: string, limit: number = 10): Promise<any[]> {
    try {
      const cacheKey = `yahoo:search:${query}:${limit}`;
      const cached = await CacheService.get<any[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const results = await yahooFinance.search(query);
      const searchResults = results.quotes.slice(0, limit).map(item => ({
        symbol: item.symbol,
        shortname: item.shortname,
        longname: item.longname,
        sector: item.sector,
        industry: item.industry,
        exchange: item.exchange,
        quoteType: item.quoteType
      }));

      await CacheService.set(cacheKey, searchResults, this.CACHE_TTL.SEARCH);
      return searchResults;

    } catch (error) {
      console.error(`Error searching stocks for query: ${query}:`, error);
      return [];
    }
  }

  // Get trending stocks
  static async getTrendingStocks(region: string = 'US', limit: number = 10): Promise<any[]> {
    try {
      const cacheKey = `yahoo:trending:${region}:${limit}`;
      const cached = await CacheService.get<any[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const trending = await yahooFinance.trendingSymbols(region);
      const trendingData = trending.finance.result[0].quotes.slice(0, limit);

      await CacheService.set(cacheKey, trendingData, this.CACHE_TTL.QUOTE);
      return trendingData;

    } catch (error) {
      console.error(`Error fetching trending stocks for region ${region}:`, error);
      return [];
    }
  }

  // Get market movers (gainers/losers)
  static async getMarketMovers(type: 'gainers' | 'losers' | 'actives', limit: number = 10): Promise<StockQuote[]> {
    try {
      const cacheKey = `yahoo:movers:${type}:${limit}`;
      const cached = await CacheService.get<StockQuote[]>(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Get trending symbols first, then filter based on performance
      const trending = await this.getTrendingStocks('US', 50);
      const symbols = trending.map(stock => stock.symbol);
      
      if (symbols.length === 0) {
        return [];
      }

      const quotes = await this.getMultipleQuotes(symbols);
      
      let movers: StockQuote[] = [];
      
      switch (type) {
        case 'gainers':
          movers = quotes
            .filter(quote => quote.regularMarketChangePercent > 0)
            .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
            .slice(0, limit);
          break;
          
        case 'losers':
          movers = quotes
            .filter(quote => quote.regularMarketChangePercent < 0)
            .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent)
            .slice(0, limit);
          break;
          
        case 'actives':
          movers = quotes
            .sort((a, b) => b.regularMarketVolume - a.regularMarketVolume)
            .slice(0, limit);
          break;
      }

      await CacheService.set(cacheKey, movers, this.CACHE_TTL.QUOTE);
      return movers;

    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      return [];
    }
  }

  // Get stock statistics/summary
  static async getStockSummary(symbol: string): Promise<any> {
    try {
      const cacheKey = `yahoo:summary:${symbol}`;
      const cached = await CacheService.get<any>(cacheKey);
      
      if (cached) {
        return cached;
      }

      const [quote, summary] = await Promise.all([
        this.getStockQuote(symbol),
        yahooFinance.quoteSummary(symbol, { 
          modules: ['defaultKeyStatistics', 'financialData', 'summaryDetail'] 
        })
      ]);

      const stockSummary = {
        quote,
        keyStatistics: summary.defaultKeyStatistics,
        financialData: summary.financialData,
        summaryDetail: summary.summaryDetail
      };

      await CacheService.set(cacheKey, stockSummary, this.CACHE_TTL.QUOTE);
      return stockSummary;

    } catch (error) {
      console.error(`Error fetching summary for ${symbol}:`, error);
      return null;
    }
  }
}

export default YahooFinanceService; 