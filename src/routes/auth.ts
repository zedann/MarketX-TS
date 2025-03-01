import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import AppError from "../utils/appError";
import admin from "../config/firebase-config";
import {
  googleGetProfile,
  googleLogout,
  verifyOtp,
} from "../services/authService";

const router = express.Router();

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: Request, res: Response) {
    res.redirect(process.env.FRONTEND_URL as string);
  }
);
router.get("/profile", googleGetProfile);

router.get("/logout", googleLogout);

// OTP verification
router.post("/verify-otp", verifyOtp);
export default router;
