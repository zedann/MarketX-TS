import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import admin from "../config/firebase-config";
import { APIResponse, HTTP_CODES } from "../types";
import sharp from "sharp";
import Tesseract from "tesseract.js";
import jwt from "jsonwebtoken";
import { CreateUserRes, User } from "../models/user";
import { catchAsync } from "../utils/catchAsync";

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "90d",
  });
};

const createSendToken = (
  user: User,
  statusCode: number,
  req: Request,
  res: Response
) => {
  const token = signToken(user.id as string);
  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

  const userRes: CreateUserRes = {
    birthday: user.birthday,
    email: user.email,
    fullname: user.fullname,
    is_active: user.is_active,
    profile_pic: user.profile_pic,
    user_type: user.user_type,
  };

  res.status(statusCode).json(
    new APIResponse("success", "Token Created", {
      user: userRes,
      token,
    })
  );
};
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

export const signIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);
export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

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
