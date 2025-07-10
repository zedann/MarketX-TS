import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import {
  loginRateLimit,
  passwordResetRateLimit,
  registrationRateLimit,
  checkAccountLockout,
  securityLogger,
  validateRequest,
  emailValidation,
  passwordValidation,
  usernameValidation,
} from "../middleware/securityMiddleware";

import {
  googleGetProfile,
  googleLogout,
  signIn,
  signUp,
  verifyOtp,
  checkEmailAvailability,
  checkUsernameAvailability,
  getPasswordStrength,
  requestPasswordReset,
  verifyPasswordResetOtp,
  resetPassword,
  validateRegistrationStepData,
  saveRegistrationStep,
  completeRegistration,
  getRegistrationProgress,
} from "../services/authService";

const router = express.Router();

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    res.cookie("jwt", user.token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production'
    });
    res.redirect(process.env.FRONTEND_URL as string);
  }
);
router.get("/profile", googleGetProfile);
// login and signup with security measures
router.route("/signin").post(
  loginRateLimit,
  checkAccountLockout,
  securityLogger("LOGIN_ATTEMPT"),
  validateRequest([emailValidation, passwordValidation]),
  signIn
);

router.route("/signup").post(
  registrationRateLimit,
  securityLogger("REGISTRATION_ATTEMPT"),
  validateRequest([emailValidation, passwordValidation, usernameValidation]),
  signUp
);

router.get("/logout", securityLogger("LOGOUT"), googleLogout);
// OTP verification
router.post("/verify-otp", verifyOtp);

// Availability checks
router.post("/check-email", checkEmailAvailability);
router.post("/check-username", checkUsernameAvailability);

// Password strength check
router.post("/password-strength", getPasswordStrength);

// Password reset flow with security measures
router.post("/request-password-reset", 
  passwordResetRateLimit,
  securityLogger("PASSWORD_RESET_REQUEST"),
  validateRequest([emailValidation]),
  requestPasswordReset
);

router.post("/verify-password-reset-otp",
  passwordResetRateLimit,
  securityLogger("PASSWORD_RESET_OTP_VERIFY"),
  verifyPasswordResetOtp
);

router.post("/reset-password",
  passwordResetRateLimit,
  securityLogger("PASSWORD_RESET_COMPLETE"),
  validateRequest([passwordValidation]),
  resetPassword
);

// Step-by-step registration
router.post("/validate-step", validateRegistrationStepData);
router.post("/save-step", saveRegistrationStep);
router.post("/complete-registration", completeRegistration);
router.get("/registration-progress/:userId", getRegistrationProgress);

export default router;
