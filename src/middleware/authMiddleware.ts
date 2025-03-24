import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError";
import userModel from "../models/user";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // 3) Check if user still exists
    const currentUser = await userModel.findById((decoded as any).id);
    if (!currentUser) {
      return next(
        new AppError(
          "The user belonging to this token does no longer exist.",
          401
        )
      );
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (err) {
    return next(new AppError("Invalid token. Please log in again.", 401));
  }
};
