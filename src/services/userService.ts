import { NextFunction, Request, Response } from "express";
import userModel from "../models/user";
import { APIResponse, HTTP_CODES } from "../types";
import { catchAsync } from "../utils/catchAsync";

export const getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await userModel.getUsers();
    return res
      .status(HTTP_CODES.OK)
      .json(new APIResponse("success", "Users fetched successfully", users));
  }
);

export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;
    const user = await userModel.createUser(userData);
  }
);

export const updateFirstLoginStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    await userModel.updateFirstLoginStatus(userId);
  }
);
