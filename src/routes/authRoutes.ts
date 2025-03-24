import express, { NextFunction, Request, Response } from "express";
import passport from "passport";

import {
  googleGetProfile,
  googleLogout,
  signIn,
  signUp,
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
  passport.authenticate("google", { session: false }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    res.cookie("jwt", user.token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production'
    });
    res.redirect(process.env.FRONTEND_URL as string);
  }
);
router.get("/profile", googleGetProfile);
// login and signup
router.route("/signin").post(signIn);
router.route("/signup").post(signUp);
router.get("/logout", googleLogout);
// OTP verification
router.post("/verify-otp", verifyOtp);

export default router;
