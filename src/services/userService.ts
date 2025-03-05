import { NextFunction, Request, Response } from "express";
import userModel, { CreateUserReq, CreateUserRes } from "../models/user";
import { APIResponse, HTTP_CODES } from "../types";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../utils/appError";
import Tesseract from "tesseract.js";
import sharp from "sharp";

export const handleIdImageUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next(new AppError("No image uploaded", 400));
  try {
    const processedImageBuffer = await sharp(req.file.buffer)
      .grayscale()
      .resize(1000)
      .toBuffer();

    // extract arabic text from the image
    const { data } = await Tesseract.recognize(processedImageBuffer, "ara+eng");

    // extract national ID number from the text

    const extractedId = data.text.match(/\d{14}/g);

    if (!extractedId) return next(new AppError("No ID number found", 404));

    const nationalId = extractedId[0];

    res
      .status(HTTP_CODES.OK)
      .json(new APIResponse("success", "ID extracted", { nationalId }));
  } catch (error) {
    console.error("❌ Error extracting ID:", error);
    return next(new AppError("Error extracting ID", 500));
  }
};

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
    const userReq: CreateUserReq = await userModel.createUser(userData);
    const userRes: CreateUserRes = {
      birthday: userReq.birthday,
      email: userReq.email,
      fullname: userReq.fullname,
      is_active: userReq.is_active,
      profile_pic: userReq.profile_pic,
      user_type: userReq.user_type,
    };

    return res
      .status(HTTP_CODES.CREATED)
      .json(new APIResponse("success", "User created successfully", userRes));
  }
);

export const updateFirstLoginStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    await userModel.updateFirstLoginStatus(userId);
  }
);
