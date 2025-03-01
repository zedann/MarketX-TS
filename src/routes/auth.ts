import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import AppError from "../utils/appError";
import admin from "../config/firebase-config";
import ts from "typescript";

const router = express.Router();

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

router.get("/profile", (req: Request, res: Response) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.get("/logout", (req: Request, res: Response) => {
  req.logout((err: Error) => {
    if (err) {
      return res.status(500).json({ error: "Error logging out" });
    }
    res.redirect(process.env.FRONTEND_URL as string);
  });
});

// OTP verification

// @ts-ignore
router.post(
  "/verify-otp",
  async (req: Request, res: Response, next: NextFunction) => {
    const { idToken } = req.body;

    if (!idToken) {
      return next(new AppError("ID Token is required", 400));
    }
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log(`✅ OTP Verified for UID: ${decodedToken.uid}`);
      res
        .status(200)
        .json({ message: "OTP verified successfully", user: decodedToken });
    } catch (error) {
      console.error("❌ Error verifying OTP:", error);
      return next(new AppError("Invalid or expired OTP", 401));
    }
  }
);
export default router;
