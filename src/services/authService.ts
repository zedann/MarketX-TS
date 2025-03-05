import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError";
import admin from "../config/firebase-config";
import { APIResponse, HTTP_CODES } from "../types";
import sharp from "sharp";
import Tesseract from "tesseract.js";

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
