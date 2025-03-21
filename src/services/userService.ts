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
  if (!req.file)
    return next(new AppError("No image uploaded", HTTP_CODES.BAD_REQUEST));
  try {
    const processedImageBuffer = await sharp(req.file.buffer)
      .grayscale()
      .resize(1000)
      .toBuffer();

    // extract arabic text from the image
    const { data } = await Tesseract.recognize(processedImageBuffer, "ara+eng");

    // extract national ID number from the text

    const extractedId = data.text.match(/\d{14}/g);

    if (!extractedId)
      return next(new AppError("No ID number found", HTTP_CODES.NOT_FOUND));

    const nationalId = extractedId[0];

    res
      .status(HTTP_CODES.OK)
      .json(new APIResponse("success", "ID extracted", { nationalId }));
  } catch (error) {
    console.error("❌ Error extracting ID:", error);
    return next(
      new AppError("Error extracting ID", HTTP_CODES.INTERNAL_SERVER_ERROR)
    );
  }
};

export const getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await userModel.getUsers(req.query);
    return res
      .status(HTTP_CODES.OK)
      .json(new APIResponse("success", "Users fetched successfully", users));
  }
);

export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userData = req.body;
    const userRes: CreateUserRes = await userModel.createUserWithSignUp(
      userData
    );

    return res
      .status(HTTP_CODES.CREATED)
      .json(new APIResponse("success", "User created successfully", userRes));
  }
);
export const getUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    return res
      .status(HTTP_CODES.OK)
      .json(new APIResponse("success", "User fetched successfully", user));
  }
);

export const updateFirstLoginStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.params.userId;
    await userModel.updateFirstLoginStatus(userId);
    return res
      .status(HTTP_CODES.OK)
      .json(new APIResponse("success", "First login status updated"));
  }
);
