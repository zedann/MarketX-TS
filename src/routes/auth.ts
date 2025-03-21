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
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req: Request, res: Response) {
    console.log("test");
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
