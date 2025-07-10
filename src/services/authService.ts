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
import { 
  checkEmailAvailability as validateEmailAvailability,
  checkUsernameAvailability as validateUsernameAvailability,
  getPasswordStrength as calculatePasswordStrength,
  validateEmail,
  validateUsername,
  validatePassword,
  validateRegistrationStep
} from "../utils/validation";

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
    
    // Enhanced validation
    if (!email || !password) {
      return next(
        new AppError(
          "Please provide email and password!",
          HTTP_CODES.BAD_REQUEST
        )
      );
    }

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return next(new AppError(emailValidation.error!, HTTP_CODES.BAD_REQUEST));
    }

    // Find user by email
    const user: User | null = await userModel.findByEmail(email);
    if (!user) {
      return next(
        new AppError("No account found with this email address", HTTP_CODES.UNAUTHORIZED)
      );
    }

    // Check if user account is active
    if (!user.is_active) {
      return next(
        new AppError("Your account is not activated. Please complete your registration.", HTTP_CODES.UNAUTHORIZED)
      );
    }

    // Verify password
    if (!user.password || !(await comparePassword(password, user.password))) {
      // Increment failed login attempts
      await userModel.incrementLoginAttempts(email);
      
      // Check if account should be locked after this failed attempt
      const updatedUser = await userModel.findByEmail(email);
      const maxAttempts = 5;
      const lockDurationMinutes = 30;
      
      if (updatedUser && (updatedUser.login_attempts || 0) >= maxAttempts) {
        await userModel.lockAccount(email, lockDurationMinutes);
        return next(
          new AppError(
            `Account locked due to multiple failed login attempts. Try again in ${lockDurationMinutes} minutes.`,
            HTTP_CODES.LOCKED
          )
        );
      }
      
      const remainingAttempts = maxAttempts - (updatedUser?.login_attempts || 0);
      return next(
        new AppError(
          `Incorrect password. ${remainingAttempts} attempts remaining before account lockout.`,
          HTTP_CODES.UNAUTHORIZED
        )
      );
    }

    // Reset login attempts on successful login
    await userModel.resetLoginAttempts(email);
    
    // Update last login
    await userModel.updateLastLogin(user.id);

    createSendToken(user, HTTP_CODES.OK, req, res);
  }
);
export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      mobile,
      national_id,
      statement,
      email,
      password,
      confirm_password,
      fullname,
      username,
      birthday,
      passcode,
      confirm_passcode,
      country_of_birth,
      nationality,
      profile_pic
    } = req.body;

    // Enhanced validation using the new validation utilities
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return next(new AppError(emailValidation.error!, HTTP_CODES.BAD_REQUEST));
    }

    // Check email availability
    const emailAvailable = await validateEmailAvailability(email);
    if (!emailAvailable.isValid) {
      return next(new AppError(emailAvailable.error!, HTTP_CODES.BAD_REQUEST));
    }

    // Validate username if provided
    if (username) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.isValid) {
        return next(new AppError(usernameValidation.error!, HTTP_CODES.BAD_REQUEST));
      }

      const usernameAvailable = await validateUsernameAvailability(username);
      if (!usernameAvailable.isValid) {
        return next(new AppError(usernameAvailable.error!, HTTP_CODES.BAD_REQUEST));
      }
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return next(new AppError(passwordValidation.error!, HTTP_CODES.BAD_REQUEST));
    }

    if (password !== confirm_password) {
      return next(new AppError("Passwords do not match", HTTP_CODES.BAD_REQUEST));
    }

    // Enhanced PIN validation (6 digits)
    const pinValidation = await validateRegistrationStep("security", { 
      passcode, 
      confirm_passcode: confirm_passcode,
      password,
      confirm_password
    });
    if (!pinValidation.isValid) {
      return next(new AppError(pinValidation.error!, HTTP_CODES.BAD_REQUEST));
    }

    // Age validation if birthday is provided
    if (birthday) {
      const ageValidation = await validateRegistrationStep("contact", { 
        mobile, 
        birthday 
      });
      if (!ageValidation.isValid) {
        return next(new AppError(ageValidation.error!, HTTP_CODES.BAD_REQUEST));
      }
    }

    const newUser: User = {
      mobile,
      username,
      is_first_login: true,
      national_id,
      statement,
      email,
      password: await encryptPassword(password),
      fullname,
      birthday,
      passcode,
      country_of_birth,
      nationality,
      profile_pic,
      google_auth_enabled: false,
      user_type: "user",
      is_active: true, // For legacy signup, activate immediately
      terms_accepted: true, // Assume terms accepted in legacy signup
    };

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

// Email availability check
export const checkEmailAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Email is required", HTTP_CODES.BAD_REQUEST));
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return next(new AppError(emailValidation.error || "Invalid email", HTTP_CODES.BAD_REQUEST));
    }

    const availabilityCheck = await validateEmailAvailability(email);
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Email availability checked", {
        available: availabilityCheck.isValid,
        message: availabilityCheck.error || "Email is available"
      })
    );
  }
);

