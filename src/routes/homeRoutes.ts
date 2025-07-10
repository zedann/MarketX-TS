import express from "express";
import { Request, Response, NextFunction } from "express";
import { protect } from "../middleware/authMiddleware";
import { securityLogger } from "../middleware/securityMiddleware";
import { catchAsync } from "../utils/catchAsync";
import { APIResponse, HTTP_CODES } from "../types";
import HomeService from "../services/homeService";

const router = express.Router();

// GET /api/v1/home/summary - aggregated data for the mobile home screen
router.get(
  "/summary",
  protect,
  securityLogger("HOME_SUMMARY_ACCESS"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const summary = await HomeService.getHomeSummary(user.id);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Home summary retrieved", summary)
    );
  })
);

export default router; 