import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import admin from "../config/firebase-config";
import { HTTP_CODES } from "../types";

export const googleGetProfile = (req: Request, res: Response) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

export const googleLogout = (req: Request, res: Response) => {
  req.logout((err: Error) => {
    if (err) {
      return res.status(500).json({ error: "Error logging out" });
    }
    res.redirect(process.env.FRONTEND_URL as string);
  });
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { idToken } = req.body;

  if (!idToken) {
    return next(new AppError("ID Token is required", 400));
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log(`✅ OTP Verified for UID: ${decodedToken.uid}`);
    res
      .status(HTTP_CODES.OK)
      .json({ message: "OTP verified successfully", user: decodedToken });
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    return next(new AppError("Invalid or expired OTP", 401));
  }
};