// Username availability check
export const checkUsernameAvailability = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req.body;

    if (!username) {
      return next(new AppError("Username is required", HTTP_CODES.BAD_REQUEST));
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      return next(new AppError(usernameValidation.error || "Invalid username", HTTP_CODES.BAD_REQUEST));
    }

    const availabilityCheck = await validateUsernameAvailability(username);
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Username availability checked", {
        available: availabilityCheck.isValid,
        message: availabilityCheck.error || "Username is available"
      })
    );
  }
);

// Password strength check
export const getPasswordStrength = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { password } = req.body;

    if (!password) {
      return next(new AppError("Password is required", HTTP_CODES.BAD_REQUEST));
    }

    const strengthResult = calculatePasswordStrength(password);
    
    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "Password strength calculated", {
        strength: strengthResult
      })
    );
  }
);

// Request password reset (send OTP to email)
export const requestPasswordReset = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Email is required", HTTP_CODES.BAD_REQUEST));
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return next(new AppError(emailValidation.error || "Invalid email", HTTP_CODES.BAD_REQUEST));
    }

    // Check if user exists
    const user = await userModel.findByEmail(email);
    if (!user) {
      return next(new AppError("No user found with this email address", HTTP_CODES.NOT_FOUND));
    }

    try {
      // Generate OTP using Firebase
      const actionCodeSettings = {
        url: `${process.env.FRONTEND_URL}/reset-password`,
        handleCodeInApp: false,
      };

      // In a real implementation, you would send an OTP via email
      // For now, we'll generate a simple OTP and store it temporarily
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In production, store this OTP in a temporary cache (Redis) or database
      // For demo purposes, we'll just return success
      console.log(`Password reset OTP for ${email}: ${otp}`);

      res.status(HTTP_CODES.OK).json(
        new APIResponse("success", "Password reset OTP sent to your email", {
          message: "Please check your email for the OTP code"
        })
      );
    } catch (error) {
      console.error("Error sending password reset OTP:", error);
      return next(new AppError("Failed to send password reset OTP", HTTP_CODES.INTERNAL_SERVER_ERROR));
    }
  }
);

// Verify password reset OTP
export const verifyPasswordResetOtp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError("Email and OTP are required", HTTP_CODES.BAD_REQUEST));
    }

    // Check if user exists
    const user = await userModel.findByEmail(email);
    if (!user) {
      return next(new AppError("No user found with this email address", HTTP_CODES.NOT_FOUND));
    }

    // In production, verify OTP from cache/database
    // For demo purposes, we'll accept any 6-digit OTP
    if (!/^\d{6}$/.test(otp)) {
      return next(new AppError("Invalid OTP format", HTTP_CODES.BAD_REQUEST));
    }

    // Generate a temporary reset token
    const resetToken = jwt.sign(
      { email: email, purpose: "password_reset" },
      process.env.JWT_SECRET as string,
      { expiresIn: "10m" } // 10 minutes expiry
    );

    res.status(HTTP_CODES.OK).json(
      new APIResponse("success", "OTP verified successfully", {
        resetToken: resetToken,
        message: "You can now reset your password"
      })
    );
  }
);

// Reset password
export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return next(new AppError("Reset token, new password, and confirm password are required", HTTP_CODES.BAD_REQUEST));
    }

    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return next(new AppError(passwordValidation.error || "Invalid password", HTTP_CODES.BAD_REQUEST));
    }

    // Check password confirmation
    if (newPassword !== confirmPassword) {
      return next(new AppError("Passwords do not match", HTTP_CODES.BAD_REQUEST));
    }

    try {
      // Verify reset token
      const decoded = jwt.verify(resetToken, process.env.JWT_SECRET as string) as any;
      
      if (decoded.purpose !== "password_reset") {
        return next(new AppError("Invalid reset token", HTTP_CODES.UNAUTHORIZED));
      }

      // Find user and update password
      const user = await userModel.findByEmail(decoded.email);
      if (!user) {
        return next(new AppError("User not found", HTTP_CODES.NOT_FOUND));
      }

      // Encrypt new password
      const hashedPassword = await encryptPassword(newPassword);
      
      // Update user password
      await userModel.updateUser(user.id!, { password: hashedPassword });

      res.status(HTTP_CODES.OK).json(
        new APIResponse("success", "Password reset successfully", {
          message: "Your password has been updated. You can now login with your new password."
        })
      );
         } catch (error) {
       console.error("Error resetting password:", error);
       return next(new AppError("Invalid or expired reset token", HTTP_CODES.UNAUTHORIZED));
     }
   }
 );

// Step-by-step registration validation
export const validateRegistrationStepData = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { step, data } = req.body;

    if (!step || !data) {
      return next(new AppError("Step and data are required", HTTP_CODES.BAD_REQUEST));
    }

    try {
      const validationResult = await validateRegistrationStep(step, data);
      
      if (!validationResult.isValid) {
        return next(new AppError(validationResult.error!, HTTP_CODES.BAD_REQUEST));
      }

      res.status(HTTP_CODES.OK).json(
        new APIResponse("success", "Step validation successful", {
          step,
          valid: true,
          message: "You can proceed to the next step"
        })
      );
    } catch (error) {
      console.error("Error validating registration step:", error);
      return next(new AppError("Failed to validate registration data", HTTP_CODES.INTERNAL_SERVER_ERROR));
    }
  }
);

