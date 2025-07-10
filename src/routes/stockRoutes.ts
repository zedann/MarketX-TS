import express, { Request, Response, NextFunction } from "express";
import { protect } from "../middleware/authMiddleware";
import { securityLogger } from "../middleware/securityMiddleware";
import { catchAsync } from "../utils/catchAsync";
import { APIResponse, HTTP_CODES } from "../types";
import StockService from "../services/stockService";
import AppError from "../utils/appError";

const router = express.Router();

// Search stocks (public endpoint)
router.get(
  "/search",
  securityLogger("STOCKS_SEARCH"),
  catchAsync(async (req: Request, res: Response) => {
    const { q: query, limit = '10' } = req.query;
    
    if (!query || typeof query !== 'string') {
      throw new AppError("Search query is required", HTTP_CODES.BAD_REQUEST);
    }

    const results = await StockService.searchStocks(query, parseInt(limit as string, 10));
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Stock search results", { 
        query, 
        results,
        count: results.length 
      })
    );
  })
);

// Public list (no auth)
router.get(
  "/",
  securityLogger("STOCKS_LIST"),
  catchAsync(async (req: Request, res: Response) => {
    const { sector, exchange, limit, offset } = req.query;
    
    const filters = {
      sector: sector as string,
      exchange: exchange as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined
    };

    const stocks = await StockService.listStocks(filters);
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Stocks retrieved", { 
        stocks,
        count: stocks.length,
        filters 
      })
    );
  })
);

// Top movers
router.get(
  "/top-movers",
  securityLogger("STOCKS_TOP_MOVERS"),
  catchAsync(async (req: Request, res: Response) => {
    const { 
      timeframe = 'day', 
      type = 'gainers', 
      limit = '10' 
    } = req.query;

    if (!['gainers', 'losers', 'actives'].includes(type as string)) {
      throw new AppError("Type must be 'gainers', 'losers', or 'actives'", HTTP_CODES.BAD_REQUEST);
    }

    const movers = await StockService.getTopMovers(
      timeframe as string, 
      type as 'gainers' | 'losers', 
      parseInt(limit as string, 10)
    );

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", `Top ${type} retrieved`, { 
        timeframe,
        type,
        movers,
        count: movers.length
      })
    );
  })
);

// Stock detail by symbol or id
router.get(
  "/:idOrSymbol",
  securityLogger("STOCK_DETAIL"),
  catchAsync(async (req: Request, res: Response) => {
    const { idOrSymbol } = req.params;
    
    if (!idOrSymbol) {
      throw new AppError("Stock symbol or ID is required", HTTP_CODES.BAD_REQUEST);
    }

    const stock = await StockService.getStockDetail(idOrSymbol);
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Stock detail retrieved", { stock })
    );
  })
);

// Price chart
router.get(
  "/:idOrSymbol/chart",
  securityLogger("STOCK_CHART"),
  catchAsync(async (req: Request, res: Response) => {
    const { idOrSymbol } = req.params;
    const { timeframe = '1Y' } = req.query;

    if (!idOrSymbol) {
      throw new AppError("Stock symbol or ID is required", HTTP_CODES.BAD_REQUEST);
    }

    const validTimeframes = ['1D', '1W', '1M', '6M', '1Y', '5Y'];
    if (!validTimeframes.includes(timeframe as string)) {
      throw new AppError(
        `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`, 
        HTTP_CODES.BAD_REQUEST
      );
    }

    const chartData = await StockService.getPriceChart(idOrSymbol, timeframe as string);
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Chart data retrieved", chartData)
    );
  })
);

// Statistics
router.get(
  "/:idOrSymbol/statistics",
  securityLogger("STOCK_STATS"),
  catchAsync(async (req: Request, res: Response) => {
    const { idOrSymbol } = req.params;
    
    if (!idOrSymbol) {
      throw new AppError("Stock symbol or ID is required", HTTP_CODES.BAD_REQUEST);
    }

    const statistics = await StockService.getStatistics(idOrSymbol);
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Stock statistics retrieved", { statistics })
    );
  })
);

export default router; 