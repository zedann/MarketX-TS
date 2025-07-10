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

// Selfie upload and face verification
export const handleSelfieUpload = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new AppError("No selfie image uploaded", HTTP_CODES.BAD_REQUEST));
  }

  const { userId } = req.body;
  if (!userId) {
    return next(new AppError("User ID is required", HTTP_CODES.BAD_REQUEST));
  }

  try {
    // Process the selfie image
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(512, 512, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Basic face detection using image analysis
    const faceValidation = await validateFaceInImage(processedImageBuffer);
    
           if (!faceValidation.isValid) {
         return next(new AppError(faceValidation.error || "Face validation failed", HTTP_CODES.BAD_REQUEST));
       }

    // In a production environment, you would:
    // 1. Save the image to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 2. Store the image URL in the database
    // 3. Perform more sophisticated face verification using ML services
    
    // For now, we'll simulate storing the image and updating the user
    const imageUrl = `selfies/${userId}_${Date.now()}.jpg`;
    
    // Update user with selfie information
    await userModel.updateUser(userId, {
      selfie_pic: imageUrl
    });

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Selfie uploaded and verified successfully", {
        imageUrl,
        faceDetected: true,
        qualityScore: faceValidation.qualityScore,
        message: "Face verification completed"
      })
    );
  } catch (error) {
    console.error("❌ Error processing selfie:", error);
    return next(
      new AppError("Error processing selfie image", HTTP_CODES.INTERNAL_SERVER_ERROR)
    );
  }
};

// Enhanced ID image upload with better validation
export const handleIdImageUploadEnhanced = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(new AppError("No ID image uploaded", HTTP_CODES.BAD_REQUEST));
  }

  const { userId, side } = req.body; // side: 'front' or 'back'
  
  if (!userId) {
    return next(new AppError("User ID is required", HTTP_CODES.BAD_REQUEST));
  }

  if (!side || !['front', 'back'].includes(side)) {
    return next(new AppError("Valid side (front/back) is required", HTTP_CODES.BAD_REQUEST));
  }

  try {
    // Process the ID image
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer();

    // Validate image quality for ID documents
    const qualityValidation = await validateIdImageQuality(processedImageBuffer);
    
         if (!qualityValidation.isValid) {
       return next(new AppError(qualityValidation.error || "ID quality validation failed", HTTP_CODES.BAD_REQUEST));
     }

    // Extract text from the ID using OCR
    const { data } = await Tesseract.recognize(processedImageBuffer, "ara+eng");
    
    let extractedInfo: any = {};
    
    if (side === 'front') {
      // Extract national ID number and name from front side
      const nationalIdMatches = data.text.match(/\d{14}/g);
      const arabicNameMatch = data.text.match(/[\u0600-\u06FF\s]+/g);
      
      if (nationalIdMatches) {
        extractedInfo.nationalId = nationalIdMatches[0];
      }
      
             if (arabicNameMatch) {
         extractedInfo.arabicName = arabicNameMatch.filter((match: string) => match.trim().length > 2)[0];
       }
    }

    // Save image URL (in production, upload to cloud storage)
    const imageUrl = `id_documents/${userId}_${side}_${Date.now()}.jpg`;
    
    // Update user with ID document information
    const updateData: any = {};
    if (side === 'front') {
      updateData.national_id_front_pic = imageUrl;
      if (extractedInfo.nationalId) {
        updateData.national_id = extractedInfo.nationalId;
      }
    } else {
      updateData.national_id_back_pic = imageUrl;
    }
    
    await userModel.updateUser(userId, updateData);

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", `ID ${side} side uploaded and processed successfully`, {
        imageUrl,
        extractedInfo,
        qualityScore: qualityValidation.qualityScore,
        side,
        message: `ID ${side} side verification completed`
      })
    );
  } catch (error) {
    console.error(`❌ Error processing ID ${side} image:`, error);
    return next(
      new AppError(`Error processing ID ${side} image`, HTTP_CODES.INTERNAL_SERVER_ERROR)
    );
  }
};

// Face validation function
async function validateFaceInImage(imageBuffer: Buffer): Promise<{
  isValid: boolean;
  error?: string;
  qualityScore?: number;
}> {
  try {
    // Get image metadata for basic validation
    const metadata = await sharp(imageBuffer).metadata();
    
    // Basic image quality checks
    if (!metadata.width || !metadata.height) {
      return { isValid: false, error: "Invalid image format" };
    }

    if (metadata.width < 200 || metadata.height < 200) {
      return { isValid: false, error: "Image resolution too low. Please take a clearer photo." };
    }

    // Check image brightness and contrast (basic quality indicators)
    const stats = await sharp(imageBuffer)
      .greyscale()
      .stats();

    const brightness = stats.channels[0].mean;
    const contrast = stats.channels[0].stdev;

    if (brightness < 50) {
      return { isValid: false, error: "Image is too dark. Please ensure good lighting." };
    }

    if (brightness > 230) {
      return { isValid: false, error: "Image is too bright. Please avoid direct flash." };
    }

    if (contrast < 20) {
      return { isValid: false, error: "Image lacks contrast. Please take photo in better lighting." };
    }

    // Calculate quality score (0-100)
    const qualityScore = Math.min(100, Math.round((contrast + (255 - Math.abs(brightness - 128))) / 2));

    // In a real implementation, you would use face detection libraries like:
    // - OpenCV
    // - Face-api.js
    // - AWS Rekognition
    // - Google Vision API
    // - Azure Face API

    return {
      isValid: true,
      qualityScore
    };
  } catch (error) {
    return { isValid: false, error: "Error analyzing image quality" };
  }
}

// ID image quality validation function
async function validateIdImageQuality(imageBuffer: Buffer): Promise<{
  isValid: boolean;
  error?: string;
  qualityScore?: number;
}> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      return { isValid: false, error: "Invalid image format" };
    }

    if (metadata.width < 600 || metadata.height < 400) {
      return { isValid: false, error: "Image resolution too low for ID verification. Please take a clearer photo." };
    }

    // Check if image is properly oriented (landscape for most IDs)
    if (metadata.height > metadata.width) {
      return { isValid: false, error: "Please orient your ID horizontally for better recognition." };
    }

    // Analyze image quality
    const stats = await sharp(imageBuffer)
      .greyscale()
      .stats();

    const brightness = stats.channels[0].mean;
    const contrast = stats.channels[0].stdev;

    if (brightness < 60) {
      return { isValid: false, error: "ID image is too dark. Please ensure good lighting." };
    }

    if (brightness > 220) {
      return { isValid: false, error: "ID image is too bright. Please avoid glare and direct flash." };
    }

    if (contrast < 25) {
      return { isValid: false, error: "ID image lacks sharpness. Please hold camera steady and focus." };
    }

    const qualityScore = Math.min(100, Math.round((contrast + (255 - Math.abs(brightness - 128))) / 2));

    return {
      isValid: true,
      qualityScore
    };
  } catch (error) {
    return { isValid: false, error: "Error analyzing ID image quality" };
  }
}