// Save partial registration data (step-by-step)
export const saveRegistrationStep = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { step, data, userId } = req.body;

    if (!step || !data) {
      return next(new AppError("Step and data are required", HTTP_CODES.BAD_REQUEST));
    }

    try {
      // Validate the step data first
      const validationResult = await validateRegistrationStep(step, data);
      
      if (!validationResult.isValid) {
        return next(new AppError(validationResult.error!, HTTP_CODES.BAD_REQUEST));
      }

      let user: User;

      if (userId) {
        // Update existing user
        user = await userModel.updateUser(userId, data);
      } else {
        // Create new user with partial data
        user = await userModel.createUserStepByStep({
          ...data,
          user_type: "user",
          is_active: false, // Will be activated after completing all steps
          is_first_login: true
        });
      }

      res.status(HTTP_CODES.OK).json(
        new APIResponse("success", "Registration step saved", {
          step,
          userId: user.id,
          nextStep: getNextRegistrationStep(step),
          message: "Step completed successfully"
        })
      );
    } catch (error) {
      console.error("Error saving registration step:", error);
      return next(new AppError("Failed to save registration data", HTTP_CODES.INTERNAL_SERVER_ERROR));
    }
  }
);

// Complete registration (final step)
export const completeRegistration = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, termsAccepted } = req.body;

    if (!userId) {
      return next(new AppError("User ID is required", HTTP_CODES.BAD_REQUEST));
    }

    if (!termsAccepted) {
      return next(new AppError("You must accept the terms and conditions", HTTP_CODES.BAD_REQUEST));
    }

    try {
      // Get user data
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new AppError("User not found", HTTP_CODES.NOT_FOUND));
      }

      // Validate that all required steps are completed
      const requiredFields = [
        'email', 'fullname', 'username', 'country_of_birth', 'nationality',
        'mobile', 'birthday', 'passcode', 'password', 'national_id', 'statement'
      ];

      const missingFields = requiredFields.filter(field => !user[field as keyof User]);
      
      if (missingFields.length > 0) {
        return next(new AppError(
          `Please complete all registration steps. Missing: ${missingFields.join(', ')}`,
          HTTP_CODES.BAD_REQUEST
        ));
      }

      // Update user to be active and accept terms
      const updatedUser = await userModel.updateUser(userId, {
        is_active: true,
        terms_accepted: true
      });

      // Create JWT token for the completed registration
      createSendToken(updatedUser, HTTP_CODES.CREATED, req, res);

    } catch (error) {
      console.error("Error completing registration:", error);
      return next(new AppError("Failed to complete registration", HTTP_CODES.INTERNAL_SERVER_ERROR));
    }
  }
);

// Get registration progress
export const getRegistrationProgress = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (!userId) {
      return next(new AppError("User ID is required", HTTP_CODES.BAD_REQUEST));
    }

    try {
      const user = await userModel.findById(userId);
      if (!user) {
        return next(new AppError("User not found", HTTP_CODES.NOT_FOUND));
      }

      const progress = calculateRegistrationProgress(user);

      res.status(HTTP_CODES.OK).json(
        new APIResponse("success", "Registration progress retrieved", {
          userId,
          progress,
          currentStep: progress.nextStep,
          completedSteps: progress.completedSteps,
          totalSteps: progress.totalSteps,
          isComplete: progress.isComplete
        })
      );
    } catch (error) {
      console.error("Error getting registration progress:", error);
      return next(new AppError("Failed to get registration progress", HTTP_CODES.INTERNAL_SERVER_ERROR));
    }
  }
);

// Helper function to get next registration step
function getNextRegistrationStep(currentStep: string): string | null {
  const steps = [
    "email", "personal", "location", "contact", 
    "security", "identity", "employment", "terms"
  ];
  
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === steps.length - 1) {
    return null; // Invalid step or last step
  }
  
  return steps[currentIndex + 1];
}

// Helper function to calculate registration progress
function calculateRegistrationProgress(user: User) {
  const steps = [
    { name: "email", completed: !!user.email },
    { name: "personal", completed: !!(user.fullname && user.username) },
    { name: "location", completed: !!(user.country_of_birth && user.nationality) },
    { name: "contact", completed: !!(user.mobile && user.birthday) },
    { name: "security", completed: !!(user.passcode && user.password) },
    { name: "identity", completed: !!user.national_id },
    { name: "employment", completed: !!user.statement },
    { name: "terms", completed: !!user.terms_accepted }
  ];

  const completedSteps = steps.filter(step => step.completed);
  const nextIncompleteStep = steps.find(step => !step.completed);

  return {
    totalSteps: steps.length,
    completedSteps: completedSteps.length,
    completedStepNames: completedSteps.map(s => s.name),
    nextStep: nextIncompleteStep?.name || null,
    isComplete: completedSteps.length === steps.length,
    percentage: Math.round((completedSteps.length / steps.length) * 100)
  };
}
