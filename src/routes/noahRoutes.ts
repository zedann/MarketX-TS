import express, { Request, Response, NextFunction } from "express";
import { protect } from "../middleware/authMiddleware";
import { securityLogger } from "../middleware/securityMiddleware";
import { catchAsync } from "../utils/catchAsync";
import { APIResponse, HTTP_CODES } from "../types";
import NoahService from "../services/noahService";

const router = express.Router();

// Intro/tutorial (public)
router.get("/intro", (req: Request, res: Response) => {
  res.status(HTTP_CODES.OK).json(new APIResponse("success", "Noah intro", NoahService.getIntro()));
});

// Chat endpoint (auth required)
router.post(
  "/chat",
  protect,
  securityLogger("NOAH_CHAT"),
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;
    const { message } = req.body;
    const result = await NoahService.chat(user.id, message);
    res.status(HTTP_CODES.OK).json(new APIResponse("success", "Noah reply", result));
  })
);

export default router; 