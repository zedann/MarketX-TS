import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import admin from "../config/firebase-config";
import { APIResponse, HTTP_CODES } from "../types";
import sharp from "sharp";
import Tesseract from "tesseract.js";
import jwt from "jsonwebtoken";
import userModel, { CreateUserReq, CreateUserRes, User } from "../models/user";
import { catchAsync } from "../utils/catchAsync";
import { comparePassword, encryptPassword } from "../utils/password";

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
    mobile: user.mobile,
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
      return res
        .status(HTTP_CODES.INTERNAL_SERVER_ERROR)
        .json({ error: "Error logging out" });
    }
    res.redirect(process.env.FRONTEND_URL as string);
  });
};

export const signIn = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(
        new AppError(
          "Please provide email and password!",
          HTTP_CODES.BAD_REQUEST
        )
      );
    }
    const user: User | null = await userModel.findByEmail(email);

    if (
      !user ||
      !(await comparePassword(password as string, user.password as string))
    ) {
      return next(
        new AppError("Incorrect email or password", HTTP_CODES.UNAUTHORIZED)
      );
    }

    createSendToken(user, HTTP_CODES.OK, req, res);
  }
);
export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser: User = {
      mobile: req.body.mobile,
      is_first_login: true,
      national_id: req.body.national_id,
      statement: req.body.statement,
      email: req.body.email,
      password: req.body.password,
      confirm_password: req.body.confirm_password,
      fullname: req.body.fullname,
      birthday: req.body.birthday,
      passcode: req.body.passcode,
      confirm_passcode: req.body.confirm_passcode,
      profile_pic: req.body.profile_pic,
      google_auth_enabled: false,
    };

    if (newUser.password !== newUser.confirm_password) {
      return next(
        new AppError("Passwords do not match", HTTP_CODES.BAD_REQUEST)
      );
    }

    // TODO: comeback to it later
    if (newUser.passcode !== newUser.confirm_passcode) {
      return next(
        new AppError("Passcodes do not match", HTTP_CODES.BAD_REQUEST)
      );
    }

    newUser.password = await encryptPassword(newUser.password as string);
    const user: User = await userModel.createUserWithSignUp(newUser);

    createSendToken(user, HTTP_CODES.CREATED, req, res);
  }
);

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { idToken } = req.body;

  if (!idToken) {
    return next(new AppError("ID Token is required", HTTP_CODES.BAD_REQUEST));
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
